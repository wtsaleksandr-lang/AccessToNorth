import {
  cuInToCuFt,
  packIntoContainers,
  type CargoItem,
  type ContainerSpec,
  type LoadPriority,
  type MultiContainerResult,
  type PlacedBox,
  type RotationMode,
} from "./containerPacking";
import { calculateContainerBalance, type ContainerBalance } from "./containerBalance";
import { PALLET_PRESETS, buildPalletPlan, type PalletCarton, type PalletSpec } from "./palletPacking";
import { createPalletPlanTransfer } from "./palletTransfer";

export interface TruckTrailerLike {
  id: string;
  name: string;
  category: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  maxPayloadLbs: number;
  hasDeck: boolean;
  deckHeightIn?: number;
}

export interface TruckCartonCargo {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightLbs: number;
  quantity: number;
  color: string;
  stackable: boolean;
  rotation: RotationMode;
  priority: number;
  palletAssign: string;
}

export interface TruckPalletCargo {
  id: string;
  name: string;
  palletType: string;
  customL: number;
  customW: number;
  heightIn: number;
  weightLbs: number;
  quantity: number;
  color: string;
  stackable: boolean;
  rotation: RotationMode;
  priority: number;
}

export interface TruckBalance extends ContainerBalance {
  distanceFromNoseIn: number;
  noseWeightPct: number;
  doorWeightPct: number;
}

export interface TruckLoadingStep {
  step: number;
  boxIndex: number;
  cargoName: string;
  positionFromNoseIn: number;
  levelIn: number;
}

export interface TruckSpatialPlan {
  trailer: TruckTrailerLike;
  packingContainer: ContainerSpec;
  multi: MultiContainerResult;
  complete: boolean;
  trailersRequired: number;
  piecesLoaded: number;
  piecesTotal: number;
  totalPlacedWeightLbs: number;
  totalPlacedVolumeCuFt: number;
  averageVolumeUtilPct: number;
  averageWeightUtilPct: number;
  balances: TruckBalance[];
  loadingSequences: TruckLoadingStep[][];
}

const TRUCK_PALLET_DIMENSIONS: Record<string, { lengthIn: number; widthIn: number }> = {
  "48x40": { lengthIn: 48, widthIn: 40 },
  "48x48": { lengthIn: 48, widthIn: 48 },
  euro: { lengthIn: 47.244, widthIn: 31.496 },
};

const AUTO_PALLET_PRESETS: Record<string, PalletSpec> = {
  "48x40": PALLET_PRESETS.find((pallet) => pallet.id === "gma48x40")!,
  "48x48": PALLET_PRESETS.find((pallet) => pallet.id === "square48")!,
  euro: PALLET_PRESETS.find((pallet) => pallet.id === "euro1200x800")!,
};

function priorityFromNumber(priority: number): LoadPriority {
  return priority === 1 ? "first" : priority === 2 ? "last" : "normal";
}

function autoPalletizeCarton(carton: TruckCartonCargo): CargoItem[] {
  const pallet = AUTO_PALLET_PRESETS[carton.palletAssign];
  if (!pallet) return [];
  const palletCarton: PalletCarton = {
    id: carton.id,
    name: carton.name || "Carton",
    lengthIn: carton.lengthIn,
    widthIn: carton.widthIn,
    heightIn: carton.heightIn,
    weightLbs: carton.weightLbs,
    quantity: carton.quantity,
    color: carton.color,
    allowRotation: carton.rotation !== "fixed",
    stackable: carton.stackable,
  };
  const palletPlan = buildPalletPlan([palletCarton], pallet, {
    maxLoadedHeightIn: 72,
    maxGrossWeightLbs: 2500,
    overhangIn: 0,
    interlockLayers: true,
  });
  const transfer = createPalletPlanTransfer(palletPlan);
  return transfer.rows.map((row, index) => ({
    id: `${carton.id}-auto-pallet-${index}`,
    name: carton.name ? `${carton.name} pallet` : `Built pallet ${index + 1}`,
    length: row.lengthIn,
    width: row.widthIn,
    height: row.heightIn,
    weight: row.grossWeightLbs * row.quantity,
    quantity: row.quantity,
    color: carton.color,
    stackable: false,
    palletized: false,
    palletType: "none",
    customPalletL: row.lengthIn,
    customPalletW: row.widthIn,
    customPalletH: 0,
    rotationMode: "horizontal",
    included: true,
    loadPriority: priorityFromNumber(carton.priority),
  }));
}

export function createTruckPackingItems({
  cargoMode,
  cartons,
  pallets,
}: {
  cargoMode: "cartons" | "pallets";
  cartons: TruckCartonCargo[];
  pallets: TruckPalletCargo[];
}): CargoItem[] {
  if (cargoMode === "cartons") {
    return cartons.flatMap((carton) => {
      if (carton.palletAssign !== "none") return autoPalletizeCarton(carton);
      return [{
        id: carton.id,
        name: carton.name || "Carton",
        length: carton.lengthIn,
        width: carton.widthIn,
        height: carton.heightIn,
        weight: carton.weightLbs * carton.quantity,
        quantity: carton.quantity,
        color: carton.color,
        stackable: carton.stackable,
        palletized: false,
        palletType: "none",
        customPalletL: 48,
        customPalletW: 40,
        customPalletH: 0,
        rotationMode: carton.rotation,
        included: true,
        loadPriority: priorityFromNumber(carton.priority),
      } satisfies CargoItem];
    });
  }

  return pallets.map((pallet) => {
    const dimensions = pallet.palletType === "custom"
      ? { lengthIn: pallet.customL, widthIn: pallet.customW }
      : TRUCK_PALLET_DIMENSIONS[pallet.palletType] || { lengthIn: pallet.customL, widthIn: pallet.customW };
    return {
      id: pallet.id,
      name: pallet.name || "Pallet",
      length: dimensions.lengthIn,
      width: dimensions.widthIn,
      height: pallet.heightIn,
      weight: pallet.weightLbs * pallet.quantity,
      quantity: pallet.quantity,
      color: pallet.color,
      stackable: pallet.stackable,
      palletized: false,
      palletType: "none",
      customPalletL: dimensions.lengthIn,
      customPalletW: dimensions.widthIn,
      customPalletH: 0,
      rotationMode: pallet.rotation,
      included: true,
      loadPriority: priorityFromNumber(pallet.priority),
    } satisfies CargoItem;
  });
}

export function trailerAsPackingContainer(trailer: TruckTrailerLike): ContainerSpec {
  return {
    id: trailer.id,
    name: trailer.name,
    lengthIn: trailer.lengthIn,
    widthIn: trailer.widthIn,
    heightIn: trailer.heightIn,
    maxPayloadLbs: trailer.maxPayloadLbs,
    volumeCuFt: cuInToCuFt(trailer.lengthIn * trailer.widthIn * trailer.heightIn),
    tare: 0,
  };
}

export function getTruckLoadingSequence(placed: PlacedBox[]): TruckLoadingStep[] {
  return placed
    .map((box, boxIndex) => ({ box, boxIndex }))
    .sort((a, b) => (
      a.box.x - b.box.x ||
      a.box.y - b.box.y ||
      a.box.z - b.box.z
    ))
    .map(({ box, boxIndex }, index) => ({
      step: index + 1,
      boxIndex,
      cargoName: box.cargoName,
      positionFromNoseIn: box.x,
      levelIn: box.y,
    }));
}

function calculateTruckBalance(placed: PlacedBox[], packingContainer: ContainerSpec): TruckBalance {
  const balance = calculateContainerBalance(placed, packingContainer);
  return {
    ...balance,
    distanceFromNoseIn: balance.centerXIn,
    noseWeightPct: balance.closedEndWeightPct,
    doorWeightPct: balance.doorEndWeightPct,
    guidance: balance.guidance.map((guidance) => guidance
      .replace("container doors", "trailer doors")
      .replace("closed end", "trailer nose")),
  };
}

export function buildTruckSpatialPlan(items: CargoItem[], trailer: TruckTrailerLike): TruckSpatialPlan {
  const packingContainer = trailerAsPackingContainer(trailer);
  const multi = packIntoContainers(items, packingContainer, 25);
  const complete = multi.totalPiecesLoaded === multi.totalPiecesAll && multi.totalPiecesAll > 0;
  const totalPlacedWeightLbs = multi.containers.reduce((sum, entry) => sum + entry.result.totalWeight, 0);
  const totalPlacedVolumeCuFt = multi.containers.reduce((sum, entry) => sum + entry.result.totalVolume, 0);
  const usableTrailerCount = Math.max(1, multi.containers.length);
  const balances = multi.containers.map((entry) => calculateTruckBalance(entry.result.placed, packingContainer));
  const loadingSequences = multi.containers.map((entry) => getTruckLoadingSequence(entry.result.placed));

  return {
    trailer,
    packingContainer,
    multi,
    complete,
    trailersRequired: multi.containers.length,
    piecesLoaded: multi.totalPiecesLoaded,
    piecesTotal: multi.totalPiecesAll,
    totalPlacedWeightLbs,
    totalPlacedVolumeCuFt,
    averageVolumeUtilPct: (totalPlacedVolumeCuFt / (packingContainer.volumeCuFt * usableTrailerCount)) * 100,
    averageWeightUtilPct: (totalPlacedWeightLbs / (packingContainer.maxPayloadLbs * usableTrailerCount)) * 100,
    balances,
    loadingSequences,
  };
}
