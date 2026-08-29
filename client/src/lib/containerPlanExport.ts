import type { MultiContainerResult } from "./containerPacking";

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildContainerPlacementCsv(
  plan: MultiContainerResult,
  unitSystem: "imperial" | "metric",
) {
  const metric = unitSystem === "metric";
  const dimFactor = metric ? IN_TO_CM : 1;
  const weightFactor = metric ? LB_TO_KG : 1;
  const dimUnit = metric ? "cm" : "in";
  const weightUnit = metric ? "kg" : "lb";
  const rows: (string | number)[][] = [[
    "Container",
    "Container Type",
    "Loading Sequence",
    "Cargo",
    `Position X (${dimUnit})`,
    `Position Y (${dimUnit})`,
    `Position Z (${dimUnit})`,
    `Length (${dimUnit})`,
    `Width (${dimUnit})`,
    `Height (${dimUnit})`,
    `Weight (${weightUnit})`,
    "Rotation",
    "Stackable",
    "Status",
  ]];

  plan.containers.forEach((entry, containerIndex) => {
    const ordered = [...entry.result.placed].sort((a, b) => (
      a.x - b.x || a.y - b.y || a.z - b.z || a.cargoName.localeCompare(b.cargoName)
    ));
    ordered.forEach((box, sequenceIndex) => {
      rows.push([
        containerIndex + 1,
        entry.container.name,
        sequenceIndex + 1,
        box.cargoName,
        (box.x * dimFactor).toFixed(1),
        (box.y * dimFactor).toFixed(1),
        (box.z * dimFactor).toFixed(1),
        (box.l * dimFactor).toFixed(1),
        (box.w * dimFactor).toFixed(1),
        (box.h * dimFactor).toFixed(1),
        (box.weight * weightFactor).toFixed(1),
        box.rotation,
        box.stackable ? "Yes" : "No",
        "Assigned",
      ]);
    });
  });

  const finalResult = plan.containers[plan.containers.length - 1]?.result;
  finalResult?.unplaced.forEach((item) => {
    rows.push([
      "",
      "",
      "",
      item.name,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      `UNPLACED - ${item.qty} piece${item.qty === 1 ? "" : "s"}`,
    ]);
  });

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
