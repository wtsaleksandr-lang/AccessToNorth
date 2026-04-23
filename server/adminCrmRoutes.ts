/**
 * Admin CRM endpoints — service-delivery layer on top of the existing
 * orders/orderItems admin surface.
 *
 *   GET    /api/admin/crm/overview                    → counts + recent activity
 *   GET    /api/admin/crm/clients                     → list all clients
 *   GET    /api/admin/crm/clients/:id                 → one client with services + activity
 *   GET    /api/admin/crm/services                    → list all client_services (filterable)
 *   GET    /api/admin/crm/services/:id                → service detail + tasks + onboarding
 *   PATCH  /api/admin/crm/tasks/:id                   → update task status / assignee / priority
 *   GET    /api/admin/crm/activity                    → recent activity across all clients
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { adminAuthMiddleware, type AdminTokenPayload } from "./adminAuth";
import * as crm from "./crmStorage";
import { db } from "./db";
import { clients, clientServices, fulfillmentTasks, onboardingSubmissions, adminActivityLog } from "@shared/schema";
import { and, count, eq, sql } from "drizzle-orm";

const taskUpdateSchema = z.object({
  status: z
    .enum(["not_started", "in_progress", "waiting", "blocked", "delivered", "cancelled"])
    .optional(),
  waitingOn: z.enum(["client", "internal", "agency"]).nullable().optional(),
  assignedTo: z.number().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  note: z.string().optional(),
});

export function registerAdminCrmRoutes(app: Express): void {
  // ─── Overview ────────────────────────────────────────────────────────────
  app.get("/api/admin/crm/overview", adminAuthMiddleware, async (_req, res) => {
    try {
      const [clientStatusCounts, serviceStatusCounts, taskStatusCounts, recentActivity] =
        await Promise.all([
          db
            .select({ status: clients.status, count: count() })
            .from(clients)
            .groupBy(clients.status),
          db
            .select({ status: clientServices.status, count: count() })
            .from(clientServices)
            .groupBy(clientServices.status),
          db
            .select({ status: fulfillmentTasks.status, count: count() })
            .from(fulfillmentTasks)
            .groupBy(fulfillmentTasks.status),
          crm.listRecentActivity(20),
        ]);
      res.json({
        clientStatusCounts,
        serviceStatusCounts,
        taskStatusCounts,
        recentActivity,
      });
    } catch (err) {
      console.error("CRM overview error:", err);
      res.status(500).json({ message: "Failed to load overview" });
    }
  });

  // ─── Clients ─────────────────────────────────────────────────────────────
  app.get("/api/admin/crm/clients", adminAuthMiddleware, async (_req, res) => {
    try {
      const all = await crm.listClients();
      // Attach a light-weight service-count per client for the list view.
      const rows = await db
        .select({
          clientId: clientServices.clientId,
          total: sql<number>`count(*)::int`,
        })
        .from(clientServices)
        .groupBy(clientServices.clientId);
      const countByClient = new Map(rows.map((r) => [r.clientId, r.total]));
      res.json(
        all.map((c) => ({ ...c, serviceCount: countByClient.get(c.id) ?? 0 })),
      );
    } catch (err) {
      console.error("CRM clients list error:", err);
      res.status(500).json({ message: "Failed to load clients" });
    }
  });

  app.get("/api/admin/crm/clients/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const client = await crm.getClientById(req.params.id);
      if (!client) return res.status(404).json({ message: "Client not found" });
      const [services, activity] = await Promise.all([
        crm.listClientServicesForClient(client.id),
        crm.listActivityForClient(client.id, 50),
      ]);
      res.json({ client, services, activity });
    } catch (err) {
      console.error("CRM client detail error:", err);
      res.status(500).json({ message: "Failed to load client" });
    }
  });

  // ─── Services ────────────────────────────────────────────────────────────
  app.get("/api/admin/crm/services", adminAuthMiddleware, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const serviceKey =
        typeof req.query.serviceKey === "string" ? req.query.serviceKey : undefined;
      const services = await crm.listAllClientServices({ status, serviceKey });

      // Hydrate with client email for the list view.
      const clientIds = [...new Set(services.map((s) => s.clientId))];
      const clientRows =
        clientIds.length > 0
          ? await db.select().from(clients).where(sql`${clients.id} = ANY(${clientIds})`)
          : [];
      const byId = new Map(clientRows.map((c) => [c.id, c]));

      // Task progress summary per service
      const taskCounts =
        services.length > 0
          ? await db
              .select({
                clientServiceId: fulfillmentTasks.clientServiceId,
                status: fulfillmentTasks.status,
                count: count(),
              })
              .from(fulfillmentTasks)
              .where(
                sql`${fulfillmentTasks.clientServiceId} = ANY(${services.map((s) => s.id)})`,
              )
              .groupBy(fulfillmentTasks.clientServiceId, fulfillmentTasks.status)
          : [];
      const progressByService = new Map<string, { delivered: number; total: number }>();
      for (const row of taskCounts) {
        const current = progressByService.get(row.clientServiceId) ?? { delivered: 0, total: 0 };
        current.total += Number(row.count);
        if (row.status === "delivered") current.delivered += Number(row.count);
        progressByService.set(row.clientServiceId, current);
      }

      res.json(
        services.map((s) => ({
          ...s,
          clientEmail: byId.get(s.clientId)?.email ?? null,
          clientName: byId.get(s.clientId)?.name ?? null,
          progress: progressByService.get(s.id) ?? { delivered: 0, total: 0 },
        })),
      );
    } catch (err) {
      console.error("CRM services list error:", err);
      res.status(500).json({ message: "Failed to load services" });
    }
  });

  app.get("/api/admin/crm/services/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const service = await crm.getClientServiceById(req.params.id);
      if (!service) return res.status(404).json({ message: "Service not found" });
      const [tasks, onboarding, client, activity] = await Promise.all([
        crm.listTasksForClientService(service.id),
        crm.getOnboardingByClientService(service.id),
        crm.getClientById(service.clientId),
        crm.listActivityForService(service.id, 50),
      ]);
      res.json({ service, tasks, onboarding, client, activity });
    } catch (err) {
      console.error("CRM service detail error:", err);
      res.status(500).json({ message: "Failed to load service" });
    }
  });

  // ─── Tasks ───────────────────────────────────────────────────────────────
  app.patch("/api/admin/crm/tasks/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const patch = taskUpdateSchema.parse(req.body);
      const existing = await crm.getTaskById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Task not found" });

      const updated = await crm.updateTaskStatus(
        existing.id,
        patch.status ?? existing.status,
        {
          waitingOn: "waitingOn" in patch ? patch.waitingOn ?? null : undefined,
          assignedTo: "assignedTo" in patch ? patch.assignedTo ?? null : undefined,
          priority: patch.priority,
        },
      );
      if (!updated) return res.status(500).json({ message: "Update failed" });

      // Activity log — stamp actor from JWT.
      const service = await crm.getClientServiceById(existing.clientServiceId);
      const admin = (req as any).adminUser as AdminTokenPayload | undefined;
      const actorId = admin?.email ?? (admin?.userId ? `user:${admin.userId}` : null);

      await crm.logActivity({
        clientId: service?.clientId ?? null,
        clientServiceId: existing.clientServiceId,
        taskId: existing.id,
        actorType: "human",
        actorId,
        action: buildActionLabel(existing.status, patch.status),
        message: patch.note ?? null,
        metadata: {
          from: existing.status,
          to: patch.status ?? existing.status,
          waitingOn: updated.waitingOn,
          priority: updated.priority,
        },
      });

      // Completion cascade.
      let cascadeResult = { serviceCompleted: false, clientActivated: false };
      if (patch.status === "delivered" && existing.status !== "delivered") {
        cascadeResult = await crm.checkAndCompleteClientService(existing.clientServiceId);
        if (cascadeResult.serviceCompleted && service) {
          // Send welcome-complete email (non-blocking).
          try {
            const { sendEmail, buildServiceCompletionEmail } = await import("./emailService");
            const client = await crm.getClientById(service.clientId);
            if (client && !service.welcomeSentAt) {
              const portalUrl = `${baseUrl()}/portal`;
              const email = buildServiceCompletionEmail(
                client.name,
                service.serviceName,
                portalUrl,
              );
              email.to = client.email;
              await sendEmail(email);
              await crm.updateClientServiceStatus(service.id, "completed", {
                welcomeSentAt: new Date(),
              });
              await crm.logActivity({
                clientId: client.id,
                clientServiceId: service.id,
                actorType: "system",
                action: "service.completed",
                message: `Engagement complete — welcome email sent`,
              });
            }
          } catch (emailErr) {
            console.error("[crm] completion email failed (non-fatal):", emailErr);
          }
        }
      }

      res.json({ task: updated, cascade: cascadeResult });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("CRM task update error:", err);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // ─── Activity log ────────────────────────────────────────────────────────
  app.get("/api/admin/crm/activity", adminAuthMiddleware, async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);
      const recent = await crm.listRecentActivity(limit);
      res.json(recent);
    } catch (err) {
      console.error("CRM activity error:", err);
      res.status(500).json({ message: "Failed to load activity" });
    }
  });
}

function buildActionLabel(fromStatus: string, toStatus: string | undefined): string {
  if (!toStatus || fromStatus === toStatus) return "task.updated";
  return `task.${toStatus}`;
}

function baseUrl(): string {
  return process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "https://www.accesstonorth.com";
}
