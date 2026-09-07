import type { SharedLoadPlanPayload } from "../../../shared/loadPlanShare";
import type { CargoItem, MultiContainerResult, PlacedBox } from "./containerPacking";
import { parseContainerDraft, type ContainerProjectSnapshot } from "./containerProjects";

export const CONTAINER_SHARE_TRANSFER_STORAGE_KEY = "atn-container-share-transfer-v1";

export interface EditableSharedPlan extends SharedLoadPlanPayload {
  token?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface ContainerShareTransfer {
  version: 1;
  title: string;
  sourceToken: string | null;
  snapshot: ContainerProjectSnapshot;
}

function round(value: number) {
  return Number(value.toFixed(3));
}

function originalDimensions(box: PlacedBox) {
  const orientation = /^[LWH]{3}$/.test(box.rotation) ? box.rotation : "LWH";
  const positioned = [box.l, box.w, box.h];
  const original: Partial<Record<"L" | "W" | "H", number>> = {};
  orientation.split("").forEach((axis, index) => {
    original[axis as "L" | "W" | "H"] = positioned[index];
  });
  return {
    length: original.L ?? box.l,
    width: original.W ?? box.w,
    height: original.H ?? box.h,
  };
}

/** Rebuilds editable rows for share links created before editor data was included. */
export function deriveCargoItemsFromSharedPlan(plan: EditableSharedPlan): CargoItem[] {
  if (plan.editorState?.cargoItems?.length) {
    return plan.editorState.cargoItems.map((item) => ({ ...item }));
  }

  const grouped = new Map<string, CargoItem>();
  plan.containers.flatMap((entry) => entry.placed).forEach((box, index) => {
    const key = box.cargoId || `shared-cargo-${index + 1}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.weight = round(existing.weight + box.weight);
      return;
    }
    const dimensions = originalDimensions(box);
    grouped.set(key, {
      id: key,
      name: box.cargoName || `Cargo ${grouped.size + 1}`,
      ...dimensions,
      weight: round(box.weight),
      quantity: 1,
      color: box.color,
      stackable: box.stackable,
      palletized: false,
      palletType: "none",
      customPalletL: dimensions.length,
      customPalletW: dimensions.width,
      customPalletH: 0,
      rotationMode: "horizontal",
      included: true,
      loadPriority: "normal",
    });
  });
  return [...grouped.values()].slice(0, 500);
}

function rebuildMultiResult(plan: EditableSharedPlan): MultiContainerResult {
  const containers = plan.containers.map((entry) => {
    const placed = entry.placed.map((box) => ({ ...box }));
    const totalWeight = placed.reduce((sum, box) => sum + box.weight, 0);
    const totalVolumeIn3 = placed.reduce((sum, box) => sum + box.l * box.w * box.h, 0);
    const maxX = placed.reduce((max, box) => Math.max(max, box.x + box.l), 0);
    const maxZ = placed.reduce((max, box) => Math.max(max, box.z + box.w), 0);
    const containerVolumeIn3 = entry.container.lengthIn * entry.container.widthIn * entry.container.heightIn;
    return {
      label: entry.label,
      container: { ...entry.container },
      result: {
        placed,
        unplaced: [],
        totalWeight,
        totalVolume: totalVolumeIn3 / 1728,
        containerVolume: containerVolumeIn3 / 1728,
        maxPayload: entry.container.maxPayloadLbs,
        volumeUtil: containerVolumeIn3 > 0 ? (totalVolumeIn3 / containerVolumeIn3) * 100 : 0,
        weightUtil: entry.container.maxPayloadLbs > 0 ? (totalWeight / entry.container.maxPayloadLbs) * 100 : 0,
        floorArea: (maxX * maxZ) / 144,
        containerFloorArea: (entry.container.lengthIn * entry.container.widthIn) / 144,
        piecesLoaded: placed.length,
        piecesTotal: placed.length,
      },
    };
  });
  const loaded = containers.reduce((sum, entry) => sum + entry.result.piecesLoaded, 0);
  return { containers, totalContainers: containers.length, totalPiecesAll: loaded, totalPiecesLoaded: loaded };
}

export function createContainerShareTransfer(plan: EditableSharedPlan): ContainerShareTransfer {
  const firstContainer = plan.containers[0]?.container;
  if (!firstContainer) throw new Error("The shared plan does not contain a container.");
  const cargoItems = deriveCargoItemsFromSharedPlan(plan);
  if (!cargoItems.length) throw new Error("The shared plan does not contain editable cargo.");
  const custom = plan.editorState?.customContainer;
  return {
    version: 1,
    title: `${plan.title} — copy`,
    sourceToken: plan.token || null,
    snapshot: {
      unitSystem: plan.unitSystem,
      containerSelectionMode: plan.editorState?.containerSelectionMode ?? "manual",
      containerId: plan.editorState?.containerId || firstContainer.id,
      customContainer: custom ? { ...custom } : {
        lengthIn: firstContainer.lengthIn,
        widthIn: firstContainer.widthIn,
        heightIn: firstContainer.heightIn,
        maxPayloadLbs: firstContainer.maxPayloadLbs,
      },
      cargoItems,
      multiResult: rebuildMultiResult(plan),
      activeResultContainer: 0,
    },
  };
}

export function serializeContainerShareTransfer(transfer: ContainerShareTransfer) {
  return JSON.stringify(transfer);
}

export function parseContainerShareTransfer(raw: string | null): ContainerShareTransfer | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ContainerShareTransfer>;
    const snapshot = parseContainerDraft(JSON.stringify(parsed.snapshot));
    if (parsed.version !== 1 || typeof parsed.title !== "string" || !snapshot) return null;
    return {
      version: 1,
      title: parsed.title.slice(0, 120) || "Shared loading plan — copy",
      sourceToken: typeof parsed.sourceToken === "string" ? parsed.sourceToken : null,
      snapshot,
    };
  } catch {
    return null;
  }
}

export function saveContainerShareTransfer(plan: EditableSharedPlan) {
  const transfer = createContainerShareTransfer(plan);
  window.sessionStorage.setItem(CONTAINER_SHARE_TRANSFER_STORAGE_KEY, serializeContainerShareTransfer(transfer));
  return transfer;
}

export function consumeContainerShareTransfer() {
  const raw = window.sessionStorage.getItem(CONTAINER_SHARE_TRANSFER_STORAGE_KEY);
  window.sessionStorage.removeItem(CONTAINER_SHARE_TRANSFER_STORAGE_KEY);
  return parseContainerShareTransfer(raw);
}
