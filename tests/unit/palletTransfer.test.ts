import assert from "node:assert/strict";
import test from "node:test";
import { PALLET_PRESETS, buildPalletPlan, type PalletCarton } from "../../client/src/lib/palletPacking";
import { createPalletPlanTransfer, parsePalletPlanTransfer, serializePalletPlanTransfer } from "../../client/src/lib/palletTransfer";

const cartons: PalletCarton[] = [{
  id: "cartons",
  name: "Cartons",
  lengthIn: 24,
  widthIn: 18,
  heightIn: 12,
  weightLbs: 100,
  quantity: 10,
  color: "#0f766e",
  allowRotation: true,
  stackable: true,
}];

test("groups matching built pallets for transfer into another planner", () => {
  const plan = buildPalletPlan(cartons, PALLET_PRESETS[0], {
    maxLoadedHeightIn: 90,
    maxGrossWeightLbs: 445,
    overhangIn: 0,
    interlockLayers: true,
  });
  const transfer = createPalletPlanTransfer(plan, new Date("2026-08-29T00:00:00.000Z"));

  assert.equal(transfer.rows.length, 2);
  assert.deepEqual(transfer.rows.map((row) => row.quantity), [2, 1]);
  assert.equal(transfer.rows[0].grossWeightLbs, 445);
  assert.equal(parsePalletPlanTransfer(serializePalletPlanTransfer(transfer))?.rows.length, 2);
});

test("rejects malformed transfer data", () => {
  assert.equal(parsePalletPlanTransfer(null), null);
  assert.equal(parsePalletPlanTransfer("not json"), null);
  assert.equal(parsePalletPlanTransfer('{"version":2,"rows":[]}'), null);
});
