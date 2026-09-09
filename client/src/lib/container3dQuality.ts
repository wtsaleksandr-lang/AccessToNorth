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

export const CARGO_STENCIL_ASPECT_RATIO = 8 / 3;

export interface CargoStencilLayout {
  widthM: number;
  heightM: number;
  rotateQuarterTurn: boolean;
}

/**
 * Size a cargo reference as an independent top-face stencil. Keeping a fixed
 * physical aspect ratio prevents the text from inheriting a rectangular
 * cargo face's UV stretch.
 */
export function getCargoStencilLayout(lengthM: number, widthM: number): CargoStencilLayout {
  const longSide = Math.max(lengthM, widthM);
  const shortSide = Math.min(lengthM, widthM);
  const maxStencilWidth = longSide * 0.52;
  const maxStencilHeight = shortSide * 0.24;
  const stencilWidth = Math.min(maxStencilWidth, maxStencilHeight * CARGO_STENCIL_ASPECT_RATIO);

  return {
    widthM: stencilWidth,
    heightM: stencilWidth / CARGO_STENCIL_ASPECT_RATIO,
    rotateQuarterTurn: widthM > lengthM,
  };
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
    // Aspect-locked top stencils add one lightweight plane per cargo unit.
    // Keep them for ordinary plans and remove them before large scenes become
    // visually crowded or draw-call heavy.
    detailedLabels: input.itemCount <= (performanceMode ? 60 : 120),
  };
}
