# Season 1 deployment checklist

## Confirmed rules

- Soft staking: Space Brokers remain in each holder's wallet.
- Rarity: the 11 designated 1/1 token IDs = 5×; every other NFT uses its frozen OpenSea rank: 1–199 = 3×; 200–800 = 2×; 801–1500 = 1.5×; 1501–2222 = 1×.
- Active fleet: 1–10 = 1×; 11–30 = 1.5×; 31–60 = 2×; 61+ = 3×.
- Completion bonus: 30 days = +10%; 60 days = +25%; 90 days = +50%.
- No MOTHERSHIP burn or staking-entry fee.
- Base rewards are calculated weekly and may accumulate before claiming.
- A sold or transferred NFT stops earning at its on-chain transfer time and loses its unfinished completion bonus.

## Required before deployment

- [ ] Confirm the Season 1 start/end timestamps.
- [x] Confirm the MOTHERSHIP base daily rate: 100 MOTHERSHIP per 1× reward-power NFT per day.
- [x] Confirm the exact Season 1 MOTHERSHIP allocation: 150,000,000 MOTHERSHIP.
- [ ] Export and manually verify the frozen rarity rank for all 2,222 NFTs.
- [x] Select the dedicated Season 1 treasury wallet: `0x006419857f931e1a4668375e4C132c9C06B2692F`.
- [x] Select a separate oracle/keeper address for transfer invalidations: `0xcFCf807a83a9661F0831E4488623eaC702447beC`.
- [ ] Run an independent Solidity security review.
- [ ] Deploy both contracts on Robinhood testnet and complete a full 30-day-equivalent accelerated test.
- [ ] Deploy and verify both contracts on Robinhood Chain.
- [ ] Transfer the fixed reward allocation into the distributor.
- [ ] Load all 2,222 rarity multipliers and freeze the snapshot.
- [ ] Add both deployed addresses to the website environment.
- [ ] Confirm mission start, early exit, NFT transfer, weekly publication and claim paths.

## Production addresses already fixed

- Space Brokers: `0xea35558af012ab6e75f72b7ec946970982587af6`
- MOTHERSHIP: `0x137bF98F59C8DC04b3cEBDb44E3Ba18dA8A52222`
- Season 1 treasury: `0x006419857f931e1a4668375e4C132c9C06B2692F`
- Transfer keeper: `0xcFCf807a83a9661F0831E4488623eaC702447beC`

## Designated Season 1 one-of-ones

`608`, `624`, `665`, `695`, `1050`, `1452`, `1527`, `1701`, `1728`, `2194`, `2208`
