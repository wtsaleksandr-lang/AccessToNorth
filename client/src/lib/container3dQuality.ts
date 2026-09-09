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

  // Never undersample the canvas below its CSS size. The old 0.75 cap made
  // container edges and the floor grid visibly pixelated on high-DPI phones
  // without solving interaction stalls.
  const pixelRatioCap = input.quality === "quality" ? 2 : input.quality === "performance" ? 1 : 1.5;
  return {
    performanceMode,
    antialias: input.itemCount <= 220,
    pixelRatio: Math.max(1, Math.min(input.devicePixelRatio || 1, pixelRatioCap)),
    shadows: false,
    shadowMapSize: performanceMode ? 0 : compact ? 512 : 1024,
    gridDivisions: performanceMode ? 44 : input.quality === "quality" ? 72 : 60,
    // Face labels reuse the cargo mesh material, so they do not add scene
    // draw calls. Keep references crisp for ordinary plans in every mode.
    detailedLabels: input.itemCount <= (performanceMode ? 60 : 120),
  };
}
