export interface ContainerSpec {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  maxPayloadLbs: number;
  volumeCuFt: number;
  tare: number;
}

export const CONTAINER_PRESETS: ContainerSpec[] = [
  {
    id: "20dc",
    name: "20' Standard (DC)",
    lengthIn: 232.2,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 62170,
    volumeCuFt: 1172,
    tare: 5071,
  },
  {
    id: "40dc",
    name: "40' Standard (DC)",
    lengthIn: 473.8,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 58820,
    volumeCuFt: 2390,
    tare: 8333,
  },
  {
    id: "40hc",
    name: "40' High Cube (HC)",
    lengthIn: 473.8,
    widthIn: 92.6,
    heightIn: 105.1,
    maxPayloadLbs: 58420,
    volumeCuFt: 2694,
    tare: 8775,
  },
  {
    id: "45hc",
    name: "45' High Cube (HC)",
    lengthIn: 524.8,
    widthIn: 92.6,
    heightIn: 105.1,
    maxPayloadLbs: 57650,
    volumeCuFt: 3043,
    tare: 10580,
  },
];

export type RotationMode = "all" | "horizontal" | "fixed";
export type LoadPriority = "first" | "normal" | "last";
export type PalletType = "none" | "us48x40" | "euro" | "custom";

export interface CargoItem {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  /** Total gross weight for all pieces represented by this row, in pounds. */
  weight: number;
  quantity: number;
  color: string;
  stackable: boolean;
  palletized: boolean;
  palletType: PalletType;
  customPalletL: number;
  customPalletW: number;
  customPalletH: number;
  rotationMode: RotationMode;
  included: boolean;
  loadPriority: LoadPriority;
}

export const PALLET_DIMS: Record<string, { l: number; w: number; h: number; label: string }> = {
  us48x40: { l: 48, w: 40, h: 6, label: "US 48×40\"" },
  euro: { l: 47.2, w: 31.5, h: 5.7, label: "Euro 1200×800mm" },
};

export interface PlacedBox {
  cargoId: string;
  cargoName: string;
  color: string;
  x: number;
  y: number;
  z: number;
  l: number;
  w: number;
  h: number;
  weight: number;
  rotation: string;
  stackable: boolean;
}

export interface LoadingResult {
  placed: PlacedBox[];
  unplaced: { name: string; qty: number }[];
  totalWeight: number;
  totalVolume: number;
  containerVolume: number;
  maxPayload: number;
  volumeUtil: number;
  weightUtil: number;
  floorArea: number;
  containerFloorArea: number;
  piecesLoaded: number;
  piecesTotal: number;
}

export interface MultiContainerResult {
  containers: {
    container: ContainerSpec;
    result: LoadingResult;
    label: string;
  }[];
  totalContainers: number;
  totalPiecesAll: number;
  totalPiecesLoaded: number;
}

export interface ContainerRecommendation {
  container: ContainerSpec;
  plan: MultiContainerResult;
}

export function cuInToCuFt(cuIn: number) {
  return cuIn / 1728;
}

function sqInToSqFt(sqIn: number) {
  return sqIn / 144;
}

function getRotations(
  bl: number,
  bw: number,
  bh: number,
  mode: RotationMode,
): [number, number, number, string][] {
  if (mode === "fixed") return [[bl, bw, bh, "LWH"]];
  if (mode === "horizontal") {
    return [
      [bl, bw, bh, "LWH"],
      [bw, bl, bh, "WLH"],
    ];
  }
  return [
    [bl, bw, bh, "LWH"],
    [bl, bh, bw, "LHW"],
    [bw, bl, bh, "WLH"],
    [bw, bh, bl, "WHL"],
    [bh, bl, bw, "HLW"],
    [bh, bw, bl, "HWL"],
  ];
}

export function packBoxes(items: CargoItem[], container: ContainerSpec): LoadingResult {
  const cL = container.lengthIn;
  const cW = container.widthIn;
  const cH = container.heightIn;
  const maxPay = container.maxPayloadLbs;
  const includedItems = items.filter((item) => item.included);

  const allBoxes: {
    cargoId: string;
    name: string;
    color: string;
    dims: [number, number, number];
    weight: number;
    stackable: boolean;
    rotationMode: RotationMode;
    loadPriority: LoadPriority;
  }[] = [];

  for (const item of includedItems) {
    let boxL = item.length;
    let boxW = item.width;
    let boxH = item.height;
    const boxWeight = item.quantity > 0 ? item.weight / item.quantity : 0;

    if (item.palletized && item.palletType !== "none") {
      const pd = item.palletType === "custom"
        ? { l: item.customPalletL, w: item.customPalletW, h: item.customPalletH }
        : PALLET_DIMS[item.palletType];
      if (pd) {
        boxL = Math.max(boxL, pd.l);
        boxW = Math.max(boxW, pd.w);
        boxH += pd.h;
      }
    }

    for (let q = 0; q < item.quantity; q += 1) {
      allBoxes.push({
        cargoId: item.id,
        name: item.name || `Item ${items.indexOf(item) + 1}`,
        color: item.color,
        dims: [boxL, boxW, boxH],
        weight: boxWeight,
        stackable: item.stackable,
        rotationMode: item.rotationMode,
        loadPriority: item.loadPriority,
      });
    }
  }

  const priorityOrder: Record<LoadPriority, number> = { first: 0, normal: 1, last: 2 };
  allBoxes.sort((a, b) => {
    const priorityDiff = priorityOrder[a.loadPriority] - priorityOrder[b.loadPriority];
    if (priorityDiff !== 0) return priorityDiff;
    const volA = a.dims[0] * a.dims[1] * a.dims[2];
    const volB = b.dims[0] * b.dims[1] * b.dims[2];
    return volB - volA;
  });

  const placed: PlacedBox[] = [];
  const unplacedMap = new Map<string, number>();
  let totalWeight = 0;
  const spaces: { x: number; y: number; z: number; l: number; w: number; h: number }[] = [
    { x: 0, y: 0, z: 0, l: cL, w: cW, h: cH },
  ];

  for (const box of allBoxes) {
    const [bl, bw, bh] = box.dims;
    const rotations = getRotations(bl, bw, bh, box.rotationMode);
    let bestFit: { spaceIdx: number; rotation: [number, number, number, string] } | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let si = 0; si < spaces.length; si += 1) {
      const space = spaces[si];
      for (const rotation of rotations) {
        const [rl, rw, rh] = rotation;
        if (
          rl <= space.l + 0.01
          && rw <= space.w + 0.01
          && rh <= space.h + 0.01
          && totalWeight + box.weight <= maxPay + 0.01
        ) {
          const waste = (space.l * space.w * space.h) - (rl * rw * rh);
          const floorPenalty = space.y * cL * cW;
          const score = waste + floorPenalty;
          if (score < bestScore) {
            bestScore = score;
            bestFit = { spaceIdx: si, rotation };
          }
        }
      }
    }

    if (!bestFit) {
      unplacedMap.set(box.name, (unplacedMap.get(box.name) || 0) + 1);
      continue;
    }

    const space = spaces[bestFit.spaceIdx];
    const [rl, rw, rh, rotation] = bestFit.rotation;
    placed.push({
      cargoId: box.cargoId,
      cargoName: box.name,
      color: box.color,
      x: space.x,
      y: space.y,
      z: space.z,
      l: rl,
      w: rw,
      h: rh,
      weight: box.weight,
      rotation,
      stackable: box.stackable,
    });

    totalWeight += box.weight;
    spaces.splice(bestFit.spaceIdx, 1);
    if (space.l - rl > 0.1) {
      spaces.push({ x: space.x + rl, y: space.y, z: space.z, l: space.l - rl, w: space.w, h: space.h });
    }
    if (space.w - rw > 0.1) {
      spaces.push({ x: space.x, y: space.y, z: space.z + rw, l: rl, w: space.w - rw, h: space.h });
    }
    if (box.stackable && space.h - rh > 0.1) {
      spaces.push({ x: space.x, y: space.y + rh, z: space.z, l: rl, w: rw, h: space.h - rh });
    }

    spaces.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 0.1) return a.y - b.y;
      if (Math.abs(a.z - b.z) > 0.1) return a.z - b.z;
      return a.x - b.x;
    });
  }

  const totalVolumeIn3 = placed.reduce((sum, item) => sum + item.l * item.w * item.h, 0);
  const containerVolumeIn3 = cL * cW * cH;
  const totalPiecesAll = includedItems.reduce((sum, item) => sum + item.quantity, 0);
  let maxX = 0;
  let maxZ = 0;
  for (const item of placed) {
    maxX = Math.max(maxX, item.x + item.l);
    maxZ = Math.max(maxZ, item.z + item.w);
  }

  return {
    placed,
    unplaced: Array.from(unplacedMap.entries()).map(([name, qty]) => ({ name, qty })),
    totalWeight,
    totalVolume: cuInToCuFt(totalVolumeIn3),
    containerVolume: cuInToCuFt(containerVolumeIn3),
    maxPayload: maxPay,
    volumeUtil: (totalVolumeIn3 / containerVolumeIn3) * 100,
    weightUtil: (totalWeight / maxPay) * 100,
    floorArea: sqInToSqFt(maxX * maxZ),
    containerFloorArea: sqInToSqFt(cL * cW),
    piecesLoaded: placed.length,
    piecesTotal: totalPiecesAll,
  };
}

export function packIntoContainers(
  items: CargoItem[],
  container: ContainerSpec,
  maxContainers = 10,
): MultiContainerResult {
  const validItems = items.filter((item) => item.included && item.quantity > 0);
  const totalPiecesAll = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const containers: MultiContainerResult["containers"] = [];
  let remaining = validItems.map((item) => ({ ...item }));

  while (remaining.length > 0 && containers.length < maxContainers) {
    const result = packBoxes(remaining, container);
    containers.push({
      container,
      result,
      label: containers.length === 0 && result.unplaced.length === 0
        ? `1 × ${container.name}`
        : `Container ${containers.length + 1} — ${container.name}`,
    });

    if (result.unplaced.length === 0 || result.piecesLoaded === 0) break;

    const placedCounts = new Map<string, number>();
    for (const item of result.placed) {
      placedCounts.set(item.cargoId, (placedCounts.get(item.cargoId) || 0) + 1);
    }

    remaining = remaining.flatMap((item) => {
      const placedQty = placedCounts.get(item.id) || 0;
      const leftover = item.quantity - placedQty;
      if (leftover <= 0) return [];
      return [{
        ...item,
        quantity: leftover,
        weight: item.quantity > 0 ? item.weight * (leftover / item.quantity) : 0,
      }];
    });
  }

  return {
    containers,
    totalContainers: containers.length,
    totalPiecesAll,
    totalPiecesLoaded: containers.reduce((sum, entry) => sum + entry.result.piecesLoaded, 0),
  };
}

export function recommendContainer(
  items: CargoItem[],
  presets: ContainerSpec[] = CONTAINER_PRESETS,
): ContainerRecommendation | null {
  const candidates = presets.map((container) => ({
    container,
    plan: packIntoContainers(items, container),
  }));
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aComplete = a.plan.totalPiecesLoaded === a.plan.totalPiecesAll;
    const bComplete = b.plan.totalPiecesLoaded === b.plan.totalPiecesAll;
    if (aComplete !== bComplete) return aComplete ? -1 : 1;
    if (!aComplete && a.plan.totalPiecesLoaded !== b.plan.totalPiecesLoaded) {
      return b.plan.totalPiecesLoaded - a.plan.totalPiecesLoaded;
    }
    if (a.plan.totalContainers !== b.plan.totalContainers) {
      return a.plan.totalContainers - b.plan.totalContainers;
    }
    const aCapacity = a.plan.totalContainers * a.container.volumeCuFt;
    const bCapacity = b.plan.totalContainers * b.container.volumeCuFt;
    if (aCapacity !== bCapacity) return aCapacity - bCapacity;
    return a.container.volumeCuFt - b.container.volumeCuFt;
  });

  return candidates[0];
}
