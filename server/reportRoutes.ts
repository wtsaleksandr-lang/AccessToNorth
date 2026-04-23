import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { adminAuthMiddleware } from "./adminAuth";
import { sendEmail, buildReportDeliveryEmail } from "./emailService";
import multer from "multer";
import crypto from "crypto";
import { readUploadBytes } from "./storage/uploadStorage";
import type { ClassificationOrderData } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted for reports"));
    }
  },
});

function generateReportToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function registerReportRoutes(app: Express): void {
  app.post(
    "/api/admin/orders/:orderId/send-report",
    adminAuthMiddleware,
    upload.single("report"),
    async (req: Request, res: Response) => {
      try {
        const orderId = req.params.orderId as string;
        const order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({ message: "PDF report file is required" });
        }

        const base64 = file.buffer.toString("base64");
        const reportUpload = await storage.createUpload({
          orderId,
          fileName: `Report_${orderId}.pdf`,
          fileData: base64,
          fileSize: file.size.toString(),
          mimeType: "application/pdf",
        });

        const token = generateReportToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await storage.updateOrderMetadata(orderId, {
          reportFileId: reportUpload.id,
          reportToken: token,
          reportTokenExpiresAt: expiresAt,
          deliveredAt: new Date(),
        });

        await storage.updateOrderStatus(orderId, "Delivered");

        const steps = order.steps.map((s) => ({ ...s, state: "done" as const }));
        await storage.updateOrderSteps(orderId, steps);

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const downloadUrl = `${baseUrl}/api/reports/${orderId}/download?token=${token}`;

        let emailSent = false;
        try {
          if (order.metadata) {
            const meta = order.metadata as ClassificationOrderData;
            const emailParams = buildReportDeliveryEmail(orderId, meta, downloadUrl);
            emailParams.to = order.customerEmail;
            emailSent = await sendEmail(emailParams);
          }
        } catch (emailErr) {
          console.error("Report email delivery failed:", emailErr);
        }

        res.json({
          success: true,
          emailSent,
          message: emailSent
            ? "Report sent to customer"
            : "Report saved and status updated, but email delivery failed. Customer can still download via their portal.",
        });
      } catch (err: any) {
        if (err.message?.includes("Only PDF")) {
          return res.status(400).json({ message: err.message });
        }
        console.error("Send report error:", err);
        res.status(500).json({ message: "Failed to send report" });
      }
    }
  );

  app.get("/api/reports/:orderId/download", async (req: Request, res: Response) => {
    try {
      const orderId = req.params.orderId as string;
      const token = req.query.token as string;

      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (!order.reportFileId || !order.reportToken) {
        return res.status(404).json({ message: "No report available for this order" });
      }

      if (order.reportToken !== token) {
        return res.status(403).json({ message: "Invalid download link" });
      }

      if (order.reportTokenExpiresAt && new Date() > new Date(order.reportTokenExpiresAt)) {
        return res.status(403).json({ message: "Download link has expired. Please contact support." });
      }

      const reportUpload = await storage.getUploadById(order.reportFileId);
      if (!reportUpload) {
        return res.status(404).json({ message: "Report file not found" });
      }

      const buffer = await readUploadBytes(reportUpload);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Report_${orderId}.pdf"`);
      // Token is in the query string — prevent it from leaking via Referer
      // to any resources the PDF viewer loads, and block intermediary caching.
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("Cache-Control", "private, no-store");
      res.send(buffer);
    } catch (err) {
      console.error("Report download error:", err);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  app.get(
    "/api/admin/orders/:orderId/report/download",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const orderId = req.params.orderId as string;
        const order = await storage.getOrderById(orderId);
        if (!order || !order.reportFileId) {
          return res.status(404).json({ message: "No report found" });
        }

        const reportUpload = await storage.getUploadById(order.reportFileId);
        if (!reportUpload) {
          return res.status(404).json({ message: "Report file not found" });
        }

        const buffer = await readUploadBytes(reportUpload);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Report_${orderId}.pdf"`);
        res.send(buffer);
      } catch (err) {
        console.error("Admin report download error:", err);
        res.status(500).json({ message: "Failed to download report" });
      }
    }
  );
}
