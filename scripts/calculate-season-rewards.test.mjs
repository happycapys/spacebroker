import test from "node:test";
import assert from "node:assert/strict";
import { calculateSeasonRewards } from "./calculate-season-rewards.mjs";

const wallet = "0x0000000000000000000000000000000000000001";
const day = 86_400;

test("fleet multiplier changes from 1.5x to 1x after active count falls below 11", () => {
  const rarity = Array.from({ length: 11 }, (_, index) => ({ tokenId: String(index + 1), rank: 2000 }));
  const missions = Array.from({ length: 11 }, (_, index) => ({
    tokenId: String(index + 1),
    staker: wallet,
    startedAt: 0,
    endedAt: index < 2 ? day : 2 * day,
    durationDays: 30,
    completed: false,
  }));
  const result = calculateSeasonRewards({
    seasonId: 1,
    seasonStart: 0,
    seasonEnd: 3 * day,
    calculateThrough: 2 * day,
    baseUnitsPerDay: "100",
    rarity,
    missions,
  });
  assert.equal(result.entitlements[0].cumulativeAmount, "2550");
});

test("completed 90-day mission receives its 50 percent bonus", () => {
  const result = calculateSeasonRewards({
    seasonId: 1,
    seasonStart: 0,
    seasonEnd: 100 * day,
    calculateThrough: 90 * day,
    baseUnitsPerDay: "100",
    rarity: [{ tokenId: "500", rank: 500 }],
    missions: [{ tokenId: "500", staker: wallet, startedAt: 0, endedAt: 90 * day, durationDays: 90, completed: true }],
  });
  assert.equal(result.entitlements[0].cumulativeAmount, "27000");
});

test("fixed pool scales all cumulative entitlements proportionally", () => {
  const result = calculateSeasonRewards({
    seasonId: 1,
    seasonStart: 0,
    seasonEnd: 2 * day,
    calculateThrough: day,
    baseUnitsPerDay: "100",
    poolCap: "50",
    rarity: [{ tokenId: "2000", rank: 2000 }],
    missions: [{ tokenId: "2000", staker: wallet, startedAt: 0, endedAt: day, durationDays: 30, completed: false }],
  });
  assert.equal(result.scaledToPool, true);
  assert.equal(result.entitlements[0].cumulativeAmount, "50");
});
