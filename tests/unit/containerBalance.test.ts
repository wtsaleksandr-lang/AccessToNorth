import assert from "node:assert/strict";
import test from "node:test";
import { calculateContainerBalance } from "../../client/src/lib/containerBalance";
import type { ContainerSpec, PlacedBox } from "../../client/src/lib/containerPacking";

const container: ContainerSpec = {
  id: "test",
  name: "Test container",
  lengthIn: 100,
  widthIn: 40,
  heightIn: 40,
  maxPayloadLbs: 10_000,
  volumeCuFt: 93,
  tare: 0,
};

function box(overrides: Partial<PlacedBox> = {}): PlacedBox {
  return {
    cargoId: "cargo",
    cargoName: "Box",
    color: "#2563eb",
    x: 40,
    y: 0,
    z: 10,
    l: 20,
    w: 20,
    h: 10,
    weight: 100,
    rotation: "LWH",
    stackable: true,
    ...overrides,
  };
}

test("centered cargo reports a balanced center of gravity", () => {
  const balance = calculateContainerBalance([box()], container);

  assert.equal(balance.status, "balanced");
  assert.equal(balance.longitudinalPct, 50);
  assert.equal(balance.lateralPct, 50);
  assert.equal(balance.closedEndWeightPct, 50);
  assert.equal(balance.sideAWeightPct, 50);
});

test("off-center cargo produces corrective guidance", () => {
  const balance = calculateContainerBalance([box({ x: 0, z: 0 })], container);

  assert.equal(balance.status, "review");
  assert.ok(balance.guidance.includes("Shift some weight toward the container doors."));
  assert.ok(balance.guidance.includes("Shift some weight toward Side B."));
});

test("weight distribution splits boxes crossing a container midpoint", () => {
  const balance = calculateContainerBalance([
    box({ x: 0, z: 0, l: 60, w: 40, weight: 300 }),
    box({ x: 80, z: 0, l: 20, w: 40, weight: 100 }),
  ], container);

  assert.equal(balance.closedEndWeightPct, 62.5);
  assert.equal(balance.doorEndWeightPct, 37.5);
  assert.equal(balance.sideAWeightPct, 50);
  assert.equal(balance.sideBWeightPct, 50);
});

test("empty layouts return neutral values", () => {
  const balance = calculateContainerBalance([], container);

  assert.equal(balance.status, "empty");
  assert.equal(balance.longitudinalPct, 50);
  assert.equal(balance.lateralPct, 50);
  assert.deepEqual(balance.guidance, []);
});
