/**
 * Vapi voice integration routes.
 *
 *   POST /api/vapi/webhook        → event sink (signature-verified)
 *   POST /api/vapi/conversation   → custom-llm turn endpoint
 *                                     returns { output: { content, model } }
 *   GET  /api/vapi/web-config     → browser SDK public-key bootstrap
 *   GET  /api/vapi/status         → readiness check
 *
 * Setup:
 *   1. Create a Vapi account (vapi.ai) and an assistant
 *   2. In the assistant config: model.provider = "custom-llm"
 *                                model.url = ${VAPI_SERVER_URL}/api/vapi/conversation
 *   3. Set env vars:
 *        VAPI_API_KEY         — server-to-Vapi REST calls
 *        VAPI_PUBLIC_KEY      — browser SDK (safe to expose)
 *        VAPI_ASSISTANT_ID    — default assistant
 *        VAPI_WEBHOOK_SECRET  — HMAC-SHA256 signing secret
 *        VAPI_SERVER_URL      — this server's public URL (for the custom-llm callback)
 */
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { chat, getModel, validateConfig } from "./services/aiService";
import { buildVoicePrompt } from "./services/promptBuilder";
import { loadMemory, saveMemory, extractSignals } from "./services/chatMemory";

interface VapiConfig {
  apiKey?: string;
  publicKey?: string;
  assistantId?: string;
  webhookSecret?: string;
  serverUrl?: string;
}

function getVapiConfig(): VapiConfig {
  return {
    apiKey: process.env.VAPI_API_KEY,
    publicKey: process.env.VAPI_PUBLIC_KEY,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET,
    serverUrl: process.env.VAPI_SERVER_URL,
  };
}

function vapiReady(): { ok: boolean; reason?: string } {
  const cfg = getVapiConfig();
  if (!cfg.apiKey) return { ok: false, reason: "VAPI_API_KEY not set" };
  return { ok: true };
}

/** Verify Vapi webhook HMAC signature. */
function verifyWebhookSignature(req: Request): boolean {
  const cfg = getVapiConfig();
  if (!cfg.webhookSecret) return true; // skip verification if no secret set (dev)
  const signature = req.headers["x-vapi-signature"] as string | undefined;
  if (!signature) return false;
  const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", cfg.webhookSecret)
    .update(bodyStr)
    .digest("hex");
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Translate Vapi conversation-update messages into our ChatMessage shape. */
function translateTranscript(
  vapiMessages: Array<{ role?: string; content?: string; message?: string }>,
): Array<{ role: "user" | "assistant"; content: string }> {
  const out: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of vapiMessages) {
    const role = m.role === "assistant" || m.role === "bot" ? "assistant" : "user";
    const content = (m.content ?? m.message ?? "").trim();
    if (!content) continue;
    if (content.length > 4000) continue;
    out.push({ role, content });
  }
  return out.slice(-20); // cap context
}

export function registerVapiRoutes(app: Express): void {
  // ─── Readiness diagnostic ─────────────────────────────────────────────
  app.get("/api/vapi/status", (_req, res) => {
    const cfg = getVapiConfig();
    res.json({
      configured: !!cfg.apiKey,
      hasPublicKey: !!cfg.publicKey,
      hasAssistantId: !!cfg.assistantId,
      hasServerUrl: !!cfg.serverUrl,
      hasWebhookSecret: !!cfg.webhookSecret,
      aiReady: validateConfig().ok,
    });
  });

  // ─── Browser SDK bootstrap ────────────────────────────────────────────
  app.get("/api/vapi/web-config", (_req, res) => {
    const cfg = getVapiConfig();
    if (!cfg.publicKey || !cfg.assistantId) {
      return res.status(503).json({ message: "Voice not configured" });
    }
    res.json({ publicKey: cfg.publicKey, assistantId: cfg.assistantId });
  });

  // ─── Custom-LLM turn endpoint ─────────────────────────────────────────
  app.post("/api/vapi/conversation", async (req: Request, res: Response) => {
    const ready = vapiReady();
    if (!ready.ok) return res.status(503).json({ message: ready.reason });
    if (!validateConfig().ok) {
      return res.status(503).json({ message: "AI not configured" });
    }

    try {
      const body = req.body ?? {};
      const callId = body.call?.id ?? body.callId ?? "unknown";
      const sessionId = `vapi:${callId}`;
      const rawMessages = Array.isArray(body.messages) ? body.messages : [];
      const msgs = translateTranscript(rawMessages);
      if (msgs.length === 0) {
        return res.json({
          output: {
            content: "Hello, this is AccessToNorth. How can I help you?",
            model: getModel(),
          },
        });
      }

      const latestUser = [...msgs].reverse().find((m) => m.role === "user");
      const { messages: prior, signals: priorSignals } = await loadMemory(sessionId);
      const signals = latestUser
        ? extractSignals(priorSignals, latestUser.content)
        : priorSignals;

      const system = buildVoicePrompt(signals);
      const reply = await chat({
        system,
        messages: msgs,
        maxTokens: 180, // voice responses must stay SHORT
        temperature: 0.5,
      });

      // Persist memory
      const updated = [
        ...prior,
        ...msgs.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
        })),
        { role: "assistant" as const, content: reply, timestamp: new Date().toISOString() },
      ];
      await saveMemory(sessionId, "website", updated, signals);

      res.json({
        output: {
          content: reply,
          model: getModel(),
        },
      });
    } catch (err: any) {
      console.error("[vapi] conversation error:", err?.message);
      res.status(500).json({
        output: {
          content:
            "I'm having trouble connecting right now. Could you email operations@accesstonorth.com and our team will follow up within one business day?",
          model: getModel(),
        },
      });
    }
  });

  // ─── Webhook sink ─────────────────────────────────────────────────────
  app.post("/api/vapi/webhook", async (req: Request, res: Response) => {
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ message: "Invalid signature" });
    }
    const body = req.body ?? {};
    const messageType = body.message?.type ?? body.type;

    switch (messageType) {
      case "assistant-request":
        // Vapi asks for an assistant config for inbound calls when no assistantId
        // is pre-bound. Return our default config.
        res.json({
          assistant: buildDefaultAssistantConfig(),
        });
        return;

      case "end-of-call-report":
        console.log(`[vapi] call ended: ${body.message?.call?.id ?? body.call?.id}`);
        res.json({ ok: true });
        return;

      case "conversation-update":
      case "status-update":
      case "transcript":
      case "hang":
      default:
        res.json({ ok: true });
        return;
    }
  });
}

function buildDefaultAssistantConfig(): Record<string, any> {
  const cfg = getVapiConfig();
  const serverUrl = cfg.serverUrl ?? "https://www.accesstonorth.com";
  return {
    name: "AccessToNorth Voice",
    firstMessage:
      "Hi, this is the AccessToNorth team line. I can help with Canadian business registration, GST/HST, CARM, or customs clearance. What brings you in today?",
    model: {
      provider: "custom-llm",
      url: `${serverUrl}/api/vapi/conversation`,
    },
    voice: {
      provider: "11labs",
      voiceId: "rachel",
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    serverUrl: `${serverUrl}/api/vapi/webhook`,
    endCallFunctionEnabled: true,
    recordingEnabled: false,
  };
}
