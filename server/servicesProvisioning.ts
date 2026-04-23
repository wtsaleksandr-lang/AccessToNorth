/**
 * Post-checkout provisioning cascade. Runs once per paid order:
 *
 *   1. find-or-create a `clients` row keyed by email
 *   2. for each order item → create a `client_services` row
 *   3. copy `service_task_templates` for that service_key into `fulfillment_tasks`
 *   4. create an `onboarding_submissions` row with a 60-day access token
 *   5. stamp activity log entries with actor_type=system
 *   6. fire a per-service onboarding email to the client
 *
 * Idempotent: if the order already has client_services, re-running is a no-op.
 */
import crypto from "crypto";
import type { Order, OrderItem } from "@shared/schema";
import * as crm from "./crmStorage";
import { storage } from "./storage";
import { sendEmail, buildOnboardingRequestEmail } from "./emailService";

const BASE_URL =
  process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "https://www.accesstonorth.com";

const ONBOARDING_TOKEN_TTL_DAYS = 60;

export interface ProvisionResult {
  clientId: string;
  servicesCreated: number;
  tasksCreated: number;
  onboardingsCreated: number;
  skipped: boolean;
}

export async function provisionServicesForOrder(orderId: string): Promise<ProvisionResult> {
  const order = await storage.getOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Idempotency: if any client_services already exist for this order, skip.
  const existing = await crm.listClientServicesForOrder(orderId);
  if (existing.length > 0) {
    return {
      clientId: existing[0].clientId,
      servicesCreated: 0,
      tasksCreated: 0,
      onboardingsCreated: 0,
      skipped: true,
    };
  }

  const items = await storage.getOrderItemsByOrderId(orderId);
  if (items.length === 0) {
    // Single-package (legacy /api/checkout) flow — no order_items rows.
    // Treat the whole order as one service.
    return provisionSinglePackageOrder(order);
  }

  const client = await crm.findOrCreateClient({
    email: order.customerEmail,
    name: order.customerName,
  });

  let tasksCreated = 0;
  let onboardingsCreated = 0;

  for (const item of items) {
    // Skip addons — they're line-items, not services.
    if (isAddon(item)) continue;

    const svc = await crm.createClientService({
      clientId: client.id,
      orderId: order.id,
      orderItemId: item.id,
      serviceKey: item.serviceKey,
      serviceName: item.serviceName,
      status: "onboarding",
      tier: item.tier ?? null,
      priceCAD: item.priceCAD ?? null,
      config: null,
    });

    const copiedTasks = await crm.copyTemplatesToTasks(svc.id, item.serviceKey);
    tasksCreated += copiedTasks.length;

    const onboarding = await crm.createOnboardingSubmission({
      clientServiceId: svc.id,
      accessToken: generateOnboardingToken(),
      tokenExpiresAt: tokenExpiryDate(),
      status: "not_sent",
      responses: null,
      aiExtracted: null,
    });
    onboardingsCreated += 1;

    await crm.logActivity({
      clientId: client.id,
      clientServiceId: svc.id,
      actorType: "system",
      action: "service.provisioned",
      message: `Provisioned ${svc.serviceName} from order ${order.id}`,
      metadata: { tasksCreated: copiedTasks.length, orderItemId: item.id },
    });

    // Fire onboarding email (non-blocking relative to the main cascade).
    await sendOnboardingEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      serviceName: svc.serviceName,
      onboardingToken: onboarding.accessToken,
    });
    await crm.markOnboardingStatus(onboarding.id, "sent", { sentAt: new Date() });
  }

  return {
    clientId: client.id,
    servicesCreated: items.length,
    tasksCreated,
    onboardingsCreated,
    skipped: false,
  };
}

async function provisionSinglePackageOrder(order: Order): Promise<ProvisionResult> {
  const client = await crm.findOrCreateClient({
    email: order.customerEmail,
    name: order.customerName,
  });

  // Derive service_key from order.serviceType label (best-effort).
  const serviceKey = inferServiceKeyFromServiceType(order.serviceType);
  const svc = await crm.createClientService({
    clientId: client.id,
    orderId: order.id,
    orderItemId: null,
    serviceKey,
    serviceName: order.serviceType,
    status: "onboarding",
    tier: null,
    priceCAD: null,
    config: null,
  });

  const copiedTasks = await crm.copyTemplatesToTasks(svc.id, serviceKey);

  const onboarding = await crm.createOnboardingSubmission({
    clientServiceId: svc.id,
    accessToken: generateOnboardingToken(),
    tokenExpiresAt: tokenExpiryDate(),
    status: "not_sent",
    responses: null,
    aiExtracted: null,
  });

  await crm.logActivity({
    clientId: client.id,
    clientServiceId: svc.id,
    actorType: "system",
    action: "service.provisioned",
    message: `Provisioned ${svc.serviceName} from single-package order ${order.id}`,
    metadata: { tasksCreated: copiedTasks.length },
  });

  await sendOnboardingEmail({
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    serviceName: svc.serviceName,
    onboardingToken: onboarding.accessToken,
  });
  await crm.markOnboardingStatus(onboarding.id, "sent", { sentAt: new Date() });

  return {
    clientId: client.id,
    servicesCreated: 1,
    tasksCreated: copiedTasks.length,
    onboardingsCreated: 1,
    skipped: false,
  };
}

function isAddon(item: OrderItem): boolean {
  // Keeping this simple — our addon SKUs (hs1, hs_extra, cfia, etc.) aren't
  // services with templates. If no template exists, copyTemplatesToTasks
  // returns an empty array and the service still provisions as a record —
  // this guard just avoids creating empty onboarding forms.
  const addonKeys = new Set([
    "hs1",
    "hs_extra",
    "import_permit",
    "cfia",
    "b2_correction",
    "after_hours",
    "importer_account",
    "cbsa_id",
  ]);
  return addonKeys.has(item.serviceKey);
}

function inferServiceKeyFromServiceType(serviceType: string): string {
  const lower = serviceType.toLowerCase();
  if (lower.includes("business number")) return "bn";
  if (lower.includes("gst")) return "gst_hst";
  if (lower.includes("non-resident")) return "non_resident_tax";
  if (lower.includes("carm")) return "carm_portal";
  if (lower.includes("rpp") || lower.includes("bond")) return "rpp_bond";
  if (lower.includes("b13") || lower.includes("export")) return "b13_export";
  if (lower.includes("starter")) return "bundle_business_starter";
  if (lower.includes("importer launch") || lower.includes("complete importer")) {
    return "bundle_complete_importer";
  }
  if (lower.includes("low-value")) return "clearance-lvs";
  if (lower.includes("clearance")) return "clearance-commercial";
  return serviceType;
}

function generateOnboardingToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function tokenExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + ONBOARDING_TOKEN_TTL_DAYS);
  return d;
}

async function sendOnboardingEmail(input: {
  customerEmail: string;
  customerName: string | null;
  serviceName: string;
  onboardingToken: string;
}): Promise<void> {
  try {
    const onboardingUrl = `${BASE_URL}/onboarding/${input.onboardingToken}`;
    const email = buildOnboardingRequestEmail(
      input.customerName,
      input.serviceName,
      onboardingUrl,
    );
    email.to = input.customerEmail;
    await sendEmail(email);
  } catch (err) {
    console.error("[provisioning] onboarding email failed (non-fatal):", err);
  }
}
