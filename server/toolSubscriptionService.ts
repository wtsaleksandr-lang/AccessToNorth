import type Stripe from "stripe";
import { pool } from "./db";
import { getUncachableStripeClient } from "./stripeClient";
import { buildToolSubscriptionEmail, sendEmail } from "./emailService";
import { getToolPlan, WINBACK_DELAY_DAYS } from "../shared/toolPlans";
import { createHash, randomBytes } from "node:crypto";

const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "https://www.accesstonorth.com";

export async function ensureToolSubscriptionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tool_subscriptions (
      stripe_subscription_id text PRIMARY KEY,
      stripe_customer_id text NOT NULL,
      email text NOT NULL,
      plan_id text NOT NULL,
      status text NOT NULL,
      trial_end timestamptz,
      cancel_at_period_end boolean NOT NULL DEFAULT false,
      welcome_sent_at timestamptz,
      reminder_7_sent_at timestamptz,
      reminder_3_sent_at timestamptz,
      reminder_1_sent_at timestamptz,
      converted_sent_at timestamptz,
      cancelled_sent_at timestamptz,
      payment_failed_sent_at timestamptz,
      winback_due_at timestamptz,
      winback_sent_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS tool_subscriptions_email_idx ON tool_subscriptions (lower(email));
    CREATE TABLE IF NOT EXISTS tool_api_keys (
      id bigserial PRIMARY KEY,
      stripe_subscription_id text NOT NULL REFERENCES tool_subscriptions(stripe_subscription_id) ON DELETE CASCADE,
      key_hash text UNIQUE NOT NULL,
      key_prefix text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      revoked_at timestamptz,
      UNIQUE (stripe_subscription_id)
    );
    CREATE TABLE IF NOT EXISTS tool_api_usage (
      stripe_subscription_id text NOT NULL REFERENCES tool_subscriptions(stripe_subscription_id) ON DELETE CASCADE,
      period_start date NOT NULL,
      request_count integer NOT NULL DEFAULT 0,
      PRIMARY KEY (stripe_subscription_id, period_start)
    );
  `);
}

function apiKeyHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function provisionApiKey(subscriptionId: string) {
  const existing = await pool.query(`SELECT key_prefix FROM tool_api_keys WHERE stripe_subscription_id=$1`, [subscriptionId]);
  if (existing.rowCount) return { key: null, prefix: existing.rows[0].key_prefix, alreadyProvisioned: true };
  const key = `atn_live_${randomBytes(24).toString("base64url")}`;
  const prefix = key.slice(0, 16);
  try {
    await pool.query(`INSERT INTO tool_api_keys (stripe_subscription_id,key_hash,key_prefix) VALUES ($1,$2,$3)`, [subscriptionId, apiKeyHash(key), prefix]);
    return { key, prefix, alreadyProvisioned: false };
  } catch (error: any) {
    if (error?.code === "23505") return { key: null, prefix, alreadyProvisioned: true };
    throw error;
  }
}

export async function validateSubscriptionApiKey(key: string) {
  if (!key.startsWith("atn_live_")) return null;
  const result = await pool.query(`
    SELECT s.stripe_subscription_id, s.plan_id, s.status FROM tool_api_keys k
    JOIN tool_subscriptions s ON s.stripe_subscription_id=k.stripe_subscription_id
    WHERE k.key_hash=$1 AND k.revoked_at IS NULL AND s.status IN ('trialing','active') LIMIT 1
  `, [apiKeyHash(key)]);
  return result.rows[0] || null;
}

export async function consumeApiAllowance(subscriptionId: string, allowance: number) {
  const result = await pool.query(`
    INSERT INTO tool_api_usage (stripe_subscription_id, period_start, request_count)
    VALUES ($1, date_trunc('month', now())::date, 1)
    ON CONFLICT (stripe_subscription_id, period_start)
    DO UPDATE SET request_count=tool_api_usage.request_count + 1
    WHERE tool_api_usage.request_count < $2
    RETURNING request_count
  `, [subscriptionId, allowance]);
  return result.rows[0]?.request_count as number | undefined;
}

function customerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
}

async function customerEmail(stripe: Stripe, subscription: Stripe.Subscription) {
  const customer = typeof subscription.customer === "string"
    ? await stripe.customers.retrieve(subscription.customer)
    : subscription.customer;
  return customer && !customer.deleted ? customer.email || "" : "";
}

export async function syncSubscription(stripe: Stripe, subscription: Stripe.Subscription, email?: string) {
  const planId = subscription.metadata?.toolPlanId || "";
  if (!getToolPlan(planId)) return null;
  const resolvedEmail = email || await customerEmail(stripe, subscription);
  if (!resolvedEmail) return null;
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  const ended = ["canceled", "unpaid", "incomplete_expired"].includes(subscription.status);
  const winbackDue = ended ? new Date(Date.now() + WINBACK_DELAY_DAYS * 86_400_000) : null;
  const result = await pool.query(`
    INSERT INTO tool_subscriptions
      (stripe_subscription_id, stripe_customer_id, email, plan_id, status, trial_end, cancel_at_period_end, winback_due_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      stripe_customer_id=EXCLUDED.stripe_customer_id, email=EXCLUDED.email, plan_id=EXCLUDED.plan_id,
      status=EXCLUDED.status, trial_end=EXCLUDED.trial_end,
      cancel_at_period_end=EXCLUDED.cancel_at_period_end,
      winback_due_at=COALESCE(tool_subscriptions.winback_due_at, EXCLUDED.winback_due_at), updated_at=now()
    RETURNING *
  `, [subscription.id, customerId(subscription), resolvedEmail, planId, subscription.status, trialEnd, subscription.cancel_at_period_end, winbackDue]);
  return result.rows[0];
}

async function sendOnce(row: any, column: string, kind: Parameters<typeof buildToolSubscriptionEmail>[0]["kind"], extra: Record<string, unknown> = {}) {
  const claimed = await pool.query(
    `UPDATE tool_subscriptions SET ${column}=now(), updated_at=now() WHERE stripe_subscription_id=$1 AND ${column} IS NULL RETURNING *`,
    [row.stripe_subscription_id],
  );
  if (!claimed.rowCount) return;
  const plan = getToolPlan(row.plan_id);
  const sent = await sendEmail(buildToolSubscriptionEmail({
    kind,
    email: row.email,
    planName: plan?.name || "Container Loading",
    trialEnd: row.trial_end ? new Date(row.trial_end) : null,
    manageUrl: process.env.STRIPE_CUSTOMER_PORTAL_URL || `${BASE_URL}/developers/container-loading-api`,
    ...extra,
  } as any));
  if (!sent) await pool.query(`UPDATE tool_subscriptions SET ${column}=NULL WHERE stripe_subscription_id=$1`, [row.stripe_subscription_id]);
}

export async function handleToolSubscriptionEvent(event: Stripe.Event) {
  const stripe = await getUncachableStripeClient();
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.purchaseType !== "tool-subscription" || !session.subscription) return;
    const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
    const row = await syncSubscription(stripe, subscription, session.customer_details?.email || session.customer_email || undefined);
    if (row) await sendOnce(row, "welcome_sent_at", "welcome");
    return;
  }
  if (!event.type.startsWith("customer.subscription.") && !event.type.startsWith("invoice.")) return;

  let subscription: Stripe.Subscription | null = null;
  if (event.type.startsWith("customer.subscription.")) subscription = event.data.object as Stripe.Subscription;
  else {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;
    if (subscriptionId) subscription = await stripe.subscriptions.retrieve(subscriptionId);
  }
  if (!subscription || !getToolPlan(subscription.metadata?.toolPlanId || "")) return;
  const row = await syncSubscription(stripe, subscription);
  if (!row) return;
  if (event.type === "customer.subscription.trial_will_end") await sendOnce(row, "reminder_3_sent_at", "reminder", { daysRemaining: 3 });
  if (event.type === "customer.subscription.deleted") await sendOnce(row, "cancelled_sent_at", "cancelled");
  if (event.type === "invoice.payment_failed") await sendOnce(row, "payment_failed_sent_at", "payment-failed");
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    if (subscription.status === "active" && invoice.amount_paid > 0) {
      await sendOnce(row, "converted_sent_at", "converted");
      await pool.query(`UPDATE tool_subscriptions SET payment_failed_sent_at=NULL WHERE stripe_subscription_id=$1`, [row.stripe_subscription_id]);
    }
  }
}

async function createWinbackCode(stripe: Stripe, customerId: string) {
  const coupons = await stripe.coupons.list({ limit: 100 });
  const coupon = coupons.data.find((item) => item.metadata?.campaign === "tool-trial-winback-2026");
  if (!coupon) throw new Error("Win-back coupon is not configured");
  const promotion = await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    customer: customerId,
    max_redemptions: 1,
    expires_at: Math.floor(Date.now() / 1000) + 14 * 86_400,
    metadata: { campaign: "tool-trial-winback-2026" },
  });
  return promotion.code;
}

export async function runToolSubscriptionLifecycle() {
  const stripe = await getUncachableStripeClient();
  const trials = await pool.query(`SELECT * FROM tool_subscriptions WHERE status='trialing' AND trial_end IS NOT NULL`);
  const now = Date.now();
  for (const row of trials.rows) {
    const days = Math.ceil((new Date(row.trial_end).getTime() - now) / 86_400_000);
    if (days <= 7 && days > 3) await sendOnce(row, "reminder_7_sent_at", "reminder", { daysRemaining: 7 });
    if (days <= 1 && days >= 0) await sendOnce(row, "reminder_1_sent_at", "reminder", { daysRemaining: 1 });
  }
  const due = await pool.query(`SELECT * FROM tool_subscriptions WHERE winback_due_at <= now() AND winback_sent_at IS NULL AND status IN ('canceled','unpaid','incomplete_expired') LIMIT 50`);
  for (const row of due.rows) {
    const active = await pool.query(`SELECT 1 FROM tool_subscriptions WHERE lower(email)=lower($1) AND status IN ('trialing','active') LIMIT 1`, [row.email]);
    if (active.rowCount) {
      await pool.query(`UPDATE tool_subscriptions SET winback_sent_at=now() WHERE stripe_subscription_id=$1`, [row.stripe_subscription_id]);
      continue;
    }
    const code = await createWinbackCode(stripe, row.stripe_customer_id);
    const monthlyPlanId = String(row.plan_id).replace(/-annual$/, "-monthly");
    await sendOnce(row, "winback_sent_at", "winback", {
      promotionCode: code,
      manageUrl: `${BASE_URL}/developers/container-loading-api?plan=${encodeURIComponent(monthlyPlanId)}&promo=${encodeURIComponent(code)}`,
    });
  }
}

export function startToolSubscriptionLifecycleJobs() {
  const run = () => runToolSubscriptionLifecycle().catch((error) => console.error("[subscriptions] lifecycle job failed:", error));
  setTimeout(run, 30_000);
  setInterval(run, 6 * 60 * 60 * 1000).unref();
}
