import PDFDocument from "pdfkit";
import type { ClassificationOrderData, Order } from "@shared/schema";

const BRAND_COLOR = "#007BFF";
const BRAND_DARK = "#0A2540";

export async function generateReportPdf(
  order: Order,
  draftReport: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      info: {
        Title: `HS Classification Report - ${order.id}`,
        Author: "AccessToNorth.com",
        Subject: "HS Code Classification Report",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const meta = order.metadata as ClassificationOrderData | null;

    doc
      .rect(0, 0, doc.page.width, 80)
      .fill(BRAND_DARK);

    doc
      .fontSize(20)
      .fillColor("#FFFFFF")
      .text("AccessToNorth.com", 60, 25, { align: "left" });

    doc
      .fontSize(10)
      .fillColor("#AABBCC")
      .text("HS Code Classification Report", 60, 50, { align: "left" });

    doc
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text(order.id, doc.page.width - 200, 30, {
        align: "right",
        width: 140,
      });

    doc
      .fontSize(9)
      .fillColor("#AABBCC")
      .text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), doc.page.width - 200, 50, {
        align: "right",
        width: 140,
      });

    let y = 100;

    if (meta) {
      doc.fontSize(9).fillColor("#666666");

      const infoItems = [
        ["Customer", order.customerName || order.customerEmail],
        ["Product", meta.productName],
        ["Country of Origin", meta.countryOfOrigin],
        ["Package", `${meta.packageTier.charAt(0).toUpperCase() + meta.packageTier.slice(1)} (${meta.packagePrice})`],
      ];

      for (const [label, value] of infoItems) {
        doc
          .fillColor("#888888")
          .text(`${label}:`, 60, y, { continued: true })
          .fillColor(BRAND_DARK)
          .text(`  ${value}`, { continued: false });
        y += 16;
      }

      y += 10;
      doc
        .moveTo(60, y)
        .lineTo(doc.page.width - 60, y)
        .strokeColor("#E0E0E0")
        .lineWidth(0.5)
        .stroke();
      y += 15;
    }

    const lines = draftReport.split("\n");

    for (const line of lines) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 60;
      }

      const trimmed = line.trim();

      if (trimmed.startsWith("## ")) {
        y += 8;
        doc
          .fontSize(13)
          .fillColor(BRAND_COLOR)
          .text(trimmed.replace(/^##\s*/, ""), 60, y, {
            width: doc.page.width - 120,
          });
        y += doc.heightOfString(trimmed.replace(/^##\s*/, ""), {
          width: doc.page.width - 120,
          fontSize: 13,
        });
        y += 4;

        doc
          .moveTo(60, y)
          .lineTo(doc.page.width - 60, y)
          .strokeColor("#E8E8E8")
          .lineWidth(0.3)
          .stroke();
        y += 8;
      } else if (trimmed.startsWith("# ")) {
        y += 6;
        doc
          .fontSize(16)
          .fillColor(BRAND_DARK)
          .text(trimmed.replace(/^#\s*/, ""), 60, y, {
            width: doc.page.width - 120,
          });
        y += doc.heightOfString(trimmed.replace(/^#\s*/, ""), {
          width: doc.page.width - 120,
          fontSize: 16,
        });
        y += 8;
      } else if (trimmed.startsWith("### ")) {
        y += 4;
        doc
          .fontSize(11)
          .fillColor(BRAND_DARK)
          .text(trimmed.replace(/^###\s*/, ""), 60, y, {
            width: doc.page.width - 120,
          });
        y += doc.heightOfString(trimmed.replace(/^###\s*/, ""), {
          width: doc.page.width - 120,
          fontSize: 11,
        });
        y += 4;
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const bulletText = trimmed.replace(/^[-*]\s*/, "");
        const cleanText = bulletText.replace(/\*\*/g, "");
        doc
          .fontSize(10)
          .fillColor("#333333")
          .text(`    \u2022  ${cleanText}`, 60, y, {
            width: doc.page.width - 120,
          });
        y += doc.heightOfString(`    \u2022  ${cleanText}`, {
          width: doc.page.width - 120,
          fontSize: 10,
        });
        y += 2;
      } else if (trimmed.match(/^\d+[\.\)]/)) {
        const cleanText = trimmed.replace(/\*\*/g, "");
        doc
          .fontSize(10)
          .fillColor("#333333")
          .text(`    ${cleanText}`, 60, y, {
            width: doc.page.width - 120,
          });
        y += doc.heightOfString(`    ${cleanText}`, {
          width: doc.page.width - 120,
          fontSize: 10,
        });
        y += 2;
      } else if (trimmed === "") {
        y += 6;
      } else {
        const cleanText = trimmed.replace(/\*\*/g, "");
        doc
          .fontSize(10)
          .fillColor("#333333")
          .text(cleanText, 60, y, {
            width: doc.page.width - 120,
          });
        y += doc.heightOfString(cleanText, {
          width: doc.page.width - 120,
          fontSize: 10,
        });
        y += 2;
      }
    }

    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor("#AAAAAA")
        .text(
          `AccessToNorth.com | Confidential | Page ${i + 1} of ${totalPages}`,
          60,
          doc.page.height - 40,
          { align: "center", width: doc.page.width - 120 }
        );
    }

    doc.end();
  });
}
