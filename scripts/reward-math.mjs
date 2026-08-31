export const BPS = 10_000n;

export function rarityMultiplierBps({ rank, oneOfOne = false }) {
  if (oneOfOne || (rank >= 1 && rank <= 10)) return 50_000n;
  if (rank >= 11 && rank <= 199) return 30_000n;
  if (rank >= 200 && rank <= 800) return 20_000n;
  if (rank >= 801 && rank <= 1500) return 15_000n;
  if (rank >= 1501 && rank <= 2222) return 10_000n;
  throw new Error(`Rank ${rank} is outside the frozen 1–2,222 range`);
}

export function fleetMultiplierBps(count) {
  if (!Number.isInteger(count) || count < 0) throw new Error("Fleet count must be a non-negative integer");
  if (count <= 10) return 10_000n;
  if (count <= 30) return 15_000n;
  if (count <= 60) return 20_000n;
  return 30_000n;
}

export function missionBonusBps(days) {
  if (days === 30) return 1_000n;
  if (days === 60) return 2_500n;
  if (days === 90) return 5_000n;
  throw new Error("Mission duration must be 30, 60 or 90 days");
}

export function ongoingReward({ baseUnits, rarityBps, fleetBps, activeSeconds }) {
  const day = 86_400n;
  return BigInt(baseUnits) * BigInt(activeSeconds) * BigInt(rarityBps) * BigInt(fleetBps)
    / day / BPS / BPS;
}

export function completedMissionReward({ baseUnits, rarityBps, fleetBps, activeSeconds, durationDays }) {
  const base = ongoingReward({ baseUnits, rarityBps, fleetBps, activeSeconds });
  return base + (base * missionBonusBps(durationDays) / BPS);
}
