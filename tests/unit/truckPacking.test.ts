import assert from "node:assert/strict";
import test from "node:test";
import { boxesOverlap3D } from "../../client/src/lib/containerLayout";
import {
  buildTruckSpatialPlan,
  createTruckPackingItems,
  getTruckLoadingSequence,
  type TruckCartonCargo,
  type TruckTrailerLike,
} from "../../client/src/lib/truckPacking";

const dryVan: TruckTrailerLike = {
  id: "dryvan53",
  name: "Dry Van 53'",
  category: "Dry Van",
  lengthIn: 636,
  widthIn: 100.5,
  heightIn: 110,
  maxPayloadLbs: 44000,
  hasDeck: false,
};

function palletCargo(quantity: number, weightEach = 1000) {
  return createTruckPackingItems({
    cargoMode: "pallets",
    cartons: [],
    pallets: [{
      id: "pallets",
      name: "Pallets",
      palletType: "48x40",
      customL: 48,
      customW: 40,
      heightIn: 50,
      weightLbs: weightEach,
      quantity,
      color: "#0f766e",
      stackable: false,
      rotation: "horizontal",
      priority: 0,
    }],
  });
}

test("creates collision-free positions for a standard 53-foot dry van", () => {
  const plan = buildTruckSpatialPlan(palletCargo(26), dryVan);
  assert.equal(plan.complete, true);
  assert.equal(plan.trailersRequired, 1);
  assert.equal(plan.piecesLoaded, 26);
  const placed = plan.multi.containers[0].result.placed;
  for (let a = 0; a < placed.length; a += 1) {
    for (let b = a + 1; b < placed.length; b += 1) {
      assert.equal(boxesOverlap3D(placed[a], placed[b]), false);
    }
  }
});

test("seven 48 x 48 x 61 inch pallets at 5,260 kg fit one dry van", () => {
  const items = createTruckPackingItems({
    cargoMode: "pallets",
    cartons: [],
    pallets: [{
      id: "square-pallets",
      name: "7 export pallets",
      palletType: "48x48",
      customL: 48,
      customW: 48,
      heightIn: 61,
      weightLbs: (5260 * 2.2046226218) / 7,
      quantity: 7,
      color: "#2563eb",
      stackable: false,
      rotation: "horizontal",
      priority: 0,
    }],
  });
  const plan = buildTruckSpatialPlan(items, dryVan);
  assert.equal(plan.complete, true);
  assert.equal(plan.trailersRequired, 1);
  assert.equal(plan.piecesLoaded, 7);
});

test("returns the actual number of trailers when one trailer is insufficient", () => {
  const plan = buildTruckSpatialPlan(palletCargo(27), dryVan);
  assert.equal(plan.complete, true);
  assert.equal(plan.trailersRequired, 2);
  assert.equal(plan.piecesLoaded, 27);
});

test("payload limits split an otherwise spatially compatible load", () => {
  const plan = buildTruckSpatialPlan(palletCargo(10, 5000), dryVan);
  assert.equal(plan.complete, true);
  assert.equal(plan.trailersRequired, 2);
  assert.ok(plan.multi.containers.every((entry) => entry.result.totalWeight <= dryVan.maxPayloadLbs));
});

test("the truck pallet selector now performs real automatic pallet building", () => {
  const carton: TruckCartonCargo = {
    id: "cartons",
    name: "Export cartons",
    lengthIn: 24,
    widthIn: 18,
    heightIn: 12,
    weightLbs: 20,
    quantity: 20,
    color: "#2563eb",
    stackable: true,
    rotation: "horizontal",
    priority: 0,
    palletAssign: "48x40",
  };
  const items = createTruckPackingItems({ cargoMode: "cartons", cartons: [carton], pallets: [] });
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 1);
  assert.equal(items[0].length, 48);
  assert.equal(items[0].width, 40);
  assert.equal(items[0].height, 65.5);
  assert.equal(items[0].weight, 445);
});

test("loading sequence starts at the nose and keeps supported cargo before upper cargo", () => {
  const plan = buildTruckSpatialPlan(palletCargo(4), dryVan);
  const placed = plan.multi.containers[0].result.placed;
  const sequence = getTruckLoadingSequence(placed);
  assert.equal(sequence.length, 4);
  for (let index = 1; index < sequence.length; index += 1) {
    assert.ok(sequence[index].positionFromNoseIn >= sequence[index - 1].positionFromNoseIn);
  }
});
