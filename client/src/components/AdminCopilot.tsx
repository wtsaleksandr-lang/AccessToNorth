/**
 * Admin copilot drawer — context-aware AI that helps the operator navigate
 * the CRM. Gets fresh context every send: current page, current client,
 * open tasks, recent activity. Never invents IDs or amounts.
 */
import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, ClipboardCopy, StickyNote } from "lucide-react";
import {
  getSessionId,
  loadMessages,
  saveMessages,
  clearMessages,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/chatHelpers";

export interface AdminCopilotContext {
  currentPage?: string;
  currentClientName?: string | null;
  currentClientEmail?: string | null;
  currentServiceName?: string | null;
  currentServiceStatus?: string | null;
  openTasks?: Array<{
    id: string;
    title: string;
    status: string;
    waitingOn: string | null;
    priority: string;
  }>;
  recentActivity?: Array<{
    action: string;
    message: string | null;
    actorType: string;
  }>;
}

interface AdminCopilotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: AdminCopilotContext;
}

function getSuggestedPrompts(ctx: AdminCopilotContext): string[] {
  if (ctx.currentServiceName) {
    return [
      "What should be the next step for this engagement?",
      "Draft a client update about where we are.",
      "Draft the authorization-form email to this client.",
      "What's blocking this service from moving forward?",
    ];
  }
  if (ctx.currentClientName || ctx.currentClientEmail) {
    return [
      "What's in flight for this client right now?",
      "Draft a weekly status email covering their active services.",
      "Any tasks waiting on the client that need a nudge?",
    ];
  }
  return [
    "Which services are stalled or overdue?",
    "What should I focus on today?",
    "Draft a weekly summary email for the team.",
    "Write a customer follow-up for a delayed CRA filing.",
  ];
}

export function AdminCopilot({ open, onOpenChange, context }: AdminCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionIdRef.current = getSessionId("admin");
    setMessages(loadMessages("admin"));
  }, []);

  useEffect(() => {
    saveMessages("admin", messages);
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  function send(text: string) {
    if (!text.trim() || streaming) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const pending: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, pending]);
    setInput("");
    setStreaming(true);
    abortRef.current = new AbortController();

    let text2 = "";
    sendChatMessage({
      surface: "admin",
      sessionId: sessionIdRef.current,
      messages: [...messages, userMsg],
      adminContext: context,
      signal: abortRef.current.signal,
      onChunk: (chunk) => {
        text2 += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: text2 };
          return copy;
        });
      },
      onDone: () => setStreaming(false),
      onError: (err) => {
        setError(err);
        setStreaming(false);
      },
    });
  }

  const suggestions = getSuggestedPrompts(context);

  return (
    <>
      {/* Launcher tucked into the top-right */}
      {!open && (
        <button
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-40 h-12 px-4 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all flex items-center gap-2 text-sm font-semibold"
          data-testid="admin-copilot-launcher"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Copilot
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div
          className="fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[460px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
          role="dialog"
          aria-label="Admin copilot"
          data-testid="admin-copilot-panel"
        >
          <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ops Copilot</p>
                <p className="text-[10px] text-slate-400">
                  {context.currentServiceName
                    ? `${context.currentServiceName} · ${context.currentClientName || context.currentClientEmail || ""}`
                    : context.currentClientName || context.currentClientEmail || context.currentPage || "CRM"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  clearMessages("admin");
                  setMessages([]);
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
                title="Clear conversation"
              >
                Clear
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
                aria-label="Close copilot"
                data-testid="admin-copilot-close"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                  I'm your ops copilot. I can answer questions about this client, draft customer
                  replies, or suggest next steps. I only use the data on screen — I won't invent IDs
                  or amounts.
                </div>
                <p className="text-xs text-slate-500 font-medium">Suggested:</p>
                <div className="space-y-1.5">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="w-full text-left text-xs bg-white border border-slate-200 hover:border-primary/30 text-slate-700 px-3 py-2 rounded-md transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  {msg.role === "user" ? "You" : "Copilot"}
                </p>
                <div
                  className={`px-3 py-2 rounded-md text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary/10 text-slate-800 border border-primary/20"
                      : "bg-white text-slate-800 border border-slate-200"
                  }`}
                >
                  {msg.content || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
                {msg.role === "assistant" && msg.content && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard?.writeText(msg.content)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                    >
                      <ClipboardCopy className="w-3 h-3" aria-hidden="true" /> Copy
                    </button>
                    {msg.content.includes("--- DRAFT ---") && (
                      <span className="text-[10px] text-primary inline-flex items-center gap-1">
                        <StickyNote className="w-3 h-3" aria-hidden="true" /> Contains a draft — copy & paste into email
                      </span>
                    )}
                  </div>
                )}
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
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-slate-200 bg-white p-3 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={streaming ? "Waiting for reply..." : "Ask the copilot..."}
              disabled={streaming}
              className="flex-1 h-10 rounded-md border border-slate-200 px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="h-10 w-10 rounded-md bg-primary text-white flex items-center justify-center disabled:opacity-50"
              aria-label="Send"
            >
              {streaming ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
