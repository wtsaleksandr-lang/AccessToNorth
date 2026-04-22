import OpenAI from "openai";
import type { Order, Upload, Message } from "@shared/schema";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}
const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  },
});

const MODEL = "gpt-4o";

function buildOrderContext(order: Order, uploads: Upload[], recentMessages: Message[]): string {
  const meta = order.metadata as Record<string, any> | null;
  let context = `ORDER INFORMATION:
- Order ID: ${order.id}
- Service Type: ${order.serviceType}
- Status: ${order.status}
- Customer: ${order.customerName || "N/A"} (${order.customerEmail})
- Created: ${order.createdAt ? new Date(order.createdAt as any).toLocaleDateString() : "N/A"}`;

  if (meta) {
    const metaLines = Object.entries(meta)
      .filter(([_, v]) => v && v !== "")
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    if (metaLines) {
      context += `\n\nORDER METADATA:\n${metaLines}`;
    }
  }

  if (order.steps && Array.isArray(order.steps)) {
    const stepsList = order.steps.map((s: any) => `- [${s.state}] ${s.label}`).join("\n");
    context += `\n\nPROGRESS STEPS:\n${stepsList}`;
  }

  if (uploads.length > 0) {
    const fileList = uploads.map(u => `- ${u.fileName} (${u.mimeType || "unknown"})`).join("\n");
    context += `\n\nUPLOADED DOCUMENTS:\n${fileList}`;
  }

  if (recentMessages.length > 0) {
    const last3 = recentMessages.slice(0, 3);
    const msgList = last3.map(m => `- [${m.sender}] ${m.message.substring(0, 200)}`).join("\n");
    context += `\n\nRECENT MESSAGES (last ${last3.length}):\n${msgList}`;
  }

  return context;
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<{ text: string; model: string }> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("AI returned empty response");
  return { text, model: completion.model || MODEL };
}

export async function generateOrderSummary(
  order: Order, uploads: Upload[], messages: Message[]
): Promise<{ text: string; model: string }> {
  const context = buildOrderContext(order, uploads, messages);
  return callAI(
    "You are an internal operations assistant for AccessToNorth.com, a Canadian trade and tax registration service. Generate concise internal order summaries for the operations team.",
    `${context}\n\nGenerate a concise internal summary of this order (max 200 words). Include: what the client needs, current status, key details, and any notable issues. This is for internal team use only.`
  );
}

export async function generateClientUpdateDraft(
  order: Order, uploads: Upload[], messages: Message[]
): Promise<{ text: string; model: string }> {
  const context = buildOrderContext(order, uploads, messages);
  return callAI(
    "You are a professional client communications writer for AccessToNorth.com, a Canadian trade and tax registration service. Write polite, clear, professional portal messages to clients.",
    `${context}\n\nDraft a professional client-facing status update message (max 250 words) suitable for the client portal. Be reassuring, mention specific progress, and note any next steps or items needed from the client. Do NOT mention AI. Do NOT use overly formal language. Keep it warm and professional.`
  );
}

export async function generateMissingDocs(
  order: Order, uploads: Upload[], messages: Message[]
): Promise<{ text: string; model: string }> {
  const context = buildOrderContext(order, uploads, messages);
  return callAI(
    "You are an operations analyst for AccessToNorth.com, a Canadian trade and tax registration service. You identify missing documents and information needed for various service types: GST/HST registration, Business Number registration, CARM setup, import clearance, HS classification, B13 export declarations, and more.",
    `${context}\n\nBased on the service type and what has been provided so far, identify any documents or information that appear to be missing or still needed (max 250 words). Format as a checklist with bullet points. If everything appears complete, say so. Consider typical CRA/CBSA requirements for this service type.`
  );
}

export async function generateNextSteps(
  order: Order, uploads: Upload[], messages: Message[]
): Promise<{ text: string; model: string }> {
  const context = buildOrderContext(order, uploads, messages);
  return callAI(
    "You are an operations manager for AccessToNorth.com, a Canadian trade and tax registration service. You create actionable next-steps checklists for the operations team.",
    `${context}\n\nGenerate a prioritized next-steps checklist for the operations team (max 250 words, 4-8 items). Each item should be a specific, actionable task. Consider the current order status, what's been done, and what needs to happen next for this service type.`
  );
}

export async function generateReadinessSnapshot(
  order: Order, uploads: Upload[], messages: Message[]
): Promise<{ text: string; model: string }> {
  const context = buildOrderContext(order, uploads, messages);
  return callAI(
    "You are a Canadian trade compliance advisor working for AccessToNorth.com. You prepare Import Readiness Snapshots for clients. You are NOT a customs broker and do NOT make binding determinations. You provide preparatory, informational guidance only.",
    `${context}\n\nGenerate an Import Readiness Snapshot report following this exact structure. Keep it under 500 words total.

# ACCESS TO NORTH – IMPORT READINESS SNAPSHOT
Order ID: ${order.id}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## 1) Summary of Your Situation
Brief overview of the client's import readiness based on the order information.

## 2) What You Already Have
List items/registrations/documents the client already has based on the order data.

## 3) What You Likely Still Need (Checklist)
Bullet-point checklist of items the client likely still needs. If info is missing, state exactly what is missing.

## 4) Common Risk Areas
Awareness items only — no binding claims. Common pitfalls for this type of import situation.

## 5) Recommended Next Steps
3–6 specific, actionable steps the client should take.

## 6) Disclaimer
"This snapshot is preparatory and informational only. The Canada Border Services Agency (CBSA) and/or your licensed customs broker makes final determinations regarding import requirements, classifications, and duties."

RULES:
- Do NOT use "we are a customs broker" language.
- Do NOT make definitive legal determinations.
- If information is missing, list exactly what's missing.
- Keep tone professional but accessible.`
  );
}

export async function generateBrokerHandoffPack(
  order: Order, uploads: Upload[], messages: Message[]
): Promise<{ text: string; model: string }> {
  const context = buildOrderContext(order, uploads, messages);
  return callAI(
    "You are a Canadian trade compliance advisor working for AccessToNorth.com. You prepare Broker Handoff Packs that help clients organize their information before engaging a customs broker. You are NOT a customs broker yourself.",
    `${context}\n\nGenerate a Broker Handoff Pack following this exact structure. Keep it under 500 words total.

# ACCESS TO NORTH – BROKER HANDOFF PACK
Order ID: ${order.id}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## 1) Shipment Summary
Summarize key shipment details from the intake/order information.

## 2) Documents Your Broker Typically Needs
List documents a broker would typically need for this type of shipment/service.

## 3) Key Details to Confirm
Details the client should verify before handing off to a broker.

## 4) Questions to Ask Your Broker
5–10 specific, practical questions the client should ask their broker.

## 5) Common Mistakes to Avoid
5–8 common mistakes importers make when working with brokers.

## 6) Disclaimer
"This pack is provided as a preparatory resource to help you organize your information. Final import requirements, classifications, and duty determinations are made by the CBSA and/or your licensed customs broker."

RULES:
- Do NOT claim to be a customs broker.
- Keep advice practical and actionable.
- If order details are limited, note what additional info would strengthen the pack.`
  );
}
