import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertCarmLeadSchema } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

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

  app.get("/api/fx-rate", (_req, res) => {
    const rate = parseFloat(process.env.FX_CAD_TO_USD || "0.72");
    res.json({ rate, base: "CAD", target: "USD" });
  });

  return httpServer;
}
