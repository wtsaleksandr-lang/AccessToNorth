import {
  CONTAINER_PRESETS,
  packIntoContainers,
  type CargoItem,
  type ContainerSpec,
  type MultiContainerResult,
} from "./containerPacking";

export interface ContainerPlanComparison {
  container: ContainerSpec;
  plan: MultiContainerResult;
  complete: boolean;
  piecesMissing: number;
  containerCount: number;
  totalCapacityCuFt: number;
  loadedVolumeCuFt: number;
  volumeUtilPct: number;
  weightUtilPct: number;
  unusedVolumeCuFt: number;
}

export function compareContainerPlans(
  items: CargoItem[],
  presets: ContainerSpec[] = CONTAINER_PRESETS,
): ContainerPlanComparison[] {
  return presets.map((container) => {
    const plan = packIntoContainers(items, container);
    const loadedVolumeCuFt = plan.containers.reduce((sum, entry) => sum + entry.result.totalVolume, 0);
    const loadedWeightLbs = plan.containers.reduce((sum, entry) => sum + entry.result.totalWeight, 0);
    const containerCount = plan.totalContainers;
    const totalCapacityCuFt = containerCount * container.volumeCuFt;
    const totalPayloadLbs = containerCount * container.maxPayloadLbs;

    return {
      container,
      plan,
      complete: plan.totalPiecesLoaded === plan.totalPiecesAll,
      piecesMissing: Math.max(0, plan.totalPiecesAll - plan.totalPiecesLoaded),
      containerCount,
      totalCapacityCuFt,
      loadedVolumeCuFt,
      volumeUtilPct: totalCapacityCuFt > 0 ? (loadedVolumeCuFt / totalCapacityCuFt) * 100 : 0,
      weightUtilPct: totalPayloadLbs > 0 ? (loadedWeightLbs / totalPayloadLbs) * 100 : 0,
      unusedVolumeCuFt: Math.max(0, totalCapacityCuFt - loadedVolumeCuFt),
    };
  });
}
