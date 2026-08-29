import assert from "node:assert/strict";
import test from "node:test";
import { compareContainerPlans } from "../../client/src/lib/containerComparison";
import { recommendContainer, type CargoItem } from "../../client/src/lib/containerPacking";

const KG_TO_LB = 1 / 0.453592;

function pallets(): CargoItem[] {
  return [{
    id: "pallets",
    name: "7 Pallets",
    length: 48,
    width: 48,
    height: 61,
    weight: 5260 * KG_TO_LB,
    quantity: 7,
    color: "#155e75",
    stackable: false,
    palletized: false,
    palletType: "none",
    customPalletL: 48,
    customPalletW: 40,
    customPalletH: 6,
    rotationMode: "horizontal",
    included: true,
    loadPriority: "normal",
  }];
}

test("container comparison explains the known seven-pallet recommendation", () => {
  const items = pallets();
  const comparisons = compareContainerPlans(items);
  const recommendation = recommendContainer(items);
  const byId = new Map(comparisons.map((comparison) => [comparison.container.id, comparison]));

  assert.equal(comparisons.length, 4);
  assert.equal(byId.get("20dc")?.containerCount, 2);
  assert.equal(byId.get("40dc")?.containerCount, 1);
  assert.equal(byId.get("40hc")?.containerCount, 1);
  assert.equal(recommendation?.container.id, "40dc");
  assert.ok(byId.get("40dc")!.unusedVolumeCuFt < byId.get("40hc")!.unusedVolumeCuFt);
});

test("comparison utilization is calculated across every required container", () => {
  const comparison20 = compareContainerPlans(pallets()).find((comparison) => comparison.container.id === "20dc")!;

  assert.equal(comparison20.complete, true);
  assert.ok(comparison20.volumeUtilPct > 0 && comparison20.volumeUtilPct < 100);
  assert.ok(comparison20.weightUtilPct > 0 && comparison20.weightUtilPct < 100);
  assert.equal(comparison20.totalCapacityCuFt, comparison20.containerCount * comparison20.container.volumeCuFt);
});
