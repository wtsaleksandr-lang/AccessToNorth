import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTAINER_PRESETS,
  packIntoContainers,
  recommendContainer,
  type CargoItem,
} from "../../client/src/lib/containerPacking";

const KG_TO_LB = 1 / 0.453592;

function cargo(overrides: Partial<CargoItem> = {}): CargoItem {
  return {
    id: "cargo-1",
    name: "Pallets",
    length: 48,
    width: 48,
    height: 61,
    weight: 5260 * KG_TO_LB,
    quantity: 7,
    color: "#22c55e",
    stackable: false,
    palletized: false,
    palletType: "none",
    customPalletL: 48,
    customPalletW: 48,
    customPalletH: 6,
    rotationMode: "horizontal",
    included: true,
    loadPriority: "normal",
    ...overrides,
  };
}

test("7 x 48 x 48 x 61 inch pallets use one 40-foot standard container", () => {
  const item = cargo();
  const container20 = CONTAINER_PRESETS.find((container) => container.id === "20dc")!;
  const container40 = CONTAINER_PRESETS.find((container) => container.id === "40dc")!;
  const container40hc = CONTAINER_PRESETS.find((container) => container.id === "40hc")!;

  assert.equal(packIntoContainers([item], container20).totalContainers, 2);
  assert.equal(packIntoContainers([item], container40).totalContainers, 1);
  assert.equal(packIntoContainers([item], container40hc).totalContainers, 1);

  const recommendation = recommendContainer([item]);
  assert.equal(recommendation?.container.id, "40dc");
  assert.equal(recommendation?.plan.totalContainers, 1);
});

test("row weight is total gross weight and is not multiplied by quantity", () => {
  const item = cargo();
  const container40 = CONTAINER_PRESETS.find((container) => container.id === "40dc")!;
  const plan = packIntoContainers([item], container40);
  const loadedWeightKg = plan.containers[0].result.totalWeight * 0.453592;

  assert.ok(Math.abs(loadedWeightKg - 5260) < 0.001);
  assert.equal(plan.totalPiecesLoaded, 7);
});

test("high cargo recommends a high-cube container", () => {
  const item = cargo({ quantity: 1, weight: 1200, height: 98, rotationMode: "horizontal" });
  const recommendation = recommendContainer([item]);

  assert.equal(recommendation?.container.id, "40hc");
  assert.equal(recommendation?.plan.totalContainers, 1);
});
