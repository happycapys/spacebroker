import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { getAddress } from "viem";
import { BPS, fleetMultiplierBps, missionBonusBps, rarityMultiplierBps } from "./reward-math.mjs";

const DAY = 86_400n;

const asUnix = (value, label) => {
  const parsed = typeof value === "number" ? value : Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`Invalid ${label}`);
  return parsed;
};

export function calculateSeasonRewards(input) {
  const seasonStart = asUnix(input.seasonStart, "seasonStart");
  const seasonEnd = asUnix(input.seasonEnd, "seasonEnd");
  const through = Math.min(asUnix(input.calculateThrough, "calculateThrough"), seasonEnd);
  const baseUnitsPerDay = BigInt(input.baseUnitsPerDay);
  const poolCap = input.poolCap ? BigInt(input.poolCap) : null;
  if (seasonStart >= seasonEnd || through < seasonStart || baseUnitsPerDay < 0n) {
    throw new Error("Invalid season configuration");
  }

  const rarity = new Map(input.rarity.map((item) => [String(item.tokenId), rarityMultiplierBps(item)]));
  if (rarity.size !== input.rarity.length) throw new Error("Duplicate token IDs in rarity snapshot");

  const missions = input.missions.map((mission, index) => {
    const tokenId = String(mission.tokenId);
    const staker = getAddress(mission.staker);
    const startedAt = Math.max(asUnix(mission.startedAt, `missions[${index}].startedAt`), seasonStart);
    const naturalEnd = mission.endedAt ? asUnix(mission.endedAt, `missions[${index}].endedAt`) : through;
    const endedAt = Math.min(naturalEnd, through, seasonEnd);
    const durationDays = Number(mission.durationDays);
    if (!rarity.has(tokenId)) throw new Error(`Missing frozen rarity for token ${tokenId}`);
    if (![30, 60, 90].includes(durationDays)) throw new Error(`Invalid mission duration for token ${tokenId}`);
    return {
      key: `${tokenId}:${index}`,
      tokenId,
      staker,
      startedAt,
      endedAt,
      durationDays,
      completed: Boolean(mission.completed),
      targetEndAt: asUnix(mission.startedAt, "mission startedAt") + durationDays * 86_400,
      rarityBps: rarity.get(tokenId),
    };
  }).filter((mission) => mission.endedAt > mission.startedAt);

  const byWallet = Map.groupBy(missions, (mission) => mission.staker);
  const rawByWallet = new Map();
  const missionBreakdown = [];

  for (const [wallet, walletMissions] of byWallet) {
    const timestamps = [...new Set(walletMissions.flatMap((mission) => [mission.startedAt, mission.endedAt]))]
      .sort((a, b) => a - b);
    const weightedSeconds = new Map(walletMissions.map((mission) => [mission.key, 0n]));

    for (let index = 0; index < timestamps.length - 1; index += 1) {
      const from = timestamps[index];
      const to = timestamps[index + 1];
      if (to <= from) continue;
      const active = walletMissions.filter((mission) => mission.startedAt <= from && mission.endedAt > from);
      if (!active.length) continue;
      const fleetBps = fleetMultiplierBps(active.length);
      const seconds = BigInt(to - from);
      for (const mission of active) {
        weightedSeconds.set(
          mission.key,
          weightedSeconds.get(mission.key) + seconds * mission.rarityBps * fleetBps,
        );
      }
    }

    let walletTotal = 0n;
    for (const mission of walletMissions) {
      const baseReward = baseUnitsPerDay * weightedSeconds.get(mission.key) / DAY / BPS / BPS;
      const qualifiesForBonus = mission.completed && mission.endedAt >= mission.targetEndAt;
      const completionBonus = qualifiesForBonus
        ? baseReward * missionBonusBps(mission.durationDays) / BPS
        : 0n;
      const total = baseReward + completionBonus;
      walletTotal += total;
      missionBreakdown.push({
        tokenId: mission.tokenId,
        staker: wallet,
        durationDays: mission.durationDays,
        completed: qualifiesForBonus,
        baseReward: baseReward.toString(),
        completionBonus: completionBonus.toString(),
        total: total.toString(),
      });
    }
    rawByWallet.set(wallet, walletTotal);
  }

  const rawTotal = [...rawByWallet.values()].reduce((sum, amount) => sum + amount, 0n);
  const scaleToPool = poolCap !== null && rawTotal > poolCap;
  const entitlements = [...rawByWallet.entries()].map(([account, rawAmount]) => ({
    account,
    cumulativeAmount: (scaleToPool ? rawAmount * poolCap / rawTotal : rawAmount).toString(),
    rawAmount: rawAmount.toString(),
  })).sort((a, b) => a.account.localeCompare(b.account));
  const allocatedTotal = entitlements.reduce((sum, item) => sum + BigInt(item.cumulativeAmount), 0n);

  return {
    seasonId: input.seasonId,
    calculatedThrough: through,
    baseUnitsPerDay: baseUnitsPerDay.toString(),
    poolCap: poolCap?.toString() ?? null,
    scaledToPool: scaleToPool,
    rawTotal: rawTotal.toString(),
    allocatedTotal: allocatedTotal.toString(),
    unallocatedDust: poolCap === null || !scaleToPool ? "0" : (poolCap - allocatedTotal).toString(),
    entitlements,
    missions: missionBreakdown,
  };
}

async function main() {
  const [inputPath, outputPath = "season-reward-entitlements.json"] = process.argv.slice(2);
  if (!inputPath) {
    console.error("Usage: node scripts/calculate-season-rewards.mjs <season-input.json> [output.json]");
    process.exit(1);
  }
  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const result = calculateSeasonRewards(input);
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: outputPath,
    wallets: result.entitlements.length,
    rawTotal: result.rawTotal,
    allocatedTotal: result.allocatedTotal,
    scaledToPool: result.scaledToPool,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
