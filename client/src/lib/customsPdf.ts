import { jsPDF } from "jspdf";
import {
  REPORT_PAGE,
  drawMetricCards,
  drawReportHeader,
  drawReportTitle,
  drawSectionHeading,
  drawStatusBanner,
  finalizeReportPages,
} from "./loadingReportPdfBrand";

type CustomsItem = {
  hsCode: string;
  description: string;
  countryOfOrigin: string;
  valueCAD: number;
  quantity: number;
  dutyRate: string;
  dutyAmount: number;
  gstAmount: number;
  provincialTaxAmount: number;
  totalForItem?: number;
  error?: string;
  warnings?: string[];
};

type CustomsSummary = {
  totalValue: number;
  totalDuty: number;
  totalGST: number;
  totalProvincialTax: number;
  totalDutiesAndTaxes: number;
  totalLandedCost: number;
  provinceName: string;
  shipmentType?: string;
};

export type CustomsPdfData = {
  title: string;
  items: CustomsItem[];
  summary: CustomsSummary;
  tariffTreatment?: string;
  warnings?: string[];
  logoDataUrl?: string;
};

const money = (value: number) => `$${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const short = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value;

function drawTableHeader(doc: jsPDF, y: number) {
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(REPORT_PAGE.left, y, 187.9, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.7);
  doc.setTextColor(71, 85, 105);
  doc.text("CLASSIFICATION / GOODS", 16, y + 5.3);
  doc.text("ORIGIN", 91, y + 5.3);
  doc.text("VALUE", 130, y + 5.3, { align: "right" });
  doc.text("DUTY", 160, y + 5.3, { align: "right" });
  doc.text("TAX", 199, y + 5.3, { align: "right" });
  return y + 12;
}

function startDetailPage(doc: jsPDF, title: string, logoDataUrl: string | undefined, page: number, total: number) {
  drawReportHeader(doc, { reportTitle: "Customs border-charge estimate", section: `Details ${page}/${total}`, logoDataUrl });
  return drawReportTitle(doc, title, "Source classifications and calculation amounts included in this estimate.") + 7;
}

export async function generateCustomsEstimatePdfBlob(data: CustomsPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });
  doc.setProperties({
    title: `AccessToNorth ${data.title}`,
    subject: "Preliminary Canadian customs border-charge estimate",
    author: "AccessToNorth.com",
    creator: "AccessToNorth.com Customs Calculator",
  });

  drawReportHeader(doc, { reportTitle: "Customs border-charge estimate", section: "Estimate", logoDataUrl: data.logoDataUrl });
  let y = drawReportTitle(
    doc,
    data.title,
    "A planning estimate based on the selected Canadian tariff classification, origin assumptions, shipment type, and declared value.",
  ) + 6;
  y = drawStatusBanner(doc, y, {
    tone: data.warnings?.length ? "review" : "good",
    title: data.warnings?.length ? "Review assumptions before importing" : "Estimate calculated",
    detail: data.warnings?.[0] || "No unsupported duty-rate format was detected. Final assessment remains subject to CBSA review.",
  });
  y = drawMetricCards(doc, y, [
    { label: "Goods value", value: money(data.summary.totalValue) },
    { label: "Customs duty", value: money(data.summary.totalDuty) },
    { label: "Border taxes", value: money(data.summary.totalGST + data.summary.totalProvincialTax) },
    { label: "Goods + charges", value: money(data.summary.totalLandedCost) },
  ]);

  y = drawSectionHeading(doc, "Calculation basis", y, data.tariffTreatment);
  const basis = [
    ["Shipment type", data.summary.shipmentType === "personal" ? "Personal / casual" : "Commercial"],
    ["Destination", data.summary.provinceName],
    ["Classifications", String(data.items.filter((item) => !item.error).length)],
    ["Tariff edition", "Canadian Customs Tariff T2026"],
  ];
  basis.forEach(([label, value], index) => {
    if (index % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(REPORT_PAGE.left, y - 4.3, 187.9, 8.5, "F"); }
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.3); doc.setTextColor(71, 85, 105); doc.text(label, 17, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(15, 23, 42); doc.text(value, 78, y);
    y += 8.5;
  });

  y += 5;
  y = drawSectionHeading(doc, "What this total means", y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(71, 85, 105);
  const explanation = data.summary.shipmentType === "personal"
    ? "The estimate includes the selected personal-import provincial tax treatment. Actual collection depends on the import channel, residency, exemptions, and CBSA assessment."
    : "The estimate includes GST or the federal part of HST normally payable on commercial importation. Provincial self-assessment, when applicable, is not included in border charges.";
  doc.text(doc.splitTextToSize(explanation, 187), REPORT_PAGE.left, y);

  const pages = Math.max(1, Math.ceil(data.items.length / 16));
  for (let page = 0; page < pages; page += 1) {
    doc.addPage();
    let tableY = startDetailPage(doc, "Classification details", data.logoDataUrl, page + 1, pages);
    tableY = drawTableHeader(doc, tableY);
    for (const [index, item] of data.items.slice(page * 16, page * 16 + 16).entries()) {
      if (index % 2 === 0) { doc.setFillColor(250, 252, 254); doc.rect(REPORT_PAGE.left, tableY - 4.8, 187.9, 11, "F"); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(15, 23, 42);
      doc.text(item.hsCode || "—", 16, tableY - 0.8);
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.2); doc.setTextColor(100, 116, 139);
      doc.text(short(item.description || item.error || "Unknown", 50), 16, tableY + 3.1);
      doc.setFontSize(6.8); doc.setTextColor(51, 65, 85);
      doc.text(short(item.countryOfOrigin || "—", 22), 91, tableY);
      doc.text(item.error ? "—" : money(item.valueCAD), 130, tableY, { align: "right" });
      doc.text(item.error ? "REVIEW" : money(item.dutyAmount), 160, tableY, { align: "right" });
      doc.text(item.error ? "—" : money(item.gstAmount + item.provincialTaxAmount), 199, tableY, { align: "right" });
      tableY += 11;
    }
  }

  finalizeReportPages(
    doc,
    "Planning estimate only · Excludes freight, insurance, brokerage, SIMA, excise, surtax, permits and other special measures.",
  );
  return doc.output("blob");
}
