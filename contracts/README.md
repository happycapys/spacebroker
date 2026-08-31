# Mothership staking contracts

This folder contains the two contracts required for non-custodial Space Brokers staking.

- `MothershipMissionRegistry` records 30, 60 and 90-day missions while every NFT remains in its owner's wallet. It stores the frozen Season 1 rarity multiplier and emits the fleet-count timeline used for rewards.
- `MothershipRewardDistributor` holds the funded MOTHERSHIP reward pool and pays cumulative weekly entitlements from a published Merkle root.

## Fixed production addresses

- Space Brokers ERC-721: `0xea35558af012ab6e75f72b7ec946970982587af6`
- MOTHERSHIP ERC-20: `0x137bF98F59C8DC04b3cEBDb44E3Ba18dA8A52222`

The MOTHERSHIP token is a standard immutable ERC-20 without a burn function. These staking contracts do not burn, tax, mint or modify that token.

## Launch sequence

1. Produce and independently verify `season-1-rarity.json` for all 2,222 token IDs.
2. Deploy `MothershipMissionRegistry` with the NFT address, treasury/multisig owner and indexer-oracle address.
3. Configure Season 1 dates.
4. Load rarity multipliers in batches, verify them and permanently freeze the snapshot.
5. Deploy `MothershipRewardDistributor` with the MOTHERSHIP address, treasury/multisig owner and claims deadline.
6. Transfer the fixed Season 1 MOTHERSHIP allocation into the distributor.
7. Publish the verified contract addresses and open staking.
8. Publish cumulative reward roots weekly. Holders may accumulate rewards and claim later.

Do not open staking until both contracts have been independently reviewed, the full rarity snapshot has been checked, and the distributor has been funded.
