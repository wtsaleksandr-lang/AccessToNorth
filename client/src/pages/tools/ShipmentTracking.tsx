import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, ArrowRight, Check, Circle, Clock3, ExternalLink,
  FileText, Loader2, LockKeyhole, Search, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout, FieldLabel, Input, TOOL_SUCCESS } from "@/components/tools";
import { usePageMeta } from "@/hooks/use-page-meta";

interface TrackingStep {
  label: string;
  state: "done" | "working" | "upcoming";
}

interface TrackingResult {
  trackingId: string;
  serviceType: string;
  status: string;
  steps: TrackingStep[];
  createdAt: string | null;
  updatedAt: string | null;
  deliveredAt: string | null;
  documentCount: number;
  portalAvailable: boolean;
}

/**
 * Card-on-canvas shell, matching the rest of the tool suite.
 */
const SHELL = "w-[98%] max-w-container-outer mx-auto rounded-lg border overflow-hidden";
const RAIL = "mx-auto max-w-container px-5 md:px-10";
const FORM_RAIL = "mx-auto max-w-3xl px-5 md:px-10";
const PAD = {
  even: "pt-10 pb-10 md:pt-[76px] md:pb-[76px]",
  topHeavy: "pt-16 pb-10 md:pt-20 md:pb-[60px]",
} as const;

/**
 * Status pill palette. The system's one accent is reserved for
 * selection/focus, so a status is a neutral surface + ink pair, with the
 * shared success ink for a finished request and the Callout warning ink for a
 * held/cancelled one. Nothing here invents a status — the string is whatever
 * the API returned.
 */
function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("delivered")) {
    return "border-[#A7F3D0] bg-[#F0FDF4] text-[#14532D]";
  }
  if (normalized.includes("hold") || normalized.includes("cancel")) {
    return "border-[#FDE68A] bg-[#FFFBEB] text-[#78350F]";
  }
  return "border-border-control bg-surface-recessed text-text-secondary";
}

export default function ShipmentTracking() {
  usePageMeta({
    title: "Track an AccessToNorth Order or Freight RFQ | AccessToNorth.com",
    description: "Securely check AccessToNorth order, document-review, customs-service, and freight quote milestones using your reference number and email.",
    canonical: "/tools/shipment-tracking",
  });

  const [trackingId, setTrackingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTrackingId(params.get("trackingId") || "");
    setEmail(params.get("email") || "");
  }, []);

  const handleTrack = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!trackingId.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter your AccessToNorth reference and the email used for the request.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/shipment-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId, email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Tracking is temporarily unavailable.");
      setResult(data);
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("trackingId", data.trackingId);
      nextUrl.searchParams.delete("email");
      window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Tracking is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas font-sans">
      {/* 83px fixed Navbar + the 16px inter-card gap. */}
      <main className="flex flex-col gap-4 pb-4 pt-[99px]">

        {/* ── Hero card ───────────────────────────────────────────────── */}
        <section className={`${SHELL} border-white/10 surface-dark ${PAD.even}`}>
          <div className={RAIL}>
            <div className="max-w-2xl">
              <p className="text-eyebrow uppercase text-text-deemphasis">Request status</p>
              <h1
                className="mt-4 text-h1-sm text-white md:text-h1"
                data-testid="text-tracking-title"
              >
                Track your AccessToNorth request
              </h1>
              <p className="mt-5 text-lead text-text-deemphasis">
                Check service, document-review, customs, and freight quote milestones. Your email keeps the request private.
              </p>
              <Link
                href="/tools"
                className="mt-6 inline-flex items-center gap-1.5 text-body font-semibold text-text-deemphasis underline underline-offset-4 transition-colors duration-state hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All tools
              </Link>
            </div>
          </div>
        </section>

        {/* ── Lookup ──────────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.topHeavy}`}>
          <div className={FORM_RAIL}>
            <h2 className="text-h2 text-text-primary">Look up a request</h2>
            <p className="mt-2 text-lead text-text-muted">
              Both fields are required — the reference alone will not return a request.
            </p>

            <form onSubmit={handleTrack} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="tracking-id" required>Order or RFQ number</FieldLabel>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
                    <Input
                      id="tracking-id"
                      value={trackingId}
                      onChange={(event) => setTrackingId(event.target.value.toUpperCase())}
                      placeholder="ATN-XXXXXX or RFQ-XXXXXX"
                      className="font-mono uppercase tabular-nums"
                      hasLeadingIcon
                      autoCapitalize="characters"
                      data-testid="input-tracking-id"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="tracking-email" required>Request email</FieldLabel>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
                    <Input
                      id="tracking-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      hasLeadingIcon
                      data-testid="input-tracking-email"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-brand text-[15px] font-semibold text-white transition-colors duration-state hover:bg-brand-hover sm:w-auto sm:px-8"
                data-testid="button-track"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Checking
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" aria-hidden="true" /> Track
                  </>
                )}
              </Button>

              <p className="flex items-start gap-2 text-[14px] leading-5 text-text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                The email is used only to verify access. It is removed from the page address after lookup.
              </p>
            </form>

            {error && (
              <Callout
                tone="error"
                role="alert"
                title="We could not find that request"
                className="mt-6"
                data-testid="tracking-error"
              >
                <p>{error}</p>
              </Callout>
            )}

            {/*
              EMPTY STATE — deliberately shows no shipment. There is no sample
              reference, no demo timeline and no placeholder carrier: a tracking
              surface that renders invented milestones teaches the reader to
              believe the next screen, so before a real lookup this says what
              the tool covers and nothing more.
            */}
            {!result && !error && (
              <div
                className="mt-8 rounded-lg border border-border-hairline bg-surface-recessed p-5"
                data-testid="tracking-empty-state"
              >
                <h3 className="text-h3 text-text-primary">No request loaded yet</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-text-muted">
                  Enter a reference above to see its milestones. This page shows AccessToNorth service
                  and RFQ progress only — it is not a carrier tracking feed, and it shows nothing until
                  a reference is matched to its request email.
                </p>
                <ul className="mt-4 space-y-2 text-[14px] leading-5 text-text-secondary">
                  {[
                    "Service orders and document reviews (ATN- references)",
                    "Freight quote requests submitted through the RFQ tool (RFQ- references)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TOOL_SUCCESS }} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result && (
              <div className="mt-8 space-y-4" data-testid="tracking-result">
                {/*
                  Scope caveat sits ABOVE the timeline, at the same 14px as the
                  timeline itself. On main it was 12px grey text underneath,
                  where a reader who had already read the milestones as carrier
                  tracking would never reach it.
                */}
                <Callout tone="info">
                  <p>
                    This timeline shows AccessToNorth service and RFQ milestones. It does not replace a
                    carrier&rsquo;s GPS, bill-of-lading, airline, or ocean-line tracking system.
                  </p>
                </Callout>

                <section className="rounded-lg border border-border-hairline bg-white">
                  <header className="flex flex-col gap-4 border-b border-border-hairline px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-eyebrow uppercase text-text-muted">Reference</p>
                      <p className="mt-1 font-mono text-[24px] font-bold leading-8 tracking-[-0.01em] text-text-primary tabular-nums">
                        {result.trackingId}
                      </p>
                      <p className="mt-1 text-[14px] leading-5 text-text-muted">{result.serviceType}</p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <span
                        className={`inline-flex items-center rounded-md border px-3 py-1 text-[13px] font-semibold leading-[18px] ${statusTone(result.status)}`}
                      >
                        {result.status}
                      </span>
                      <p className="mt-2 text-[13px] leading-[18px] text-text-muted tabular-nums">
                        Updated {result.updatedAt
                          ? new Date(result.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })
                          : "recently"}
                      </p>
                    </div>
                  </header>

                  <div className="px-5 py-5">
                    <h2 className="text-h3 text-text-primary">Progress timeline</h2>
                    <ol className="mt-5">
                      {result.steps.map((item, index) => {
                        const done = item.state === "done";
                        const working = item.state === "working";
                        return (
                          <li
                            key={`${item.label}-${index}`}
                            className="relative flex gap-4 pb-6 last:pb-0"
                            data-testid={`tracking-step-${index}`}
                          >
                            {index < result.steps.length - 1 && (
                              <span
                                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border-hairline"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                                done
                                  ? "border-[#15803D] bg-[#15803D] text-white"
                                  : working
                                    ? "border-brand bg-white text-brand"
                                    : "border-border-control bg-white text-text-deemphasis"
                              }`}
                              aria-hidden="true"
                            >
                              {done ? <Check className="h-4 w-4" /> : working ? <Clock3 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                            </span>
                            <div className="min-w-0 pt-1">
                              <p className={`text-[14px] font-semibold leading-5 ${done || working ? "text-text-primary" : "text-text-muted"}`}>
                                {item.label}
                              </p>
                              <p className="mt-0.5 text-[13px] leading-[18px] text-text-muted">
                                {done ? "Completed" : working ? "In progress" : "Upcoming"}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  <footer className="flex flex-col gap-3 border-t border-border-hairline bg-surface-recessed px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-[14px] leading-5 text-text-secondary">
                      <FileText className="h-4 w-4 text-text-muted" aria-hidden="true" />
                      <span className="tabular-nums">
                        {result.documentCount} document{result.documentCount === 1 ? "" : "s"} attached
                      </span>
                    </div>
                    {result.portalAvailable && (
                      <Link href="/portal">
                        <Button
                          variant="outline"
                          className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand sm:w-auto"
                        >
                          Open client portal
                          <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </Link>
                    )}
                  </footer>
                </section>

                <Link
                  href="/tools/freight-quote"
                  className="inline-flex items-center gap-1.5 text-body font-semibold text-text-secondary underline underline-offset-2 transition-colors duration-state hover:text-brand"
                >
                  Start another freight quote request
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
