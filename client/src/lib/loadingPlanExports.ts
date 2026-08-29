import type { PalletBuildPlan } from "./palletPacking";
import type { TruckSpatialPlan } from "./truckPacking";

type UnitSystem = "imperial" | "metric";

function csvCell(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(values: Array<string | number | boolean>) {
  return values.map(csvCell).join(",");
}

function converters(unitSystem: UnitSystem) {
  const metric = unitSystem === "metric";
  return {
    dimLabel: metric ? "cm" : "in",
    weightLabel: metric ? "kg" : "lb",
    dimension: (inches: number) => Number((metric ? inches * 2.54 : inches).toFixed(2)),
    weight: (lbs: number) => Number((metric ? lbs * 0.453592 : lbs).toFixed(2)),
  };
}

export function buildTruckPlacementCsv(plan: TruckSpatialPlan, unitSystem: UnitSystem) {
  const format = converters(unitSystem);
  const rows = [csvRow([
    "Trailer",
    "Loading Step",
    "Cargo",
    "Color",
    `From Nose (${format.dimLabel})`,
    `From Floor (${format.dimLabel})`,
    `From Left Wall (${format.dimLabel})`,
    `Length (${format.dimLabel})`,
    `Width (${format.dimLabel})`,
    `Height (${format.dimLabel})`,
    `Weight (${format.weightLabel})`,
    "Rotation",
    "Stackable",
  ])];

  plan.multi.containers.forEach((entry, trailerIndex) => {
    const ordered = plan.loadingSequences[trailerIndex] || [];
    ordered.forEach((step) => {
      const placement = entry.result.placed[step.boxIndex];
      if (!placement) return;
      rows.push(csvRow([
        trailerIndex + 1,
        step.step,
        placement.cargoName,
        placement.color,
        format.dimension(placement.x),
        format.dimension(placement.y),
        format.dimension(placement.z),
        format.dimension(placement.l),
        format.dimension(placement.w),
        format.dimension(placement.h),
        format.weight(placement.weight),
        placement.rotation,
        placement.stackable ? "Yes" : "No",
      ]));
    });
  });

  return rows.join("\n");
}

export function buildPalletPlacementCsv(plan: PalletBuildPlan, unitSystem: UnitSystem) {
  const format = converters(unitSystem);
  const rows = [csvRow([
    "Pallet",
    "Layer",
    "Position",
    "Carton",
    "Color",
    `X (${format.dimLabel})`,
    `Y (${format.dimLabel})`,
    `Z (${format.dimLabel})`,
    `Length (${format.dimLabel})`,
    `Width (${format.dimLabel})`,
    `Height (${format.dimLabel})`,
    `Weight Each (${format.weightLabel})`,
    "Rotated",
    "Pattern",
  ])];

  plan.pallets.forEach((builtPallet, palletIndex) => {
    builtPallet.layers.forEach((layer) => {
      layer.placements.forEach((placement, positionIndex) => {
        rows.push(csvRow([
          palletIndex + 1,
          layer.index,
          positionIndex + 1,
          placement.cartonName,
          placement.color,
          format.dimension(placement.x),
          format.dimension(placement.y),
          format.dimension(placement.z),
          format.dimension(placement.lengthIn),
          format.dimension(placement.widthIn),
          format.dimension(placement.heightIn),
          format.weight(placement.weightLbs),
          placement.rotated ? "Yes" : "No",
          layer.pattern,
        ]));
      });
    });
  });

  return rows.join("\n");
}
