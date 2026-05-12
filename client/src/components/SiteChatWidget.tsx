/**
 * Public-site AI chat bubble. Mounted globally via App.tsx so every marketing
 * page gets it. Streams responses via SSE from /api/chat (surface="website").
 * Session id lives in localStorage; memory is DB-backed server-side.
 */
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import {
  getSessionId,
  loadMessages,
  saveMessages,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/chatHelpers";

const GREETING =
  "Hi — I'm AccessToNorth's assistant. I can answer questions about Canadian GST/HST, Business Numbers, CARM onboarding, customs clearance coordination, or help you find the right service. What can I help you with?";

const SUGGESTED: string[] = [
  "I'm a US Shopify seller — do I need GST/HST?",
  "How does CARM onboarding work?",
  "What does a customs bond cost?",
  "Can you register my Business Number?",
];

// Surfaces where the bubble should NOT show
const HIDE_ON_PREFIXES = ["/admin", "/portal", "/onboarding", "/checkout", "/payment-"];

export function SiteChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Route gating — don't show on admin/portal/etc.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    function checkPath() {
      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      setHidden(HIDE_ON_PREFIXES.some((p) => path.startsWith(p)));
    }
    checkPath();
    // wouter uses history API — listen for pushState as well as popstate
    const onRoute = () => checkPath();
    window.addEventListener("popstate", onRoute);
    const origPush = window.history.pushState;
    window.history.pushState = function (...args) {
      origPush.apply(this, args as any);
      onRoute();
    };
    return () => {
      window.removeEventListener("popstate", onRoute);
      window.history.pushState = origPush;
    };
  }, []);

  // Load session + messages on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId("website");
    const stored = loadMessages("website");
    setMessages(stored);
  }, []);

  // Persist messages
  useEffect(() => {
    saveMessages("website", messages);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  function send(text: string) {
    if (!text.trim() || streaming) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const pendingAssistant: ChatMessage = { role: "assistant", content: "" };
    const nextMessages = [...messages, userMsg, pendingAssistant];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);
    abortRef.current = new AbortController();

    let assistantText = "";
    sendChatMessage({
      surface: "website",
      sessionId: sessionIdRef.current,
      messages: [...messages, userMsg],
      signal: abortRef.current.signal,
      onChunk: (chunk) => {
        assistantText += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantText };
          return copy;
        });
      },
      onDone: () => setStreaming(false),
      onError: (err) => {
        setError(err);
        setStreaming(false);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content:
              assistantText ||
              "I'm having trouble connecting right now. You can also reach our team at operations@accesstonorth.com.",
          };
          return copy;
        });
      },
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  if (hidden) return null;

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 px-5 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 hover:bg-primary/90 transition-all flex items-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Open AccessToNorth assistant"
          data-testid="chat-launcher"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Ask AccessToNorth
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] sm:w-[380px] h-[min(560px,calc(100vh-8rem))] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-label="AccessToNorth assistant"
          data-testid="chat-panel"
        >
          <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">AccessToNorth assistant</p>
                <p className="text-[10px] text-slate-400">AI — answers Q&amp;A, points to services</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close chat"
              data-testid="chat-close"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                  {GREETING}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-xs bg-white border border-slate-200 hover:border-primary/30 text-slate-700 px-2.5 py-1.5 rounded-full transition-colors text-left"
                      data-testid="chat-suggestion"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-white p-3 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={streaming ? "Waiting for reply..." : "Type your question..."}
              disabled={streaming}
              className="flex-1 h-10 rounded-md border border-slate-200 px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              data-testid="chat-input"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="h-10 w-10 rounded-md bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
              data-testid="chat-send"
            >
              {streaming ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center px-3 pb-2">
            AI-generated replies. For binding answers, book a consultation via /contact.
          </p>
        </div>
      )}
    </>
  );
}
