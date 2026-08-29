import { jsPDF } from "jspdf";
import type { PlacedBox } from "./containerPacking";
import type { TruckSpatialPlan } from "./truckPacking";

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

function drawHeader(doc: jsPDF, label: string) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 215.9, 25, "F");
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(14, 7, 11, 11, 2.5, 2.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("AccessToNorth.com", 30, 13.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text(label, 30, 19);
}

function drawFooter(doc: jsPDF, page: number) {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 282, 202, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  doc.setTextColor(100, 116, 139);
  doc.text("Planning estimate only - confirm securement, trailer capacity, axle weights, and legal limits with the carrier.", 14, 287);
  doc.text(`Page ${page}`, 202, 287, { align: "right" });
}

function drawTopPlan(doc: jsPDF, placed: PlacedBox[], lengthIn: number, widthIn: number, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / lengthIn, height / widthIn);
  const planWidth = lengthIn * scale;
  const planHeight = widthIn * scale;
  const left = x + (width - planWidth) / 2;
  const top = y + (height - planHeight) / 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(100, 116, 139);
  doc.roundedRect(left, top, planWidth, planHeight, 1.5, 1.5, "FD");
  placed.forEach((cargo, index) => {
    const [r, g, b] = hexToRgb(cargo.color);
    doc.setFillColor(r, g, b);
    doc.setDrawColor(255, 255, 255);
    doc.rect(left + cargo.x * scale, top + cargo.z * scale, cargo.l * scale, cargo.w * scale, "FD");
    if (cargo.l * scale > 8 && cargo.w * scale > 5) {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text(String(index + 1), left + (cargo.x + cargo.l / 2) * scale, top + (cargo.z + cargo.w / 2) * scale + 1.8, { align: "center" });
    }
  });
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.8);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(left + planWidth, top, left + planWidth, top + planHeight);
  doc.setLineDashPattern([], 0);
}

export async function generateTruckLoadingReportBlob({
  plan,
  cargoRows,
  unitSystem,
}: {
  plan: TruckSpatialPlan;
  cargoRows: TruckPdfCargoRow[];
  unitSystem: UnitSystem;
}) {
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });
  const format = createFormatters(unitSystem);
  doc.setProperties({
    title: "AccessToNorth Truck Loading Plan",
    subject: "Spatial trailer loading plan",
    author: "AccessToNorth.com",
    creator: "AccessToNorth.com Truck Load Planner",
  });

  drawHeader(doc, "TRUCK LOADING PLAN");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Spatial loading summary", 14, 39);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)} | ${plan.trailer.name}`, 14, 46);

  const cards = [
    ["Trailers", String(plan.trailersRequired)],
    ["Pieces", `${plan.piecesLoaded}/${plan.piecesTotal}`],
    ["Placed weight", format.weight(plan.totalPlacedWeightLbs)],
    ["Avg. volume use", `${plan.averageVolumeUtilPct.toFixed(1)}%`],
  ];
  cards.forEach(([label, value], index) => {
    const cardX = 14 + index * 47.5;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, 53, 43, 22, 2.5, 2.5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), cardX + 4, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(value, cardX + 4, 69);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Equipment", 14, 88);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${plan.trailer.name} (${plan.trailer.category})`, 14, 95);
  doc.text(`Usable space: ${format.dimension(plan.trailer.lengthIn)} x ${format.dimension(plan.trailer.widthIn)} x ${format.dimension(plan.trailer.heightIn)}`, 14, 101);
  doc.text(`Payload per trailer: ${format.weight(plan.trailer.maxPayloadLbs)}`, 14, 107);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Cargo inputs", 14, 121);
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 126, 188, 8, "F");
  const columns = [14, 80, 142, 172];
  ["Cargo", "Dimensions", "Weight each", "Quantity"].forEach((header, index) => doc.text(header, columns[index] + 1, 131.5));
  let rowY = 139;
  doc.setFontSize(7.5);
  cargoRows.slice(0, 14).forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(row.name.slice(0, 34), columns[0] + 1, rowY);
    doc.text(row.dimensionsIn.map(format.dimension).join(" x "), columns[1] + 1, rowY);
    doc.text(format.weight(row.weightEachLbs), columns[2] + 1, rowY);
    doc.text(String(row.quantity), columns[3] + 1, rowY);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, rowY + 2.5, 202, rowY + 2.5);
    rowY += 8;
  });

  rowY += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Important planning limits", 14, rowY);
  rowY += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const notes = [
    "Cargo positions are geometric suggestions and do not calculate legal axle weights.",
    "Confirm securement, concentrated-load limits, tractor weight, axle spacing, and route restrictions before dispatch.",
    "Loading order starts at the trailer nose so rear-door cargo remains accessible during loading.",
  ];
  notes.forEach((note) => {
    const lines = doc.splitTextToSize(`- ${note}`, 181);
    doc.text(lines, 17, rowY);
    rowY += lines.length * 4.2 + 2;
  });
  drawFooter(doc, 1);

  plan.multi.containers.forEach((entry, trailerIndex) => {
    doc.addPage();
    drawHeader(doc, `TRAILER ${trailerIndex + 1} OF ${plan.trailersRequired}`);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(`Trailer ${trailerIndex + 1} loading plan`, 14, 39);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${entry.result.piecesLoaded} pieces | ${format.weight(entry.result.totalWeight)} | ${entry.result.volumeUtil.toFixed(1)}% volume | ${entry.result.weightUtil.toFixed(1)}% payload`, 14, 47);
    const balance = plan.balances[trailerIndex];
    doc.text(`Cargo centre: ${format.dimension(balance.distanceFromNoseIn)} from nose | Nose/rear split ${balance.noseWeightPct.toFixed(1)}% / ${balance.doorWeightPct.toFixed(1)}%`, 14, 53);
    drawTopPlan(doc, entry.result.placed, plan.trailer.lengthIn, plan.trailer.widthIn, 14, 61, 188, 56);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Loading sequence", 14, 130);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 135, 188, 8, "F");
    ["Step", "Cargo", "From nose", "Deck level"].forEach((header, index) => doc.text(header, [14, 33, 127, 164][index] + 1, 140.5));
    let sequenceY = 148;
    doc.setFontSize(7.5);
    plan.loadingSequences[trailerIndex].slice(0, 15).forEach((step) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(String(step.step), 15, sequenceY);
      doc.text(step.cargoName.slice(0, 48), 34, sequenceY);
      doc.text(format.dimension(step.positionFromNoseIn), 128, sequenceY);
      doc.text(format.dimension(step.levelIn), 165, sequenceY);
      doc.setDrawColor(241, 245, 249);
      doc.line(14, sequenceY + 2.5, 202, sequenceY + 2.5);
      sequenceY += 8;
    });
    if (plan.loadingSequences[trailerIndex].length > 15) {
      doc.setTextColor(100, 116, 139);
      doc.text(`${plan.loadingSequences[trailerIndex].length - 15} more steps continue in the same nose-to-door order.`, 14, 273);
    }
    drawFooter(doc, trailerIndex + 2);
  });

  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}
