import type { PalletBuildPlan } from "./palletPacking";

export const PALLET_TRANSFER_STORAGE_KEY = "access-to-north:pallet-plan-transfer:v1";

export interface PalletTransferRow {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  grossWeightLbs: number;
  quantity: number;
  color: string;
}

export interface PalletPlanTransfer {
  version: 1;
  createdAt: string;
  source: "pallet-builder";
  rows: PalletTransferRow[];
}

const TRANSFER_COLORS = ["#0f766e", "#2563eb", "#b45309", "#7c3aed", "#be123c", "#0e7490"];

function rounded(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function createPalletPlanTransfer(plan: PalletBuildPlan, now = new Date()): PalletPlanTransfer {
  const grouped = new Map<string, PalletTransferRow>();

  for (const pallet of plan.pallets) {
    const key = [
      rounded(pallet.loadedLengthIn),
      rounded(pallet.loadedWidthIn),
      rounded(pallet.loadedHeightIn),
      rounded(pallet.grossWeightLbs),
    ].join(":");
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
      continue;
    }
    const rowNumber = grouped.size + 1;
    grouped.set(key, {
      id: `built-pallet-${rowNumber}`,
      name: plan.pallets.length === 1 ? "Built pallet" : `Built pallet type ${rowNumber}`,
      lengthIn: rounded(pallet.loadedLengthIn),
      widthIn: rounded(pallet.loadedWidthIn),
      heightIn: rounded(pallet.loadedHeightIn),
      grossWeightLbs: rounded(pallet.grossWeightLbs),
      quantity: 1,
      color: TRANSFER_COLORS[(rowNumber - 1) % TRANSFER_COLORS.length],
    });
  }

  return {
    version: 1,
    createdAt: now.toISOString(),
    source: "pallet-builder",
    rows: Array.from(grouped.values()),
  };
}

export function serializePalletPlanTransfer(transfer: PalletPlanTransfer) {
  return JSON.stringify(transfer);
}

export function parsePalletPlanTransfer(raw: string | null): PalletPlanTransfer | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PalletPlanTransfer>;
    if (parsed.version !== 1 || parsed.source !== "pallet-builder" || !Array.isArray(parsed.rows)) return null;
    const rows = parsed.rows.filter((row) => (
      row && row.lengthIn > 0 && row.widthIn > 0 && row.heightIn > 0 && row.quantity > 0 && row.grossWeightLbs >= 0
    ));
    if (rows.length === 0) return null;
    return { ...parsed, rows } as PalletPlanTransfer;
  } catch {
    return null;
  }
}

export function savePalletPlanTransfer(plan: PalletBuildPlan) {
  const transfer = createPalletPlanTransfer(plan);
  window.localStorage.setItem(PALLET_TRANSFER_STORAGE_KEY, serializePalletPlanTransfer(transfer));
  return transfer;
}

export function consumePalletPlanTransfer() {
  const raw = window.localStorage.getItem(PALLET_TRANSFER_STORAGE_KEY);
  window.localStorage.removeItem(PALLET_TRANSFER_STORAGE_KEY);
  return parsePalletPlanTransfer(raw);
}
