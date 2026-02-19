import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { getUncachableStripeClient } from "./stripeClient";
import multer from "multer";
import type { OrderStep, ClassificationOrderData } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, and PNG files are accepted"));
    }
  },
});

const TIER_CONFIG: Record<string, { stripeKey: string; price: string; hsCount: number; delivery: string; label: string }> = {
  basic: { stripeKey: "hs-classification-basic", price: "$29", hsCount: 1, delivery: "1 business day", label: "Basic" },
  business: { stripeKey: "hs-classification-business", price: "$99", hsCount: 10, delivery: "1 business day", label: "Business" },
  pro: { stripeKey: "hs-classification-pro", price: "$249", hsCount: 50, delivery: "48 business hours", label: "Pro" },
};

const classificationOrderSchema = z.object({
  packageTier: z.enum(["basic", "business", "pro"]),
  productName: z.string().min(1, "Product name is required"),
  productDescription: z.string().min(1, "Product description is required"),
  countryOfOrigin: z.string().min(1, "Country of origin is required"),
  industryCategory: z.string().optional().default(""),
  additionalNotes: z.string().optional().default(""),
  email: z.string().email("Valid email is required"),
  companyName: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HSC-${code}`;
}

function getClassificationSteps(): OrderStep[] {
  return [
    { label: "Order Received", state: "done" },
    { label: "Pending Review", state: "working" },
    { label: "Classification In Progress", state: "upcoming" },
    { label: "Report Delivered", state: "upcoming" },
  ];
}

export function registerClassificationRoutes(app: Express): void {
  app.post(
    "/api/classification-orders",
    upload.array("documents", 10),
    async (req: Request, res: Response) => {
      try {
        const parsed = classificationOrderSchema.parse(req.body);
        const tierConfig = TIER_CONFIG[parsed.packageTier];
        if (!tierConfig) {
          return res.status(400).json({ message: "Invalid package tier" });
        }

        let orderId = generateOrderId();
        let attempts = 0;
        while (attempts < 5) {
          const existing = await storage.getOrderById(orderId);
          if (!existing) break;
          orderId = generateOrderId();
          attempts++;
        }

        const orderData: ClassificationOrderData = {
          productName: parsed.productName,
          productDescription: parsed.productDescription,
          countryOfOrigin: parsed.countryOfOrigin,
          industryCategory: parsed.industryCategory || "",
          hsCodesRequested: tierConfig.hsCount,
          additionalNotes: parsed.additionalNotes || "",
          companyName: parsed.companyName || "",
          phone: parsed.phone || "",
          packageTier: parsed.packageTier,
          packagePrice: tierConfig.price,
          deliveryTime: tierConfig.delivery,
        };

        await storage.createOrder({
          id: orderId,
          customerEmail: parsed.email.toLowerCase(),
          customerName: parsed.companyName || null,
          serviceType: `HS Classification — ${tierConfig.label}`,
          status: "Awaiting Payment",
          steps: getClassificationSteps(),
          stripeSessionId: null,
          metadata: orderData,
        });

        const files = req.files as Express.Multer.File[] | undefined;
        if (files && files.length > 0) {
          for (const file of files) {
            const base64 = file.buffer.toString("base64");
            await storage.createUpload({
              orderId,
              fileName: file.originalname,
              fileData: base64,
              fileSize: file.size.toString(),
              mimeType: file.mimetype,
            });
          }
        }

        const stripe = await getUncachableStripeClient();

        const products = await stripe.products.list({ active: true, limit: 100 });
        const matchingProduct = products.data.find(
          (p) => p.metadata?.packageType === tierConfig.stripeKey
        );
        if (!matchingProduct) {
          return res.status(400).json({ message: "Payment product not configured. Please contact support." });
        }

        const prices = await stripe.prices.list({ product: matchingProduct.id, active: true, limit: 10 });
        const price = prices.data[0];
        if (!price) {
          return res.status(400).json({ message: "Payment price not found. Please contact support." });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{ price: price.id, quantity: 1 }],
          customer_email: parsed.email.toLowerCase(),
          metadata: {
            orderId,
            packageType: tierConfig.stripeKey,
            orderType: "hs-classification",
          },
          success_url: `${baseUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
          cancel_url: `${baseUrl}/order/hs-classification?package=${parsed.packageTier}&cancelled=true`,
        });

        await storage.updateOrderStripeSession(orderId, session.id);

        res.json({ url: session.url, orderId });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({
            message: err.errors[0].message,
            field: err.errors[0].path.join("."),
          });
        }
        if (err.message?.includes("Only PDF")) {
          return res.status(400).json({ message: err.message });
        }
        console.error("Classification order error:", err);
        res.status(500).json({ message: "Failed to create order. Please try again." });
      }
    }
  );

  app.get("/api/classification-orders/:orderId", async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrderById(req.params.orderId as string);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderUploads = await storage.getUploadsByOrderId(order.id);
      const uploadsInfo = orderUploads.map(({ fileData, ...rest }) => rest);

      res.json({
        id: order.id,
        status: order.status,
        serviceType: order.serviceType,
        metadata: order.metadata,
        uploadCount: uploadsInfo.length,
        createdAt: order.createdAt,
      });
    } catch (err) {
      console.error("Get classification order error:", err);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
}
