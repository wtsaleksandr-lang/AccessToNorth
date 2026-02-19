import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { adminAuthMiddleware } from "./adminAuth";
import {
  generateOrderSummary,
  generateClientUpdateDraft,
  generateMissingDocs,
  generateNextSteps,
  generateReadinessSnapshot,
  generateBrokerHandoffPack,
} from "./aiAssistService";
import { generateSnapshotPdf, generateBrokerPackPdf } from "./pdfGenerator";
import { sendEmail, buildSnapshotDeliveryEmail, buildBrokerPackDeliveryEmail } from "./emailService";

export function registerAiAssistRoutes(app: Express): void {
  app.post(
    "/api/admin/orders/:orderId/ai-summary",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const [uploads, messages] = await Promise.all([
          storage.getUploadsByOrderId(order.id),
          storage.getMessagesByOrderId(order.id),
        ]);

        const { text, model } = await generateOrderSummary(order, uploads, messages);

        await storage.updateOrderMetadata(order.id, {
          aiSummary: text,
          aiAssistGeneratedAt: new Date(),
        });

        res.json({ text, model, generatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.error("AI summary error:", err);
        res.status(500).json({ message: err.message || "Failed to generate summary" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/ai-client-update",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const [uploads, messages] = await Promise.all([
          storage.getUploadsByOrderId(order.id),
          storage.getMessagesByOrderId(order.id),
        ]);

        const { text, model } = await generateClientUpdateDraft(order, uploads, messages);

        await storage.updateOrderMetadata(order.id, {
          aiClientUpdateDraft: text,
          aiAssistGeneratedAt: new Date(),
        });

        res.json({ text, model, generatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.error("AI client update error:", err);
        res.status(500).json({ message: err.message || "Failed to generate client update" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/ai-missing-docs",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const [uploads, messages] = await Promise.all([
          storage.getUploadsByOrderId(order.id),
          storage.getMessagesByOrderId(order.id),
        ]);

        const { text, model } = await generateMissingDocs(order, uploads, messages);

        await storage.updateOrderMetadata(order.id, {
          aiMissingDocs: text,
          aiAssistGeneratedAt: new Date(),
        });

        res.json({ text, model, generatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.error("AI missing docs error:", err);
        res.status(500).json({ message: err.message || "Failed to identify missing docs" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/ai-next-steps",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const [uploads, messages] = await Promise.all([
          storage.getUploadsByOrderId(order.id),
          storage.getMessagesByOrderId(order.id),
        ]);

        const { text, model } = await generateNextSteps(order, uploads, messages);

        await storage.updateOrderMetadata(order.id, {
          aiNextSteps: text,
          aiAssistGeneratedAt: new Date(),
        });

        res.json({ text, model, generatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.error("AI next steps error:", err);
        res.status(500).json({ message: err.message || "Failed to generate next steps" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/readiness-snapshot",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const [uploads, messages] = await Promise.all([
          storage.getUploadsByOrderId(order.id),
          storage.getMessagesByOrderId(order.id),
        ]);

        const { text, model } = await generateReadinessSnapshot(order, uploads, messages);

        await storage.updateOrderMetadata(order.id, {
          aiReadinessSnapshotText: text,
        });

        res.json({ text, model, generatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.error("Readiness snapshot error:", err);
        res.status(500).json({ message: err.message || "Failed to generate snapshot" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/readiness-snapshot/export-pdf",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const reportText = req.body.text || order.aiReadinessSnapshotText;
        if (!reportText) return res.status(400).json({ message: "No snapshot text to export" });

        const pdfBuffer = await generateSnapshotPdf(order, reportText);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Readiness_Snapshot_${order.id}.pdf"`);
        res.send(pdfBuffer);
      } catch (err: any) {
        console.error("Snapshot PDF export error:", err);
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/readiness-snapshot/send",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.readinessSnapshotSentAt) {
          return res.status(400).json({ message: "Snapshot already sent to this customer" });
        }

        const reportText = req.body.text || order.aiReadinessSnapshotText;
        if (!reportText) return res.status(400).json({ message: "No snapshot text to send" });

        const pdfBuffer = await generateSnapshotPdf(order, reportText);
        const base64 = pdfBuffer.toString("base64");

        const upload = await storage.createUpload({
          orderId: order.id,
          fileName: `Readiness_Snapshot_${order.id}.pdf`,
          fileData: base64,
          fileSize: pdfBuffer.length.toString(),
          mimeType: "application/pdf",
        });

        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await storage.updateOrderMetadata(order.id, {
          readinessSnapshotPdfId: upload.id,
          readinessSnapshotSentAt: new Date(),
          reportToken: token,
          reportTokenExpiresAt: expiresAt,
        });

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const downloadUrl = `${baseUrl}/api/reports/${order.id}/download?token=${token}`;

        let emailSent = false;
        try {
          const emailParams = buildSnapshotDeliveryEmail(order.id, order.customerName || order.customerEmail, downloadUrl);
          emailParams.to = order.customerEmail;
          emailSent = await sendEmail(emailParams);
        } catch (emailErr) {
          console.error("Snapshot email failed:", emailErr);
        }

        res.json({ success: true, emailSent });
      } catch (err: any) {
        console.error("Send snapshot error:", err);
        res.status(500).json({ message: "Failed to send snapshot" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/broker-pack",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const [uploads, messages] = await Promise.all([
          storage.getUploadsByOrderId(order.id),
          storage.getMessagesByOrderId(order.id),
        ]);

        const { text, model } = await generateBrokerHandoffPack(order, uploads, messages);

        await storage.updateOrderMetadata(order.id, {
          aiBrokerPackText: text,
        });

        res.json({ text, model, generatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.error("Broker pack error:", err);
        res.status(500).json({ message: err.message || "Failed to generate broker pack" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/broker-pack/export-pdf",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const reportText = req.body.text || order.aiBrokerPackText;
        if (!reportText) return res.status(400).json({ message: "No broker pack text to export" });

        const pdfBuffer = await generateBrokerPackPdf(order, reportText);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Broker_Handoff_${order.id}.pdf"`);
        res.send(pdfBuffer);
      } catch (err: any) {
        console.error("Broker pack PDF export error:", err);
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    }
  );

  app.post(
    "/api/admin/orders/:orderId/broker-pack/send",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const order = await storage.getOrderById(req.params.orderId as string);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.brokerPackSentAt) {
          return res.status(400).json({ message: "Broker pack already sent to this customer" });
        }

        const reportText = req.body.text || order.aiBrokerPackText;
        if (!reportText) return res.status(400).json({ message: "No broker pack text to send" });

        const pdfBuffer = await generateBrokerPackPdf(order, reportText);
        const base64 = pdfBuffer.toString("base64");

        const upload = await storage.createUpload({
          orderId: order.id,
          fileName: `Broker_Handoff_${order.id}.pdf`,
          fileData: base64,
          fileSize: pdfBuffer.length.toString(),
          mimeType: "application/pdf",
        });

        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await storage.updateOrderMetadata(order.id, {
          brokerPackPdfId: upload.id,
          brokerPackSentAt: new Date(),
          reportToken: token,
          reportTokenExpiresAt: expiresAt,
        });

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const downloadUrl = `${baseUrl}/api/reports/${order.id}/download?token=${token}`;

        let emailSent = false;
        try {
          const emailParams = buildBrokerPackDeliveryEmail(order.id, order.customerName || order.customerEmail, downloadUrl);
          emailParams.to = order.customerEmail;
          emailSent = await sendEmail(emailParams);
        } catch (emailErr) {
          console.error("Broker pack email failed:", emailErr);
        }

        res.json({ success: true, emailSent });
      } catch (err: any) {
        console.error("Send broker pack error:", err);
        res.status(500).json({ message: "Failed to send broker pack" });
      }
    }
  );
}
