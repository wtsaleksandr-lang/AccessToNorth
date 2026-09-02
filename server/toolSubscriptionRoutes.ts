import type { Express } from "express";
import { z } from "zod";
import { getUncachableStripeClient } from "./stripeClient";
import { pool } from "./db";
import { provisionApiKey, syncSubscription } from "./toolSubscriptionService";
import { formatCad, getToolPlan, TOOL_PLANS, TOOL_TRIAL_DAYS } from "../shared/toolPlans";

const checkoutSchema = z.object({
  planId: z.string(),
  email: z.string().trim().email(),
  promotionCode: z.string().trim().max(64).optional(),
});

async function findPrice(stripe: Awaited<ReturnType<typeof getUncachableStripeClient>>, planId: string) {
  const prices = await stripe.prices.list({ active: true, limit: 100, type: "recurring" });
  return prices.data.find((price) => price.metadata?.toolPlanId === planId);
}

export function registerToolSubscriptionRoutes(app: Express) {
  app.get("/api/tool-subscriptions/plans", (_req, res) => {
    res.json({
      currency: "CAD",
      trialDays: TOOL_TRIAL_DAYS,
      plans: TOOL_PLANS.map((plan) => ({ ...plan, displayPrice: formatCad(plan.amount) })),
    });
  });

  app.post("/api/tool-subscriptions/checkout", async (req, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid checkout details" });
    const plan = getToolPlan(parsed.data.planId);
    if (!plan) return res.status(400).json({ message: "Unknown subscription plan" });
    try {
      const stripe = await getUncachableStripeClient();
      const price = await findPrice(stripe, plan.id);
      if (!price) return res.status(503).json({ message: "This plan is being configured. Please try again shortly." });

      const customers = await stripe.customers.list({ email: parsed.data.email, limit: 1 });
      const customer = customers.data[0] || await stripe.customers.create({ email: parsed.data.email });
      const prior = await pool.query(`SELECT 1 FROM tool_subscriptions WHERE lower(email)=lower($1) LIMIT 1`, [parsed.data.email]);
      const stripeHistory = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 1 });
      const claimedTrial = Boolean(prior.rowCount || stripeHistory.data.length);
      let discounts: { promotion_code: string }[] | undefined;
      if (parsed.data.promotionCode) {
        const matches = await stripe.promotionCodes.list({ code: parsed.data.promotionCode, active: true, limit: 1 });
        if (!matches.data[0]) return res.status(400).json({ message: "That promotion code is invalid or expired." });
        discounts = [{ promotion_code: matches.data[0].id }];
      }
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.id,
        payment_method_types: ["card"],
        line_items: [{ price: price.id, quantity: 1 }],
        subscription_data: {
          ...(claimedTrial ? {} : { trial_period_days: TOOL_TRIAL_DAYS }),
          metadata: { purchaseType: "tool-subscription", toolPlanId: plan.id, toolTier: plan.tier },
        },
        metadata: { purchaseType: "tool-subscription", toolPlanId: plan.id, toolTier: plan.tier },
        allow_promotion_codes: discounts ? undefined : true,
        discounts,
        success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/developers/container-loading-api?checkout=cancelled`,
      });
      res.json({ url: session.url, trialApplied: !claimedTrial });
    } catch (error: any) {
      console.error("Subscription checkout failed:", error?.message || error);
      res.status(500).json({ message: "Could not start secure checkout. Please try again." });
    }
  });

  app.get("/api/tool-subscriptions/session/:sessionId", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, { expand: ["subscription", "customer"] });
      if (session.metadata?.purchaseType !== "tool-subscription") return res.status(404).json({ message: "Subscription not found" });
      const plan = getToolPlan(session.metadata.toolPlanId || "");
      const subscription = typeof session.subscription === "object" ? session.subscription : null;
      const expandedCustomer = session.customer && typeof session.customer === "object" ? session.customer : null;
      const expandedEmail = expandedCustomer && !expandedCustomer.deleted ? expandedCustomer.email : null;
      let apiKey: Awaited<ReturnType<typeof provisionApiKey>> | null = null;
      if (plan?.apiAccess && subscription && ["trialing", "active"].includes(subscription.status)) {
        await syncSubscription(stripe, subscription, session.customer_details?.email || undefined);
        apiKey = await provisionApiKey(subscription.id);
      }
      res.json({
        planName: plan?.name || "Container Loading",
        status: subscription?.status || "processing",
        trialEnd: subscription?.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        email: session.customer_details?.email || expandedEmail,
        apiKey,
      });
    } catch {
      res.status(404).json({ message: "Subscription not found" });
    }
  });

  app.post("/api/tool-subscriptions/portal", async (req, res) => {
    const parsed = z.object({ sessionId: z.string().min(10) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Checkout session is required" });
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);
      if (session.metadata?.purchaseType !== "tool-subscription" || !session.customer) return res.status(404).json({ message: "Subscription not found" });
      const portal = await stripe.billingPortal.sessions.create({
        customer: String(session.customer),
        return_url: `${req.protocol}://${req.get("host")}/developers/container-loading-api`,
      });
      res.json({ url: portal.url });
    } catch (error: any) {
      console.error("Billing portal failed:", error?.message || error);
      res.status(500).json({ message: "Could not open billing settings" });
    }
  });
}
