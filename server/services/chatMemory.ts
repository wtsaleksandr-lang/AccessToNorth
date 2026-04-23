/**
 * DB-backed chat memory. Keyed by sessionId (anonymous) or stitched to
 * clientId once the visitor logs into the portal.
 *
 *   - 40 messages retained per session (FIFO)
 *   - 30-day TTL (pruned lazily on write)
 *   - Lightweight regex signal extraction (no extra LLM call)
 */
import { db } from "../db";
import { chatMemory } from "@shared/schema";
import { and, eq, lt, sql } from "drizzle-orm";

const MAX_MESSAGES = 40;
const TTL_DAYS = 30;

export interface ChatMemoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatMemorySignals {
  previousTopics?: string[];
  interestedInPricing?: boolean;
  interestedInBooking?: boolean;
  askedAboutNonResident?: boolean;
  askedAboutCarm?: boolean;
  askedAboutHsCode?: boolean;
  mentionedIndustry?: string;
}

export async function loadMemory(sessionId: string): Promise<{
  messages: ChatMemoryMessage[];
  signals: ChatMemorySignals;
}> {
  const [row] = await db
    .select()
    .from(chatMemory)
    .where(eq(chatMemory.sessionId, sessionId))
    .limit(1);
  return {
    messages: (row?.messagesJson as ChatMemoryMessage[] | null) ?? [],
    signals: (row?.extractedSignals as ChatMemorySignals | null) ?? {},
  };
}

export async function saveMemory(
  sessionId: string,
  surface: string,
  messages: ChatMemoryMessage[],
  signals: ChatMemorySignals,
  clientId: string | null = null,
): Promise<void> {
  // Keep only the last MAX_MESSAGES
  const trimmed = messages.slice(-MAX_MESSAGES);
  const [existing] = await db
    .select({ id: chatMemory.id })
    .from(chatMemory)
    .where(eq(chatMemory.sessionId, sessionId))
    .limit(1);
  if (existing) {
    await db
      .update(chatMemory)
      .set({
        surface,
        messagesJson: trimmed,
        extractedSignals: signals,
        clientId,
        lastSeenAt: new Date(),
      })
      .where(eq(chatMemory.id, existing.id));
  } else {
    await db.insert(chatMemory).values({
      sessionId,
      surface,
      messagesJson: trimmed,
      extractedSignals: signals,
      clientId,
    });
  }
}

/**
 * Cheap regex-based signal extractor. No second LLM call — runs on the
 * latest user turn + accumulates across the conversation.
 */
export function extractSignals(
  prior: ChatMemorySignals,
  latestUserText: string,
): ChatMemorySignals {
  const t = latestUserText.toLowerCase();
  const next: ChatMemorySignals = { ...prior };

  if (/\bprice|pricing|fee|cost|how much\b/i.test(t)) next.interestedInPricing = true;
  if (/\bbook|schedule|call|consult|talk to someone|speak with\b/i.test(t)) {
    next.interestedInBooking = true;
  }
  if (/\bnon.?resident|nri|us seller|overseas|foreign company\b/i.test(t)) {
    next.askedAboutNonResident = true;
  }
  if (/\bcarm|rpp|customs bond|cbsa portal|import account\b/i.test(t)) {
    next.askedAboutCarm = true;
  }
  if (/\bhs code|classification|tariff code|duty rate\b/i.test(t)) {
    next.askedAboutHsCode = true;
  }

  const topic = extractTopic(t);
  if (topic) {
    const prev = next.previousTopics ?? [];
    if (!prev.includes(topic)) {
      next.previousTopics = [...prev, topic].slice(-6);
    } else {
      next.previousTopics = prev;
    }
  }

  const industry = /\b(shopify|amazon|fba|saas|e.?commerce|manufacturing|food|cosmetics|apparel|electronics)\b/i.exec(t);
  if (industry && !next.mentionedIndustry) {
    next.mentionedIndustry = industry[0].toLowerCase();
  }
  return next;
}

function extractTopic(t: string): string | null {
  if (/gst|hst|sales tax/i.test(t)) return "gst-hst";
  if (/business number|\bbn\b/i.test(t)) return "business-number";
  if (/non.?resident|simplified regime/i.test(t)) return "non-resident";
  if (/carm|cbsa/i.test(t)) return "carm";
  if (/hs code|classification/i.test(t)) return "hs-classification";
  if (/clearance|customs broker|cbsa/i.test(t)) return "customs-clearance";
  if (/sima|anti.?dumping/i.test(t)) return "sima";
  if (/b13|export/i.test(t)) return "b13-export";
  return null;
}

/** Prune memories older than TTL. Call occasionally, not every request. */
export async function pruneOldMemories(): Promise<number> {
  const cutoff = new Date(Date.now() - TTL_DAYS * 86_400_000);
  const result = await db
    .delete(chatMemory)
    .where(lt(chatMemory.lastSeenAt, cutoff))
    .returning({ id: chatMemory.id });
  return result.length;
}

/** Stitch an anonymous session to an authenticated client. */
export async function linkSessionToClient(
  sessionId: string,
  clientId: string,
): Promise<void> {
  await db
    .update(chatMemory)
    .set({ clientId })
    .where(eq(chatMemory.sessionId, sessionId));
}
