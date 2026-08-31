// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Minimal {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

interface IERC721Owner {
    function ownerOf(uint256 tokenId) external view returns (address);
}

abstract contract TwoStepOwnable {
    address public owner;
    address public pendingOwner;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotPendingOwner();
    error ZeroAddress();

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        address previousOwner = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        emit OwnershipTransferred(previousOwner, msg.sender);
    }
}

/// @title Mothership Mission Registry
/// @notice Records non-custodial Space Brokers missions. NFTs never leave the holder's wallet.
/// @dev Reward amounts are calculated from the emitted mission/fleet timeline and paid by the
/// cumulative Merkle distributor below. An oracle may invalidate a mission at the exact timestamp
/// of a transfer observed by the public chain indexer.
contract MothershipMissionRegistry is TwoStepOwnable {
    uint16 public constant BPS = 10_000;
    uint16 public constant RARITY_STANDARD = 10_000;
    uint16 public constant RARITY_ADVANCED = 15_000;
    uint16 public constant RARITY_EPIC = 20_000;
    uint16 public constant RARITY_ELITE = 30_000;
    uint16 public constant RARITY_ONE_OF_ONE = 50_000;
    uint256 public constant MAX_BATCH = 100;

    IERC721Owner public immutable spaceBrokers;
    address public oracle;
    bool public rarityFrozen;
    bool public stakingOpen;
    uint32 public rarityConfiguredCount;

    uint32 public seasonId;
    uint64 public seasonStart;
    uint64 public seasonEnd;

    struct Mission {
        address staker;
        uint64 startedAt;
        uint64 targetEndAt;
        uint64 endedAt;
        uint8 durationDays;
        bool completed;
        bool active;
    }

    mapping(uint256 tokenId => uint16 multiplierBps) public rarityMultiplierBps;
    mapping(uint256 tokenId => bool configured) public rarityConfigured;
    mapping(uint256 tokenId => Mission mission) public missions;
    mapping(address staker => uint32 count) public activeFleet;

    event OracleUpdated(address indexed previousOracle, address indexed newOracle);
    event RarityMultiplierSet(uint256 indexed tokenId, uint16 multiplierBps);
    event RaritySnapshotFrozen(uint32 indexed seasonId);
    event SeasonConfigured(uint32 indexed seasonId, uint64 startsAt, uint64 endsAt);
    event StakingStatusChanged(bool open);
    event MissionStarted(
        uint32 indexed seasonId,
        uint256 indexed tokenId,
        address indexed staker,
        uint8 durationDays,
        uint64 startedAt,
        uint64 targetEndAt,
        uint16 rarityBps,
        uint32 fleetAfter,
        uint16 fleetBpsAfter
    );
    event MissionEnded(
        uint32 indexed seasonId,
        uint256 indexed tokenId,
        address indexed staker,
        uint64 endedAt,
        bool completed,
        uint8 reason,
        uint32 fleetAfter,
        uint16 fleetBpsAfter
    );

    error InvalidSeason();
    error InvalidDuration();
    error InvalidMultiplier();
    error InvalidBatch();
    error RarityAlreadyFrozen();
    error RarityNotFrozen();
    error IncompleteRaritySnapshot(uint256 configured, uint256 required);
    error StakingClosed();
    error SeasonInactive();
    error MissionAlreadyActive(uint256 tokenId);
    error MissionNotActive(uint256 tokenId);
    error MissionNotComplete(uint256 tokenId);
    error NotTokenOwner(uint256 tokenId);
    error StillTokenOwner(uint256 tokenId);
    error NotMissionStaker(uint256 tokenId);
    error NotOracle();
    error InvalidObservedTimestamp(uint256 tokenId);

    constructor(address collection, address initialOwner, address initialOracle)
        TwoStepOwnable(initialOwner)
    {
        if (collection == address(0) || initialOracle == address(0)) revert ZeroAddress();
        spaceBrokers = IERC721Owner(collection);
        oracle = initialOracle;
        emit OracleUpdated(address(0), initialOracle);
    }

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    function configureSeason(uint32 newSeasonId, uint64 startsAt, uint64 endsAt) external onlyOwner {
        if (stakingOpen || newSeasonId == 0 || startsAt >= endsAt || endsAt <= block.timestamp) {
            revert InvalidSeason();
        }
        seasonId = newSeasonId;
        seasonStart = startsAt;
        seasonEnd = endsAt;
        emit SeasonConfigured(newSeasonId, startsAt, endsAt);
    }

    function setOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert ZeroAddress();
        address previousOracle = oracle;
        oracle = newOracle;
        emit OracleUpdated(previousOracle, newOracle);
    }

    function setRarityMultipliers(uint256[] calldata tokenIds, uint16[] calldata multipliersBps)
        external
        onlyOwner
    {
        if (rarityFrozen) revert RarityAlreadyFrozen();
        if (tokenIds.length == 0 || tokenIds.length != multipliersBps.length || tokenIds.length > MAX_BATCH) {
            revert InvalidBatch();
        }
        for (uint256 i; i < tokenIds.length; ++i) {
            uint16 multiplier = multipliersBps[i];
            if (!_validRarityMultiplier(multiplier)) revert InvalidMultiplier();
            if (!rarityConfigured[tokenIds[i]]) {
                rarityConfigured[tokenIds[i]] = true;
                ++rarityConfiguredCount;
            }
            rarityMultiplierBps[tokenIds[i]] = multiplier;
            emit RarityMultiplierSet(tokenIds[i], multiplier);
        }
    }

    function freezeRaritySnapshot() external onlyOwner {
        if (rarityFrozen) revert RarityAlreadyFrozen();
        if (seasonId == 0) revert InvalidSeason();
        if (rarityConfiguredCount != 2_222) {
            revert IncompleteRaritySnapshot(rarityConfiguredCount, 2_222);
        }
        rarityFrozen = true;
        emit RaritySnapshotFrozen(seasonId);
    }

    function setStakingOpen(bool open) external onlyOwner {
        if (open && (!rarityFrozen || seasonId == 0)) revert RarityNotFrozen();
        stakingOpen = open;
        emit StakingStatusChanged(open);
    }

    function startMissions(uint256[] calldata tokenIds, uint8 durationDays) external {
        if (!stakingOpen) revert StakingClosed();
        if (block.timestamp < seasonStart || block.timestamp >= seasonEnd) revert SeasonInactive();
        if (durationDays != 30 && durationDays != 60 && durationDays != 90) revert InvalidDuration();
        if (tokenIds.length == 0 || tokenIds.length > MAX_BATCH) revert InvalidBatch();

        uint64 startedAt = uint64(block.timestamp);
        uint64 targetEndAt = startedAt + uint64(durationDays) * 1 days;

        for (uint256 i; i < tokenIds.length; ++i) {
            uint256 tokenId = tokenIds[i];
            if (spaceBrokers.ownerOf(tokenId) != msg.sender) revert NotTokenOwner(tokenId);
            if (missions[tokenId].active) revert MissionAlreadyActive(tokenId);
            uint16 rarityBps = rarityMultiplierBps[tokenId];
            if (!_validRarityMultiplier(rarityBps)) revert InvalidMultiplier();

            missions[tokenId] = Mission({
                staker: msg.sender,
                startedAt: startedAt,
                targetEndAt: targetEndAt,
                endedAt: 0,
                durationDays: durationDays,
                completed: false,
                active: true
            });

            uint32 fleetAfter = ++activeFleet[msg.sender];
            emit MissionStarted(
                seasonId,
                tokenId,
                msg.sender,
                durationDays,
                startedAt,
                targetEndAt,
                rarityBps,
                fleetAfter,
                fleetMultiplierBps(fleetAfter)
            );
        }
    }

    function completeMissions(uint256[] calldata tokenIds) external {
        if (tokenIds.length == 0 || tokenIds.length > MAX_BATCH) revert InvalidBatch();
        for (uint256 i; i < tokenIds.length; ++i) {
            uint256 tokenId = tokenIds[i];
            Mission storage mission = missions[tokenId];
            if (!mission.active) revert MissionNotActive(tokenId);
            if (mission.staker != msg.sender) revert NotMissionStaker(tokenId);
            if (block.timestamp < mission.targetEndAt) revert MissionNotComplete(tokenId);
            if (spaceBrokers.ownerOf(tokenId) != msg.sender) revert NotTokenOwner(tokenId);
            _endMission(tokenId, uint64(block.timestamp), true, 1);
        }
    }

    function exitMissions(uint256[] calldata tokenIds) external {
        if (tokenIds.length == 0 || tokenIds.length > MAX_BATCH) revert InvalidBatch();
        for (uint256 i; i < tokenIds.length; ++i) {
            uint256 tokenId = tokenIds[i];
            Mission storage mission = missions[tokenId];
            if (!mission.active) revert MissionNotActive(tokenId);
            if (mission.staker != msg.sender) revert NotMissionStaker(tokenId);
            _endMission(tokenId, uint64(block.timestamp), false, 2);
        }
    }

    /// @notice Public safety valve when the NFT currently belongs to another wallet.
    function invalidateTransferred(uint256[] calldata tokenIds) external {
        if (tokenIds.length == 0 || tokenIds.length > MAX_BATCH) revert InvalidBatch();
        for (uint256 i; i < tokenIds.length; ++i) {
            uint256 tokenId = tokenIds[i];
            Mission storage mission = missions[tokenId];
            if (!mission.active) revert MissionNotActive(tokenId);
            if (spaceBrokers.ownerOf(tokenId) == mission.staker) revert StillTokenOwner(tokenId);
            _endMission(tokenId, uint64(block.timestamp), false, 3);
        }
    }

    /// @notice Uses a chain-indexed NFT Transfer timestamp so rewards stop at the actual transfer.
    function oracleInvalidateTransferred(uint256[] calldata tokenIds, uint64[] calldata observedAt)
        external
        onlyOracle
    {
        if (tokenIds.length == 0 || tokenIds.length != observedAt.length || tokenIds.length > MAX_BATCH) {
            revert InvalidBatch();
        }
        for (uint256 i; i < tokenIds.length; ++i) {
            uint256 tokenId = tokenIds[i];
            Mission storage mission = missions[tokenId];
            uint64 transferTime = observedAt[i];
            if (!mission.active) revert MissionNotActive(tokenId);
            if (transferTime < mission.startedAt || transferTime > block.timestamp) {
                revert InvalidObservedTimestamp(tokenId);
            }
            _endMission(tokenId, transferTime, false, 4);
        }
    }

    function fleetMultiplierBps(uint256 count) public pure returns (uint16) {
        if (count == 0 || count <= 10) return 10_000;
        if (count <= 30) return 15_000;
        if (count <= 60) return 20_000;
        return 30_000;
    }

    function missionBonusBps(uint8 durationDays) public pure returns (uint16) {
        if (durationDays == 30) return 1_000;
        if (durationDays == 60) return 2_500;
        if (durationDays == 90) return 5_000;
        revert InvalidDuration();
    }

    function currentRewardPowerBps(uint256 tokenId) external view returns (uint256) {
        Mission memory mission = missions[tokenId];
        if (!mission.active) return 0;
        return uint256(rarityMultiplierBps[tokenId]) * fleetMultiplierBps(activeFleet[mission.staker]) / BPS;
    }

    function _endMission(uint256 tokenId, uint64 endedAt, bool completed, uint8 reason) internal {
        Mission storage mission = missions[tokenId];
        address staker = mission.staker;
        mission.active = false;
        mission.completed = completed;
        mission.endedAt = endedAt;
        uint32 fleetAfter = --activeFleet[staker];
        emit MissionEnded(
            seasonId,
            tokenId,
            staker,
            endedAt,
            completed,
            reason,
            fleetAfter,
            fleetMultiplierBps(fleetAfter)
        );
    }

    function _validRarityMultiplier(uint16 multiplier) internal pure returns (bool) {
        return multiplier == RARITY_STANDARD || multiplier == RARITY_ADVANCED || multiplier == RARITY_EPIC
            || multiplier == RARITY_ELITE || multiplier == RARITY_ONE_OF_ONE;
    }
}

/// @title Mothership Cumulative Reward Distributor
/// @notice Pays cumulative weekly MOTHERSHIP entitlements proven by a Merkle root.
contract MothershipRewardDistributor is TwoStepOwnable {
    IERC20Minimal public immutable rewardToken;
    bytes32 public merkleRoot;
    uint64 public rewardPeriod;
    uint64 public claimsEndAt;
    uint256 public publishedTotalAllocation;
    uint256 public totalClaimed;
    bool public paused;
    uint256 private unlocked = 1;

    mapping(address account => uint256 amount) public claimed;

    event RewardsPublished(uint64 indexed rewardPeriod, bytes32 indexed merkleRoot, uint256 totalAllocation);
    event RewardClaimed(address indexed account, uint256 amount, uint256 cumulativeAmount);
    event ClaimsEndExtended(uint64 previousEndAt, uint64 newEndAt);
    event ClaimsPaused(bool paused);
    event UnclaimedRecovered(address indexed recipient, uint256 amount);

    error InvalidRoot();
    error InvalidPeriod();
    error InvalidAllocation();
    error ClaimsClosed();
    error ClaimsArePaused();
    error InvalidProof();
    error NothingToClaim();
    error TransferFailed();
    error ReentrantCall();
    error ClaimsStillOpen();

    constructor(address token, address initialOwner, uint64 initialClaimsEndAt)
        TwoStepOwnable(initialOwner)
    {
        if (token == address(0)) revert ZeroAddress();
        if (initialClaimsEndAt <= block.timestamp) revert ClaimsClosed();
        rewardToken = IERC20Minimal(token);
        claimsEndAt = initialClaimsEndAt;
    }

    modifier nonReentrant() {
        if (unlocked != 1) revert ReentrantCall();
        unlocked = 2;
        _;
        unlocked = 1;
    }

    function publishRewards(bytes32 newRoot, uint64 newPeriod, uint256 totalAllocation) external onlyOwner {
        if (newRoot == bytes32(0)) revert InvalidRoot();
        if (newPeriod <= rewardPeriod) revert InvalidPeriod();
        if (
            totalAllocation < publishedTotalAllocation
                || totalAllocation > rewardToken.balanceOf(address(this)) + totalClaimed
        ) revert InvalidAllocation();
        merkleRoot = newRoot;
        rewardPeriod = newPeriod;
        publishedTotalAllocation = totalAllocation;
        emit RewardsPublished(newPeriod, newRoot, totalAllocation);
    }

    function setPaused(bool newPaused) external onlyOwner {
        paused = newPaused;
        emit ClaimsPaused(newPaused);
    }

    function extendClaimsEnd(uint64 newClaimsEndAt) external onlyOwner {
        if (newClaimsEndAt <= claimsEndAt) revert ClaimsClosed();
        uint64 previous = claimsEndAt;
        claimsEndAt = newClaimsEndAt;
        emit ClaimsEndExtended(previous, newClaimsEndAt);
    }

    function claim(uint256 cumulativeAmount, bytes32[] calldata proof) external nonReentrant {
        if (paused) revert ClaimsArePaused();
        if (block.timestamp > claimsEndAt) revert ClaimsClosed();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, cumulativeAmount))));
        if (!_verify(proof, merkleRoot, leaf)) revert InvalidProof();

        uint256 alreadyClaimed = claimed[msg.sender];
        if (cumulativeAmount <= alreadyClaimed) revert NothingToClaim();
        uint256 amount = cumulativeAmount - alreadyClaimed;
        claimed[msg.sender] = cumulativeAmount;
        totalClaimed += amount;

        if (!rewardToken.transfer(msg.sender, amount)) revert TransferFailed();
        emit RewardClaimed(msg.sender, amount, cumulativeAmount);
    }

    function recoverUnclaimed(address recipient, uint256 amount) external onlyOwner nonReentrant {
        if (block.timestamp <= claimsEndAt) revert ClaimsStillOpen();
        if (recipient == address(0)) revert ZeroAddress();
        if (!rewardToken.transfer(recipient, amount)) revert TransferFailed();
        emit UnclaimedRecovered(recipient, amount);
    }

    function availableRewards() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    function _verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i; i < proof.length; ++i) {
            bytes32 proofElement = proof[i];
            computedHash = computedHash <= proofElement
                ? keccak256(abi.encodePacked(computedHash, proofElement))
                : keccak256(abi.encodePacked(proofElement, computedHash));
        }
        return computedHash == root;
    }
}
