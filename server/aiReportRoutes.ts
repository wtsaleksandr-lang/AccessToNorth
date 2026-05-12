import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { adminAuthMiddleware, type AdminTokenPayload } from "./adminAuth";
import { generateDraftReport, extractMissingInfoQuestions } from "./aiDraftService";
import { generateReportPdf } from "./pdfGenerator";
import { sendEmail, buildRequestInfoEmail } from "./emailService";
import { recordAuditEvent } from "./lib/audit";
import type { ClassificationOrderData } from "@shared/schema";

export function registerAiReportRoutes(app: Express): void {
  app.post(
    "/api/admin/orders/:orderId/generate-draft",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const orderId = req.params.orderId as string;
        const order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        if (!order.metadata) {
          return res.status(400).json({ message: "Order has no classification metadata" });
        }

        const uploads = await storage.getUploadsByOrderId(orderId);

        const { draft, model } = await generateDraftReport(order, uploads);

        await storage.updateOrderMetadata(orderId, {
          aiDraftReport: draft,
          aiGeneratedAt: new Date(),
          aiModelUsed: model,
        });
        await recordAuditEvent({
          orderId,
          actor: (req as any).adminUser as AdminTokenPayload | undefined,
          action: "ai_draft_generated",
          field: "aiDraftReport",
          newVal: { model },
        });

        res.json({
          draft,
          model,
          generatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error("AI draft generation error:", err);
        res.status(500).json({
          message: err.message || "Failed to generate draft report",
        });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/save-draft",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const orderId = req.params.orderId as string;
        const { draft } = req.body;

        if (!draft || typeof draft !== "string") {
          return res.status(400).json({ message: "Draft text is required" });
        }

        const order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        const previousDraft = order.aiDraftReport;
        await storage.updateOrderMetadata(orderId, {
          aiDraftReport: draft,
        });
        if (previousDraft !== draft) {
          await recordAuditEvent({
            orderId,
            actor: (req as any).adminUser as AdminTokenPayload | undefined,
            action: "ai_draft_saved",
            field: "aiDraftReport",
            oldVal: previousDraft ? `${previousDraft.slice(0, 200)}…` : null,
            newVal: `${draft.slice(0, 200)}${draft.length > 200 ? "…" : ""}`,
          });
        }

        res.json({ success: true });
      } catch (err: any) {
        console.error("Save draft error:", err);
        res.status(500).json({ message: "Failed to save draft" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/export-pdf",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const orderId = req.params.orderId as string;
        const { draft } = req.body;

        const order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        const reportText = draft || order.aiDraftReport;
        if (!reportText) {
          return res.status(400).json({ message: "No draft report to export" });
        }

        const pdfBuffer = await generateReportPdf(order, reportText);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="Report_${orderId}.pdf"`
        );
        res.send(pdfBuffer);
      } catch (err: any) {
        console.error("PDF export error:", err);
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/send-pdf-report",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const orderId = req.params.orderId as string;
        const { draft } = req.body;

        const order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        const reportText = draft || order.aiDraftReport;
        if (!reportText) {
          return res.status(400).json({ message: "No draft report to send" });
        }

        const pdfBuffer = await generateReportPdf(order, reportText);

        const base64 = pdfBuffer.toString("base64");
        const reportUpload = await storage.createUpload({
          orderId,
          fileName: `Report_${orderId}.pdf`,
          fileData: base64,
          fileSize: pdfBuffer.length.toString(),
          mimeType: "application/pdf",
        });

        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await storage.updateOrderMetadata(orderId, {
          reportFileId: reportUpload.id,
          reportToken: token,
          reportTokenExpiresAt: expiresAt,
          deliveredAt: new Date(),
        });

        const previousStatus = order.status;
        await storage.updateOrderStatus(orderId, "Delivered");

        const previousSteps = order.steps;
        const steps = order.steps.map((s) => ({ ...s, state: "done" as const }));
        await storage.updateOrderSteps(orderId, steps);

        const actor = (req as any).adminUser as AdminTokenPayload | undefined;
        await recordAuditEvent({
          orderId,
          actor,
          action: "report_sent",
          field: "reportFileId",
          newVal: { customerEmail: order.customerEmail, uploadId: reportUpload.id },
        });
        if (previousStatus !== "Delivered") {
          await recordAuditEvent({
            orderId,
            actor,
            action: "status_change",
            field: "status",
            oldVal: previousStatus,
            newVal: "Delivered",
          });
        }
        await recordAuditEvent({
          orderId,
          actor,
          action: "step_update",
          field: "steps",
          oldVal: previousSteps,
          newVal: steps,
        });

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const downloadUrl = `${baseUrl}/api/reports/${orderId}/download?token=${token}`;

        let emailSent = false;
        try {
          if (order.metadata) {
            const meta = order.metadata as ClassificationOrderData;
            const { buildReportDeliveryEmail } = await import("./emailService");
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
            ? "Report generated, sent to customer, and order marked as Delivered"
            : "Report saved and status updated, but email delivery failed.",
        });
      } catch (err: any) {
        console.error("Send PDF report error:", err);
        res.status(500).json({ message: "Failed to send report" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/request-info",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const orderId = req.params.orderId as string;
        const { draft, customQuestions } = req.body;

        const order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        const meta = order.metadata as ClassificationOrderData | null;
        if (!meta) {
          return res.status(400).json({ message: "Order has no classification metadata" });
        }

        let questions: string[] = [];
        if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
          questions = customQuestions;
        } else if (draft) {
          questions = extractMissingInfoQuestions(draft);
        } else if (order.aiDraftReport) {
          questions = extractMissingInfoQuestions(order.aiDraftReport);
        }

        if (questions.length === 0) {
          return res.status(400).json({
            message: "No questions found in Section 5 of the draft. Please provide custom questions.",
          });
        }

        const emailParams = buildRequestInfoEmail(orderId, meta, questions);
        emailParams.to = order.customerEmail;
        const emailSent = await sendEmail(emailParams);

        const requestInfoMessage = `Requested additional information:\n${questions.map((q) => `- ${q}`).join("\n")}`;
        await storage.createMessage({
          orderId,
          sender: "admin",
          message: requestInfoMessage,
        });

        const previousStatus = order.status;
        await storage.updateOrderStatus(orderId, "On Hold");

        const actor = (req as any).adminUser as AdminTokenPayload | undefined;
        await recordAuditEvent({
          orderId,
          actor,
          action: "info_requested",
          field: "messages",
          newVal: { questions, customerEmail: order.customerEmail },
        });
        if (previousStatus !== "On Hold") {
          await recordAuditEvent({
            orderId,
            actor,
            action: "status_change",
            field: "status",
            oldVal: previousStatus,
            newVal: "On Hold",
          });
        }

        res.json({
          success: true,
          emailSent,
          questionsCount: questions.length,
          questions,
        });
      } catch (err: any) {
        console.error("Request info error:", err);
        res.status(500).json({ message: "Failed to request information" });
      }
    }
  );
}
