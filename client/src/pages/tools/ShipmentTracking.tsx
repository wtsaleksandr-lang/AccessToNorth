import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2, Circle, Clock3, ExternalLink,
  FileText, Loader2, LockKeyhole, PackageSearch, Search, ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("delivered")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized.includes("hold") || normalized.includes("cancel")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <Link href="/tools" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> All tools</Link>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PackageSearch className="h-7 w-7" /></div>
            <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl" data-testid="text-tracking-title">Track your AccessToNorth request</h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">Check service, document-review, customs, and freight quote milestones. Your email keeps the request private.</p>
          </div>

          <Card className="mx-auto max-w-3xl overflow-hidden border-slate-200 shadow-lg shadow-slate-200/40">
            <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
            <CardContent className="p-5 sm:p-7">
              <form onSubmit={handleTrack} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
                <div><Label htmlFor="tracking-id">Order or RFQ number</Label><div className="relative mt-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="tracking-id" value={trackingId} onChange={(event) => setTrackingId(event.target.value.toUpperCase())} placeholder="ATN-XXXXXX or RFQ-XXXXXX" className="pl-10 font-mono uppercase" autoCapitalize="characters" data-testid="input-tracking-id" /></div></div>
                <div><Label htmlFor="tracking-email">Request email</Label><div className="relative mt-1"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="tracking-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="pl-10" data-testid="input-tracking-email" /></div></div>
                <Button type="submit" disabled={loading} className="gap-2 sm:min-w-28" data-testid="button-track">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking</> : <>Track <Search className="h-4 w-4" /></>}</Button>
              </form>
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><p>The email is used only to verify access. It is removed from the page address after lookup.</p></div>
            </CardContent>
          </Card>

          {error && (
            <div className="mx-auto mt-5 flex max-w-3xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert" data-testid="tracking-error"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">We could not find that request</p><p className="mt-0.5 text-red-600">{error}</p></div></div>
          )}

          {result && (
            <div className="mx-auto mt-6 max-w-3xl space-y-5" data-testid="tracking-result">
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Reference</p><p className="mt-1 font-mono text-xl font-extrabold text-slate-950">{result.trackingId}</p><p className="mt-1 text-sm text-slate-500">{result.serviceType}</p></div>
                    <div className="sm:text-right"><Badge variant="outline" className={statusTone(result.status)}>{result.status}</Badge><p className="mt-2 text-xs text-slate-400">Updated {result.updatedAt ? new Date(result.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "recently"}</p></div>
                  </div>
                  <div className="p-5 sm:p-7">
                    <h2 className="mb-5 text-base font-bold text-slate-950">Progress timeline</h2>
                    <ol className="space-y-0">
                      {result.steps.map((item, index) => {
                        const done = item.state === "done";
                        const working = item.state === "working";
                        return (
                          <li key={`${item.label}-${index}`} className="relative flex gap-4 pb-7 last:pb-0" data-testid={`tracking-step-${index}`}>
                            {index < result.steps.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px ${done ? "bg-emerald-300" : "bg-slate-200"}`} />}
                            <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? "border-emerald-500 bg-emerald-500 text-white" : working ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-300"}`}>{done ? <Check className="h-4 w-4" /> : working ? <Clock3 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}</span>
                            <div className="pt-1"><p className={`text-sm font-semibold ${done || working ? "text-slate-900" : "text-slate-400"}`}>{item.label}</p><p className="mt-0.5 text-xs text-slate-400">{done ? "Completed" : working ? "In progress" : "Upcoming"}</p></div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-slate-600"><FileText className="h-4 w-4 text-primary" /><span>{result.documentCount} document{result.documentCount === 1 ? "" : "s"} attached</span></div>{result.portalAvailable && <Link href="/portal"><Button variant="outline" className="w-full gap-2 bg-white sm:w-auto">Open client portal <ExternalLink className="h-3.5 w-3.5" /></Button></Link>}</div>
                </CardContent>
              </Card>
              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-relaxed text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p>This timeline shows AccessToNorth service and RFQ milestones. It does not replace a carrier’s GPS, bill-of-lading, airline, or ocean-line tracking system.</p></div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
