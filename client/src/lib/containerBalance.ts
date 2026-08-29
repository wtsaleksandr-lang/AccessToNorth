import type { ContainerSpec, PlacedBox } from "./containerPacking";

export type BalanceStatus = "balanced" | "caution" | "review" | "empty";

export interface ContainerBalance {
  status: BalanceStatus;
  centerXIn: number;
  centerYIn: number;
  centerZIn: number;
  longitudinalPct: number;
  heightPct: number;
  lateralPct: number;
  longitudinalOffsetPct: number;
  lateralOffsetPct: number;
  closedEndWeightPct: number;
  doorEndWeightPct: number;
  sideAWeightPct: number;
  sideBWeightPct: number;
  guidance: string[];
}

export interface CenteredContainerLayout {
  placed: PlacedBox[];
  shiftXIn: number;
  shiftZIn: number;
  changed: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function weightBeforeMidpoint(start: number, size: number, midpoint: number, weight: number) {
  if (size <= 0 || weight <= 0) return 0;
  const portionBefore = clamp((midpoint - start) / size, 0, 1);
  return weight * portionBefore;
}

export function calculateContainerBalance(
  placed: PlacedBox[],
  container: ContainerSpec,
): ContainerBalance {
  const weightedBoxes = placed.filter((box) => box.weight > 0);
  const totalWeight = weightedBoxes.reduce((sum, box) => sum + box.weight, 0);

  if (totalWeight <= 0) {
    return {
      status: "empty",
      centerXIn: container.lengthIn / 2,
      centerYIn: 0,
      centerZIn: container.widthIn / 2,
      longitudinalPct: 50,
      heightPct: 0,
      lateralPct: 50,
      longitudinalOffsetPct: 0,
      lateralOffsetPct: 0,
      closedEndWeightPct: 50,
      doorEndWeightPct: 50,
      sideAWeightPct: 50,
      sideBWeightPct: 50,
      guidance: [],
    };
  }

  const weightedCenter = weightedBoxes.reduce(
    (sum, box) => ({
      x: sum.x + (box.x + box.l / 2) * box.weight,
      y: sum.y + (box.y + box.h / 2) * box.weight,
      z: sum.z + (box.z + box.w / 2) * box.weight,
    }),
    { x: 0, y: 0, z: 0 },
  );

  const centerXIn = weightedCenter.x / totalWeight;
  const centerYIn = weightedCenter.y / totalWeight;
  const centerZIn = weightedCenter.z / totalWeight;
  const longitudinalPct = clamp((centerXIn / container.lengthIn) * 100, 0, 100);
  const heightPct = clamp((centerYIn / container.heightIn) * 100, 0, 100);
  const lateralPct = clamp((centerZIn / container.widthIn) * 100, 0, 100);
  const longitudinalOffsetPct = Math.abs(longitudinalPct - 50);
  const lateralOffsetPct = Math.abs(lateralPct - 50);

  const closedEndWeight = weightedBoxes.reduce(
    (sum, box) => sum + weightBeforeMidpoint(box.x, box.l, container.lengthIn / 2, box.weight),
    0,
  );
  const sideAWeight = weightedBoxes.reduce(
    (sum, box) => sum + weightBeforeMidpoint(box.z, box.w, container.widthIn / 2, box.weight),
    0,
  );
  const closedEndWeightPct = (closedEndWeight / totalWeight) * 100;
  const sideAWeightPct = (sideAWeight / totalWeight) * 100;

  let status: BalanceStatus = "balanced";
  if (longitudinalOffsetPct > 25 || lateralOffsetPct > 15 || heightPct > 70) {
    status = "review";
  } else if (longitudinalOffsetPct > 15 || lateralOffsetPct > 7.5 || heightPct > 55) {
    status = "caution";
  }

  const guidance: string[] = [];
  if (longitudinalOffsetPct > 15) {
    guidance.push(longitudinalPct < 50
      ? "Shift some weight toward the container doors."
      : "Shift some weight toward the closed end.");
  }
  if (lateralOffsetPct > 7.5) {
    guidance.push(lateralPct < 50
      ? "Shift some weight toward Side B."
      : "Shift some weight toward Side A.");
  }
  if (heightPct > 55) {
    guidance.push("Move heavier items lower where cargo rules allow.");
  }

  return {
    status,
    centerXIn,
    centerYIn,
    centerZIn,
    longitudinalPct,
    heightPct,
    lateralPct,
    longitudinalOffsetPct,
    lateralOffsetPct,
    closedEndWeightPct,
    doorEndWeightPct: 100 - closedEndWeightPct,
    sideAWeightPct,
    sideBWeightPct: 100 - sideAWeightPct,
    guidance,
  };
}

/**
 * Moves the complete cargo block as one rigid layout toward the geometric
 * centre of the container. A rigid translation preserves every existing
 * collision, support, and stacking relationship while keeping all cargo
 * inside the container bounds.
 */
export function centerContainerCargoLayout(
  placed: PlacedBox[],
  container: ContainerSpec,
): CenteredContainerLayout {
  if (placed.length === 0) return { placed, shiftXIn: 0, shiftZIn: 0, changed: false };

  const balance = calculateContainerBalance(placed, container);
  const minX = Math.min(...placed.map((box) => box.x));
  const maxX = Math.max(...placed.map((box) => box.x + box.l));
  const minZ = Math.min(...placed.map((box) => box.z));
  const maxZ = Math.max(...placed.map((box) => box.z + box.w));
  const requestedX = container.lengthIn / 2 - balance.centerXIn;
  const requestedZ = container.widthIn / 2 - balance.centerZIn;
  const shiftXIn = clamp(requestedX, -minX, container.lengthIn - maxX);
  const shiftZIn = clamp(requestedZ, -minZ, container.widthIn - maxZ);
  const changed = Math.abs(shiftXIn) > 0.1 || Math.abs(shiftZIn) > 0.1;

  return {
    placed: changed
      ? placed.map((box) => ({ ...box, x: box.x + shiftXIn, z: box.z + shiftZIn }))
      : placed,
    shiftXIn,
    shiftZIn,
    changed,
  };
}
