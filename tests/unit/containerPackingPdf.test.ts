import assert from "node:assert/strict";
import test from "node:test";
import { generatePackingReportBlob } from "../../client/src/pages/tools/container-pdf/ContainerPackingReportPDF";
import { generateBasicPackingReportBlob } from "../../client/src/pages/tools/container-pdf/ContainerPackingReportFallback";

test("packing report renders a valid PDF blob", async () => {
  const blob = await generatePackingReportBlob({
    containerSpec: {
      id: "40dc",
      name: "40' Standard (DC)",
      lengthIn: 473.8,
      widthIn: 92.6,
      heightIn: 94.2,
      maxPayloadLbs: 58820,
      volumeCuFt: 2390,
      tare: 8333,
    },
    cargoRows: [{
      name: "Pallets",
      qty: 7,
      l: 48,
      w: 48,
      h: 61,
      weightPer: 1656,
      totalWeight: 11596,
      stackable: false,
      rotation: "Horiz.",
      color: "#22c55e",
      volPer: 81.3,
      totalVol: 569.1,
    }],
    result: {
      placed: [],
      unplaced: [],
      totalWeight: 11596,
      totalVolume: 569.1,
      containerVolume: 2390,
      maxPayload: 58820,
      volumeUtil: 23.8,
      weightUtil: 19.7,
      floorArea: 112,
      containerFloorArea: 304.7,
      piecesLoaded: 7,
      piecesTotal: 7,
    },
    totalContainers: 1,
    unitSystem: "imperial",
    images: { iso: "", top: "", sideA: "", front: "" },
  });

  const signature = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
  assert.equal(signature, "%PDF-");
  assert.ok(blob.size > 1000);
});

test("compatibility packing report renders a valid PDF blob", async () => {
  const containerSpec = {
    id: "40dc",
    name: "40' Standard (DC)",
    lengthIn: 473.8,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 58820,
    volumeCuFt: 2390,
    tare: 8333,
  };
  const result = {
    placed: [{
      cargoId: "pallets",
      cargoName: "Pallets",
      color: "#22c55e",
      x: 0,
      y: 0,
      z: 0,
      l: 48,
      w: 48,
      h: 61,
      weight: 1656,
      rotation: "LWH",
      stackable: false,
    }],
    unplaced: [],
    totalWeight: 11596,
    totalVolume: 569.1,
    containerVolume: 2390,
    maxPayload: 58820,
    volumeUtil: 23.8,
    weightUtil: 19.7,
    floorArea: 112,
    containerFloorArea: 304.7,
    piecesLoaded: 7,
    piecesTotal: 7,
  };

  const blob = await generateBasicPackingReportBlob({
    containerSpec,
    cargoItems: [{
      id: "pallets",
      name: "Pallets",
      length: 48,
      width: 48,
      height: 61,
      weight: 11596,
      quantity: 7,
      color: "#22c55e",
      stackable: false,
      palletized: false,
      palletType: "none",
      customPalletL: 48,
      customPalletW: 40,
      customPalletH: 6,
      rotationMode: "horizontal",
      included: true,
      loadPriority: "normal",
    }],
    result,
    totalContainers: 1,
    unitSystem: "imperial",
  });

  const signature = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
  assert.equal(signature, "%PDF-");
  assert.ok(blob.size > 1000);
});
