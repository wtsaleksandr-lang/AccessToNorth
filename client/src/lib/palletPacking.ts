export type PalletPresetId = "gma48x40" | "iso1200x1000" | "euro1200x800" | "square48" | "custom";

export interface PalletSpec {
  id: PalletPresetId;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  tareWeightLbs: number;
}

export interface PalletCarton {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightLbs: number;
  quantity: number;
  color: string;
  allowRotation: boolean;
  stackable: boolean;
  included?: boolean;
}

export interface PalletBuildOptions {
  maxLoadedHeightIn: number;
  maxGrossWeightLbs: number;
  overhangIn: number;
  interlockLayers: boolean;
}

export interface PalletPlacement {
  cartonId: string;
  cartonName: string;
  color: string;
  x: number;
  y: number;
  z: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightLbs: number;
  rotated: boolean;
}

export interface PalletLayer {
  index: number;
  cartonId: string;
  cartonName: string;
  color: string;
  z: number;
  heightIn: number;
  capacity: number;
  utilizationPct: number;
  pattern: "rows-lengthwise" | "rows-crosswise";
  placements: PalletPlacement[];
}

export interface BuiltPallet {
  index: number;
  layers: PalletLayer[];
  cartonCount: number;
  loadedLengthIn: number;
  loadedWidthIn: number;
  loadedHeightIn: number;
  cargoWeightLbs: number;
  grossWeightLbs: number;
  averageLayerUtilizationPct: number;
  centerOfGravity: { xPct: number; yPct: number; heightIn: number };
  stability: "good" | "review" | "risk";
}

export interface PalletBuildPlan {
  pallet: PalletSpec;
  options: PalletBuildOptions;
  pallets: BuiltPallet[];
  totalCartons: number;
  totalPallets: number;
  totalGrossWeightLbs: number;
  averageCartonsPerPallet: number;
  averageLayerUtilizationPct: number;
  warnings: string[];
  recommendations: string[];
}

export const PALLET_PRESETS: PalletSpec[] = [
  { id: "gma48x40", name: 'North American 48" × 40"', lengthIn: 48, widthIn: 40, heightIn: 5.5, tareWeightLbs: 45 },
  { id: "iso1200x1000", name: "ISO 1200 × 1000 mm", lengthIn: 47.244, widthIn: 39.37, heightIn: 5.67, tareWeightLbs: 55 },
  { id: "euro1200x800", name: "Euro / EPAL 1200 × 800 mm", lengthIn: 47.244, widthIn: 31.496, heightIn: 5.67, tareWeightLbs: 55 },
  { id: "square48", name: 'Square 48" × 48"', lengthIn: 48, widthIn: 48, heightIn: 5.5, tareWeightLbs: 50 },
];

interface RowOrientation {
  along: number;
  cross: number;
  rotated: boolean;
}

interface LayerPatternCandidate {
  capacity: number;
  axis: "length" | "width";
  rowsA: number;
  rowsB: number;
  usedCross: number;
  placements: Array<{
    x: number;
    y: number;
    lengthIn: number;
    widthIn: number;
    rotated: boolean;
  }>;
}

const EPSILON = 0.0001;

function round(value: number, digits = 2) {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function positiveInteger(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function buildCandidatePlacements(
  axis: "length" | "width",
  usableLength: number,
  usableWidth: number,
  overhangIn: number,
  first: RowOrientation,
  second: RowOrientation,
  rowsA: number,
  rowsB: number,
  itemLimit: number,
  reverseRows: boolean,
) {
  const axisLength = axis === "length" ? usableLength : usableWidth;
  const crossLength = axis === "length" ? usableWidth : usableLength;
  const rows: RowOrientation[] = [
    ...Array.from({ length: rowsA }, () => first),
    ...Array.from({ length: rowsB }, () => second),
  ];
  if (reverseRows) rows.reverse();

  const usedCross = rows.reduce((sum, row) => sum + row.cross, 0);
  let crossCursor = (crossLength - usedCross) / 2;
  let remaining = itemLimit;
  const placements: LayerPatternCandidate["placements"] = [];

  for (const row of rows) {
    if (remaining <= 0) break;
    const rowCapacity = Math.floor((axisLength + EPSILON) / row.along);
    const count = Math.min(rowCapacity, remaining);
    const usedAlong = count * row.along;
    let alongCursor = (axisLength - usedAlong) / 2;

    for (let i = 0; i < count; i += 1) {
      if (axis === "length") {
        placements.push({
          x: alongCursor - overhangIn,
          y: crossCursor - overhangIn,
          lengthIn: row.along,
          widthIn: row.cross,
          rotated: row.rotated,
        });
      } else {
        placements.push({
          x: crossCursor - overhangIn,
          y: alongCursor - overhangIn,
          lengthIn: row.cross,
          widthIn: row.along,
          rotated: row.rotated,
        });
      }
      alongCursor += row.along;
      remaining -= 1;
    }
    crossCursor += row.cross;
  }

  return { placements, usedCross };
}

function enumerateLayerPatterns(
  carton: PalletCarton,
  pallet: PalletSpec,
  itemLimit: number,
  overhangIn: number,
  reverseRows: boolean,
) {
  const usableLength = pallet.lengthIn + overhangIn * 2;
  const usableWidth = pallet.widthIn + overhangIn * 2;
  const patterns: LayerPatternCandidate[] = [];
  const axes: Array<"length" | "width"> = ["length", "width"];

  for (const axis of axes) {
    const axisLength = axis === "length" ? usableLength : usableWidth;
    const crossLength = axis === "length" ? usableWidth : usableLength;
    const first: RowOrientation = axis === "length"
      ? { along: carton.lengthIn, cross: carton.widthIn, rotated: false }
      : { along: carton.widthIn, cross: carton.lengthIn, rotated: false };
    const second: RowOrientation = axis === "length"
      ? { along: carton.widthIn, cross: carton.lengthIn, rotated: true }
      : { along: carton.lengthIn, cross: carton.widthIn, rotated: true };

    const maxRowsA = Math.floor((crossLength + EPSILON) / first.cross);
    const maxRowsB = carton.allowRotation ? Math.floor((crossLength + EPSILON) / second.cross) : 0;

    for (let rowsA = 0; rowsA <= maxRowsA; rowsA += 1) {
      for (let rowsB = 0; rowsB <= maxRowsB; rowsB += 1) {
        if (rowsA + rowsB === 0) continue;
        const usedCross = rowsA * first.cross + rowsB * second.cross;
        if (usedCross > crossLength + EPSILON) continue;
        const capacityA = rowsA * Math.floor((axisLength + EPSILON) / first.along);
        const capacityB = rowsB * Math.floor((axisLength + EPSILON) / second.along);
        const capacity = capacityA + capacityB;
        if (capacity <= 0) continue;
        const built = buildCandidatePlacements(
          axis,
          usableLength,
          usableWidth,
          overhangIn,
          first,
          second,
          rowsA,
          rowsB,
          Math.min(itemLimit, capacity),
          reverseRows,
        );
        patterns.push({ axis, rowsA, rowsB, capacity, usedCross: built.usedCross, placements: built.placements });
      }
    }
  }

  const unique = new Map<string, LayerPatternCandidate>();
  for (const pattern of patterns) {
    const key = `${pattern.axis}:${pattern.rowsA}:${pattern.rowsB}:${pattern.capacity}`;
    unique.set(key, pattern);
  }

  return Array.from(unique.values()).sort((a, b) => {
    if (b.capacity !== a.capacity) return b.capacity - a.capacity;
    if (b.placements.length !== a.placements.length) return b.placements.length - a.placements.length;
    return b.usedCross - a.usedCross;
  });
}

export function buildBestLayerPattern(
  carton: PalletCarton,
  pallet: PalletSpec,
  itemLimit = Number.MAX_SAFE_INTEGER,
  overhangIn = 0,
  layerIndex = 0,
  interlockLayers = true,
): LayerPatternCandidate | null {
  const candidates = enumerateLayerPatterns(
    carton,
    pallet,
    itemLimit,
    Math.max(0, overhangIn),
    interlockLayers && layerIndex % 2 === 1,
  );
  if (candidates.length === 0) return null;

  const bestCapacity = candidates[0].capacity;
  const equivalent = candidates.filter((candidate) => candidate.capacity === bestCapacity);
  const selected = interlockLayers && layerIndex % 2 === 1 && equivalent.length > 1
    ? equivalent.find((candidate) => candidate.axis !== equivalent[0].axis) || equivalent[1]
    : equivalent[0];

  return selected;
}

function createEmptyPallet(index: number): BuiltPallet {
  return {
    index,
    layers: [],
    cartonCount: 0,
    loadedLengthIn: 0,
    loadedWidthIn: 0,
    loadedHeightIn: 0,
    cargoWeightLbs: 0,
    grossWeightLbs: 0,
    averageLayerUtilizationPct: 0,
    centerOfGravity: { xPct: 50, yPct: 50, heightIn: 0 },
    stability: "good",
  };
}

function finalizePallet(palletLoad: BuiltPallet, pallet: PalletSpec) {
  const placements = palletLoad.layers.flatMap((layer) => layer.placements);
  const minX = placements.length ? Math.min(...placements.map((box) => box.x)) : 0;
  const minY = placements.length ? Math.min(...placements.map((box) => box.y)) : 0;
  const maxX = placements.length ? Math.max(...placements.map((box) => box.x + box.lengthIn)) : pallet.lengthIn;
  const maxY = placements.length ? Math.max(...placements.map((box) => box.y + box.widthIn)) : pallet.widthIn;
  const totalWeight = placements.reduce((sum, box) => sum + box.weightLbs, 0);
  const weightedX = placements.reduce((sum, box) => sum + (box.x + box.lengthIn / 2) * box.weightLbs, 0);
  const weightedY = placements.reduce((sum, box) => sum + (box.y + box.widthIn / 2) * box.weightLbs, 0);
  const weightedZ = placements.reduce((sum, box) => sum + (box.z + box.heightIn / 2) * box.weightLbs, 0);
  const xCenter = totalWeight > 0 ? weightedX / totalWeight : pallet.lengthIn / 2;
  const yCenter = totalWeight > 0 ? weightedY / totalWeight : pallet.widthIn / 2;
  const layerUtilization = palletLoad.layers.length
    ? palletLoad.layers.reduce((sum, layer) => sum + layer.utilizationPct, 0) / palletLoad.layers.length
    : 0;
  const xPct = pallet.lengthIn > 0 ? (xCenter / pallet.lengthIn) * 100 : 50;
  const yPct = pallet.widthIn > 0 ? (yCenter / pallet.widthIn) * 100 : 50;
  const maxOffset = Math.max(Math.abs(50 - xPct), Math.abs(50 - yPct));
  const minLayerUtil = palletLoad.layers.length ? Math.min(...palletLoad.layers.map((layer) => layer.utilizationPct)) : 0;

  palletLoad.cartonCount = placements.length;
  palletLoad.loadedLengthIn = round(Math.max(pallet.lengthIn, maxX - minX));
  palletLoad.loadedWidthIn = round(Math.max(pallet.widthIn, maxY - minY));
  palletLoad.loadedHeightIn = round(pallet.heightIn + palletLoad.layers.reduce((sum, layer) => sum + layer.heightIn, 0));
  palletLoad.cargoWeightLbs = round(totalWeight);
  palletLoad.grossWeightLbs = round(totalWeight + pallet.tareWeightLbs);
  palletLoad.averageLayerUtilizationPct = round(layerUtilization, 1);
  palletLoad.centerOfGravity = {
    xPct: round(xPct, 1),
    yPct: round(yPct, 1),
    heightIn: round(totalWeight > 0 ? weightedZ / totalWeight : pallet.heightIn, 1),
  };
  palletLoad.stability = maxOffset > 15 || minLayerUtil < 35
    ? "risk"
    : maxOffset > 9 || minLayerUtil < 55
      ? "review"
      : "good";
}

export function buildPalletPlan(
  cartons: PalletCarton[],
  pallet: PalletSpec,
  options: PalletBuildOptions,
): PalletBuildPlan {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const normalizedOptions: PalletBuildOptions = {
    maxLoadedHeightIn: Math.max(pallet.heightIn, options.maxLoadedHeightIn || 0),
    maxGrossWeightLbs: Math.max(pallet.tareWeightLbs, options.maxGrossWeightLbs || 0),
    overhangIn: Math.max(0, options.overhangIn || 0),
    interlockLayers: options.interlockLayers,
  };
  const validCartons = cartons
    .filter((carton) => carton.included !== false && positiveInteger(carton.quantity) > 0)
    .filter((carton) => {
      const valid = carton.lengthIn > 0 && carton.widthIn > 0 && carton.heightIn > 0 && carton.weightLbs >= 0;
      if (!valid) warnings.push(`${carton.name || "A carton row"} was skipped because its dimensions are incomplete.`);
      return valid;
    })
    .map((carton) => ({ ...carton, quantity: positiveInteger(carton.quantity) }))
    .sort((a, b) => {
      if (a.stackable !== b.stackable) return a.stackable ? -1 : 1;
      const pressureA = a.weightLbs / Math.max(1, a.lengthIn * a.widthIn);
      const pressureB = b.weightLbs / Math.max(1, b.lengthIn * b.widthIn);
      return pressureB - pressureA;
    });

  const pallets: BuiltPallet[] = [];
  let current = createEmptyPallet(1);
  let currentClosed = false;

  const openNextPallet = () => {
    if (current.layers.length > 0) {
      finalizePallet(current, pallet);
      pallets.push(current);
    }
    current = createEmptyPallet(pallets.length + 1);
    currentClosed = false;
  };

  for (const carton of validCartons) {
    let remaining = carton.quantity;
    const testPattern = buildBestLayerPattern(
      carton,
      pallet,
      remaining,
      normalizedOptions.overhangIn,
      0,
      normalizedOptions.interlockLayers,
    );
    if (!testPattern) {
      warnings.push(`${carton.name || "Carton"} does not fit the selected pallet footprint, even with the allowed overhang.`);
      continue;
    }

    while (remaining > 0) {
      if (currentClosed) openNextPallet();

      const currentHeight = pallet.heightIn + current.layers.reduce((sum, layer) => sum + layer.heightIn, 0);
      const currentGrossWeight = pallet.tareWeightLbs + current.layers
        .flatMap((layer) => layer.placements)
        .reduce((sum, placement) => sum + placement.weightLbs, 0);
      const fitsHeight = currentHeight + carton.heightIn <= normalizedOptions.maxLoadedHeightIn + EPSILON;
      const availableWeight = normalizedOptions.maxGrossWeightLbs - currentGrossWeight;
      let maxByWeight = carton.weightLbs > 0 ? Math.floor((availableWeight + EPSILON) / carton.weightLbs) : remaining;

      if ((!fitsHeight || maxByWeight <= 0) && current.layers.length > 0) {
        openNextPallet();
        continue;
      }

      if (!fitsHeight && current.layers.length === 0) {
        warnings.push(`${carton.name || "Carton"} alone exceeds the selected maximum loaded height.`);
      }
      if (maxByWeight <= 0 && current.layers.length === 0) {
        maxByWeight = 1;
        warnings.push(`${carton.name || "Carton"} alone exceeds the selected pallet gross-weight limit.`);
      }

      const pattern = buildBestLayerPattern(
        carton,
        pallet,
        Math.min(remaining, Math.max(1, maxByWeight)),
        normalizedOptions.overhangIn,
        current.layers.length,
        normalizedOptions.interlockLayers,
      );
      if (!pattern || pattern.placements.length === 0) break;

      const z = pallet.heightIn + current.layers.reduce((sum, layer) => sum + layer.heightIn, 0);
      const placements: PalletPlacement[] = pattern.placements.map((placement) => ({
        cartonId: carton.id,
        cartonName: carton.name || "Carton",
        color: carton.color,
        x: round(placement.x, 4),
        y: round(placement.y, 4),
        z: round(z, 4),
        lengthIn: placement.lengthIn,
        widthIn: placement.widthIn,
        heightIn: carton.heightIn,
        weightLbs: carton.weightLbs,
        rotated: placement.rotated,
      }));
      const usableArea = (pallet.lengthIn + normalizedOptions.overhangIn * 2) * (pallet.widthIn + normalizedOptions.overhangIn * 2);
      const occupiedArea = placements.reduce((sum, placement) => sum + placement.lengthIn * placement.widthIn, 0);
      current.layers.push({
        index: current.layers.length + 1,
        cartonId: carton.id,
        cartonName: carton.name || "Carton",
        color: carton.color,
        z,
        heightIn: carton.heightIn,
        capacity: pattern.capacity,
        utilizationPct: round((occupiedArea / usableArea) * 100, 1),
        pattern: pattern.axis === "length" ? "rows-lengthwise" : "rows-crosswise",
        placements,
      });
      remaining -= placements.length;
      if (!carton.stackable) currentClosed = true;
    }
  }

  openNextPallet();

  const totalCartons = pallets.reduce((sum, built) => sum + built.cartonCount, 0);
  const totalGrossWeightLbs = pallets.reduce((sum, built) => sum + built.grossWeightLbs, 0);
  const averageLayerUtilizationPct = pallets.length
    ? pallets.reduce((sum, built) => sum + built.averageLayerUtilizationPct, 0) / pallets.length
    : 0;

  if (normalizedOptions.overhangIn > 0) {
    recommendations.push("Confirm the permitted overhang and wrapping method with the warehouse or carrier before building the pallet.");
  }
  if (pallets.some((built) => built.stability !== "good")) {
    recommendations.push("Review the highlighted pallet balance and low-coverage layers before wrapping or strapping.");
  }
  if (averageLayerUtilizationPct > 0 && averageLayerUtilizationPct < 70) {
    recommendations.push("A different pallet footprint may reduce unused layer area.");
  }
  if (validCartons.length > 1) {
    recommendations.push("Mixed-SKU pallets should be checked for carton compression strength and warehouse handling rules.");
  }

  return {
    pallet,
    options: normalizedOptions,
    pallets,
    totalCartons,
    totalPallets: pallets.length,
    totalGrossWeightLbs: round(totalGrossWeightLbs),
    averageCartonsPerPallet: pallets.length ? round(totalCartons / pallets.length, 1) : 0,
    averageLayerUtilizationPct: round(averageLayerUtilizationPct, 1),
    warnings,
    recommendations,
  };
}
