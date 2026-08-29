import assert from "node:assert/strict";
import test from "node:test";
import {
  generatePackingReportBlob,
  resolveContainerReportBrand,
} from "../../client/src/pages/tools/container-pdf/ContainerPackingReportPDF";
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

test("complete report includes a loading-plan page for every container", async () => {
  const containerSpec = {
    id: "20dc",
    name: "20' Standard (DC)",
    lengthIn: 232.2,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 62170,
    volumeCuFt: 1172,
    tare: 5071,
  };
  const makeResult = (piecesLoaded: number) => ({
    placed: [],
    unplaced: [],
    totalWeight: piecesLoaded * 1200,
    totalVolume: piecesLoaded * 80,
    containerVolume: 1172,
    maxPayload: 62170,
    volumeUtil: piecesLoaded * 6.8,
    weightUtil: piecesLoaded * 1.93,
    floorArea: piecesLoaded * 16,
    containerFloorArea: 149.3,
    piecesLoaded,
    piecesTotal: piecesLoaded,
  });
  const firstResult = makeResult(4);
  const secondResult = makeResult(3);
  const blob = await generatePackingReportBlob({
    containerSpec,
    cargoRows: [{
      name: "Pallets",
      qty: 7,
      l: 48,
      w: 48,
      h: 61,
      weightPer: 1200,
      totalWeight: 8400,
      stackable: false,
      rotation: "Horiz.",
      color: "#155e75",
      volPer: 80,
      totalVol: 560,
    }],
    result: firstResult,
    totalContainers: 2,
    unitSystem: "imperial",
    images: { iso: "", top: "", sideA: "", front: "" },
    containerPlans: [
      { label: "Container 1", containerSpec, result: firstResult },
      { label: "Container 2", containerSpec, result: secondResult },
    ],
  });

  const pdfSource = new TextDecoder("latin1").decode(await blob.arrayBuffer());
  assert.equal((pdfSource.match(/\/Type \/Page\b/g) ?? []).length, 3);
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

test("report branding keeps AccessToNorth defaults and accepts entitled account overrides", () => {
  assert.deepEqual(resolveContainerReportBrand(), {
    name: "AccessToNorth",
    domainSuffix: ".com",
    tagline: "Canadian Import & Business Registration Services",
    accentColor: "#0f7fe5",
  });
  assert.deepEqual(resolveContainerReportBrand({
    name: "North Star Imports",
    domainSuffix: "",
    tagline: "Prepared for warehouse operations",
    accentColor: "#155e75",
  }), {
    name: "North Star Imports",
    domainSuffix: "",
    tagline: "Prepared for warehouse operations",
    accentColor: "#155e75",
  });
});
