import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import {
  verifyAdminCredentials,
  signAdminToken,
  setAdminCookie,
  adminAuthMiddleware,
  type AdminTokenPayload,
} from "./adminAuth";
import { loginRateLimiter } from "./middleware/rateLimit";
import { recordAuditEvent, listAuditEventsForOrder } from "./lib/audit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(1, "Password is required"),
});

const updateStepsSchema = z.object({
  steps: z.array(z.object({
    label: z.string(),
    state: z.enum(["done", "working", "upcoming"]),
  })),
  status: z.string().optional(),
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export function registerAdminRoutes(app: Express): void {
  app.post("/api/admin/login", loginRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const result = await verifyAdminCredentials(email, password);
      if (!result) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = signAdminToken(result);
      setAdminCookie(res, token);
      res.json({ success: true, email: result.email ?? null });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Admin login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/logout", (_req: Request, res: Response) => {
    res.clearCookie("admin_token", { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/admin/check", adminAuthMiddleware, (_req: Request, res: Response) => {
    res.json({ authenticated: true });
  });

  app.get("/api/admin/orders", adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const allOrders = await storage.getAllOrders();
      const ordersWithCounts = await Promise.all(
        allOrders.map(async (order) => {
          const msgs = await storage.getMessagesByOrderId(order.id);
          const ups = await storage.getUploadsByOrderId(order.id);
          return {
            ...order,
            messageCount: msgs.length,
            uploadCount: ups.length,
            latestMessage: msgs.length > 0 ? msgs[0] : null,
          };
        })
      );
      res.json(ordersWithCounts);
    } catch (err) {
      console.error("Admin get orders error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/orders/:orderId", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const orderId = req.params.orderId as string;
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const [orderUploads, orderMessages] = await Promise.all([
        storage.getUploadsByOrderId(order.id),
        storage.getMessagesByOrderId(order.id),
      ]);

      const uploadsWithoutData = orderUploads.map(({ fileData, ...rest }) => rest);

      res.json({ order, uploads: uploadsWithoutData, messages: orderMessages });
    } catch (err) {
      console.error("Admin get order error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/orders/:orderId", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { steps, status } = updateStepsSchema.parse(req.body);
      const orderId = req.params.orderId as string;
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const actor = (req as any).adminUser as AdminTokenPayload | undefined;

      const previousSteps = order.steps;
      await storage.updateOrderSteps(order.id, steps);
      if (JSON.stringify(previousSteps) !== JSON.stringify(steps)) {
        await recordAuditEvent({
          orderId: order.id,
          actor,
          action: "step_update",
          field: "steps",
          oldVal: previousSteps,
          newVal: steps,
        });
      }

      if (status) {
        const previousStatus = order.status;
        await storage.updateOrderStatus(order.id, status);

        if (status !== previousStatus) {
          await recordAuditEvent({
            orderId: order.id,
            actor,
            action: "status_change",
            field: "status",
            oldVal: previousStatus,
            newVal: status,
          });

          try {
            const { sendEmail, buildStatusUpdateEmail, buildGenericStatusUpdateEmail } = await import("./emailService");
            const useHsTemplate =
              status === "In Progress" &&
              order.metadata &&
              order.serviceType.includes("HS Classification");

            const emailParams = useHsTemplate
              ? buildStatusUpdateEmail(order.id, status, order.metadata as any)
              : buildGenericStatusUpdateEmail(order.id, order.serviceType, status, order.customerName);

            emailParams.to = order.customerEmail;
            await sendEmail(emailParams);
          } catch (emailErr) {
            console.error("Status email failed (non-blocking):", emailErr);
          }
        }
      }

      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Admin update order error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/orders/:orderId/message", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { message } = messageSchema.parse(req.body);
      const order = await storage.getOrderById(req.params.orderId as string);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const newMessage = await storage.createMessage({
        orderId: order.id,
        sender: "admin",
        message,
      });

      await recordAuditEvent({
        orderId: order.id,
        actor: (req as any).adminUser as AdminTokenPayload | undefined,
        action: "message_added",
        field: "messages",
        oldVal: null,
        newVal: message,
      });

      // Non-blocking: notify the customer that an admin replied.
      (async () => {
        try {
          const { sendEmail, buildAdminMessageNotificationEmail } = await import("./emailService");
          const notif = buildAdminMessageNotificationEmail(order.id, order.customerName, message);
          notif.to = order.customerEmail;
          await sendEmail(notif);
        } catch (notifyErr) {
          console.error("Admin-message notification failed (non-blocking):", notifyErr);
        }
      })();

      res.status(201).json(newMessage);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Admin message error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/orders/:orderId/audit", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const orderId = req.params.orderId as string;
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const limitParam = parseInt(String(req.query.limit ?? "50"), 10);
      const limit = Number.isFinite(limitParam) ? limitParam : 50;
      const events = await listAuditEventsForOrder(order.id, limit);
      res.json({ events });
    } catch (err) {
      console.error("Admin audit fetch error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/uploads/:uploadId/download", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const upload = await storage.getUploadById(req.params.uploadId as string);
      if (!upload) {
        return res.status(404).json({ message: "File not found" });
      }

      const buffer = Buffer.from(upload.fileData, "base64");
      res.setHeader("Content-Type", upload.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${upload.fileName}"`);
      res.send(buffer);
    } catch (err) {
      console.error("Admin download error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
