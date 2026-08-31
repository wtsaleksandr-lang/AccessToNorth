import type { Express } from "express";
import type { Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertCarmLeadSchema } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sendEmail, buildCartOrderConfirmationEmail, buildCartInternalAlertEmail, buildReminderEmail, buildOnHoldEmail } from "./emailService";
import { lookupCartPrice } from "./pricing/catalog";
import { createCartOrderFromSession } from "./orderService";

const FRONTEND_TO_STRIPE_KEY: Record<string, string> = {
  bn: "business-number",
  gst_hst: "gst-hst",
  bundle_business_starter: "business-starter",
  non_resident_tax: "non-resident",
  carm_portal: "carm",
  rpp_bond: "rpp-bond",
  b13_export: "b13-export",
  hs_classification: "hs-classification",
  bundle_complete_importer: "complete-bundle",
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/maps/browser-config", (_req, res) => {
    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ apiKey });
  });
  
  app.post(api.registrations.create.path, async (req, res) => {
    try {
      const input = api.registrations.create.input.parse(req.body);
      const registration = await storage.createRegistration(input);
      res.status(201).json(registration);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.registrations.getStatus.path, async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const results = await storage.getRegistrationsByEmail(email);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.contact.submit.path, async (req, res) => {
    try {
      const input = api.contact.submit.input.parse(req.body);
      await storage.createContact(input);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get('/api/stripe/publishable-key', async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (err) {
      console.error('Error fetching publishable key:', err);
      res.status(500).json({ message: "Failed to load payment configuration" });
    }
  });

  app.get('/api/products', async (_req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ active: true, limit: 100 });
      const prices = await stripe.prices.list({ active: true, limit: 100 });

      const priceMap = new Map<string, any>();
      for (const price of prices.data) {
        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        if (!priceMap.has(productId) || price.created > priceMap.get(productId).created) {
          priceMap.set(productId, price);
        }
      }

      const result = products.data
        .filter((p) => p.metadata?.packageType)
        .map((product) => {
          const price = priceMap.get(product.id);
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            packageType: product.metadata.packageType,
            features: product.metadata.features?.split(',') || [],
            priceId: price?.id,
            amount: price?.unit_amount || 0,
            currency: price?.currency || 'usd',
          };
        })
        .sort((a, b) => a.amount - b.amount);

      res.json(result);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ message: "Failed to load products" });
    }
  });

  app.post('/api/checkout', async (req, res) => {
    try {
      const { packageType, registrationId, customerEmail, customerName } = req.body;

      if (!packageType) {
        return res.status(400).json({ message: "Package type is required" });
      }

      const stripePackageType = FRONTEND_TO_STRIPE_KEY[packageType] || packageType;

      if (registrationId) {
        const registrations = await storage.getRegistrationsByEmail(customerEmail);
        const match = registrations.find(r => r.id === registrationId && (r.packageType === packageType || r.packageType === stripePackageType));
        if (!match) {
          return res.status(400).json({ message: "Invalid registration" });
        }
      }

      const stripe = await getUncachableStripeClient();

      const products = await stripe.products.list({ active: true, limit: 100 });
      const matchingProduct = products.data.find(p => p.metadata?.packageType === stripePackageType);
      if (!matchingProduct) {
        return res.status(400).json({ message: "Invalid package type" });
      }

      const prices = await stripe.prices.list({ product: matchingProduct.id, active: true, limit: 10 });
      const price = prices.data[0];
      if (!price) {
        return res.status(400).json({ message: "No price found for this package" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        customer_email: customerEmail || undefined,
        metadata: {
          packageType: matchingProduct.metadata.packageType,
          registrationId: registrationId?.toString() || '',
          customerName: customerName || '',
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment-cancel`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  const carmLeadRateLimit = new Map<string, number[]>();
  
  app.post('/api/leads/carm-security', async (req, res) => {
    try {
      const ip = req.ip || 'unknown';
      const now = Date.now();
      const windowMs = 60_000;
      const maxRequests = 5;
      const timestamps = carmLeadRateLimit.get(ip)?.filter(t => now - t < windowMs) || [];
      if (timestamps.length >= maxRequests) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
      }
      timestamps.push(now);
      carmLeadRateLimit.set(ip, timestamps);

      const carmLeadInputSchema = insertCarmLeadSchema.extend({
        email: z.string().email("Valid email is required"),
        companyName: z.string().min(1, "Company name is required"),
        importValueRange: z.enum(["< $10k", "$10k–$50k", "$50k–$250k", "$250k+"]),
      });

      const input = carmLeadInputSchema.parse({
        ...req.body,
        phone: req.body.phone || null,
        highestMonthlyPayable: req.body.highestMonthlyPayable || null,
        bondEstimate: req.body.bondEstimate || null,
        cashEstimate: req.body.cashEstimate || null,
        applyMinimum: req.body.applyMinimum ?? null,
        frequency: req.body.frequency || null,
        isNonResident: req.body.isNonResident ?? null,
        priority: (!req.body.currentlyImporting || req.body.importValueRange === "< $10k") ? "low" : "normal",
        source: "carm-security-calculator",
      });
      
      const lead = await storage.createCarmLead(input);

      res.status(201).json({ success: true, id: lead.id, priority: lead.priority });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      } else {
        console.error('Error creating CARM lead:', err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get('/api/checkout/session/:sessionId', async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      res.json({
        status: session.payment_status,
        packageType: session.metadata?.packageType,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
    } catch (err) {
      console.error('Error fetching session:', err);
      res.status(500).json({ message: "Failed to fetch session details" });
    }
  });

  // DB-only lookup: returns the order created by the webhook for this
  // Stripe session. Used by /payment-success as a fallback when the primary
  // cart-checkout/complete flow is not applicable (single-package buyers).
  app.get('/api/orders/by-session/:sessionId', async (req, res) => {
    try {
      const order = await storage.getOrderByStripeSessionId(req.params.sessionId);
      if (!order) {
        return res.status(404).json({ message: "Order not yet created — try again in a few seconds." });
      }
      res.json({
        orderId: order.id,
        serviceType: order.serviceType,
        status: order.status,
        customerEmail: order.customerEmail,
      });
    } catch (err) {
      console.error('Error fetching order by session:', err);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/fx-rate", (_req, res) => {
    const rate = parseFloat(process.env.FX_CAD_TO_USD || "0.72");
    res.json({ rate, base: "CAD", target: "USD" });
  });

  const cartCheckoutSchema = z.object({
    customerEmail: z.string().email("Valid email is required"),
    customerName: z.string().min(1, "Name is required"),
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().positive(),
      serviceKey: z.string(),
      tier: z.string().optional(),
      category: z.string(),
      quantity: z.number().int().positive(),
    })).min(1, "Cart cannot be empty"),
  });

  app.post('/api/cart-checkout', async (req, res) => {
    try {
      const input = cartCheckoutSchema.parse(req.body);

      // Resolve every price from the server-side catalog. Never trust
      // the client-supplied `price`. Reject the whole request if any
      // serviceKey is unknown.
      const resolved = input.items.map(item => {
        const entry = lookupCartPrice(item.serviceKey, item.category);
        if (!entry) {
          throw new Error(`Unknown service key: ${item.serviceKey}`);
        }
        return {
          id: item.id,
          name: entry.name,
          priceCAD: entry.priceCAD,
          serviceKey: item.serviceKey,
          tier: item.tier,
          category: item.category,
          quantity: item.quantity,
        };
      });

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const lineItems = resolved.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.name,
            metadata: { serviceKey: item.serviceKey, tier: item.tier || '' },
          },
          unit_amount: item.priceCAD * 100,
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        customer_email: input.customerEmail,
        metadata: {
          customerName: input.customerName,
          // Persist only identifiers; prices are re-resolved server-side on completion.
          cartItems: JSON.stringify(resolved.map(i => ({
            id: i.id,
            serviceKey: i.serviceKey,
            tier: i.tier,
            category: i.category,
            quantity: i.quantity,
          }))),
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout?cancelled=true`,
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err?.message?.startsWith("Unknown service key")) {
        return res.status(400).json({ message: err.message });
      }
      console.error('Error creating cart checkout session:', err);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post('/api/cart-checkout/complete', async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://www.accesstonorth.com";

      const { orderId, token, items } = await createCartOrderFromSession(session as any, baseUrl);
      res.json({ orderId, token, items });
    } catch (err: any) {
      if (err?.message?.startsWith("Unknown service key") || err?.message?.startsWith("No cartItems")) {
        return res.status(400).json({ message: err.message });
      }
      console.error('Error completing cart checkout:', err);
      res.status(500).json({ message: "Failed to process order" });
    }
  });

  app.get('/api/orders/by-token/:token', async (req, res) => {
    try {
      const order = await storage.getOrderBySecureToken(req.params.token);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.secureTokenExpiresAt && new Date() > new Date(order.secureTokenExpiresAt)) {
        return res.status(410).json({ message: "This link has expired" });
      }
      const items = await storage.getOrderItemsByOrderId(order.id);
      res.json({
        id: order.id,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        status: order.status,
        items,
        createdAt: order.createdAt,
      });
    } catch (err) {
      console.error('Error fetching order by token:', err);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch('/api/order-items/:id/intake', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }

      const item = await storage.getOrderItemById(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const { token, intakeData } = req.body;
      if (!token || !intakeData) {
        return res.status(400).json({ message: "Token and intake data are required" });
      }

      const order = await storage.getOrderBySecureToken(token);
      if (!order || order.id !== item.orderId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.updateOrderItemIntake(itemId, intakeData);

      const allItems = await storage.getOrderItemsByOrderId(order.id);
      const allComplete = allItems.every(i => i.status !== "Pending Details");
      if (allComplete) {
        await storage.updateOrderStatus(order.id, "Pending Review");
        await storage.updateOrderSteps(order.id, [
          { label: "Payment received", state: "done" },
          { label: "Details submitted", state: "done" },
          { label: "Under review", state: "working" },
          { label: "Completed", state: "upcoming" },
        ]);
      }

      res.json({ success: true, item: await storage.getOrderItemById(itemId) });
    } catch (err) {
      console.error('Error submitting intake:', err);
      res.status(500).json({ message: "Failed to submit details" });
    }
  });

  startReminderJob();

  return httpServer;
}

function startReminderJob() {
  const INTERVAL = 60 * 60 * 1000;

  async function checkReminders() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const pendingItems = await storage.getPendingDetailsItems(oneDayAgo);

      for (const item of pendingItems) {
        const created = new Date(item.createdAt!);
        const baseUrl = process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "https://www.accesstonorth.com";
        const completeUrl = `${baseUrl}/complete-order?token=${item.order.secureToken}`;

        if (created <= sevenDaysAgo && !item.onHoldAt) {
          await storage.updateOrderItemReminder(item.id, 'onHoldAt');
          await storage.updateOrderItemStatus(item.id, 'On Hold');
          const email = buildOnHoldEmail(item.order.id, item.order.customerName || '', item.serviceName);
          await sendEmail(email);
          console.log(`[reminder] Order ${item.order.id} item "${item.serviceName}" marked On Hold`);
        } else if (created <= threeDaysAgo && !item.reminder2SentAt && !item.onHoldAt) {
          await storage.updateOrderItemReminder(item.id, 'reminder2SentAt');
          const email = buildReminderEmail(item.order.id, item.order.customerName || '', item.order.customerEmail, item.serviceName, completeUrl, 2);
          email.to = item.order.customerEmail;
          await sendEmail(email);
          console.log(`[reminder] Sent 2nd reminder for order ${item.order.id} item "${item.serviceName}"`);
        } else if (created <= oneDayAgo && !item.reminder1SentAt && !item.reminder2SentAt && !item.onHoldAt) {
          await storage.updateOrderItemReminder(item.id, 'reminder1SentAt');
          const email = buildReminderEmail(item.order.id, item.order.customerName || '', item.order.customerEmail, item.serviceName, completeUrl, 1);
          email.to = item.order.customerEmail;
          await sendEmail(email);
          console.log(`[reminder] Sent 1st reminder for order ${item.order.id} item "${item.serviceName}"`);
        }
      }
    } catch (err) {
      console.error('[reminder] Error checking reminders:', err);
    }
  }

  setTimeout(() => {
    checkReminders();
    setInterval(checkReminders, INTERVAL);
  }, 30000);
}
