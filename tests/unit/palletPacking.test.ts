import assert from "node:assert/strict";
import test from "node:test";
import {
  PALLET_PRESETS,
  buildBestLayerPattern,
  buildPalletPlan,
  type PalletCarton,
} from "../../client/src/lib/palletPacking";

const gma = PALLET_PRESETS[0];

function carton(overrides: Partial<PalletCarton> = {}): PalletCarton {
  return {
    id: "carton-a",
    name: "Carton A",
    lengthIn: 24,
    widthIn: 18,
    heightIn: 12,
    weightLbs: 20,
    quantity: 20,
    color: "#0f766e",
    allowRotation: true,
    stackable: true,
    ...overrides,
  };
}

test("finds a practical mixed-orientation layer pattern", () => {
  const pattern = buildBestLayerPattern(carton(), gma);
  assert.ok(pattern);
  assert.equal(pattern.capacity, 4);
  assert.equal(pattern.placements.length, 4);
  for (const placement of pattern.placements) {
    assert.ok(placement.x >= -0.001);
    assert.ok(placement.y >= -0.001);
    assert.ok(placement.x + placement.lengthIn <= gma.lengthIn + 0.001);
    assert.ok(placement.y + placement.widthIn <= gma.widthIn + 0.001);
  }
});

test("builds twenty cartons into one height-compliant pallet", () => {
  const plan = buildPalletPlan([carton()], gma, {
    maxLoadedHeightIn: 72,
    maxGrossWeightLbs: 2500,
    overhangIn: 0,
    interlockLayers: true,
  });

  assert.equal(plan.totalPallets, 1);
  assert.equal(plan.totalCartons, 20);
  assert.equal(plan.pallets[0].layers.length, 5);
  assert.equal(plan.pallets[0].loadedHeightIn, 65.5);
  assert.equal(plan.pallets[0].grossWeightLbs, 445);
});

test("opens more pallets when gross-weight limit is reached", () => {
  const plan = buildPalletPlan([carton({ quantity: 10, weightLbs: 100 })], gma, {
    maxLoadedHeightIn: 90,
    maxGrossWeightLbs: 445,
    overhangIn: 0,
    interlockLayers: true,
  });

  assert.equal(plan.totalPallets, 3);
  assert.deepEqual(plan.pallets.map((pallet) => pallet.cartonCount), [4, 4, 2]);
  assert.ok(plan.pallets.every((pallet) => pallet.grossWeightLbs <= 445));
});

test("keeps non-stackable cartons to one layer per pallet", () => {
  const plan = buildPalletPlan([carton({ quantity: 9, stackable: false })], gma, {
    maxLoadedHeightIn: 90,
    maxGrossWeightLbs: 2500,
    overhangIn: 0,
    interlockLayers: true,
  });

  assert.equal(plan.totalPallets, 3);
  assert.deepEqual(plan.pallets.map((pallet) => pallet.layers.length), [1, 1, 1]);
  assert.deepEqual(plan.pallets.map((pallet) => pallet.cartonCount), [4, 4, 1]);
});

test("permits controlled overhang when a carton cannot fit otherwise", () => {
  assert.equal(buildBestLayerPattern(carton({ lengthIn: 50, widthIn: 40, quantity: 1 }), gma, 1, 0), null);
  const pattern = buildBestLayerPattern(carton({ lengthIn: 50, widthIn: 40, quantity: 1 }), gma, 1, 1);
  assert.ok(pattern);
  assert.equal(pattern.placements.length, 1);
});
