/**
 * Client-side chat helpers — session id, localStorage message persistence,
 * SSE stream reader.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const SESSION_STORAGE_KEY = "atn_chat_session_id";
const MESSAGES_KEY_PREFIX = "atn_chat_messages_";

export function getSessionId(surface: string = "website"): string {
  const key = `${SESSION_STORAGE_KEY}_${surface}`;
  if (typeof window === "undefined") return cryptoRandom();
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id = cryptoRandom();
    window.localStorage.setItem(key, id);
    return id;
  } catch {
    return cryptoRandom();
  }
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  return `sess-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function loadMessages(surface: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${surface}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(-30);
    return [];
  } catch {
    return [];
  }
}

export function saveMessages(surface: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${MESSAGES_KEY_PREFIX}${surface}`,
      JSON.stringify(messages.slice(-30)),
    );
  } catch {
    // quota / private mode — silently fail
  }
}

export function clearMessages(surface: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${surface}`);
  } catch {
    // ignore
  }
}

export interface SendChatOptions {
  surface: "website" | "admin" | "portal";
  sessionId: string;
  messages: ChatMessage[];
  adminContext?: Record<string, any>;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export async function sendChatMessage(opts: SendChatOptions): Promise<void> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: opts.signal,
      body: JSON.stringify({
        surface: opts.surface,
        sessionId: opts.sessionId,
        messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
        adminContext: opts.adminContext,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      opts.onError(body.message ?? `HTTP ${res.status}`);
      return;
    }
    if (!res.body) {
      opts.onError("No response stream");
      return;
    }
    await readSSEStream(res.body, {
      onChunk: opts.onChunk,
      onDone: opts.onDone,
      onError: opts.onError,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") return;
    opts.onError(err?.message ?? "Network error");
  }
}

export async function readSSEStream(
  body: ReadableStream<Uint8Array>,
  handlers: {
    onChunk: (text: string) => void;
    onDone: () => void;
    onError: (err: string) => void;
  },
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) {
          handlers.onError(parsed.error);
          return;
        }
        if (parsed.done) {
          handlers.onDone();
          return;
        }
        if (typeof parsed.text === "string") {
          handlers.onChunk(parsed.text);
        }
      } catch {
        // ignore malformed chunk
      }
    }
  }
  handlers.onDone();
}
