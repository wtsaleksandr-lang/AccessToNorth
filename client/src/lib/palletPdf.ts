import { jsPDF } from "jspdf";
import type { PalletBuildPlan, PalletCarton, PalletLayer } from "./palletPacking";
import {
  REPORT_PAGE,
  drawMetricCards,
  drawReportHeader,
  drawReportTitle,
  drawSectionHeading,
  drawStatusBanner,
  finalizeReportPages,
} from "./loadingReportPdfBrand";

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

function shorten(value: string, length: number) {
  return value.length > length ? `${value.slice(0, Math.max(1, length - 1))}…` : value;
}

function drawPalletProfile(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setFillColor(226, 196, 148);
  doc.setDrawColor(154, 107, 53);
  doc.setLineWidth(0.55);
  doc.lines([[width * 0.5, height * 0.28], [width * 0.5, -height * 0.28], [-width * 0.5, -height * 0.28], [-width * 0.5, height * 0.28]], x, y + height * 0.26, [1, 1], "FD", true);
  doc.lines([[0, height * 0.28], [width * 0.5, height * 0.28], [0, -height * 0.28]], x, y + height * 0.26, [1, 1], "S");
  doc.line(x, y + height * 0.54, x, y + height * 0.85);
  doc.line(x + width * 0.5, y + height * 0.26, x + width * 0.5, y + height * 0.57);
  doc.line(x - width * 0.5, y + height * 0.26, x - width * 0.5, y + height * 0.57);
  doc.line(x - width * 0.5, y + height * 0.57, x, y + height * 0.85);
  doc.line(x, y + height * 0.85, x + width * 0.5, y + height * 0.57);
}

function drawLayerDiagram(doc: jsPDF, layer: PalletLayer, palletLength: number, palletWidth: number, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / Math.max(1, palletLength), height / Math.max(1, palletWidth));
  const drawingWidth = palletLength * scale;
  const drawingHeight = palletWidth * scale;
  const offsetX = x + (width - drawingWidth) / 2;
  const offsetY = y + (height - drawingHeight) / 2;
  doc.setFillColor(248, 250, 252); doc.setDrawColor(154, 107, 53); doc.setLineWidth(0.5);
  doc.roundedRect(offsetX, offsetY, drawingWidth, drawingHeight, 1.5, 1.5, "FD");
  for (const placement of layer.placements) {
    const [r, g, b] = hexToRgb(placement.color);
    doc.setFillColor(r, g, b); doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.35);
    doc.rect(offsetX + placement.x * scale, offsetY + placement.y * scale, Math.max(0.4, placement.lengthIn * scale), Math.max(0.4, placement.widthIn * scale), "FD");
  }
}

function drawTableHeader(doc: jsPDF, y: number, headers: string[], columns: number[]) {
  doc.setFillColor(241, 245, 249); doc.roundedRect(REPORT_PAGE.left, y, 187.9, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(71, 85, 105);
  headers.forEach((header, index) => doc.text(header, columns[index], y + 5.3));
  return y + 12;
}

function drawCartonManifestPage(doc: jsPDF, rows: PalletCarton[], pageIndex: number, pageCount: number, unitSystem: UnitSystem, logoDataUrl?: string) {
  const format = createFormatters(unitSystem);
  drawReportHeader(doc, { reportTitle: "Pallet builder", section: `Carton details ${pageIndex + 1}/${pageCount}`, logoDataUrl });
  let y = drawReportTitle(doc, "Carton details", "Complete source manifest used to calculate pallet layers and quantities.") + 5;
  y = drawTableHeader(doc, y, ["Carton", "Dimensions", "Each", "Qty", "Rotate", "Stack"], [15, 69, 134, 164, 177, 190]);
  rows.forEach((carton, index) => {
    if (index % 2 === 0) { doc.setFillColor(250, 252, 254); doc.rect(REPORT_PAGE.left, y - 4.5, 187.9, 9, "F"); }
    doc.setFillColor(...hexToRgb(carton.color)); doc.roundedRect(15, y - 3.2, 3.5, 3.5, 0.8, 0.8, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.1); doc.setTextColor(51, 65, 85);
    doc.text(shorten(carton.name || "Carton", 29), 20, y);
    doc.text(`${format.dimension(carton.lengthIn)} × ${format.dimension(carton.widthIn)} × ${format.dimension(carton.heightIn)}`, 69, y);
    doc.text(format.weight(carton.weightLbs), 134, y); doc.text(String(carton.quantity), 164, y); doc.text(carton.allowRotation ? "Yes" : "No", 177, y); doc.text(carton.stackable ? "Yes" : "No", 190, y);
    y += 9;
  });
}

export async function generatePalletReportBlob({ plan, cartons, unitSystem, logoDataUrl }: {
  plan: PalletBuildPlan;
  cartons: PalletCarton[];
  unitSystem: UnitSystem;
  logoDataUrl?: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });
  const format = createFormatters(unitSystem);
  doc.setProperties({ title: "AccessToNorth Pallet Building Plan", subject: "Pallet layer and loading plan", author: "AccessToNorth.com", creator: "AccessToNorth.com Pallet Builder" });

  drawReportHeader(doc, { reportTitle: "Pallet builder", section: "Overview", logoDataUrl });
  let y = drawReportTitle(doc, "Pallet building plan", `${plan.pallet.name} · Layer-by-layer carton placement and operational review.`) + 4;
  const hasRisk = plan.pallets.some((pallet) => pallet.stability === "risk") || plan.warnings.length > 0;
  const hasReview = plan.pallets.some((pallet) => pallet.stability === "review") || plan.recommendations.length > 0;
  y = drawStatusBanner(doc, y, {
    tone: hasRisk ? "risk" : hasReview ? "review" : "good",
    title: hasRisk ? "Review required before pallet building" : hasReview ? "Plan complete — warehouse review recommended" : "Plan complete — ready for warehouse review",
    detail: `${plan.totalCartons} cartons assigned to ${plan.totalPallets} pallet${plan.totalPallets === 1 ? "" : "s"}. Confirm compression strength, pallet rating, wrap, and handling conditions.`,
  });
  y = drawMetricCards(doc, y, [
    { label: "Pallets", value: String(plan.totalPallets), detail: plan.pallet.name },
    { label: "Cartons", value: String(plan.totalCartons), detail: `${plan.averageCartonsPerPallet} average` },
    { label: "Gross weight", value: format.weight(plan.totalGrossWeightLbs), detail: "all pallets" },
    { label: "Layer use", value: `${plan.averageLayerUtilizationPct.toFixed(1)}%`, detail: "average" },
  ]);

  y = drawSectionHeading(doc, "Pallet and limits", y, "Entered planning constraints");
  doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240); doc.roundedRect(REPORT_PAGE.left, y, 187.9, 42, 3, 3, "FD");
  drawPalletProfile(doc, 42, y + 9, 43, 26);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42); doc.text(plan.pallet.name, 75, y + 10);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.4); doc.setTextColor(71, 85, 105);
  doc.text(`Base ${format.dimension(plan.pallet.lengthIn)} × ${format.dimension(plan.pallet.widthIn)} · tare ${format.weight(plan.pallet.tareWeightLbs)}`, 75, y + 17);
  doc.text(`Maximum loaded height ${format.dimension(plan.options.maxLoadedHeightIn)} · maximum gross ${format.weight(plan.options.maxGrossWeightLbs)}`, 75, y + 24);
  doc.text(`Overhang per edge ${format.dimension(plan.options.overhangIn)} · alternating layers ${plan.options.interlockLayers ? "enabled" : "disabled"}`, 75, y + 31);
  y += 50;

  y = drawSectionHeading(doc, "Operational review", y);
  const notes = [
    ...plan.warnings.map((note) => `Warning: ${note}`),
    ...plan.recommendations,
    "Confirm carton compression strength, pallet rating, wrapping or strapping, fork access, and receiving limits before handling.",
  ].slice(0, 5);
  notes.forEach((note) => {
    doc.setFillColor(note.startsWith("Warning") ? 254 : 248, note.startsWith("Warning") ? 242 : 250, note.startsWith("Warning") ? 242 : 252);
    doc.roundedRect(REPORT_PAGE.left, y, 187.9, 12, 2, 2, "F"); doc.setFillColor(note.startsWith("Warning") ? 220 : 2, note.startsWith("Warning") ? 38 : 132, note.startsWith("Warning") ? 38 : 199); doc.circle(19, y + 6, 1.4, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.3); doc.setTextColor(71, 85, 105); doc.text(doc.splitTextToSize(note, 174), 24, y + 4.8); y += 14;
  });

  const activeCartons = cartons.filter((carton) => carton.included !== false && carton.quantity > 0);
  const manifestChunks: PalletCarton[][] = [];
  for (let index = 0; index < activeCartons.length; index += 20) manifestChunks.push(activeCartons.slice(index, index + 20));
  manifestChunks.forEach((rows, index) => { doc.addPage(); drawCartonManifestPage(doc, rows, index, manifestChunks.length, unitSystem, logoDataUrl); });

  plan.pallets.forEach((builtPallet, palletIndex) => {
    const layerChunks: PalletLayer[][] = [];
    for (let index = 0; index < builtPallet.layers.length; index += 4) layerChunks.push(builtPallet.layers.slice(index, index + 4));
    layerChunks.forEach((layers, chunkIndex) => {
      doc.addPage();
      const firstLayer = layers[0]?.index ?? 0;
      const lastLayer = layers[layers.length - 1]?.index ?? 0;
      drawReportHeader(doc, { reportTitle: "Pallet builder", section: `Pallet ${palletIndex + 1} of ${plan.totalPallets}`, logoDataUrl });
      let pageY = drawReportTitle(doc, `Pallet ${palletIndex + 1} build plan`, `${builtPallet.cartonCount} cartons · ${builtPallet.layers.length} layers · Layers ${firstLayer}–${lastLayer} shown`) + 3;
      pageY = drawMetricCards(doc, pageY, [
        { label: "Gross weight", value: format.weight(builtPallet.grossWeightLbs), detail: `limit ${format.weight(plan.options.maxGrossWeightLbs)}` },
        { label: "Loaded height", value: format.dimension(builtPallet.loadedHeightIn), detail: `limit ${format.dimension(plan.options.maxLoadedHeightIn)}` },
        { label: "Layer use", value: `${builtPallet.averageLayerUtilizationPct.toFixed(1)}%`, detail: "average" },
        { label: "Stability", value: builtPallet.stability, detail: `balance ${builtPallet.centerOfGravity.xPct}/${builtPallet.centerOfGravity.yPct}%` },
      ]);
      pageY = drawSectionHeading(doc, "Layer diagrams", pageY, "Top view · build from layer 1 upward");
      layers.forEach((layer, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const cellX = REPORT_PAGE.left + column * 96;
        const cellY = pageY + row * 79;
        doc.setFillColor(250, 252, 254); doc.setDrawColor(226, 232, 240); doc.roundedRect(cellX, cellY, 91.9, 72, 3, 3, "FD");
        doc.setFillColor(...hexToRgb(layer.color)); doc.roundedRect(cellX + 4, cellY + 4, 4, 4, 1, 1, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(15, 23, 42); doc.text(`Layer ${layer.index} · ${shorten(layer.cartonName, 27)}`, cellX + 11, cellY + 7.5);
        doc.setFont("helvetica", "normal"); doc.setFontSize(6.6); doc.setTextColor(100, 116, 139); doc.text(`${layer.placements.length} cartons · ${layer.utilizationPct}% use · ${layer.pattern === "rows-lengthwise" ? "lengthwise" : "crosswise"}`, cellX + 4, cellY + 14);
        drawLayerDiagram(doc, layer, plan.pallet.lengthIn, plan.pallet.widthIn, cellX + 5, cellY + 19, 81.9, 47);
      });
      if (chunkIndex === layerChunks.length - 1) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(6.8); doc.setTextColor(100, 116, 139);
        doc.text("Build layers in numerical order. Review partial top layers and re-check wrap or strap coverage before movement.", REPORT_PAGE.left, 263);
      }
    });
  });

  finalizeReportPages(doc, "Planning estimate — verify carton strength, pallet rating, wrapping, and handling requirements.");
  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}
