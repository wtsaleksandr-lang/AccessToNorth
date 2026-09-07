export type ContainerRenderQuality = "auto" | "performance" | "quality";

export interface ContainerRenderProfileInput {
  quality: ContainerRenderQuality;
  viewportWidth: number;
  devicePixelRatio: number;
  itemCount: number;
  deviceMemoryGb?: number;
  hardwareConcurrency?: number;
}

export interface ContainerRenderProfile {
  performanceMode: boolean;
  antialias: boolean;
  pixelRatio: number;
  shadows: boolean;
  shadowMapSize: number;
  gridDivisions: number;
  detailedLabels: boolean;
}

export function getContainerRenderProfile(input: ContainerRenderProfileInput): ContainerRenderProfile {
  const compact = input.viewportWidth < 768;
  const constrainedDevice = (input.deviceMemoryGb !== undefined && input.deviceMemoryGb <= 4)
    || (input.hardwareConcurrency !== undefined && input.hardwareConcurrency <= 4);
  const largePlan = input.itemCount > 140;
  const performanceMode = input.quality === "performance"
    || (input.quality === "auto" && (compact || constrainedDevice || largePlan));

  const pixelRatioCap = input.quality === "quality" ? 2 : performanceMode ? 1.15 : 1.6;
  return {
    performanceMode,
    antialias: !performanceMode,
    pixelRatio: Math.max(0.75, Math.min(input.devicePixelRatio || 1, pixelRatioCap)),
    shadows: !performanceMode && input.itemCount <= 240,
    shadowMapSize: performanceMode ? 0 : compact ? 512 : 1024,
    gridDivisions: performanceMode ? 90 : 180,
    detailedLabels: input.itemCount <= (performanceMode ? 40 : 180),
  };
}
