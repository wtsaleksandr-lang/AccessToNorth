/**
 * Compliance-grade audit logging for admin mutations on orders.
 *
 * Every admin route that touches an order (status, steps, messages, AI drafts,
 * snapshot/broker-pack delivery, etc.) calls recordAuditEvent so we have a
 * tamper-evident, reverse-chronological trail per order_id.
 *
 * Failures here are intentionally non-fatal — we never want an audit-write
 * failure to block a legitimate admin action. We log the error and move on.
 */
import { db } from "../db";
import { auditEvents, type InsertAuditEvent } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import type { AdminTokenPayload } from "../adminAuth";

export type AuditAction =
  | "status_change"
  | "step_update"
  | "message_added"
  | "manual_edit"
  | "ai_draft_generated"
  | "ai_draft_saved"
  | "ai_summary_generated"
  | "ai_client_update_generated"
  | "ai_missing_docs_generated"
  | "ai_next_steps_generated"
  | "readiness_snapshot_generated"
  | "readiness_snapshot_sent"
  | "broker_pack_generated"
  | "broker_pack_sent"
  | "report_sent"
  | "info_requested";

export interface RecordAuditEventInput {
  orderId: string;
  actor: AdminTokenPayload | null | undefined;
  action: AuditAction | string;
  field?: string | null;
  oldVal?: unknown;
  newVal?: unknown;
}

/**
 * Normalise an arbitrary value into a short text payload suitable for the
 * old_value / new_value columns. Long structures (steps arrays, metadata
 * objects) are JSON-stringified and truncated.
 */
function stringifyValue(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  try {
    const json = JSON.stringify(val);
    // Hard cap to keep audit rows reasonably bounded.
    return json.length > 4000 ? `${json.slice(0, 4000)}…` : json;
  } catch {
    return String(val);
  }
}

/**
 * Insert a single audit row. Never throws — audit-write failures must not
 * break the admin path that produced them.
 */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  try {
    const row: InsertAuditEvent = {
      orderId: input.orderId,
      actorId: input.actor?.userId ?? null,
      actorEmail: input.actor?.email ?? null,
      action: input.action,
      fieldName: input.field ?? null,
      oldValue: stringifyValue(input.oldVal),
      newValue: stringifyValue(input.newVal),
    };
    await db.insert(auditEvents).values(row);
  } catch (err) {
    console.error("[audit] failed to record event (non-fatal):", err);
  }
}

/**
 * Fetch the most recent audit rows for an order, newest first. Paginated to
 * keep the admin timeline view bounded.
 */
export async function listAuditEventsForOrder(
  orderId: string,
  limit = 50,
): Promise<Array<typeof auditEvents.$inferSelect>> {
  const capped = Math.min(Math.max(1, Math.floor(limit)), 200);
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.orderId, orderId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(capped);
}
