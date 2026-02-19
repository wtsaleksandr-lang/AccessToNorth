import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { verifyAdminPassword, signAdminToken, setAdminCookie, adminAuthMiddleware } from "./adminAuth";
import { z } from "zod";

const loginSchema = z.object({
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
  app.post("/api/admin/login", (req: Request, res: Response) => {
    try {
      const { password } = loginSchema.parse(req.body);

      if (!verifyAdminPassword(password)) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = signAdminToken();
      setAdminCookie(res, token);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
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

      await storage.updateOrderSteps(order.id, steps);
      if (status) {
        const previousStatus = order.status;
        await storage.updateOrderStatus(order.id, status);

        if (
          status === "In Progress" &&
          previousStatus !== "In Progress" &&
          order.metadata &&
          order.serviceType.includes("HS Classification")
        ) {
          try {
            const { sendEmail, buildStatusUpdateEmail } = await import("./emailService");
            const emailParams = buildStatusUpdateEmail(order.id, status, order.metadata as any);
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

      res.status(201).json(newMessage);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Admin message error:", err);
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
