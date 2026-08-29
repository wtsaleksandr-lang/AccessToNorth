import assert from "node:assert/strict";
import test from "node:test";
import { createTruckPackingItems, buildTruckSpatialPlan, type TruckTrailerLike } from "../../client/src/lib/truckPacking";
import { generateTruckLoadingReportBlob } from "../../client/src/lib/truckPdf";

test("truck loading report renders a valid PDF", async () => {
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
      id: "pallets",
      name: "Export pallets",
      palletType: "48x40",
      customL: 48,
      customW: 40,
      heightIn: 55,
      weightLbs: 1000,
      quantity: 10,
      color: "#0f766e",
      stackable: false,
      rotation: "horizontal",
      priority: 0,
    }],
  });
  const plan = buildTruckSpatialPlan(items, trailer);
  const blob = await generateTruckLoadingReportBlob({
    plan,
    cargoRows: [{ name: "Export pallets", dimensionsIn: [48, 40, 55], weightEachLbs: 1000, quantity: 10 }],
    unitSystem: "imperial",
  });
  const signature = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
  assert.equal(signature, "%PDF-");
  assert.ok(blob.size > 1500);
});
