/**
 * POST /api/chat  — SSE streaming chat endpoint.
 *
 * Body: { surface: "website" | "admin" | "portal", messages: ChatMessage[],
 *         sessionId: string, adminContext?: AdminContext }
 *
 * Writes SSE events: `data: {"text": "..."}` chunks, `data: {"done": true}` at end.
 * On error: `data: {"error": "..."}`.
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { streamChat, validateConfig, type ChatMessage } from "./services/aiService";
import {
  loadMemory,
  saveMemory,
  extractSignals,
  type ChatMemoryMessage,
  type ChatMemorySignals,
} from "./services/chatMemory";
import {
  buildWebsitePrompt,
  buildAdminPrompt,
  buildPortalPrompt,
  type AdminContext,
} from "./services/promptBuilder";
import { adminAuthMiddleware } from "./adminAuth";
import { portalAuthMiddleware } from "./portalAuth";

const bodySchema = z.object({
  surface: z.enum(["website", "admin", "portal"]),
  sessionId: z.string().min(4).max(128),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  adminContext: z.record(z.string(), z.any()).optional(),
});

export function registerChatRoutes(app: Express): void {
  app.post("/api/chat", async (req: Request, res: Response) => {
    const validation = validateConfig();
    if (!validation.ok) {
      return res.status(503).json({ message: `AI not configured: ${validation.reason}` });
    }

    let body;
    try {
      body = bodySchema.parse(req.body);
    } catch (err: any) {
      return res.status(400).json({ message: err.errors?.[0]?.message ?? "Invalid request" });
    }

    // Admin surface requires admin auth; portal surface requires portal auth.
    if (body.surface === "admin") {
      try {
        await runAdminGuard(req, res);
      } catch {
        return; // runAdminGuard already responded with 401/403
      }
    }

    // Load prior memory and extract signals from the latest user turn.
    const { messages: priorMessages, signals: priorSignals } = await loadMemory(body.sessionId);
    const latestUser = [...body.messages].reverse().find((m) => m.role === "user");
    const signals: ChatMemorySignals = latestUser
      ? extractSignals(priorSignals, latestUser.content)
      : priorSignals;

    // Compose system prompt per surface.
    let systemPrompt: string;
    switch (body.surface) {
      case "admin":
        systemPrompt = buildAdminPrompt((body.adminContext ?? {}) as AdminContext);
        break;
      case "portal":
        systemPrompt = buildPortalPrompt(null);
        break;
      case "website":
      default:
        systemPrompt = buildWebsitePrompt(signals);
        break;
    }

    // SSE setup
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable proxy buffering (nginx)
    res.flushHeaders?.();

    const send = (obj: unknown) => {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

    let assistantText = "";
    try {
      const stream = await streamChat({
        system: systemPrompt,
        messages: body.messages as ChatMessage[],
        // Admin drafts sometimes run long; website keeps it tight.
        maxTokens: body.surface === "admin" ? 1500 : 900,
        temperature: body.surface === "admin" ? 0.3 : 0.6,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          (event.delta as any)?.type === "text_delta"
        ) {
          const chunk = (event.delta as any).text as string;
          assistantText += chunk;
          send({ text: chunk });
        }
      }

      send({ done: true });
      res.end();

      // Persist memory after the stream completes.
      const updatedMessages: ChatMemoryMessage[] = [
        ...priorMessages,
        ...body.messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
        })),
        { role: "assistant", content: assistantText, timestamp: new Date().toISOString() },
      ];
      await saveMemory(body.sessionId, body.surface, updatedMessages, signals);
    } catch (err: any) {
      console.error("[chat] stream error:", err?.message);
      send({ error: err?.message ?? "AI error" });
      res.end();
    }
  });
}

/** Admin guard — reuses adminAuthMiddleware but promisified. */
function runAdminGuard(req: Request, res: Response): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    adminAuthMiddleware(req, res, (err?: unknown) => {
      if (err) reject(err);
      else if (res.headersSent) reject(new Error("guard responded"));
      else resolve();
    });
  });
}
