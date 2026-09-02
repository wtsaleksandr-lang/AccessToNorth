import { useEffect, useState } from "react";
import { CheckCircle2, Copy, KeyRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Summary = { planName: string; status: string; trialEnd: string | null; email: string | null; apiKey?: { key: string | null; prefix: string; alreadyProvisioned: boolean } | null };

export default function SubscriptionSuccess() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";
  useEffect(() => {
    if (!sessionId) return setError("This confirmation link is incomplete.");
    fetch(`/api/tool-subscriptions/session/${encodeURIComponent(sessionId)}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Subscription not found");
      setSummary(data);
    }).catch((reason) => setError(reason.message));
  }, [sessionId]);

  async function manage() {
    const response = await fetch("/api/tool-subscriptions/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
    const data = await response.json();
    if (response.ok && data.url) window.location.assign(data.url);
    else toast({ title: "Billing settings unavailable", description: data.message, variant: "destructive" });
  }

  return <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto max-w-2xl px-4 pb-24 pt-32"><section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
    {error ? <><h1 className="text-2xl font-bold">We could not confirm this subscription</h1><p className="mt-3 text-slate-600">{error}</p></> : !summary ? <p className="text-slate-600">Confirming your secure checkout…</p> : <><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-4 text-3xl font-extrabold text-slate-950">Your {summary.planName} plan is ready</h1><p className="mt-3 text-slate-600">{summary.trialEnd ? `Your free trial runs through ${new Date(summary.trialEnd).toLocaleDateString("en-CA", { dateStyle: "long" })}.` : "Your subscription is active."} We sent the details to {summary.email}.</p>
    {summary.apiKey && <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left"><div className="flex items-center gap-2 font-bold text-slate-900"><KeyRound className="h-5 w-5" /> API key</div>{summary.apiKey.key ? <><p className="mt-2 text-sm text-slate-600">Copy this key now. For security, it will not be shown again.</p><div className="mt-3 flex gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white p-3 text-xs">{summary.apiKey.key}</code><Button size="icon" onClick={() => navigator.clipboard.writeText(summary.apiKey!.key!).then(() => toast({ title: "API key copied" }))}><Copy className="h-4 w-4" /></Button></div></> : <p className="mt-2 text-sm text-slate-600">A key beginning with <code>{summary.apiKey.prefix}</code> was already issued. Contact support if it needs to be rotated.</p>}</div>}
    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><a href="/tools/container-calculator">Open calculator</a></Button><Button variant="outline" onClick={manage}>Manage billing</Button></div></>}
  </section></main><Footer /></div>;
}
