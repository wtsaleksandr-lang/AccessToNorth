/**
 * Thin Anthropic wrapper — single source of truth for LLM config.
 * Every AI surface (website chat, admin copilot, Vapi voice) goes through
 * here so we have one retry policy, one model default, one config-validation.
 */
import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set — AI features will fail to initialize.");
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export function getModel(): string {
  return DEFAULT_MODEL;
}

export function validateConfig(): { ok: boolean; reason?: string } {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY not set" };
  }
  return { ok: true };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  system: string;
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Non-streaming chat completion with 2 linear retries on transient errors.
 * Use this for Vapi voice turns and short admin actions.
 */
export async function chat(opts: ChatOptions): Promise<string> {
  const client = getClient();
  const model = opts.model ?? DEFAULT_MODEL;
  const maxTokens = opts.maxTokens ?? 800;
  const temperature = opts.temperature ?? 0.6;

  let lastErr: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: opts.system,
        messages: opts.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
      const text = resp.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("");
      return text;
    } catch (err: any) {
      lastErr = err;
      // 401/400 are not transient — surface immediately.
      if (err?.status === 401 || err?.status === 400) throw err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr ?? new Error("AI chat failed after retries");
}

/**
 * Streaming chat — returns the Anthropic SDK stream. Caller is responsible
 * for piping to SSE and persisting the final text via onComplete.
 */
export async function streamChat(opts: ChatOptions) {
  const client = getClient();
  const model = opts.model ?? DEFAULT_MODEL;
  const maxTokens = opts.maxTokens ?? 1200;
  const temperature = opts.temperature ?? 0.6;

  return client.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: opts.system,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  });
}
