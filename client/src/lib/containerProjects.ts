import type { CargoItem, MultiContainerResult } from "./containerPacking";

export const CONTAINER_PROJECTS_STORAGE_KEY = "atn-container-projects-v1";
export const CONTAINER_DRAFT_STORAGE_KEY = "atn-container-draft-v1";
export const MAX_SAVED_CONTAINER_PROJECTS = 20;

export interface ContainerProjectSnapshot {
  unitSystem: "imperial" | "metric";
  containerSelectionMode: "recommend" | "manual";
  containerId: string;
  customContainer: {
    lengthIn: number;
    widthIn: number;
    heightIn: number;
    maxPayloadLbs: number;
  };
  cargoItems: CargoItem[];
  multiResult: MultiContainerResult | null;
  activeResultContainer: number;
}

export interface SavedContainerProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  snapshot: ContainerProjectSnapshot;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSnapshot(value: unknown): value is ContainerProjectSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ContainerProjectSnapshot>;
  const custom = candidate.customContainer;
  if (candidate.unitSystem !== "imperial" && candidate.unitSystem !== "metric") return false;
  if (candidate.containerSelectionMode !== "recommend" && candidate.containerSelectionMode !== "manual") return false;
  if (typeof candidate.containerId !== "string" || candidate.containerId.length > 40) return false;
  if (!custom || !isFiniteNumber(custom.lengthIn) || !isFiniteNumber(custom.widthIn)
    || !isFiniteNumber(custom.heightIn) || !isFiniteNumber(custom.maxPayloadLbs)) return false;
  if (!Array.isArray(candidate.cargoItems) || candidate.cargoItems.length < 1 || candidate.cargoItems.length > 500) return false;
  if (!candidate.cargoItems.every((item) => item && typeof item === "object"
    && typeof item.id === "string" && typeof item.name === "string"
    && isFiniteNumber(item.length) && isFiniteNumber(item.width) && isFiniteNumber(item.height)
    && isFiniteNumber(item.weight) && Number.isInteger(item.quantity)
    && typeof item.color === "string")) return false;
  if (candidate.multiResult !== null && candidate.multiResult !== undefined) {
    if (typeof candidate.multiResult !== "object" || !Array.isArray(candidate.multiResult.containers)) return false;
  }
  return Number.isInteger(candidate.activeResultContainer) && (candidate.activeResultContainer ?? -1) >= 0;
}

function cloneSnapshot(snapshot: ContainerProjectSnapshot): ContainerProjectSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as ContainerProjectSnapshot;
}

export function parseContainerProjects(raw: string | null): SavedContainerProject[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((project): project is SavedContainerProject => {
      if (!project || typeof project !== "object") return false;
      const candidate = project as Partial<SavedContainerProject>;
      return typeof candidate.id === "string" && typeof candidate.name === "string"
        && candidate.name.trim().length > 0 && candidate.name.length <= 120
        && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string"
        && isSnapshot(candidate.snapshot);
    }).slice(0, MAX_SAVED_CONTAINER_PROJECTS);
  } catch {
    return [];
  }
}

export function parseContainerDraft(raw: string | null): ContainerProjectSnapshot | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return isSnapshot(value) ? cloneSnapshot(value) : null;
  } catch {
    return null;
  }
}

export function readContainerProjects(): SavedContainerProject[] {
  if (typeof window === "undefined") return [];
  return parseContainerProjects(window.localStorage.getItem(CONTAINER_PROJECTS_STORAGE_KEY));
}

export function readContainerDraft(): ContainerProjectSnapshot | null {
  if (typeof window === "undefined") return null;
  return parseContainerDraft(window.localStorage.getItem(CONTAINER_DRAFT_STORAGE_KEY));
}

export function persistContainerProjects(projects: SavedContainerProject[]) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(CONTAINER_PROJECTS_STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_SAVED_CONTAINER_PROJECTS)));
    return true;
  } catch {
    return false;
  }
}

export function persistContainerDraft(snapshot: ContainerProjectSnapshot) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(CONTAINER_DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function saveContainerProject(
  projects: SavedContainerProject[],
  snapshot: ContainerProjectSnapshot,
  name: string,
  projectId?: string | null,
  now = new Date(),
): { projects: SavedContainerProject[]; project: SavedContainerProject } {
  const normalizedName = name.trim().slice(0, 120) || "Untitled loading plan";
  const existing = projectId ? projects.find((project) => project.id === projectId) : undefined;
  const stamp = now.toISOString();
  const project: SavedContainerProject = {
    id: existing?.id || `plan-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizedName,
    createdAt: existing?.createdAt || stamp,
    updatedAt: stamp,
    snapshot: cloneSnapshot(snapshot),
  };
  const next = [project, ...projects.filter((entry) => entry.id !== project.id)]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_SAVED_CONTAINER_PROJECTS);
  return { projects: next, project };
}

export function duplicateContainerProject(project: SavedContainerProject, now = new Date()): SavedContainerProject {
  return {
    ...project,
    id: `plan-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${project.name} (copy)`.slice(0, 120),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    snapshot: cloneSnapshot(project.snapshot),
  };
}
