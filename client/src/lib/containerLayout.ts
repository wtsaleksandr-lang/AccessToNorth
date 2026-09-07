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

/**
 * Finds a collision-safe position for cargo returning from a staging dock.
 * The original position is preferred, then the search considers meaningful
 * edges and supported stack levels instead of walking every inch of the box.
 */
export function findSafeManualPlacement(
  box: PlacedBox,
  otherBoxes: PlacedBox[],
  container: ContainerSpec,
) {
  const original = { ...box };
  if (validateManualPlacement(original, otherBoxes, container).valid) return original;

  const xCandidates = new Set<number>([0, Math.max(0, container.lengthIn - box.l)]);
  const zCandidates = new Set<number>([0, Math.max(0, container.widthIn - box.w)]);
  const yCandidates = new Set<number>([0]);

  for (const other of otherBoxes) {
    xCandidates.add(other.x);
    xCandidates.add(other.x + other.l);
    zCandidates.add(other.z);
    zCandidates.add(other.z + other.w);
    yCandidates.add(other.y + other.h);
  }

  const xs = [...xCandidates].filter(Number.isFinite).sort((a, b) => a - b);
  const zs = [...zCandidates].filter(Number.isFinite).sort((a, b) => a - b);
  const ys = [...yCandidates].filter(Number.isFinite).sort((a, b) => a - b);

  for (const y of ys) {
    for (const x of xs) {
      for (const z of zs) {
        const candidate = { ...box, x, y, z };
        if (validateManualPlacement(candidate, otherBoxes, container).valid) return candidate;
      }
    }
  }

  return null;
}

export type ManualAlignment = "closed-end" | "length-center" | "doors" | "side-a" | "width-center" | "side-b";
export type ManualRotationDirection = "clockwise" | "counterclockwise";

export function translateManualSelection(
  boxes: PlacedBox[],
  selectedIndices: Iterable<number>,
  deltaX: number,
  deltaZ: number,
) {
  const selected = new Set(selectedIndices);
  return boxes.map((box, index) => selected.has(index)
    ? { ...box, x: Number((box.x + deltaX).toFixed(3)), z: Number((box.z + deltaZ).toFixed(3)) }
    : { ...box });
}

/** Aligns a selected cargo group while preserving every item's relative spacing and stack height. */
export function alignManualSelection(
  boxes: PlacedBox[],
  selectedIndices: Iterable<number>,
  container: ContainerSpec,
  alignment: ManualAlignment,
) {
  const selected = [...new Set(selectedIndices)].filter((index) => boxes[index]);
  if (!selected.length) return null;
  const selectedBoxes = selected.map((index) => boxes[index]);
  const minX = Math.min(...selectedBoxes.map((box) => box.x));
  const maxX = Math.max(...selectedBoxes.map((box) => box.x + box.l));
  const minZ = Math.min(...selectedBoxes.map((box) => box.z));
  const maxZ = Math.max(...selectedBoxes.map((box) => box.z + box.w));
  let deltaX = 0;
  let deltaZ = 0;

  if (alignment === "closed-end") deltaX = -minX;
  if (alignment === "length-center") deltaX = (container.lengthIn - (maxX - minX)) / 2 - minX;
  if (alignment === "doors") deltaX = container.lengthIn - maxX;
  if (alignment === "side-a") deltaZ = -minZ;
  if (alignment === "width-center") deltaZ = (container.widthIn - (maxZ - minZ)) / 2 - minZ;
  if (alignment === "side-b") deltaZ = container.widthIn - maxZ;

  const candidate = translateManualSelection(boxes, selected, deltaX, deltaZ);
  return validateManualLayout(candidate, container).valid ? candidate : null;
}

function horizontalRotationName(rotation: string) {
  if (!/^[LWH]{3}$/.test(rotation)) return rotation;
  return `${rotation[1]}${rotation[0]}${rotation[2]}`;
}

/**
 * Rotates an axis-aligned selection by 90 degrees around its shared centre.
 * The full group is shifted back inside the container when possible and the
 * operation is rejected if it would collide with other cargo or lose support.
 */
export function rotateManualSelection(
  boxes: PlacedBox[],
  selectedIndices: Iterable<number>,
  container: ContainerSpec,
  direction: ManualRotationDirection,
) {
  const selected = [...new Set(selectedIndices)].filter((index) => boxes[index]);
  if (!selected.length) return null;
  const selectedSet = new Set(selected);
  const selectedBoxes = selected.map((index) => boxes[index]);
  const minX = Math.min(...selectedBoxes.map((box) => box.x));
  const maxX = Math.max(...selectedBoxes.map((box) => box.x + box.l));
  const minZ = Math.min(...selectedBoxes.map((box) => box.z));
  const maxZ = Math.max(...selectedBoxes.map((box) => box.z + box.w));
  const centreX = (minX + maxX) / 2;
  const centreZ = (minZ + maxZ) / 2;

  let candidate = boxes.map((box, index) => {
    if (!selectedSet.has(index)) return { ...box };
    const boxCentreX = box.x + box.l / 2;
    const boxCentreZ = box.z + box.w / 2;
    const offsetX = boxCentreX - centreX;
    const offsetZ = boxCentreZ - centreZ;
    const nextCentreX = direction === "clockwise" ? centreX + offsetZ : centreX - offsetZ;
    const nextCentreZ = direction === "clockwise" ? centreZ - offsetX : centreZ + offsetX;
    return {
      ...box,
      x: Number((nextCentreX - box.w / 2).toFixed(3)),
      z: Number((nextCentreZ - box.l / 2).toFixed(3)),
      l: box.w,
      w: box.l,
      rotation: horizontalRotationName(box.rotation),
    };
  });

  const rotated = selected.map((index) => candidate[index]);
  const rotatedMinX = Math.min(...rotated.map((box) => box.x));
  const rotatedMaxX = Math.max(...rotated.map((box) => box.x + box.l));
  const rotatedMinZ = Math.min(...rotated.map((box) => box.z));
  const rotatedMaxZ = Math.max(...rotated.map((box) => box.z + box.w));
  const deltaX = rotatedMinX < 0
    ? -rotatedMinX
    : rotatedMaxX > container.lengthIn ? container.lengthIn - rotatedMaxX : 0;
  const deltaZ = rotatedMinZ < 0
    ? -rotatedMinZ
    : rotatedMaxZ > container.widthIn ? container.widthIn - rotatedMaxZ : 0;
  candidate = translateManualSelection(candidate, selected, deltaX, deltaZ);

  return validateManualLayout(candidate, container).valid ? candidate : null;
}
