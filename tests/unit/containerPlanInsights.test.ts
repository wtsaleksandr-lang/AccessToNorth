import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContainerPlanReview,
  diagnoseUnplacedCargo,
} from "../../client/src/lib/containerPlanInsights";
import type { CargoItem, ContainerSpec, MultiContainerResult } from "../../client/src/lib/containerPacking";

const container: ContainerSpec = {
  id: "20dc",
  name: "20' Standard (DC)",
  lengthIn: 232.2,
  widthIn: 92.6,
  heightIn: 94.2,
  maxPayloadLbs: 62170,
  volumeCuFt: 1172,
  tare: 5071,
};

function cargo(overrides: Partial<CargoItem> = {}): CargoItem {
  return {
    id: "cargo-1",
    name: "Machinery",
    length: 48,
    width: 40,
    height: 40,
    weight: 2000,
    quantity: 1,
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
    ...overrides,
  };
}

test("unplaced diagnosis distinguishes oversize cargo from packing-space failure", () => {
  const oversized = diagnoseUnplacedCargo(
    [cargo({ length: 250, rotationMode: "fixed" })],
    container,
    [{ name: "Machinery", qty: 1 }],
    "imperial",
  );
  assert.match(oversized[0].reason, /does not fit in any allowed orientation/);

  const spatial = diagnoseUnplacedCargo(
    [cargo()],
    container,
    [{ name: "Machinery", qty: 1 }],
    "imperial",
  );
  assert.match(spatial[0].reason, /Fits individually/);
});

test("plan review flags missing pieces and missing weights", () => {
  const plan: MultiContainerResult = {
    containers: [{
      container,
      label: "Container 1",
      result: {
        placed: [],
        unplaced: [{ name: "Machinery", qty: 1 }],
        totalWeight: 0,
        totalVolume: 0,
        containerVolume: 1172,
        maxPayload: 62170,
        volumeUtil: 0,
        weightUtil: 0,
        floorArea: 0,
        containerFloorArea: 149.3,
        piecesLoaded: 0,
        piecesTotal: 1,
      },
    }],
    totalContainers: 1,
    totalPiecesAll: 1,
    totalPiecesLoaded: 0,
  };

  const review = buildContainerPlanReview([cargo({ weight: 0 })], plan);
  assert.equal(review.find((item) => item.id === "fit")?.status, "action");
  assert.equal(review.find((item) => item.id === "weight")?.status, "warning");
  assert.equal(review.find((item) => item.id === "securement")?.status, "manual");
});
