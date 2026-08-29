import assert from "node:assert/strict";
import test from "node:test";
import { buildPalletPlacementCsv, buildTruckPlacementCsv } from "../../client/src/lib/loadingPlanExports";
import { PALLET_PRESETS, buildPalletPlan, type PalletCarton } from "../../client/src/lib/palletPacking";
import { buildTruckSpatialPlan, createTruckPackingItems, type TruckTrailerLike } from "../../client/src/lib/truckPacking";

const cartons: PalletCarton[] = [{
  id: "carton-a",
  name: "Carton, blue",
  lengthIn: 24,
  widthIn: 18,
  heightIn: 12,
  weightLbs: 20,
  quantity: 4,
  color: "#2563eb",
  allowRotation: true,
  stackable: true,
}];

test("pallet placement CSV includes every carton position and escapes names", () => {
  const plan = buildPalletPlan(cartons, PALLET_PRESETS[0], {
    maxLoadedHeightIn: 72,
    maxGrossWeightLbs: 2500,
    overhangIn: 0,
    interlockLayers: true,
  });
  const csv = buildPalletPlacementCsv(plan, "imperial");
  const lines = csv.split("\n");
  assert.equal(lines.length, 5);
  assert.match(lines[0], /Pallet,Layer,Position/);
  assert.match(lines[1], /"Carton, blue"/);
  assert.match(lines[1], /#2563eb/);
});

test("truck placement CSV follows the complete loading sequence", () => {
  const trailer: TruckTrailerLike = {
    id: "dryvan53",
    name: "Dry Van 53'",
    category: "Dry Van",
    lengthIn: 636,
    widthIn: 100.5,
    heightIn: 110,
    maxPayloadLbs: 44000,
    hasDeck: false,
  };
  const items = createTruckPackingItems({
    cargoMode: "pallets",
    cartons: [],
    pallets: [{
      id: "pallet-a",
      name: "Export pallets",
      palletType: "48x40",
      customL: 48,
      customW: 40,
      heightIn: 55,
      weightLbs: 1000,
      quantity: 3,
      color: "#0f766e",
      stackable: false,
      rotation: "horizontal",
      priority: 0,
    }],
  });
  const plan = buildTruckSpatialPlan(items, trailer);
  const csv = buildTruckPlacementCsv(plan, "metric");
  const lines = csv.split("\n");
  assert.equal(lines.length, plan.piecesLoaded + 1);
  assert.match(lines[0], /From Nose \(cm\)/);
  assert.match(lines[1], /Export pallets/);
});
