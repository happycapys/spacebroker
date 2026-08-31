import test from "node:test";
import assert from "node:assert/strict";
import {
  completedMissionReward,
  fleetMultiplierBps,
  ongoingReward,
  rarityMultiplierBps,
} from "./reward-math.mjs";

test("rarity bands cover the agreed collection ranges", () => {
  assert.equal(rarityMultiplierBps({ rank: 1 }), 50_000n);
  assert.equal(rarityMultiplierBps({ rank: 10 }), 50_000n);
  assert.equal(rarityMultiplierBps({ rank: 11 }), 30_000n);
  assert.equal(rarityMultiplierBps({ rank: 199 }), 30_000n);
  assert.equal(rarityMultiplierBps({ rank: 200 }), 20_000n);
  assert.equal(rarityMultiplierBps({ rank: 800 }), 20_000n);
  assert.equal(rarityMultiplierBps({ rank: 801 }), 15_000n);
  assert.equal(rarityMultiplierBps({ rank: 1500 }), 15_000n);
  assert.equal(rarityMultiplierBps({ rank: 1501 }), 10_000n);
  assert.equal(rarityMultiplierBps({ rank: 2222 }), 10_000n);
});

test("fleet bands use unambiguous boundaries", () => {
  assert.equal(fleetMultiplierBps(1), 10_000n);
  assert.equal(fleetMultiplierBps(10), 10_000n);
  assert.equal(fleetMultiplierBps(11), 15_000n);
  assert.equal(fleetMultiplierBps(30), 15_000n);
  assert.equal(fleetMultiplierBps(31), 20_000n);
  assert.equal(fleetMultiplierBps(60), 20_000n);
  assert.equal(fleetMultiplierBps(61), 30_000n);
});

test("rank 500 in a 35-NFT fleet earns 4x ongoing power", () => {
  const reward = ongoingReward({
    baseUnits: 100n,
    rarityBps: rarityMultiplierBps({ rank: 500 }),
    fleetBps: fleetMultiplierBps(35),
    activeSeconds: 86_400n,
  });
  assert.equal(reward, 400n);
});

test("a completed 90-day mission adds 50 percent", () => {
  const reward = completedMissionReward({
    baseUnits: 100n,
    rarityBps: rarityMultiplierBps({ rank: 500 }),
    fleetBps: fleetMultiplierBps(35),
    activeSeconds: 90n * 86_400n,
    durationDays: 90,
  });
  assert.equal(reward, 54_000n);
});

test("a 1/1 in a 61+ fleet has 15x ongoing power", () => {
  const reward = ongoingReward({
    baseUnits: 100n,
    rarityBps: rarityMultiplierBps({ rank: 1, oneOfOne: true }),
    fleetBps: fleetMultiplierBps(61),
    activeSeconds: 86_400n,
  });
  assert.equal(reward, 1_500n);
});
