import assert from "node:assert/strict";
import test from "node:test";
import {
  alignManualSelection,
  boxesOverlap3D,
  findSafeManualPlacement,
  getSupportRatio,
  isInsideContainer,
  moveManualSelectionVertical,
  rotateManualSelection,
  validateManualLayout,
  validateManualPlacement,
} from "../../client/src/lib/containerLayout";
import type { ContainerSpec, PlacedBox } from "../../client/src/lib/containerPacking";

const container: ContainerSpec = {
  id: "test",
  name: "Test container",
  lengthIn: 100,
  widthIn: 50,
  heightIn: 50,
  maxPayloadLbs: 10_000,
  volumeCuFt: 145,
  tare: 0,
};

function box(overrides: Partial<PlacedBox> = {}): PlacedBox {
  return {
    cargoId: "cargo",
    cargoName: "Box",
    color: "#2563eb",
    x: 0,
    y: 0,
    z: 0,
    l: 20,
    w: 20,
    h: 10,
    weight: 100,
    rotation: "LWH",
    stackable: true,
    ...overrides,
  };
}

test("manual placement allows touching cargo but rejects overlap", () => {
  const first = box();
  const touching = box({ x: 20 });
  const overlapping = box({ x: 19 });

  assert.equal(boxesOverlap3D(first, touching), false);
  assert.equal(boxesOverlap3D(first, overlapping), true);
  assert.equal(validateManualPlacement(touching, [first], container).valid, true);
  assert.equal(validateManualPlacement(overlapping, [first], container).reason, "collision");
});

test("manual placement keeps every cargo item inside the container", () => {
  const outside = box({ x: 81 });
  assert.equal(isInsideContainer(outside, container), false);
  assert.equal(validateManualPlacement(outside, [], container).reason, "inside");
});

test("stacked cargo needs at least sixty percent footprint support", () => {
  const support = box({ l: 20, w: 20 });
  const fullySupported = box({ y: 10 });
  const partlySupported = box({ x: 10, y: 10 });

  assert.equal(getSupportRatio(fullySupported, [support]), 1);
  assert.equal(validateManualPlacement(fullySupported, [support], container).valid, true);
  assert.equal(getSupportRatio(partlySupported, [support]), 0.5);
  assert.equal(validateManualPlacement(partlySupported, [support], container).reason, "unsupported");
});

test("cargo marked non-stackable cannot support another item", () => {
  const nonStackableSupport = box({ stackable: false });
  const upperBox = box({ y: 10 });

  assert.equal(getSupportRatio(upperBox, [nonStackableSupport]), 0);
  assert.equal(validateManualPlacement(upperBox, [nonStackableSupport], container).reason, "unsupported");
});

test("moving a supporting item cannot leave another item floating", () => {
  const movedSupport = box({ x: 30 });
  const upperBox = box({ y: 10 });
  const result = validateManualLayout([movedSupport, upperBox], container);

  assert.equal(result.valid, false);
  assert.equal(result.reason, "unsupported");
  assert.equal(result.boxIndex, 1);
});

test("staged cargo returns to its original position when it remains available", () => {
  const staged = box({ x: 20, z: 10 });
  const returned = findSafeManualPlacement(staged, [box({ x: 0, z: 10 })], container);

  assert.deepEqual(returned, staged);
});

test("staged cargo finds the next safe edge when its original position is occupied", () => {
  const staged = box({ x: 0, z: 0 });
  const occupying = box({ x: 0, z: 0 });
  const returned = findSafeManualPlacement(staged, [occupying], container);

  assert.ok(returned);
  assert.equal(validateManualPlacement(returned, [occupying], container).valid, true);
  assert.equal(boxesOverlap3D(returned, occupying), false);
});

test("staged cargo stays staged when no valid container position exists", () => {
  const oversized = box({ l: 120 });
  assert.equal(findSafeManualPlacement(oversized, [], container), null);
});

test("selected cargo aligns as a group without changing its internal spacing", () => {
  const boxes = [box({ x: 20, z: 10 }), box({ x: 40, z: 10 })];
  const aligned = alignManualSelection(boxes, [0, 1], container, "doors");

  assert.ok(aligned);
  assert.equal(aligned[1].x - aligned[0].x, 20);
  assert.equal(aligned[1].x + aligned[1].l, container.lengthIn);
});

test("group alignment is rejected when it would overlap unselected cargo", () => {
  const boxes = [box({ x: 20, z: 0 }), box({ x: 40, z: 0 }), box({ x: 80, z: 0 })];
  assert.equal(alignManualSelection(boxes, [0, 1], container, "doors"), null);
});

test("selected cargo rotates as a rigid group and stays inside the container", () => {
  const boxes = [box({ x: 10, z: 5, l: 20, w: 10 }), box({ x: 30, z: 5, l: 20, w: 10 })];
  const rotated = rotateManualSelection(boxes, [0, 1], container, "clockwise");

  assert.ok(rotated);
  assert.equal(rotated[0].l, 10);
  assert.equal(rotated[0].w, 20);
  assert.equal(rotated[0].rotation, "WLH");
  assert.equal(validateManualLayout(rotated, container).valid, true);
  assert.equal(Math.abs((rotated[1].z + rotated[1].w / 2) - (rotated[0].z + rotated[0].w / 2)), 20);
});

test("group rotation is rejected when the rotated footprint collides", () => {
  const selected = box({ x: 20, z: 0, l: 40, w: 10 });
  const blocker = box({ x: 30, z: 10, l: 20, w: 20 });
  assert.equal(rotateManualSelection([selected, blocker], [0], container, "clockwise"), null);
});


test("vertical movement snaps cargo onto the next supported stack level", () => {
  const lower = box({ x: 0, y: 0, h: 10 });
  const selected = box({ x: 0, y: 0, h: 8 });
  const raised = moveManualSelectionVertical([lower, selected], [1], container, "up");

  assert.ok(raised);
  assert.equal(raised[1].y, 10);
  assert.equal(validateManualLayout(raised, container).valid, true);
});

test("vertical movement lowers cargo to the next supported level or floor", () => {
  const support = box({ x: 0, y: 0, h: 10 });
  const selected = box({ x: 0, y: 10, h: 8 });
  const lowered = moveManualSelectionVertical([support, selected], [1], container, "down");

  assert.equal(lowered, null);
  const floorCargo = moveManualSelectionVertical([selected], [0], container, "down");
  assert.ok(floorCargo);
  assert.equal(floorCargo[0].y, 0);
});

test("vertical movement rejects unsupported floating positions", () => {
  const distantSupport = box({ x: 40, y: 0, h: 10 });
  const selected = box({ x: 0, y: 0, h: 8 });
  assert.equal(moveManualSelectionVertical([distantSupport, selected], [1], container, "up"), null);
});
