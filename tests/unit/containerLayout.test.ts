import assert from "node:assert/strict";
import test from "node:test";
import {
  boxesOverlap3D,
  getSupportRatio,
  isInsideContainer,
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
