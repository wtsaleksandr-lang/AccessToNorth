import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { registerPortalRoutes } from "./portalRoutes";
import { registerAdminRoutes } from "./adminRoutes";
import { registerCustomsRoutes } from "./customsRoutes";
import { registerClassificationRoutes } from "./classificationRoutes";
import { registerReportRoutes } from "./reportRoutes";
import { registerAiReportRoutes } from "./aiReportRoutes";
import { registerAiAssistRoutes } from "./aiAssistRoutes";
import { registerCargoExtractRoutes } from "./cargoExtractRoutes";
import { registerOnboardingRoutes } from "./onboardingRoutes";
import { registerAdminCrmRoutes } from "./adminCrmRoutes";
import { registerChatRoutes } from "./chatRoutes";
import { registerVapiRoutes } from "./vapiRoutes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { seedProducts } from './seedProducts';
import { seedTaskTemplates } from './seedTaskTemplates';
import { securityHeaders } from './middleware/securityHeaders';

import { pool } from './db';

const app = express();
const httpServer = createServer(app);

async function ensureTrigramIndexes() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hs_description_trgm
      ON hs_codes USING gin (description gin_trgm_ops)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hs_description_full_trgm
      ON hs_codes USING gin (description_full gin_trgm_ops)
    `);
  } catch (err: any) {
    console.error('Warning: Could not create trigram indexes:', err.message);
  } finally {
    client.release();
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    log('Initializing Stripe schema...', 'stripe');
    await runMigrations({ databaseUrl } as any);
    log('Stripe schema ready', 'stripe');

    const stripeSync = await getStripeSync();

    log('Setting up managed webhook...', 'stripe');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const result = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`
    );
    log(`Webhook configured: ${result?.webhook?.url || 'ready'}`, 'stripe');

    log('Seeding Stripe products...', 'stripe');
    await seedProducts();

    log('Seeding service-delivery task templates...', 'crm');
    try {
      await seedTaskTemplates();
    } catch (seedErr: any) {
      // Non-fatal; service catalog lives in DB, so if the tables haven't
      // been migrated yet the app can still boot and the admin can run
      // `npm run db:push` before relying on the CRM flow.
      console.error('[seed] task template seed failed (non-fatal):', seedErr?.message);
    }

    log('Syncing Stripe data...', 'stripe');
    stripeSync.syncBackfill()
      .then(() => log('Stripe data synced', 'stripe'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }

}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer.');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      try {
        const { getUncachableStripeClient } = await import('./stripeClient');
        const stripe = await getUncachableStripeClient();
        const event = JSON.parse(req.body.toString());

        // Idempotency note:
        //  - hs-classification: guarded by `order.status === 'Awaiting Payment'`
        //  - generic packageType:  guarded inside createOrderFromCheckout
        //    (check-then-insert on stripeSessionId)
        //  - cart flow: created via /api/cart-checkout/complete, guarded by
        //    getOrderByStripeSessionId before insert
        // Any new webhook branch MUST keep this invariant.
        if (event.type === 'checkout.session.expired') {
          // Payment abandoned or session timed out — send a gentle nudge.
          const session = event.data.object;
          const customerEmail =
            session.customer_email || session.customer_details?.email;
          const customerName = session.customer_details?.name || null;
          if (customerEmail) {
            try {
              const { sendEmail, buildPaymentFailedEmail } = await import('./emailService');
              const notif = buildPaymentFailedEmail(customerName, session.id);
              notif.to = customerEmail;
              await sendEmail(notif);
              log(`Payment-failed email sent to ${customerEmail} for session ${session.id}`, 'stripe');
            } catch (failErr: any) {
              console.error(
                `Payment-failed email dispatch failed for ${session.id}:`,
                failErr.message,
              );
            }
          }
        } else if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const customerEmail = session.customer_email || session.customer_details?.email;
          const packageType = session.metadata?.packageType;
          const customerName = session.metadata?.customerName || session.customer_details?.name || null;
          const orderType = session.metadata?.orderType;
          const existingOrderId = session.metadata?.orderId;

          if (orderType === 'hs-classification' && existingOrderId) {
            const { storage } = await import('./storage');
            const order = await storage.getOrderById(existingOrderId);
            if (order && order.status === 'Awaiting Payment') {
              await storage.updateOrderStatus(existingOrderId, 'Pending Review');
              log(`Classification order ${existingOrderId} payment confirmed, status updated to Pending Review`, 'stripe');

              try {
                const { sendEmail, buildCustomerConfirmationEmail, buildInternalOrderAlertEmail } = await import('./emailService');
                const meta = order.metadata as any;

                if (meta && !order.confirmationEmailSentAt) {
                  const confirmEmail = buildCustomerConfirmationEmail(existingOrderId, meta);
                  confirmEmail.to = order.customerEmail;
                  const confirmSent = await sendEmail(confirmEmail);
                  if (confirmSent) {
                    await storage.updateOrderMetadata(existingOrderId, { confirmationEmailSentAt: new Date() });
                  }
                }

                if (meta && !order.internalEmailSentAt) {
                  const uploads = await storage.getUploadsByOrderId(existingOrderId);
                  const alertEmail = buildInternalOrderAlertEmail(existingOrderId, order.customerEmail, meta, uploads.length);
                  const alertSent = await sendEmail(alertEmail);
                  if (alertSent) {
                    await storage.updateOrderMetadata(existingOrderId, { internalEmailSentAt: new Date() });
                  }
                }

                log(`Classification order ${existingOrderId} emails dispatched`, 'stripe');
              } catch (emailErr) {
                log(`Email dispatch failed for order ${existingOrderId}: ${emailErr}`, 'stripe');
              }
            }
          } else if (session.metadata?.cartItems) {
            // Cart checkout — the user may close the tab before /payment-success
            // triggers /api/cart-checkout/complete, so this webhook is the
            // safety net that guarantees a DB record exists for every paid session.
            // Idempotent via getOrderByStripeSessionId inside the helper.
            const { createCartOrderFromSession } = await import('./orderService');
            const baseUrl = process.env.REPLIT_DEV_DOMAIN
              ? `https://${process.env.REPLIT_DEV_DOMAIN}`
              : 'https://www.accesstonorth.com';
            try {
              const { orderId, created } = await createCartOrderFromSession(session, baseUrl);
              if (created) {
                log(`Cart order ${orderId} created from webhook for ${customerEmail}`, 'stripe');
              }
            } catch (cartErr: any) {
              console.error(`Webhook cart-order creation failed for session ${session.id}:`, cartErr.message);
            }
          } else if (customerEmail && packageType) {
            const { createOrderFromCheckout } = await import('./orderService');
            const orderId = await createOrderFromCheckout(
              customerEmail,
              customerName,
              packageType,
              session.id
            );
            log(`Order ${orderId} created from Stripe checkout for ${customerEmail}`, 'stripe');

            // Send customer confirmation + internal alert for single-package
            // checkouts. Previously these emails were only sent for HS-classification
            // and cart flows — legacy /api/checkout buyers got silence.
            try {
              const { storage } = await import('./storage');
              const order = await storage.getOrderById(orderId);
              if (order && !order.confirmationEmailSentAt) {
                const { sendEmail, buildCartOrderConfirmationEmail, buildCartInternalAlertEmail } = await import('./emailService');
                const singleItem = [{
                  id: packageType,
                  serviceKey: packageType,
                  tier: null,
                  name: order.serviceType,
                  price: (session.amount_total ?? 0) / 100,
                  quantity: 1,
                }];
                const baseUrl = process.env.REPLIT_DEV_DOMAIN
                  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
                  : 'https://www.accesstonorth.com';
                const portalUrl = `${baseUrl}/portal`;

                const confirmEmail = buildCartOrderConfirmationEmail(orderId, customerName || '', singleItem, portalUrl, order.customerEmail);
                confirmEmail.to = order.customerEmail;
                await sendEmail(confirmEmail);

                const alertEmail = buildCartInternalAlertEmail(
                  orderId,
                  order.customerEmail,
                  customerName || '',
                  singleItem,
                  session.amount_total || 0,
                );
                await sendEmail(alertEmail);

                await storage.updateOrderMetadata(orderId, {
                  confirmationEmailSentAt: new Date(),
                  internalEmailSentAt: new Date(),
                });
                log(`Single-package order ${orderId} confirmation emails sent`, 'stripe');
              }
            } catch (emailErr: any) {
              console.error(`Single-package email dispatch failed for ${orderId}:`, emailErr.message);
            }
          }
        }
      } catch (orderError: any) {
        console.error('Error creating order from webhook:', orderError.message);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(securityHeaders);

// Redact known PII/secret fields from any JSON body before logging.
// Still logs shape + size so operators can debug — just not the values.
const REDACT_KEYS = new Set([
  "password", "token", "secureToken", "secure_token", "authorization",
  "email", "customerEmail", "customer_email", "phone", "customerName", "customer_name",
  "fileData", "file_data", "stripeSessionId", "stripe_session_id",
  "apiKey", "api_key", "sessionId", "session_id",
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value == null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.has(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string" && value.length > 200) {
    return `${value.slice(0, 200)}…[+${value.length - 200} chars]`;
  }
  return value;
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && res.statusCode >= 400) {
        // Only log response bodies for error responses (for debugging);
        // successful responses can contain PII and aren't useful in logs.
        const redacted = JSON.stringify(redact(capturedJsonResponse));
        const truncated = redacted.length > 500 ? `${redacted.slice(0, 500)}…` : redacted;
        logLine += ` :: ${truncated}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    await initStripe();
  } catch (err: any) {
    console.warn('Stripe initialization skipped (integration not connected):', err.message);
  }
  await ensureTrigramIndexes();
  registerPortalRoutes(app);
  registerAdminRoutes(app);
  registerCustomsRoutes(app);
  registerClassificationRoutes(app);
  registerReportRoutes(app);
  registerAiReportRoutes(app);
  registerAiAssistRoutes(app);
  registerCargoExtractRoutes(app);
  registerOnboardingRoutes(app);
  registerAdminCrmRoutes(app);
  registerChatRoutes(app);
  registerVapiRoutes(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
