import type { Express, Request, Response } from "express";
import multer from "multer";
import { storage } from "./storage";
import { signPortalToken, setPortalCookie, portalAuthMiddleware, type PortalTokenPayload } from "./portalAuth";
import { loginRateLimiter } from "./middleware/rateLimit";
import { getUploadBackend, readUploadBytes } from "./storage/uploadStorage";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Please upload PDF, image, or Word documents."));
    }
  },
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  orderId: z.string().min(1, "Order ID is required"),
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export function registerPortalRoutes(app: Express): void {
  app.post("/api/portal/login", loginRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email, orderId } = loginSchema.parse(req.body);
      const order = await storage.getOrderByIdAndEmail(orderId, email.toLowerCase());

      if (!order) {
        return res.status(401).json({ message: "No order found with that ID and email combination." });
      }

      const token = signPortalToken({ orderId: order.id, email: order.customerEmail });
      setPortalCookie(res, token);

      res.json({ success: true, orderId: order.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Portal login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/portal/logout", (_req: Request, res: Response) => {
    res.clearCookie("portal_token", { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/portal/order/:orderId", portalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const portalUser = (req as any).portalUser as PortalTokenPayload;
      const { orderId } = req.params;

      if (portalUser.orderId !== orderId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const [orderUploads, orderMessages] = await Promise.all([
        storage.getUploadsByOrderId(orderId),
        storage.getMessagesByOrderId(orderId),
      ]);

      const uploadsWithoutData = orderUploads.map(({ fileData, ...rest }) => rest);

      res.json({
        order,
        uploads: uploadsWithoutData,
        messages: orderMessages,
      });
    } catch (err) {
      console.error("Portal get order error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/portal/order/:orderId/message", portalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const portalUser = (req as any).portalUser as PortalTokenPayload;
      const { orderId } = req.params;

      if (portalUser.orderId !== orderId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { message } = messageSchema.parse(req.body);

      const newMessage = await storage.createMessage({
        orderId,
        sender: "client",
        message,
      });

      console.log(`[Portal] New message from ${portalUser.email} on order ${orderId}: ${message.substring(0, 100)}`);

      // Non-blocking: alert ops so replies don't sit unseen until someone
      // happens to open the admin dashboard.
      (async () => {
        try {
          const order = await storage.getOrderById(orderId);
          if (!order) return;
          const { sendEmail, buildClientMessageNotificationEmail } = await import("./emailService");
          const notif = buildClientMessageNotificationEmail(
            orderId,
            order.customerEmail,
            order.customerName,
            message,
          );
          await sendEmail(notif);
        } catch (notifyErr) {
          console.error("Client-message notification failed (non-blocking):", notifyErr);
        }
      })();

      res.status(201).json(newMessage);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Portal message error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/portal/order/:orderId/upload",
    portalAuthMiddleware,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const portalUser = (req as any).portalUser as PortalTokenPayload;
        const { orderId } = req.params;

        if (portalUser.orderId !== orderId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Route through the storage abstraction. With UPLOAD_BACKEND=db
        // (default) this is identical to the legacy behavior: we write
        // base64 to fileData. With UPLOAD_BACKEND=local the bytes are
        // written to disk and only a small key lands in Postgres.
        const backend = getUploadBackend();
        const location = await backend.put({
          buffer: file.buffer,
          contentType: file.mimetype,
          fileNameHint: file.originalname,
        });

        const newUpload = await storage.createUpload({
          orderId,
          fileName: file.originalname,
          fileData: location.kind === "db-base64" ? location.fileData : "",
          storageKey: location.kind === "external" ? location.storageKey : null,
          fileSize: file.size.toString(),
          mimeType: file.mimetype,
        } as any);

        const { fileData, storageKey, ...uploadWithoutData } = newUpload as any;

        console.log(`[Portal] File uploaded by ${portalUser.email} on order ${orderId}: ${file.originalname}`);

        res.status(201).json(uploadWithoutData);
      } catch (err: any) {
        if (err.message?.includes("File type not allowed")) {
          return res.status(400).json({ message: err.message });
        }
        console.error("Portal upload error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get("/api/portal/order/:orderId/upload/:uploadId/download", portalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const portalUser = (req as any).portalUser as PortalTokenPayload;
      const { orderId, uploadId } = req.params;

      if (portalUser.orderId !== orderId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const orderUploads = await storage.getUploadsByOrderId(orderId);
      const targetUpload = orderUploads.find(u => u.id === uploadId);

      if (!targetUpload) {
        return res.status(404).json({ message: "File not found" });
      }

      const buffer = await readUploadBytes(targetUpload);
      res.setHeader("Content-Type", targetUpload.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${targetUpload.fileName}"`);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(buffer);
    } catch (err) {
      console.error("Portal download error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
