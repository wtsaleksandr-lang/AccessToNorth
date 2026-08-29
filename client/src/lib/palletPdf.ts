import { jsPDF } from "jspdf";
import type { PalletBuildPlan, PalletCarton, PalletLayer } from "./palletPacking";

type UnitSystem = "imperial" | "metric";

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((part) => `${part}${part}`).join("") : value;
  const parsed = Number.parseInt(normalized, 16);
  if (!Number.isFinite(parsed)) return [15, 118, 110] as const;
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255] as const;
}

function createFormatters(unitSystem: UnitSystem) {
  const metric = unitSystem === "metric";
  return {
    dimension: (inches: number) => metric ? `${(inches * 2.54).toFixed(1)} cm` : `${inches.toFixed(1)} in`,
    weight: (lbs: number) => metric ? `${(lbs * 0.453592).toFixed(1)} kg` : `${lbs.toFixed(0)} lb`,
  };
}

function drawHeader(doc: jsPDF, subtitle: string) {
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
  doc.setTextColor(191, 219, 254);
  doc.text(subtitle, 30, 19);
}

function drawFooter(doc: jsPDF, page: number) {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 282, 202, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Planning estimate only - confirm carton strength, pallet rating, wrapping, and handling requirements.", 14, 287);
  doc.text(`Page ${page}`, 202, 287, { align: "right" });
}

function drawLayerDiagram(
  doc: jsPDF,
  layer: PalletLayer,
  palletLength: number,
  palletWidth: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / palletLength, height / palletWidth);
  const drawingWidth = palletLength * scale;
  const drawingHeight = palletWidth * scale;
  const offsetX = x + (width - drawingWidth) / 2;
  const offsetY = y + (height - drawingHeight) / 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(offsetX, offsetY, drawingWidth, drawingHeight, 1.5, 1.5, "FD");

  for (const placement of layer.placements) {
    const [r, g, b] = hexToRgb(placement.color);
    doc.setFillColor(r, g, b);
    doc.setDrawColor(255, 255, 255);
    doc.rect(
      offsetX + placement.x * scale,
      offsetY + placement.y * scale,
      placement.lengthIn * scale,
      placement.widthIn * scale,
      "FD",
    );
  }
}

export async function generatePalletReportBlob({
  plan,
  cartons,
  unitSystem,
}: {
  plan: PalletBuildPlan;
  cartons: PalletCarton[];
  unitSystem: UnitSystem;
}) {
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });
  const format = createFormatters(unitSystem);
  doc.setProperties({
    title: "AccessToNorth Pallet Building Plan",
    subject: "Pallet layer and loading plan",
    author: "AccessToNorth.com",
    creator: "AccessToNorth.com Pallet Builder",
  });

  drawHeader(doc, "PALLET BUILDING PLAN");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Pallet plan summary", 14, 39);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)} | ${plan.pallet.name}`, 14, 46);

  const cards = [
    ["Pallets", String(plan.totalPallets)],
    ["Cartons", String(plan.totalCartons)],
    ["Gross weight", format.weight(plan.totalGrossWeightLbs)],
    ["Layer use", `${plan.averageLayerUtilizationPct.toFixed(1)}%`],
  ];
  cards.forEach(([label, value], index) => {
    const cardX = 14 + index * 47.5;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, 53, 43, 22, 2.5, 2.5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), cardX + 4, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value, cardX + 4, 69);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Planning limits", 14, 87);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Maximum loaded height: ${format.dimension(plan.options.maxLoadedHeightIn)}`, 14, 94);
  doc.text(`Maximum gross weight: ${format.weight(plan.options.maxGrossWeightLbs)}`, 14, 100);
  doc.text(`Allowed overhang per edge: ${format.dimension(plan.options.overhangIn)}`, 14, 106);
  doc.text(`Alternating layer patterns: ${plan.options.interlockLayers ? "Enabled" : "Disabled"}`, 14, 112);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Carton inputs", 14, 125);
  const headers = ["Carton", "Dimensions", "Each", "Qty", "Rotate", "Stack"];
  const columns = [14, 69, 121, 150, 165, 185];
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 130, 188, 8, "F");
  doc.setFontSize(7.5);
  headers.forEach((header, index) => doc.text(header, columns[index] + 1, 135.5));
  let rowY = 143;
  cartons.filter((carton) => carton.included !== false && carton.quantity > 0).slice(0, 12).forEach((carton) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text((carton.name || "Carton").slice(0, 28), columns[0] + 1, rowY);
    doc.text(`${format.dimension(carton.lengthIn)} x ${format.dimension(carton.widthIn)} x ${format.dimension(carton.heightIn)}`, columns[1] + 1, rowY);
    doc.text(format.weight(carton.weightLbs), columns[2] + 1, rowY);
    doc.text(String(carton.quantity), columns[3] + 1, rowY);
    doc.text(carton.allowRotation ? "Yes" : "No", columns[4] + 1, rowY);
    doc.text(carton.stackable ? "Yes" : "No", columns[5] + 1, rowY);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, rowY + 2.5, 202, rowY + 2.5);
    rowY += 8;
  });

  const notes = [...plan.warnings, ...plan.recommendations];
  if (notes.length > 0) {
    rowY += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Checks and recommendations", 14, rowY);
    rowY += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    for (const note of notes.slice(0, 6)) {
      const lines = doc.splitTextToSize(`- ${note}`, 181);
      doc.text(lines, 17, rowY);
      rowY += lines.length * 4.2 + 2;
      if (rowY > 274) break;
    }
  }
  drawFooter(doc, 1);

  plan.pallets.forEach((builtPallet, palletIndex) => {
    doc.addPage();
    drawHeader(doc, `PALLET ${palletIndex + 1} OF ${plan.totalPallets}`);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(`Pallet ${palletIndex + 1}`, 14, 39);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(
      `${builtPallet.cartonCount} cartons | ${builtPallet.layers.length} layers | ` +
      `${format.dimension(builtPallet.loadedLengthIn)} x ${format.dimension(builtPallet.loadedWidthIn)} x ${format.dimension(builtPallet.loadedHeightIn)} | ` +
      `${format.weight(builtPallet.grossWeightLbs)}`,
      14,
      47,
    );
    doc.text(
      `Layer use ${builtPallet.averageLayerUtilizationPct.toFixed(1)}% | Balance L ${builtPallet.centerOfGravity.xPct.toFixed(1)}% / W ${builtPallet.centerOfGravity.yPct.toFixed(1)}% | Stability: ${builtPallet.stability.toUpperCase()}`,
      14,
      53,
    );

    const visibleLayers = builtPallet.layers.slice(0, 12);
    visibleLayers.forEach((layer, layerIndex) => {
      const column = layerIndex % 2;
      const row = Math.floor(layerIndex / 2);
      const cellX = 14 + column * 95;
      const cellY = 62 + row * 34;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Layer ${layer.index} - ${layer.cartonName.slice(0, 24)} (${layer.placements.length})`, cellX, cellY);
      drawLayerDiagram(doc, layer, plan.pallet.lengthIn, plan.pallet.widthIn, cellX, cellY + 3, 88, 26);
    });
    if (builtPallet.layers.length > visibleLayers.length) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`${builtPallet.layers.length - visibleLayers.length} additional layers follow the same calculated patterns.`, 14, 272);
    }
    drawFooter(doc, palletIndex + 2);
  });

  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}
