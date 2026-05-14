import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  ArrowRight,
  ShieldCheck,
  Landmark,
  Globe,
  Award,
  MapPin,
  HeartHandshake,
  FileSignature,
  Lock,
} from "lucide-react";

const values = [
  {
    icon: FileSignature,
    title: "Authorized representation under signed consent",
    desc:
      "We act on your behalf only after you sign the CRA's Business Consent form (RC59-B) or the equivalent customs authorization. Our access is limited to the accounts in scope.",
  },
  {
    icon: HeartHandshake,
    title: "Flat-fee, no hidden charges",
    desc:
      "Every service has a published flat fee. No hourly billing, no surprise invoices, no retainers. If scope changes mid-engagement, you approve a new flat fee before we proceed.",
  },
  {
    icon: Globe,
    title: "Non-resident practice",
    desc:
      "Most of our clients are outside Canada. We handle simplified GST/HST, non-resident Business Numbers, and NRI setups as a routine practice, not as an exception.",
  },
  {
    icon: Award,
    title: "Refund on unfiled work",
    desc:
      "Cancel before we submit your filing and receive a full refund. If an application is rejected due to our error, we re-file at no cost or refund the service fee.",
  },
];

const practiceAreas = [
  {
    icon: Landmark,
    name: "CRA registrations",
    desc: "Business Number, GST/HST (full and simplified regimes), payroll program accounts, corporate income tax accounts, non-resident setups.",
  },
  {
    icon: ShieldCheck,
    name: "CBSA / CARM",
    desc: "CARM Client Portal onboarding, financial security coordination, RPP enrollment, and customs broker delegation for commercial importers.",
  },
  {
    icon: Globe,
    name: "Customs & trade",
    desc: "Commercial customs clearance coordination (declaration prepared for filing by your licensed broker), HS code classification, B13 export declaration preparation, and post-entry correction (B2) paperwork for broker filing.",
  },
  {
    icon: Lock,
    name: "Import compliance",
    desc: "Compliance reviews, origin and valuation documentation under CUSMA and other trade agreements, SIMA exposure checks, and CFIA / OGD permit coordination.",
  },
];

export default function About() {
  usePageMeta({
    title: "About | AccessToNorth.com",
    description:
      "AccessToNorth is an administrative services firm coordinating Canadian CRA and CBSA filings for resident and non-resident businesses. Operating under signed authorization; not a law firm or customs broker.",
    canonical: "https://www.accesstonorth.com/about",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
              About AccessToNorth
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display text-slate-900 mb-4" data-testid="text-about-title">
              Canadian tax &amp; customs filings,<br className="hidden md:block" /> coordinated for you.
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              AccessToNorth is an administrative services firm that coordinates Canadian CRA and CBSA
              filings on behalf of resident and non-resident businesses. We prepare, submit, and
              track your filings under a signed authorization, and report back at each step.
            </p>
          </div>

          {/* Positioning */}
          <Card className="mb-10">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">What we do</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Canadian tax and customs compliance involves a specific set of forms, portals,
                    and agencies — CRA My Business Account, CBSA CARM Client Portal, CFIA permits,
                    Global Affairs Canada import controls. Each one has its own format, timing, and
                    failure mode. We coordinate these filings end-to-end for a flat fee.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed mt-3">
                    We are not a law firm, an accounting firm, or a customs broker. We are a
                    coordination service that prepares your documents, submits them to the correct
                    agency, and keeps a written record of every step.
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">What we don't do</h2>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5" aria-hidden="true">•</span>
                      Provide legal, tax, or accounting advice — we refer to licensed professionals
                      when that's what you need.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5" aria-hidden="true">•</span>
                      Act as a customs broker of record — customs brokers are licensed by CBSA; we
                      coordinate with your broker or recommend one.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5" aria-hidden="true">•</span>
                      Guarantee a specific outcome from the CRA, CBSA, or any other agency —
                      processing times and decisions are theirs to make.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5" aria-hidden="true">•</span>
                      Take on engagements outside our practice areas — see below.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How we operate */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-display text-slate-900 mb-5 text-center">How we operate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {values.map((v) => (
                <Card key={v.title} className="border border-slate-200">
                  <CardContent className="p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <v.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm">{v.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Practice areas */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-display text-slate-900 mb-5 text-center">Practice areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {practiceAreas.map((area) => (
                <Card key={area.name} className="border border-slate-200">
                  <CardContent className="p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <area.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm">{area.name}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{area.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Team (placeholder, honest) */}
          <Card className="mb-10">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">How the work is handled</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                Every engagement is coordinated by a dedicated point of contact who stays assigned
                through delivery. Filings are prepared by team members experienced with Canadian
                CRA and CBSA workflows, and every outbound submission is reviewed against a
                checklist before going to the agency.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Where a filing involves specialized knowledge — HS classification, SIMA
                determinations, or CARM financial-security structuring — we confirm the approach
                with the practice lead for that area before proceeding. If a matter falls outside
                our scope or requires legal or accounting advice, we say so and refer you out.
              </p>
            </CardContent>
          </Card>

          {/* Confidentiality */}
          <Card className="mb-10 border-blue-100 bg-blue-50/40">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <h2 className="text-lg font-bold text-slate-900">Confidentiality &amp; data handling</h2>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Client documents and personal information are held in confidence. Files are
                submitted over encrypted channels, stored in access-controlled systems, and
                retained only as long as required to complete your engagement and meet applicable
                record-keeping obligations. We do not sell, trade, or share client data with third
                parties outside the scope of your filing. See our{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  Privacy Policy
                </Link>{" "}
                for full terms.
              </p>
            </CardContent>
          </Card>

          {/* Jurisdiction */}
          <Card className="mb-10">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <h2 className="text-lg font-bold text-slate-900">Where we operate</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                AccessToNorth is operated through affiliated entities in the United States and
                Canada. We operate out of Toronto, Canada. Our US entity is
                MR Holdings &amp; Trade LLC. We are an administrative-services firm that coordinates
                documentation with the CRA, CBSA, and other Canadian agencies. We are not a law
                firm, not a customs broker, and not affiliated with any government agency.
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-slate-500 mb-4 text-sm">Ready to talk specifics?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/pricing">
                <Button size="lg" className="cursor-pointer">
                  View pricing <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="cursor-pointer">
                  Book a consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
