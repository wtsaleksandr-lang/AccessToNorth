import type { ContainerSpec, PlacedBox } from "./containerPacking";

const POSITION_EPSILON_IN = 0.05;
const SUPPORT_LEVEL_TOLERANCE_IN = 0.25;
const MIN_SUPPORT_RATIO = 0.6;

function overlapLength(aStart: number, aLength: number, bStart: number, bLength: number) {
  return Math.max(0, Math.min(aStart + aLength, bStart + bLength) - Math.max(aStart, bStart));
}

export function boxesOverlap3D(a: PlacedBox, b: PlacedBox) {
  return (
    overlapLength(a.x, a.l, b.x, b.l) > POSITION_EPSILON_IN &&
    overlapLength(a.y, a.h, b.y, b.h) > POSITION_EPSILON_IN &&
    overlapLength(a.z, a.w, b.z, b.w) > POSITION_EPSILON_IN
  );
}

export function isInsideContainer(box: PlacedBox, container: ContainerSpec) {
  return (
    box.x >= -POSITION_EPSILON_IN &&
    box.y >= -POSITION_EPSILON_IN &&
    box.z >= -POSITION_EPSILON_IN &&
    box.x + box.l <= container.lengthIn + POSITION_EPSILON_IN &&
    box.y + box.h <= container.heightIn + POSITION_EPSILON_IN &&
    box.z + box.w <= container.widthIn + POSITION_EPSILON_IN
  );
}

export function getSupportRatio(box: PlacedBox, otherBoxes: PlacedBox[]) {
  if (box.y <= POSITION_EPSILON_IN) return 1;

  const footprint = box.l * box.w;
  if (footprint <= 0) return 0;

  const supportedArea = otherBoxes.reduce((area, possibleSupport) => {
    if (!possibleSupport.stackable) return area;
    const supportTop = possibleSupport.y + possibleSupport.h;
    if (Math.abs(supportTop - box.y) > SUPPORT_LEVEL_TOLERANCE_IN) return area;

    return area + (
      overlapLength(box.x, box.l, possibleSupport.x, possibleSupport.l) *
      overlapLength(box.z, box.w, possibleSupport.z, possibleSupport.w)
    );
  }, 0);

  return Math.min(1, supportedArea / footprint);
}

export type ManualPlacementValidation = {
  valid: boolean;
  reason: "inside" | "collision" | "unsupported" | null;
  supportRatio: number;
};

export function validateManualPlacement(
  box: PlacedBox,
  otherBoxes: PlacedBox[],
  container: ContainerSpec,
): ManualPlacementValidation {
  if (!isInsideContainer(box, container)) {
    return { valid: false, reason: "inside", supportRatio: 0 };
  }

  if (otherBoxes.some((other) => boxesOverlap3D(box, other))) {
    return { valid: false, reason: "collision", supportRatio: 0 };
  }

  const supportRatio = getSupportRatio(box, otherBoxes);
  if (supportRatio + Number.EPSILON < MIN_SUPPORT_RATIO) {
    return { valid: false, reason: "unsupported", supportRatio };
  }

  return { valid: true, reason: null, supportRatio };
}

export function validateManualLayout(boxes: PlacedBox[], container: ContainerSpec) {
  for (let index = 0; index < boxes.length; index += 1) {
    const validation = validateManualPlacement(
      boxes[index],
      boxes.filter((_, otherIndex) => otherIndex !== index),
      container,
    );
    if (!validation.valid) return { ...validation, boxIndex: index };
  }

  return { valid: true, reason: null, supportRatio: 1, boxIndex: null } as const;
}
