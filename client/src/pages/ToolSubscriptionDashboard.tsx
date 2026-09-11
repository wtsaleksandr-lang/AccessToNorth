import { useEffect, useState } from "react";
import { Activity, ArrowRight, CheckCircle2, Code2, Copy, CreditCard, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";
import { TOOL_ACCOUNT_TOKEN_STORAGE_KEY } from "@/lib/toolAccount";

type AccountSummary = {
  email: string;
  status: string;
  plan: { id: string; name: string; tier: string; apiAccess: boolean; monthlyCalculations: number };
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: { currentMonth: number; remaining: number };
  apiKeyPrefix: string | null;
  engineVersion: string;
};

export default function ToolSubscriptionDashboard() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rotating, setRotating] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const token = typeof window === "undefined" ? "" : window.localStorage.getItem(TOOL_ACCOUNT_TOKEN_STORAGE_KEY) || "";
  usePageMeta({ title: "Container Loading Account | AccessToNorth.com", description: "Manage your AccessToNorth container loading subscription and API access.", canonical: "/developers/container-loading-dashboard", robots: "noindex,nofollow" });

  async function loadAccount() {
    if (!token) {
      setError("No subscription access is saved in this browser.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/tool-subscriptions/account", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load the account.");
      setSummary(data);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the account.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAccount(); }, []);

  async function openBilling() {
    const response = await fetch("/api/tool-subscriptions/account/portal", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (response.ok && data.url) window.location.assign(data.url);
    else toast({ title: "Billing settings unavailable", description: data.message, variant: "destructive" });
  }

  async function rotateKey() {
    if (!window.confirm("Create a new API key? Your current key will stop working immediately.")) return;
    setRotating(true);
    try {
      const response = await fetch("/api/tool-subscriptions/account/api-key/rotate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !data.apiKey?.key) throw new Error(data.message || "Could not rotate the API key.");
      setNewApiKey(data.apiKey.key);
      setSummary((current) => current ? { ...current, apiKeyPrefix: data.apiKey.prefix } : current);
      toast({ title: "New API key created", description: "Copy it now. The previous key has been disabled." });
    } catch (reason) {
      toast({ title: "API key rotation failed", description: reason instanceof Error ? reason.message : "Please try again.", variant: "destructive" });
    } finally {
      setRotating(false);
    }
  }

  const usagePercent = summary?.plan.monthlyCalculations
    ? Math.min(100, (summary.usage.currentMonth / summary.plan.monthlyCalculations) * 100)
    : 0;

  return <div className="min-h-screen bg-slate-50"><main className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Badge className="border-blue-200 bg-blue-50 text-primary hover:bg-blue-50"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Partner account</Badge><h1 className="mt-3 text-3xl font-extrabold text-slate-950">Container loading account</h1><p className="mt-2 text-sm text-slate-500">Subscription, usage and integration access in one place.</p></div><Button type="button" variant="outline" className="gap-2 bg-white" onClick={loadAccount} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div>
    {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading your account…</div> : error ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center"><KeyRound className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-xl font-bold text-slate-900">Account access unavailable</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{error} Open the subscription confirmation page in the same browser, or contact support to reconnect access.</p><Button asChild className="mt-6"><a href="/developers/container-loading-api">View plans</a></Button></div> : summary && <>
      <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Current plan</p><p className="mt-2 text-xl font-extrabold text-slate-950">{summary.plan.name}</p><div className="mt-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-semibold capitalize text-emerald-700">{summary.status}</span></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Account</p><p className="mt-2 truncate text-sm font-bold text-slate-900">{summary.email}</p><p className="mt-2 text-xs text-slate-500">{summary.trialEnd ? `Trial ends ${new Date(summary.trialEnd).toLocaleDateString("en-CA", { dateStyle: "medium" })}` : summary.cancelAtPeriodEnd ? "Cancels at the end of the billing period" : "Recurring subscription"}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Engine version</p><p className="mt-2 truncate font-mono text-sm font-bold text-slate-900">{summary.engineVersion}</p><p className="mt-2 text-xs text-slate-500">Hosted updates apply automatically.</p></div></section>
      {summary.plan.apiAccess && <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-base font-bold text-slate-900"><Activity className="h-5 w-5 text-primary" />Monthly API usage</div><p className="mt-1 text-xs text-slate-500">Current calendar month</p></div><span className="text-right text-2xl font-extrabold text-slate-950">{summary.usage.currentMonth.toLocaleString()}<span className="text-sm font-medium text-slate-400"> / {summary.plan.monthlyCalculations.toLocaleString()}</span></span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${usagePercent}%` }} /></div><div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>{usagePercent.toFixed(1)}% used</span><span>{summary.usage.remaining.toLocaleString()} remaining</span></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2 text-base font-bold text-slate-900"><KeyRound className="h-5 w-5 text-primary" />API key</div><p className="mt-2 text-xs text-slate-500">Active key: <code className="font-semibold text-slate-700">{summary.apiKeyPrefix || "Not issued"}…</code></p><Button type="button" variant="outline" className="mt-5 w-full gap-2" onClick={rotateKey} disabled={rotating}><RefreshCw className={`h-4 w-4 ${rotating ? "animate-spin" : ""}`} />Rotate API key</Button></div></section>}
      {newApiKey && <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 font-bold text-amber-950"><CheckCircle2 className="h-5 w-5" />Copy your new key now</div><p className="mt-1 text-xs text-amber-800">It will not be displayed again after you leave this page.</p><div className="mt-3 flex gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-amber-200 bg-white p-3 text-xs">{newApiKey}</code><Button type="button" size="icon" variant="outline" className="shrink-0 bg-white" onClick={() => navigator.clipboard.writeText(newApiKey).then(() => toast({ title: "API key copied" }))}><Copy className="h-4 w-4" /></Button></div></section>}
      <section className="mt-5 grid gap-4 sm:grid-cols-2"><button type="button" onClick={openBilling} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary"><CreditCard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">Manage billing</span><span className="mt-1 block text-xs text-slate-500">Invoices, payment method and cancellation</span></span><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary" /></button><a href="/developers/container-loading-api" className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Code2 className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">API documentation</span><span className="mt-1 block text-xs text-slate-500">Request format, limits and embed options</span></span><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary" /></a></section>
    </>}
  </main></div>;
}
