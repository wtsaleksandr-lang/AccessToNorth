/**
 * Storage layer for the service-delivery layer (clients, client_services,
 * fulfillment_tasks, onboarding_submissions, activity log).
 *
 * Kept separate from server/storage.ts to avoid growing that 400-line file;
 * both layers share the same Drizzle `db` client.
 */
import { and, asc, desc, eq, ne, inArray, or } from "drizzle-orm";
import { db } from "./db";
import {
  clients,
  clientServices,
  fulfillmentTasks,
  serviceTaskTemplates,
  onboardingSubmissions,
  adminActivityLog,
  type Client,
  type InsertClient,
  type ClientService,
  type InsertClientService,
  type FulfillmentTask,
  type InsertFulfillmentTask,
  type ServiceTaskTemplate,
  type OnboardingSubmission,
  type InsertOnboardingSubmission,
  type AdminActivityLogEntry,
  type InsertAdminActivityLogEntry,
} from "@shared/schema";

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function findOrCreateClient(input: {
  email: string;
  name?: string | null;
  companyName?: string | null;
  phone?: string | null;
  country?: string | null;
}): Promise<Client> {
  const email = input.email.trim().toLowerCase();
  const existing = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
  if (existing.length > 0) {
    // Backfill name/company/phone only if we don't have them yet.
    const current = existing[0];
    const patch: Partial<InsertClient> = {};
    if (!current.name && input.name) patch.name = input.name;
    if (!current.companyName && input.companyName) patch.companyName = input.companyName;
    if (!current.phone && input.phone) patch.phone = input.phone;
    if (!current.country && input.country) patch.country = input.country;
    if (Object.keys(patch).length) {
      const [updated] = await db
        .update(clients)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(clients.id, current.id))
        .returning();
      return updated;
    }
    return current;
  }

  const [created] = await db
    .insert(clients)
    .values({
      email,
      name: input.name ?? null,
      companyName: input.companyName ?? null,
      phone: input.phone ?? null,
      country: input.country ?? null,
      status: "onboarding",
    })
    .returning();
  return created;
}

export async function getClientById(id: string): Promise<Client | undefined> {
  const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return row;
}

export async function getClientByEmail(email: string): Promise<Client | undefined> {
  const [row] = await db
    .select()
    .from(clients)
    .where(eq(clients.email, email.trim().toLowerCase()))
    .limit(1);
  return row;
}

export async function listClients(): Promise<Client[]> {
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function updateClientStatus(id: string, status: string): Promise<void> {
  await db
    .update(clients)
    .set({ status, updatedAt: new Date() })
    .where(eq(clients.id, id));
}

// ---------------------------------------------------------------------------
// Client services
// ---------------------------------------------------------------------------

export async function createClientService(input: InsertClientService): Promise<ClientService> {
  const [created] = await db.insert(clientServices).values(input).returning();
  return created;
}

export async function getClientServiceById(id: string): Promise<ClientService | undefined> {
  const [row] = await db.select().from(clientServices).where(eq(clientServices.id, id)).limit(1);
  return row;
}

export async function listClientServicesForClient(clientId: string): Promise<ClientService[]> {
  return db
    .select()
    .from(clientServices)
    .where(eq(clientServices.clientId, clientId))
    .orderBy(desc(clientServices.createdAt));
}

export async function listClientServicesForOrder(orderId: string): Promise<ClientService[]> {
  return db
    .select()
    .from(clientServices)
    .where(eq(clientServices.orderId, orderId))
    .orderBy(asc(clientServices.createdAt));
}

export async function listAllClientServices(filter?: {
  status?: string;
  serviceKey?: string;
}): Promise<ClientService[]> {
  const conditions = [];
  if (filter?.status) conditions.push(eq(clientServices.status, filter.status));
  if (filter?.serviceKey) conditions.push(eq(clientServices.serviceKey, filter.serviceKey));
  if (conditions.length === 0) {
    return db.select().from(clientServices).orderBy(desc(clientServices.createdAt));
  }
  return db
    .select()
    .from(clientServices)
    .where(and(...conditions))
    .orderBy(desc(clientServices.createdAt));
}

export async function updateClientServiceStatus(
  id: string,
  status: string,
  extras: Partial<Pick<ClientService, "startedAt" | "completedAt" | "welcomeSentAt" | "config">> = {},
): Promise<void> {
  await db
    .update(clientServices)
    .set({ status, ...extras, updatedAt: new Date() })
    .where(eq(clientServices.id, id));
}

export async function updateClientServiceConfig(
  id: string,
  config: Record<string, any>,
): Promise<void> {
  await db
    .update(clientServices)
    .set({ config, updatedAt: new Date() })
    .where(eq(clientServices.id, id));
}

// ---------------------------------------------------------------------------
// Fulfillment tasks
// ---------------------------------------------------------------------------

export async function copyTemplatesToTasks(
  clientServiceId: string,
  serviceKey: string,
): Promise<FulfillmentTask[]> {
  const templates = await db
    .select()
    .from(serviceTaskTemplates)
    .where(eq(serviceTaskTemplates.serviceKey, serviceKey))
    .orderBy(asc(serviceTaskTemplates.orderIndex));

  if (templates.length === 0) return [];

  const tasks = await db
    .insert(fulfillmentTasks)
    .values(
      templates.map((t) => ({
        clientServiceId,
        title: t.title,
        description: t.description,
        orderIndex: t.orderIndex,
        status: "not_started",
        priority: "normal",
        handledBy: t.defaultHandledBy,
        waitingOn: t.defaultWaitingOn,
        dueAt: t.estimatedDays
          ? new Date(Date.now() + t.estimatedDays * 86_400_000)
          : null,
      })),
    )
    .returning();

  return tasks;
}

export async function listTasksForClientService(
  clientServiceId: string,
): Promise<FulfillmentTask[]> {
  return db
    .select()
    .from(fulfillmentTasks)
    .where(eq(fulfillmentTasks.clientServiceId, clientServiceId))
    .orderBy(asc(fulfillmentTasks.orderIndex));
}

export async function getTaskById(id: string): Promise<FulfillmentTask | undefined> {
  const [row] = await db
    .select()
    .from(fulfillmentTasks)
    .where(eq(fulfillmentTasks.id, id))
    .limit(1);
  return row;
}

export async function updateTaskStatus(
  id: string,
  status: string,
  options: {
    waitingOn?: string | null;
    assignedTo?: number | null;
    priority?: string;
    metadata?: Record<string, any>;
  } = {},
): Promise<FulfillmentTask | undefined> {
  const patch: Record<string, any> = { status, updatedAt: new Date() };

  if (status === "in_progress" || status === "submitted") {
    patch.startedAt = new Date();
  }
  if (status === "delivered") {
    patch.deliveredAt = new Date();
  }
  if ("waitingOn" in options) patch.waitingOn = options.waitingOn ?? null;
  if ("assignedTo" in options) patch.assignedTo = options.assignedTo ?? null;
  if (options.priority) patch.priority = options.priority;
  if (options.metadata) patch.metadata = options.metadata;

  const [updated] = await db
    .update(fulfillmentTasks)
    .set(patch)
    .where(eq(fulfillmentTasks.id, id))
    .returning();
  return updated;
}

/**
 * Core completion cascade: flips a client_service to `completed` when all
 * its tasks are delivered. Mirrors the WeFixTrades pattern.
 */
export async function checkAndCompleteClientService(clientServiceId: string): Promise<{
  serviceCompleted: boolean;
  clientActivated: boolean;
}> {
  const tasks = await listTasksForClientService(clientServiceId);
  if (tasks.length === 0) return { serviceCompleted: false, clientActivated: false };

  const allDelivered = tasks.every((t) => t.status === "delivered");
  if (!allDelivered) return { serviceCompleted: false, clientActivated: false };

  const svc = await getClientServiceById(clientServiceId);
  if (!svc || svc.status === "completed") {
    return { serviceCompleted: false, clientActivated: false };
  }

  await updateClientServiceStatus(clientServiceId, "completed", {
    completedAt: new Date(),
  });

  // Check if client has any still-open services; if not, mark active.
  const open = await db
    .select()
    .from(clientServices)
    .where(
      and(
        eq(clientServices.clientId, svc.clientId),
        ne(clientServices.status, "completed"),
        ne(clientServices.status, "cancelled"),
      ),
    )
    .limit(1);

  let clientActivated = false;
  if (open.length === 0) {
    await updateClientStatus(svc.clientId, "active");
    clientActivated = true;
  }

  return { serviceCompleted: true, clientActivated };
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export async function createOnboardingSubmission(
  input: InsertOnboardingSubmission,
): Promise<OnboardingSubmission> {
  const [created] = await db.insert(onboardingSubmissions).values(input).returning();
  return created;
}

export async function getOnboardingByToken(token: string): Promise<OnboardingSubmission | undefined> {
  const [row] = await db
    .select()
    .from(onboardingSubmissions)
    .where(eq(onboardingSubmissions.accessToken, token))
    .limit(1);
  return row;
}

export async function getOnboardingByClientService(
  clientServiceId: string,
): Promise<OnboardingSubmission | undefined> {
  const [row] = await db
    .select()
    .from(onboardingSubmissions)
    .where(eq(onboardingSubmissions.clientServiceId, clientServiceId))
    .limit(1);
  return row;
}

export async function markOnboardingStatus(
  id: string,
  status: "sent" | "viewed" | "submitted" | "processed",
  extras: Partial<Pick<
    OnboardingSubmission,
    "responses" | "aiExtracted" | "aiProcessedAt" | "sentAt" | "viewedAt" | "submittedAt"
  >> = {},
): Promise<void> {
  await db
    .update(onboardingSubmissions)
    .set({ status, ...extras })
    .where(eq(onboardingSubmissions.id, id));
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export async function logActivity(input: InsertAdminActivityLogEntry): Promise<void> {
  await db.insert(adminActivityLog).values(input);
}

export async function listActivityForClient(
  clientId: string,
  limit = 100,
): Promise<AdminActivityLogEntry[]> {
  return db
    .select()
    .from(adminActivityLog)
    .where(eq(adminActivityLog.clientId, clientId))
    .orderBy(desc(adminActivityLog.createdAt))
    .limit(limit);
}

export async function listActivityForService(
  clientServiceId: string,
  limit = 100,
): Promise<AdminActivityLogEntry[]> {
  return db
    .select()
    .from(adminActivityLog)
    .where(eq(adminActivityLog.clientServiceId, clientServiceId))
    .orderBy(desc(adminActivityLog.createdAt))
    .limit(limit);
}

export async function listRecentActivity(limit = 50): Promise<AdminActivityLogEntry[]> {
  return db
    .select()
    .from(adminActivityLog)
    .orderBy(desc(adminActivityLog.createdAt))
    .limit(limit);
}
