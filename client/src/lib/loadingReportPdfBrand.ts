import type { jsPDF } from "jspdf";

export const REPORT_PAGE = { width: 215.9, height: 279.4, left: 14, right: 201.9, footerY: 269 } as const;

export async function loadAccessToNorthLogoDataUrl() {
  if (typeof window === "undefined" || typeof FileReader === "undefined") return undefined;
  try {
    const response = await fetch("/favicon.png", { cache: "force-cache" });
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function drawVectorMark(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(0, 123, 255);
  doc.roundedRect(x, y, size, size, size * 0.23, size * 0.23, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(size * 0.075);
  doc.lines([
    [size * 0.28, size * -0.11],
    [size * 0.2, size * 0.1],
    [size * 0.02, size * 0.42],
    [size * -0.22, size * 0.22],
    [size * -0.28, size * -0.08],
    [size * 0, size * -0.55],
  ], x + size * 0.36, y + size * 0.24, [1, 1], "S", true);
  doc.line(x + size * 0.33, y + size * 0.55, x + size * 0.46, y + size * 0.68);
  doc.line(x + size * 0.46, y + size * 0.68, x + size * 0.71, y + size * 0.42);
}

export function drawReportHeader(doc: jsPDF, {
  reportTitle,
  section,
  logoDataUrl,
}: {
  reportTitle: string;
  section: string;
  logoDataUrl?: string;
}) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, REPORT_PAGE.width, 26, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(REPORT_PAGE.left, 25.5, REPORT_PAGE.right, 25.5);
  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", REPORT_PAGE.left, 6, 12, 12, undefined, "FAST");
  else drawVectorMark(doc, REPORT_PAGE.left, 6, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(15, 23, 42);
  doc.text("AccessToNorth", 29.5, 13.7);
  const wordWidth = doc.getTextWidth("AccessToNorth");
  doc.setTextColor(0, 123, 255);
  doc.text(".com", 29.5 + wordWidth, 13.7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(reportTitle, 29.5, 18.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(section.toUpperCase(), REPORT_PAGE.right, 11.4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(new Date().toISOString().slice(0, 10), REPORT_PAGE.right, 17, { align: "right" });
}

export function drawReportTitle(doc: jsPDF, title: string, subtitle: string) {
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(title, REPORT_PAGE.left, 39);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const lines = doc.splitTextToSize(subtitle, 187);
  doc.text(lines, REPORT_PAGE.left, 46);
  return 46 + lines.length * 4;
}

export function drawStatusBanner(doc: jsPDF, y: number, {
  tone,
  title,
  detail,
}: {
  tone: "good" | "review" | "risk";
  title: string;
  detail: string;
}) {
  const palette = tone === "good"
    ? { fill: [236, 253, 245], stroke: [167, 243, 208], accent: [5, 150, 105] }
    : tone === "review"
      ? { fill: [255, 251, 235], stroke: [253, 230, 138], accent: [217, 119, 6] }
      : { fill: [254, 242, 242], stroke: [254, 202, 202], accent: [220, 38, 38] };
  doc.setFillColor(...palette.fill as [number, number, number]);
  doc.setDrawColor(...palette.stroke as [number, number, number]);
  doc.roundedRect(REPORT_PAGE.left, y, 187.9, 19, 3, 3, "FD");
  doc.setFillColor(...palette.accent as [number, number, number]);
  doc.circle(20, y + 9.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 26, y + 7.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(doc.splitTextToSize(detail, 169), 26, y + 12.4);
  return y + 24;
}

export function drawMetricCards(doc: jsPDF, y: number, cards: Array<{ label: string; value: string; detail?: string }>) {
  const gap = 4;
  const width = (187.9 - gap * (cards.length - 1)) / cards.length;
  cards.forEach((card, index) => {
    const x = REPORT_PAGE.left + index * (width + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, width, 24, 3, 3, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label.toUpperCase(), x + 4, y + 6.5);
    doc.setFontSize(card.value.length > 17 ? 9 : 11.5);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, x + 4, y + 15);
    if (card.detail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.4);
      doc.setTextColor(148, 163, 184);
      doc.text(card.detail.slice(0, 34), x + 4, y + 20.2);
    }
  });
  return y + 30;
}

export function drawSectionHeading(doc: jsPDF, title: string, y: number, meta?: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, REPORT_PAGE.left, y);
  if (meta) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(meta, REPORT_PAGE.right, y, { align: "right" });
  }
  return y + 6;
}

export function finalizeReportPages(doc: jsPDF, footerNote: string) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(REPORT_PAGE.left, REPORT_PAGE.footerY, REPORT_PAGE.right, REPORT_PAGE.footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.7);
    doc.setTextColor(100, 116, 139);
    doc.text(footerNote, REPORT_PAGE.left, REPORT_PAGE.footerY + 5);
    doc.text(`Page ${page} of ${total}`, REPORT_PAGE.right, REPORT_PAGE.footerY + 5, { align: "right" });
  }
}
