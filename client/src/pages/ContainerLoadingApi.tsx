import { useEffect, useMemo, useState } from "react";
import { Check, Code2, Copy, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";

const tiers = [
  { id: "embed-starter", name: "Embed Starter", monthly: 19, annual: 149, description: "The complete calculator on one logistics website.", features: ["1 approved domain", "500 plans/month", "Responsive hosted iframe", "Share links and PDF export", "Automatic engine updates"] },
  { id: "embed-pro", name: "Embed Pro", monthly: 49, annual: 490, description: "A white-label planner for forwarders and warehouses.", popular: true, features: ["3 approved domains", "5,000 plans/month", "Your logo and brand colours", "No AccessToNorth promotion", "Priority email support"] },
  { id: "loading-api", name: "Loading API", monthly: 99, annual: 990, description: "Headless optimization for TMS, WMS, ERP, and quoting apps.", features: ["20,000 calculations/month", "REST/JSON placements", "Container recommendations", "Hosted share links", "Versioned, continuously updated engine"] },
];

const sampleRequest = `POST /api/v1/container-load-plans\nAuthorization: Bearer YOUR_API_KEY\n\n{\n  "container": "40hc",\n  "items": [{\n    "name": "Pallet", "length": 48, "width": 48,\n    "height": 61, "quantity": 7, "totalWeight": 11596,\n    "units": "in-lbs"\n  }]\n}`;

export default function ContainerLoadingApi() {
  const { toast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [selectedTier, setSelectedTier] = useState<typeof tiers[number] | null>(null);
  const [email, setEmail] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  usePageMeta({ title: "Container Loading Calculator API & Website Embed | AccessToNorth.com", description: "Affordable container loading API and embeddable 3D load planner with a 14-day free trial. Hosted updates, placement results, PDFs, and share links.", canonical: "/developers/container-loading-api" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const promo = params.get("promo");
    if (promo) setPromotionCode(promo);
    if (plan) {
      const tier = tiers.find((item) => plan.startsWith(item.id));
      if (tier) { setBilling(plan.endsWith("annual") ? "annual" : "monthly"); setSelectedTier(tier); }
    }
  }, []);
  const selectedPlanId = useMemo(() => selectedTier ? `${selectedTier.id}-${billing}` : "", [selectedTier, billing]);

  async function beginCheckout() {
    if (!selectedTier || !/^\S+@\S+\.\S+$/.test(email)) return toast({ title: "Enter a valid email address", variant: "destructive" });
    setSubmitting(true);
    try {
      const response = await fetch("/api/tool-subscriptions/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: selectedPlanId, email, promotionCode: promotionCode || undefined }) });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.message || "Checkout could not be started");
      window.location.assign(data.url);
    } catch (error: any) {
      toast({ title: "Checkout unavailable", description: error.message, variant: "destructive" });
      setSubmitting(false);
    }
  }

  return <div className="min-h-screen bg-slate-50"><Navbar /><main className="pb-20 pt-28">
    <section className="mx-auto max-w-5xl px-4 text-center sm:px-6">
      <Badge className="mb-4 border-blue-200 bg-blue-50 text-primary hover:bg-blue-50"><Code2 className="mr-1.5 h-3.5 w-3.5" /> Developer & partner access</Badge>
      <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Put premium 3D load planning inside your product.</h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Start with the free public calculator, embed the complete planner, or connect by API. Every paid plan includes a 14-day trial, automatic updates, and no setup fee.</p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"><Button size="lg" onClick={() => setSelectedTier(tiers[0])}>Start 14-day free trial</Button><Button asChild size="lg" variant="outline"><a href="/embed/container-calculator" target="_blank" rel="noreferrer">Preview the embed <ExternalLink className="ml-2 h-4 w-4" /></a></Button></div>
      <p className="mt-3 text-xs text-slate-500">Card required · No charge today · Reminder before renewal · Cancel any time</p>
    </section>

    <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
      <div className="mx-auto flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button className={`rounded-lg px-5 py-2 text-sm font-semibold ${billing === "monthly" ? "bg-slate-900 text-white" : "text-slate-600"}`} onClick={() => setBilling("monthly")}>Monthly</button><button className={`rounded-lg px-5 py-2 text-sm font-semibold ${billing === "annual" ? "bg-slate-900 text-white" : "text-slate-600"}`} onClick={() => setBilling("annual")}>Annual <span className="ml-1 text-emerald-500">save up to 35%</span></button></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-4">
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Public Calculator</h2><p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500">For occasional planning directly on AccessToNorth.com.</p><div className="mt-5 text-3xl font-extrabold">Free</div><ul className="mt-6 flex-1 space-y-3">{["Unlimited manual projects", "3D loading preview", "PDF and share links", "No website embed or API"].map((f) => <li key={f} className="flex gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />{f}</li>)}</ul><Button asChild variant="outline" className="mt-7"><a href="/tools/container-calculator">Use free calculator</a></Button></article>
        {tiers.map((tier) => {
          const amount = billing === "annual" ? tier.annual : tier.monthly;
          const equivalent = billing === "annual" ? Math.round((tier.annual / 12) * 100) / 100 : tier.monthly;
          return <article key={tier.id} className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${tier.popular ? "border-primary ring-2 ring-primary/10" : "border-slate-200"}`}>{tier.popular && <Badge className="absolute -top-3 left-6">Best value</Badge>}{tier.id === "embed-starter" && billing === "annual" && <Badge className="absolute -top-3 right-5 bg-emerald-600">Founding price</Badge>}<h2 className="text-lg font-bold">{tier.name}</h2><p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500">{tier.description}</p><div className="mt-5"><span className="text-3xl font-extrabold">CA${amount}</span><span className="text-sm text-slate-400">/{billing === "annual" ? "year" : "month"}</span>{billing === "annual" && <p className="mt-1 text-xs text-emerald-700">CA${equivalent}/month equivalent</p>}</div><ul className="mt-6 flex-1 space-y-3">{tier.features.map((f) => <li key={f} className="flex gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}</ul><Button className="mt-7" variant={tier.popular ? "default" : "outline"} onClick={() => setSelectedTier(tier)}>Try free for 14 days</Button></article>;
        })}
      </div>
    </section>

    <section className="mx-auto mt-14 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-2xl bg-slate-950 p-7 text-white"><Sparkles className="h-6 w-6 text-sky-400" /><h2 className="mt-5 text-2xl font-bold">Hosted means always current</h2><p className="mt-3 text-sm leading-6 text-slate-300">The embed and versioned API run on our infrastructure. Compatible packing-engine improvements, container data, and security fixes reach every client automatically—without copying a new script or updating an SDK.</p><div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /><span>Domain restrictions, isolated API keys, rate limits, usage allowances, and Stripe-managed billing are included.</span></div></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-3"><div><p className="text-sm font-bold">One request, complete placement</p><p className="text-xs text-slate-500">REST + JSON · imperial or metric</p></div><button onClick={() => navigator.clipboard.writeText(sampleRequest).then(() => toast({ title: "API example copied" }))} className="rounded-lg border p-2" aria-label="Copy API example"><Copy className="h-4 w-4" /></button></div><pre className="overflow-x-auto bg-slate-900 p-5 text-xs leading-6 text-slate-200"><code>{sampleRequest}</code></pre></div></section>
  </main><Footer />
  <Dialog open={Boolean(selectedTier)} onOpenChange={(open) => !open && setSelectedTier(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Start your 14-day free trial</DialogTitle><DialogDescription>{selectedTier?.name} · {billing === "annual" ? `CA$${selectedTier?.annual}/year` : `CA$${selectedTier?.monthly}/month`} after trial. You will receive reminders and can cancel before renewal.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="trial-email">Work email</Label><Input id="trial-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" /></div>{promotionCode && <div><Label htmlFor="promo">Promotion code</Label><Input id="promo" value={promotionCode} onChange={(e) => setPromotionCode(e.target.value)} /></div>}<Button className="w-full" disabled={submitting} onClick={beginCheckout}>{submitting ? "Opening secure checkout…" : "Continue to Stripe Checkout"}</Button><p className="text-center text-xs leading-5 text-slate-500">Stripe securely collects your card. One free trial per customer. By continuing, you agree to the Terms and recurring renewal shown above.</p></div></DialogContent></Dialog>
  </div>;
}
