import crypto from "crypto";
import { storage } from "./storage";
import { lookupCartPrice } from "./pricing/catalog";
import {
  sendEmail,
  buildCartOrderConfirmationEmail,
  buildCartInternalAlertEmail,
} from "./emailService";
import type { OrderStep } from "@shared/schema";

export interface CartSessionLike {
  id: string;
  customer_email?: string | null;
  amount_total?: number | null;
  metadata?: Record<string, string | undefined> | null;
}

interface ResolvedCartItem {
  id: string;
  serviceKey: string;
  tier: string | null;
  category: string;
  quantity: number;
  name: string;
  price: number;
}

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ATN-${code}`;
}

const serviceLabels: Record<string, string> = {
  "business-number": "Business Number Registration",
  "gst-hst": "GST/HST Registration",
  "non-resident": "Non-Resident Tax Registration",
  "carm": "CARM Portal Registration",
  "complete-bundle": "Complete Importer Bundle",
};

function getDefaultSteps(serviceType: string): OrderStep[] {
  const base: OrderStep[] = [
    { label: "Payment Received", state: "done" },
    { label: "Documents Under Review", state: "working" },
  ];

  switch (serviceType) {
    case "business-number":
      return [
        ...base,
        { label: "CRA Business Number Application", state: "upcoming" },
        { label: "BN Issued & Delivered", state: "upcoming" },
      ];
    case "gst-hst":
      return [
        ...base,
        { label: "Business Number Setup", state: "upcoming" },
        { label: "GST/HST Registration Filed", state: "upcoming" },
        { label: "Registration Complete", state: "upcoming" },
      ];
    case "non-resident":
      return [
        ...base,
        { label: "Non-Resident BN Application", state: "upcoming" },
        { label: "Simplified Regime Registration", state: "upcoming" },
        { label: "Registration Complete", state: "upcoming" },
      ];
    case "carm":
      return [
        ...base,
        { label: "Business Number Setup", state: "upcoming" },
        { label: "Import Account Registration", state: "upcoming" },
        { label: "CARM Portal Onboarding", state: "upcoming" },
        { label: "Complete", state: "upcoming" },
      ];
    case "complete-bundle":
      return [
        ...base,
        { label: "Business Number Setup", state: "upcoming" },
        { label: "GST/HST Registration", state: "upcoming" },
        { label: "Import/Export Account", state: "upcoming" },
        { label: "CARM Portal Registration", state: "upcoming" },
        { label: "All Registrations Complete", state: "upcoming" },
      ];
    default:
      return [
        ...base,
        { label: "Processing", state: "upcoming" },
        { label: "Complete", state: "upcoming" },
      ];
  }
}

export async function createOrderFromCheckout(
  customerEmail: string,
  customerName: string | null,
  serviceType: string,
  stripeSessionId: string
): Promise<string> {
  const existing = await storage.getOrderByStripeSessionId(stripeSessionId);
  if (existing) {
    console.log(`[Order] Order ${existing.id} already exists for session ${stripeSessionId}, skipping`);
    return existing.id;
  }

  let orderId = generateOrderId();

  let attempts = 0;
  while (attempts < 5) {
    const existing = await storage.getOrderById(orderId);
    if (!existing) break;
    orderId = generateOrderId();
    attempts++;
  }

  const steps = getDefaultSteps(serviceType);

  await storage.createOrder({
    id: orderId,
    customerEmail: customerEmail.toLowerCase(),
    customerName: customerName || null,
    serviceType: serviceLabels[serviceType] || serviceType,
    status: "In Progress",
    steps,
    stripeSessionId,
  });

  console.log(`[Order] Created order ${orderId} for ${customerEmail} (${serviceType})`);

  // CRM provisioning: client + client_services + fulfillment_tasks + onboarding + emails.
  // Non-fatal: if this fails the order is still recorded and admin can provision manually.
  try {
    const { provisionServicesForOrder } = await import("./servicesProvisioning");
    const result = await provisionServicesForOrder(orderId);
    if (!result.skipped) {
      console.log(
        `[Order] Provisioned ${result.servicesCreated} services + ${result.tasksCreated} tasks for order ${orderId}`,
      );
    }
  } catch (provErr: any) {
    console.error(`[Order] Provisioning failed for ${orderId} (non-fatal):`, provErr?.message);
  }

  return orderId;
}

/**
 * Create a cart-style order from a completed Stripe Checkout session.
 * Idempotent — returns the existing order id if one already exists for this session.
 * Resolves every line item from the server-side pricing catalog (never trusts
 * session metadata prices). Sends confirmation + internal alert emails on the
 * first successful creation.
 */
export async function createCartOrderFromSession(
  session: CartSessionLike,
  baseUrl: string,
): Promise<{ orderId: string; token: string | null; items: any[]; created: boolean }> {
  const stripeSessionId = session.id;
  const existing = await storage.getOrderByStripeSessionId(stripeSessionId);
  if (existing) {
    const items = await storage.getOrderItemsByOrderId(existing.id);
    return { orderId: existing.id, token: existing.secureToken ?? null, items, created: false };
  }

  const customerEmail = session.customer_email || "";
  const customerName = session.metadata?.customerName || "";

  const rawCartItems = JSON.parse(session.metadata?.cartItems || "[]") as Array<{
    id: string;
    serviceKey: string;
    tier?: string | null;
    category: string;
    quantity: number;
  }>;

  if (rawCartItems.length === 0) {
    throw new Error(`No cartItems metadata on session ${stripeSessionId}`);
  }

  const cartItems: ResolvedCartItem[] = rawCartItems.map((item) => {
    const entry = lookupCartPrice(item.serviceKey, item.category);
    if (!entry) {
      throw new Error(`Unknown service key in session metadata: ${item.serviceKey}`);
    }
    return {
      id: item.id,
      serviceKey: item.serviceKey,
      tier: item.tier ?? null,
      category: item.category,
      quantity: item.quantity,
      name: entry.name,
      price: entry.priceCAD,
    };
  });

  const orderId = `ATN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const secureToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 90);

  const serviceNames = cartItems.map((i) => i.name).join(", ");

  const order = await storage.createOrder({
    id: orderId,
    customerEmail,
    customerName,
    serviceType: serviceNames,
    status: "Pending Details",
    steps: [
      { label: "Payment received", state: "done" },
      { label: "Complete service details", state: "working" },
      { label: "Under review", state: "upcoming" },
      { label: "Completed", state: "upcoming" },
    ],
    stripeSessionId,
    secureToken,
    secureTokenExpiresAt: tokenExpiry,
  });

  const orderItemsCreated = [];
  for (const item of cartItems) {
    const orderItem = await storage.createOrderItem({
      orderId: order.id,
      serviceKey: item.serviceKey,
      serviceName: item.name,
      tier: item.tier,
      priceCAD: item.price,
      quantity: item.quantity,
      status: "Pending Details",
    });
    orderItemsCreated.push(orderItem);
  }

  const completeUrl = `${baseUrl}/complete-order?token=${secureToken}`;

  try {
    const confirmEmail = buildCartOrderConfirmationEmail(orderId, customerName, cartItems, completeUrl, customerEmail);
    confirmEmail.to = customerEmail;
    await sendEmail(confirmEmail);

    const alertEmail = buildCartInternalAlertEmail(
      orderId,
      customerEmail,
      customerName,
      cartItems,
      session.amount_total || 0,
    );
    await sendEmail(alertEmail);

    await storage.updateOrderMetadata(orderId, {
      confirmationEmailSentAt: new Date(),
      internalEmailSentAt: new Date(),
    });
  } catch (emailErr) {
    console.error("[Order] Cart order email dispatch failed:", emailErr);
  }

  // CRM provisioning: client + client_services + fulfillment_tasks + onboarding + emails.
  try {
    const { provisionServicesForOrder } = await import("./servicesProvisioning");
    const result = await provisionServicesForOrder(order.id);
    if (!result.skipped) {
      console.log(
        `[Order] Provisioned ${result.servicesCreated} services + ${result.tasksCreated} tasks for cart order ${order.id}`,
      );
    }
  } catch (provErr: any) {
    console.error(`[Order] Cart provisioning failed for ${order.id} (non-fatal):`, provErr?.message);
  }

  return { orderId: order.id, token: secureToken, items: orderItemsCreated, created: true };
}
