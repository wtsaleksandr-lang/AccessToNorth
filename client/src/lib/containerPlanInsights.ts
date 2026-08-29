import { calculateContainerBalance } from "./containerBalance";
import {
  PALLET_DIMS,
  type CargoItem,
  type ContainerSpec,
  type MultiContainerResult,
} from "./containerPacking";

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

export type PlanReviewStatus = "pass" | "warning" | "action" | "manual";

export interface PlanReviewItem {
  id: "fit" | "weight" | "balance" | "securement";
  label: string;
  status: PlanReviewStatus;
  detail: string;
}

export interface UnplacedCargoDiagnosis {
  name: string;
  quantity: number;
  reason: string;
}

function effectiveDimensions(item: CargoItem): [number, number, number] {
  let length = item.length;
  let width = item.width;
  let height = item.height;
  if (item.palletized && item.palletType !== "none") {
    const pallet = item.palletType === "custom"
      ? { l: item.customPalletL, w: item.customPalletW, h: item.customPalletH }
      : PALLET_DIMS[item.palletType];
    if (pallet) {
      length = Math.max(length, pallet.l);
      width = Math.max(width, pallet.w);
      height += pallet.h;
    }
  }
  return [length, width, height];
}

function allowedOrientations(item: CargoItem): [number, number, number][] {
  const [length, width, height] = effectiveDimensions(item);
  if (item.rotationMode === "fixed") return [[length, width, height]];
  if (item.rotationMode === "horizontal") {
    return [[length, width, height], [width, length, height]];
  }
  return [
    [length, width, height],
    [length, height, width],
    [width, length, height],
    [width, height, length],
    [height, length, width],
    [height, width, length],
  ];
}

function itemDisplayName(item: CargoItem, index: number) {
  return item.name || `Item ${index + 1}`;
}

export function diagnoseUnplacedCargo(
  items: CargoItem[],
  container: ContainerSpec,
  unplaced: { name: string; qty: number }[],
  unitSystem: "imperial" | "metric",
): UnplacedCargoDiagnosis[] {
  const metric = unitSystem === "metric";
  const dim = (value: number) => metric
    ? `${(value * IN_TO_CM).toFixed(0)} cm`
    : `${value.toFixed(1)} in`;
  const weight = (value: number) => metric
    ? `${Math.round(value * LB_TO_KG).toLocaleString()} kg`
    : `${Math.round(value).toLocaleString()} lb`;
  const validItems = items.filter((item) => (
    item.included
    && item.quantity > 0
    && item.length > 0
    && item.width > 0
    && item.height > 0
  ));

  return unplaced.map((entry) => {
    const itemIndex = validItems.findIndex((candidate, index) => (
      itemDisplayName(candidate, index) === entry.name
    ));
    const item = itemIndex >= 0 ? validItems[itemIndex] : null;
    if (!item) {
      return {
        name: entry.name,
        quantity: entry.qty,
        reason: "Could not be placed in the remaining usable space.",
      };
    }

    const perPieceWeight = item.quantity > 0 ? item.weight / item.quantity : 0;
    if (perPieceWeight > container.maxPayloadLbs + 0.01) {
      return {
        name: entry.name,
        quantity: entry.qty,
        reason: `One piece weighs ${weight(perPieceWeight)}, above the ${weight(container.maxPayloadLbs)} payload limit.`,
      };
    }

    const fitsGeometry = allowedOrientations(item).some(([length, width, height]) => (
      length <= container.lengthIn + 0.01
      && width <= container.widthIn + 0.01
      && height <= container.heightIn + 0.01
    ));
    if (!fitsGeometry) {
      const [length, width, height] = effectiveDimensions(item);
      return {
        name: entry.name,
        quantity: entry.qty,
        reason: `Effective size ${dim(length)} x ${dim(width)} x ${dim(height)} does not fit in any allowed orientation.`,
      };
    }

    return {
      name: entry.name,
      quantity: entry.qty,
      reason: "Fits individually, but not in the remaining space. Review rotation, stacking, loading priority, or equipment quantity.",
    };
  });
}

export function buildContainerPlanReview(
  items: CargoItem[],
  plan: MultiContainerResult,
): PlanReviewItem[] {
  const includedItems = items.filter((item) => (
    item.included
    && item.quantity > 0
    && item.length > 0
    && item.width > 0
    && item.height > 0
  ));
  const missingPieces = Math.max(0, plan.totalPiecesAll - plan.totalPiecesLoaded);
  const missingWeightRows = includedItems.filter((item) => item.weight <= 0).length;
  const balances = plan.containers.map((entry) => calculateContainerBalance(entry.result.placed, entry.container));
  const reviewBalanceCount = balances.filter((balance) => balance.status === "review").length;
  const cautionBalanceCount = balances.filter((balance) => balance.status === "caution").length;

  return [
    {
      id: "fit",
      label: "Cargo assignment",
      status: missingPieces === 0 ? "pass" : "action",
      detail: missingPieces === 0
        ? `All ${plan.totalPiecesAll} pieces are assigned to ${plan.totalContainers} container${plan.totalContainers === 1 ? "" : "s"}.`
        : `${missingPieces} piece${missingPieces === 1 ? " is" : "s are"} still unassigned.`,
    },
    {
      id: "weight",
      label: "Gross weight",
      status: missingWeightRows === 0 ? "pass" : "warning",
      detail: missingWeightRows === 0
        ? "Weight is entered for every included cargo row."
        : `${missingWeightRows} cargo row${missingWeightRows === 1 ? " has" : "s have"} no weight; payload and COG results are incomplete.`,
    },
    {
      id: "balance",
      label: "Weight distribution",
      status: reviewBalanceCount > 0 || cautionBalanceCount > 0 ? "warning" : "pass",
      detail: reviewBalanceCount > 0
        ? `${reviewBalanceCount} container${reviewBalanceCount === 1 ? " needs" : "s need"} a practical balance review.`
        : cautionBalanceCount > 0
          ? `${cautionBalanceCount} container${cautionBalanceCount === 1 ? " has" : "s have"} a balance caution.`
          : "Calculated centres of gravity are within the planning range.",
    },
    {
      id: "securement",
      label: "Blocking & bracing",
      status: "manual",
      detail: "Not calculated. Final securement and loading access require an operator review.",
    },
  ];
}
