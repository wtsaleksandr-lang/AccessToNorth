import { jsPDF } from "jspdf";
import type { PlacedBox } from "./containerPacking";
import type { TruckSpatialPlan } from "./truckPacking";
import {
  REPORT_PAGE,
  drawMetricCards,
  drawReportHeader,
  drawReportTitle,
  drawSectionHeading,
  drawStatusBanner,
  finalizeReportPages,
} from "./loadingReportPdfBrand";

export interface TruckPdfCargoRow {
  name: string;
  dimensionsIn: [number, number, number];
  weightEachLbs: number;
  quantity: number;
}

type UnitSystem = "imperial" | "metric";

function createFormatters(unitSystem: UnitSystem) {
  const metric = unitSystem === "metric";
  return {
    dimension: (inches: number) => metric ? `${(inches * 2.54).toFixed(1)} cm` : `${inches.toFixed(1)} in`,
    weight: (lbs: number) => metric ? `${(lbs * 0.453592).toFixed(1)} kg` : `${lbs.toFixed(0)} lb`,
  };
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) return [14, 116, 144] as const;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

function shorten(value: string, length: number) {
  return value.length > length ? `${value.slice(0, Math.max(1, length - 1))}…` : value;
}

function drawTrailerProfile(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, width * 0.78, height, 2, 2, "FD");
  doc.lines([[width * 0.12, 0], [width * 0.1, height * 0.28], [0, height * 0.72], [-width * 0.22, 0]], x + width * 0.78, y + height * 0.28, [1, 1], "FD", true);
  doc.setFillColor(255, 255, 255);
  doc.circle(x + width * 0.22, y + height + 1, 2.7, "FD");
  doc.circle(x + width * 0.83, y + height + 1, 2.7, "FD");
  for (let divider = 1; divider < 8; divider += 1) doc.line(x + (width * 0.78 * divider) / 8, y + 2, x + (width * 0.78 * divider) / 8, y + height - 2);
}

function drawTopPlan(doc: jsPDF, placed: PlacedBox[], lengthIn: number, widthIn: number, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / Math.max(1, lengthIn), height / Math.max(1, widthIn));
  const planWidth = lengthIn * scale;
  const planHeight = widthIn * scale;
  const left = x + (width - planWidth) / 2;
  const top = y + (height - planHeight) / 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.55);
  doc.roundedRect(left, top, planWidth, planHeight, 1.5, 1.5, "FD");
  placed.forEach((cargo, index) => {
    const [r, g, b] = hexToRgb(cargo.color);
    doc.setFillColor(r, g, b);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.35);
    doc.rect(left + cargo.x * scale, top + cargo.z * scale, Math.max(0.3, cargo.l * scale), Math.max(0.3, cargo.w * scale), "FD");
    if (cargo.l * scale > 7 && cargo.w * scale > 4.5) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(index + 1), left + (cargo.x + cargo.l / 2) * scale, top + (cargo.z + cargo.w / 2) * scale + 1.5, { align: "center" });
    }
  });
  doc.setDrawColor(2, 132, 199);
  doc.setLineDashPattern([2, 1.2], 0);
  doc.line(left + planWidth, top, left + planWidth, top + planHeight);
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("NOSE", left, top - 2);
  doc.text("DOORS", left + planWidth, top - 2, { align: "right" });
}

function drawTableHeader(doc: jsPDF, y: number, headers: string[], columns: number[]) {
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(REPORT_PAGE.left, y, 187.9, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  headers.forEach((header, index) => doc.text(header, columns[index], y + 5.3));
  return y + 12;
}

function drawManifestPage(doc: jsPDF, rows: TruckPdfCargoRow[], pageIndex: number, pageCount: number, unitSystem: UnitSystem, logoDataUrl?: string) {
  const format = createFormatters(unitSystem);
  drawReportHeader(doc, { reportTitle: "Truck loading planner", section: `Cargo details ${pageIndex + 1}/${pageCount}`, logoDataUrl });
  let y = drawReportTitle(doc, "Cargo details", "Complete source manifest used by the spatial loading calculation.") + 5;
  y = drawTableHeader(doc, y, ["Cargo", "Dimensions", "Weight each", "Qty"], [15, 82, 151, 187]);
  rows.forEach((row, index) => {
    if (index % 2 === 0) { doc.setFillColor(250, 252, 254); doc.rect(REPORT_PAGE.left, y - 4.5, 187.9, 9, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.3); doc.setTextColor(51, 65, 85);
    doc.text(shorten(row.name || "Cargo", 39), 15, y);
    doc.text(row.dimensionsIn.map(format.dimension).join(" × "), 82, y);
    doc.text(format.weight(row.weightEachLbs), 151, y);
    doc.text(String(row.quantity), 187, y);
    y += 9;
  });
}

export async function generateTruckLoadingReportBlob({ plan, cargoRows, unitSystem, logoDataUrl }: {
  plan: TruckSpatialPlan;
  cargoRows: TruckPdfCargoRow[];
  unitSystem: UnitSystem;
  logoDataUrl?: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });
  const format = createFormatters(unitSystem);
  doc.setProperties({ title: "AccessToNorth Truck Loading Plan", subject: "Spatial trailer loading plan", author: "AccessToNorth.com", creator: "AccessToNorth.com Truck Load Planner" });

  drawReportHeader(doc, { reportTitle: "Truck loading planner", section: "Overview", logoDataUrl });
  let y = drawReportTitle(doc, "Truck loading plan", `${plan.trailer.name} · Collision-aware placement and operational loading sequence.`) + 4;
  const balanceNeedsReview = plan.balances.some((balance) => balance.status !== "balanced");
  y = drawStatusBanner(doc, y, {
    tone: !plan.complete ? "risk" : balanceNeedsReview ? "review" : "good",
    title: !plan.complete ? "Plan incomplete — cargo remains unplaced" : balanceNeedsReview ? "Complete plan — balance review recommended" : "Complete plan — ready for dispatch review",
    detail: `${plan.piecesLoaded} of ${plan.piecesTotal} pieces placed across ${plan.trailersRequired} trailer${plan.trailersRequired === 1 ? "" : "s"}. Carrier validation remains required.`,
  });
  y = drawMetricCards(doc, y, [
    { label: "Trailers", value: String(plan.trailersRequired), detail: plan.trailer.category },
    { label: "Pieces", value: `${plan.piecesLoaded}/${plan.piecesTotal}`, detail: "collision-free" },
    { label: "Placed weight", value: format.weight(plan.totalPlacedWeightLbs), detail: `${plan.averageWeightUtilPct.toFixed(1)}% payload` },
    { label: "Volume use", value: `${plan.averageVolumeUtilPct.toFixed(1)}%`, detail: "average" },
  ]);

  y = drawSectionHeading(doc, "Equipment", y, "Usable internal dimensions");
  doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240); doc.roundedRect(REPORT_PAGE.left, y, 187.9, 37, 3, 3, "FD");
  drawTrailerProfile(doc, 20, y + 8, 44, 18);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text(plan.trailer.name, 73, y + 11);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(71, 85, 105);
  doc.text(`${format.dimension(plan.trailer.lengthIn)} × ${format.dimension(plan.trailer.widthIn)} × ${format.dimension(plan.trailer.heightIn)}`, 73, y + 18);
  doc.text(`Payload per trailer ${format.weight(plan.trailer.maxPayloadLbs)} · ${plan.trailer.category}`, 73, y + 25);
  y += 45;

  y = drawSectionHeading(doc, "Operational review", y);
  [
    "Positions are geometric suggestions; the report does not calculate legal axle weights or bridge-law compliance.",
    "Confirm securement, floor point loads, tractor weight, kingpin position, tandem setting, and route restrictions.",
    "The sequence is ordered from the trailer nose toward the doors and is included for every placed piece.",
  ].forEach((note, index) => {
    doc.setFillColor(index === 0 ? 239 : 248, index === 0 ? 246 : 250, index === 0 ? 255 : 252);
    doc.roundedRect(REPORT_PAGE.left, y, 187.9, 12, 2, 2, "F"); doc.setFillColor(2, 132, 199); doc.circle(19, y + 6, 1.4, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.4); doc.setTextColor(71, 85, 105); doc.text(doc.splitTextToSize(note, 174), 24, y + 4.8); y += 14;
  });

  const manifestChunks: TruckPdfCargoRow[][] = [];
  for (let index = 0; index < cargoRows.length; index += 20) manifestChunks.push(cargoRows.slice(index, index + 20));
  manifestChunks.forEach((rows, index) => { doc.addPage(); drawManifestPage(doc, rows, index, manifestChunks.length, unitSystem, logoDataUrl); });

  plan.multi.containers.forEach((entry, trailerIndex) => {
    const balance = plan.balances[trailerIndex];
    const sequence = plan.loadingSequences[trailerIndex] || [];
    doc.addPage();
    drawReportHeader(doc, { reportTitle: "Truck loading planner", section: `Trailer ${trailerIndex + 1} of ${plan.trailersRequired}`, logoDataUrl });
    let pageY = drawReportTitle(doc, `Trailer ${trailerIndex + 1} loading plan`, `${entry.result.piecesLoaded} pieces · ${format.weight(entry.result.totalWeight)} · ${entry.result.volumeUtil.toFixed(1)}% volume · ${entry.result.weightUtil.toFixed(1)}% payload`) + 3;
    pageY = drawMetricCards(doc, pageY, [
      { label: "Cargo centre", value: format.dimension(balance.distanceFromNoseIn), detail: "from nose" },
      { label: "Length split", value: `${balance.noseWeightPct.toFixed(0)} / ${balance.doorWeightPct.toFixed(0)}%`, detail: "nose / rear" },
      { label: "Width split", value: `${balance.sideAWeightPct.toFixed(0)} / ${balance.sideBWeightPct.toFixed(0)}%`, detail: "left / right" },
      { label: "Balance", value: balance.status, detail: "geometric" },
    ]);
    pageY = drawSectionHeading(doc, "Top-view placement", pageY, "Nose to doors");
    drawTopPlan(doc, entry.result.placed, plan.trailer.lengthIn, plan.trailer.widthIn, REPORT_PAGE.left, pageY, 187.9, 68);
    pageY += 75;
    pageY = drawSectionHeading(doc, "Loading sequence", pageY, `${sequence.length} steps total`);
    pageY = drawTableHeader(doc, pageY, ["Step", "Cargo", "From nose", "Deck level"], [15, 34, 143, 174]);
    sequence.slice(0, 8).forEach((step, index) => {
      if (index % 2 === 0) { doc.setFillColor(250, 252, 254); doc.rect(REPORT_PAGE.left, pageY - 4.5, 187.9, 8.5, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.2); doc.setTextColor(51, 65, 85);
      doc.text(String(step.step), 15, pageY); doc.text(shorten(step.cargoName, 58), 34, pageY); doc.text(format.dimension(step.positionFromNoseIn), 143, pageY); doc.text(format.dimension(step.levelIn), 174, pageY); pageY += 8.5;
    });
    if (sequence.length > 8) { doc.setFontSize(7); doc.setTextColor(100, 116, 139); doc.text(`${sequence.length - 8} additional steps continue on the next page.`, REPORT_PAGE.left, Math.min(pageY + 2, 264)); }

    for (let start = 8; start < sequence.length; start += 23) {
      const chunk = sequence.slice(start, start + 23);
      doc.addPage();
      drawReportHeader(doc, { reportTitle: "Truck loading planner", section: `Trailer ${trailerIndex + 1} sequence`, logoDataUrl });
      let sequenceY = drawReportTitle(doc, "Loading sequence", `Trailer ${trailerIndex + 1} · Steps ${chunk[0]?.step ?? 0}–${chunk[chunk.length - 1]?.step ?? 0} of ${sequence.length}.`) + 5;
      sequenceY = drawTableHeader(doc, sequenceY, ["Step", "Cargo", "From nose", "Deck level"], [15, 34, 143, 174]);
      chunk.forEach((step, index) => {
        if (index % 2 === 0) { doc.setFillColor(250, 252, 254); doc.rect(REPORT_PAGE.left, sequenceY - 4.5, 187.9, 8.5, "F"); }
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.2); doc.setTextColor(51, 65, 85);
        doc.text(String(step.step), 15, sequenceY); doc.text(shorten(step.cargoName, 58), 34, sequenceY); doc.text(format.dimension(step.positionFromNoseIn), 143, sequenceY); doc.text(format.dimension(step.levelIn), 174, sequenceY); sequenceY += 8.5;
      });
    }
  });

  finalizeReportPages(doc, "Planning estimate — verify securement, trailer capacity, axle weights, and legal limits with the carrier.");
  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}
