import { storage } from "./storage";
import type { OrderStep } from "@shared/schema";

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

  return orderId;
}
