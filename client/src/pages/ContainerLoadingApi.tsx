import { Check, Code2, Copy, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Embed Starter",
    price: "CA$19",
    cadence: "/month",
    description: "For a logistics website that wants the complete calculator without building an integration.",
    features: ["1 approved domain", "500 loading plans/month", "Responsive iframe", "Share links and PDF export", "AccessToNorth branding"],
  },
  {
    name: "Embed Pro",
    price: "CA$49",
    cadence: "/month",
    description: "A polished white-label calculator for forwarders, warehouses, and quoting portals.",
    popular: true,
    features: ["3 approved domains", "5,000 loading plans/month", "Your logo and brand colours", "No AccessToNorth promotion", "Email support"],
  },
  {
    name: "Loading API",
    price: "CA$99",
    cadence: "/month",
    description: "Headless optimization for TMS, WMS, ERP, and custom quotation workflows.",
    features: ["20,000 calculations/month", "REST/JSON placement results", "Container recommendations", "Hosted read-only plan URLs", "CA$0.005 per extra calculation"],
  },
];

const sampleRequest = `POST /api/v1/container-load-plans
Authorization: Bearer YOUR_API_KEY

{
  "container": "40hc",
  "items": [{
    "name": "Pallet",
    "length": 48,
    "width": 48,
    "height": 61,
    "quantity": 7,
    "totalWeight": 11596,
    "units": "in-lbs"
  }]
}`;

export default function ContainerLoadingApi() {
  const { toast } = useToast();
  usePageMeta({
    title: "Container Loading Calculator API & Website Embed | AccessToNorth.com",
    description: "Affordable container loading API and embeddable 3D load planner from CA$19/month. Add container recommendations, placement results, PDFs, and share links to your logistics website.",
    canonical: "/developers/container-loading-api",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Badge className="mb-4 border-blue-200 bg-blue-50 text-primary hover:bg-blue-50"><Code2 className="mr-1.5 h-3.5 w-3.5" /> Developer access</Badge>
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Put premium 3D load planning inside your product.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Embed the ready-made calculator or send cargo through a simple API. Public pricing starts far below a conventional load-planning licence, with no setup fee or annual commitment.</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg"><a href="/contact?subject=container-loading-api">Request API access <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
            <Button asChild size="lg" variant="outline"><a href="/embed/container-calculator" target="_blank" rel="noreferrer">Preview embeddable calculator</a></Button>
          </div>
        </section>

        <section className="mx-auto mt-14 grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${plan.popular ? "border-primary ring-2 ring-primary/10" : "border-slate-200"}`}>
              {plan.popular && <Badge className="absolute -top-3 left-6 bg-primary text-white">Best value</Badge>}
              <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
              <p className="mt-2 min-h-[66px] text-sm leading-6 text-slate-500">{plan.description}</p>
              <div className="mt-5 flex items-end gap-1"><span className="text-3xl font-extrabold tracking-tight text-slate-950">{plan.price}</span><span className="pb-1 text-sm text-slate-400">{plan.cadence}</span></div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}
              </ul>
              <Button asChild className="mt-7" variant={plan.popular ? "default" : "outline"}><a href={`/contact?subject=${encodeURIComponent(plan.name)}`}>Choose {plan.name}</a></Button>
            </article>
          ))}
        </section>

        <section className="mx-auto mt-14 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl bg-slate-950 p-7 text-white">
            <Sparkles className="h-6 w-6 text-sky-400" />
            <h2 className="mt-5 text-2xl font-bold">Transparent launch pricing</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">EasyCargo publicly lists US$79/month or US$799/year for its planner, while many enterprise API products require a sales quote. AccessToNorth starts at CA$19/month for an embed and publishes every allowance up front.</p>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /><span>Domain restrictions, rate limits, isolated API keys, and usage reporting are included before a customer goes live.</span></div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div><p className="text-sm font-bold text-slate-900">One request, complete placement</p><p className="text-xs text-slate-500">REST + JSON · imperial or metric</p></div>
              <button type="button" onClick={() => navigator.clipboard.writeText(sampleRequest).then(() => toast({ title: "API example copied" }))} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-primary" aria-label="Copy API example"><Copy className="h-4 w-4" /></button>
            </div>
            <pre className="overflow-x-auto bg-slate-900 p-5 text-xs leading-6 text-slate-200"><code>{sampleRequest}</code></pre>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

