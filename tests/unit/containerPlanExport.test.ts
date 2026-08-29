import assert from "node:assert/strict";
import test from "node:test";
import { buildContainerPlacementCsv } from "../../client/src/lib/containerPlanExport";
import type { MultiContainerResult } from "../../client/src/lib/containerPacking";

test("placement CSV includes every container and safely quotes cargo names", () => {
  const container = {
    id: "20dc",
    name: "20' Standard (DC)",
    lengthIn: 232.2,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 62170,
    volumeCuFt: 1172,
    tare: 5071,
  };
  const result = (x: number) => ({
    placed: [{
      cargoId: "cargo",
      cargoName: "Crate, fragile",
      color: "#155e75",
      x,
      y: 0,
      z: 2,
      l: 48,
      w: 40,
      h: 36,
      weight: 1000,
      rotation: "LWH",
      stackable: false,
    }],
    unplaced: [],
    totalWeight: 1000,
    totalVolume: 40,
    containerVolume: 1172,
    maxPayload: 62170,
    volumeUtil: 3.4,
    weightUtil: 1.6,
    floorArea: 13.3,
    containerFloorArea: 149.3,
    piecesLoaded: 1,
    piecesTotal: 1,
  });
  const plan: MultiContainerResult = {
    containers: [
      { container, label: "Container 1", result: result(0) },
      { container, label: "Container 2", result: { ...result(12), unplaced: [{ name: "Oversize frame", qty: 1 }] } },
    ],
    totalContainers: 2,
    totalPiecesAll: 3,
    totalPiecesLoaded: 2,
  };

  const csv = buildContainerPlacementCsv(plan, "metric");
  assert.match(csv, /Position X \(cm\)/);
  assert.match(csv, /"Crate, fragile"/);
  assert.equal(csv.trim().split("\r\n").length, 4);
  assert.match(csv, /^1,/m);
  assert.match(csv, /^2,/m);
  assert.match(csv, /Assigned/);
  assert.match(csv, /UNPLACED - 1 piece/);
});
