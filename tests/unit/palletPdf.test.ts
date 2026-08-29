import assert from "node:assert/strict";
import test from "node:test";
import { PALLET_PRESETS, buildPalletPlan, type PalletCarton } from "../../client/src/lib/palletPacking";
import { generatePalletReportBlob } from "../../client/src/lib/palletPdf";

test("pallet building report renders a valid PDF", async () => {
  const cartons: PalletCarton[] = [{
    id: "cartons",
    name: "Export cartons",
    lengthIn: 24,
    widthIn: 18,
    heightIn: 12,
    weightLbs: 20,
    quantity: 20,
    color: "#0f766e",
    allowRotation: true,
    stackable: true,
  }];
  const plan = buildPalletPlan(cartons, PALLET_PRESETS[0], {
    maxLoadedHeightIn: 72,
    maxGrossWeightLbs: 2500,
    overhangIn: 0,
    interlockLayers: true,
  });

  const blob = await generatePalletReportBlob({ plan, cartons, unitSystem: "imperial" });
  const signature = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
  assert.equal(signature, "%PDF-");
  assert.ok(blob.size > 1500);
});
