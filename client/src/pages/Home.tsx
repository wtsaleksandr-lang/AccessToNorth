declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
    };
  }
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import businessTeamImg from "@/assets/images/business-team.jpg";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrationModal } from "@/components/RegistrationModal";
import { DiyVsUsComparison } from "@/components/DiyVsUsComparison";
import { HowItWorksSection } from "@/components/HowItWorks";
import { usePageMeta } from "@/hooks/use-page-meta";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, ShieldCheck, Award, Lock, BadgeCheck, Building2, Landmark, Shield, Calculator, Package, Globe, FileCheck, Search } from "lucide-react";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("gst-hst");
  const [, setLocation] = useLocation();

  usePageMeta({
    title: "AccessToNorth.com — Canadian GST/HST & Business Registration",
    description: "Flat-fee Canadian business registration. GST/HST, Business Numbers, CARM, customs clearance, and non-resident compliance. From CA$99. 5–10 business days.",
    canonical: "/",
  });

  const handleOpenModal = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 maple-bg">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 space-y-4 md:space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" aria-hidden="true"></span>
                Coordinating Canadian tax &amp; customs filings
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-display text-slate-900 leading-[1.05] tracking-tight" data-testid="text-hero-title" style={{ letterSpacing: '-0.02em' }}>
                Canadian{" "}
                <span className="text-primary">Business Number &amp; GST/HST</span>
                {" "}filings, coordinated for you.
              </h1>

              <p className="text-base md:text-lg text-slate-600 max-w-lg leading-relaxed">
                Flat fee from CA$99. We prepare and submit your CRA filings under signed authorization.
                CRA typically issues accounts within 5&ndash;10 business days of filing. For Canadian
                and non-resident businesses.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-primary text-lg px-8 shadow-lg shadow-primary/25 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#0056b3] hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-100"
                    data-testid="button-start-registration"
                  >
                    View services &amp; pricing
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 px-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                        <img
                          src={`/images/avatar-${i}.png`}
                          alt=""
                          aria-hidden="true"
                          width={40}
                          height={40}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />)}
                    </div>
                    <span className="text-slate-600 font-medium">Canadian &amp; non-resident clients</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20" aria-hidden="true"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20" aria-hidden="true"></div>

              <div className="relative">
                <div className="relative z-10 glass-card rounded-2xl p-6 md:p-8 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sample Client</p>
                      <p className="text-sm font-semibold text-slate-900">Maple Trade Co.</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-primary w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Business Number (BN)", detail: "BN 12345 6789 RC0001" },
                      { title: "GST/HST Account", detail: "Registered — effective Apr 2026" },
                      { title: "CARM Import Account", detail: "Active — RPP secured" },
                    ].map((step) => (
                      <div key={step.title} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{step.title}</p>
                          <p className="text-xs text-slate-500 truncate">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Registration Status</span>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">Completed</span>
                  </div>
                </div>

                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className="absolute left-[-10px] lg:left-[-14px] top-[12%] flex flex-col gap-2.5 lg:gap-3">
                    {[
                      { icon: Landmark, label: "CRA", testId: "inst-badge-cra" },
                      { icon: Building2, label: "CBSA", testId: "inst-badge-cbsa" },
                      { icon: Shield, label: "IRS", testId: "inst-badge-irs" },
                      { icon: BadgeCheck, label: "USPTO", testId: "inst-badge-uspto", hideOnSmall: true },
                      { icon: Building2, label: "SBA", testId: "inst-badge-sba", hideOnSmall: true },
                    ].map((badge, i) => (
                      <div
                        key={badge.testId}
                        data-testid={badge.testId}
                        className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-[14px] border border-white/60 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 ${badge.hideOnSmall ? 'hidden sm:flex' : 'flex'}`}
                        style={{ marginLeft: `${(i % 2) * 6}px` }}
                      >
                        <badge.icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-medium text-slate-700">{badge.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="absolute right-[-10px] lg:right-[-14px] top-[28%] flex flex-col gap-2.5 lg:gap-3 items-end">
                    {[
                      { icon: ShieldCheck, label: "CRA-authorized under your signed consent", testId: "trust-badge-cra" },
                      { icon: Award, label: "Flat-fee, refund on unfiled work", testId: "trust-badge-guarantee" },
                      { icon: Lock, label: "Encrypted document handling", testId: "trust-badge-secure" },
                    ].map((badge, i) => (
                      <div
                        key={badge.testId}
                        data-testid={badge.testId}
                        className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-[14px] border border-white/60 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
                        style={{ marginRight: `${(i % 2) * 6}px` }}
                      >
                        <badge.icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs lg:text-sm font-medium text-slate-700 whitespace-nowrap">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do — Service Highlights */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">Our services</h2>
            <p className="text-base md:text-lg text-slate-600">
              End-to-end coordination of Canadian tax and customs work — from CRA registrations we
              perform in-house to CARM onboarding and commercial clearance coordination prepared for
              filing by your licensed broker.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mb-10">
            {[
              { icon: Package, title: "Customs Clearance Coordination", desc: "Flat-rate clearance coordination — declaration prepared for filing by your licensed broker.", href: "/services/customs-clearance-canada" },
              { icon: Landmark, title: "CARM Registration", desc: "End-to-end CARM portal onboarding for importers.", href: "/services/carm-registration-canada" },
              { icon: Globe, title: "Non-Resident Importer", desc: "Full NRI setup for foreign businesses selling in Canada.", href: "/services/non-resident-importer-canada" },
              { icon: FileCheck, title: "HS Code Classification", desc: "Accurate tariff classification to avoid penalties.", href: "/services/hs-code-classification-canada" },
              { icon: Shield, title: "Import Compliance", desc: "Comprehensive audit of your import operations.", href: "/services/import-compliance-review" },
              { icon: Calculator, title: "Trade Tools", desc: "Free calculators for duties, CARM, and HS codes.", href: "/tools" },
            ].map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="h-full cursor-pointer border border-slate-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300" data-testid={`card-home-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/services">
              <Button variant="outline" size="lg" className="cursor-pointer" data-testid="button-all-services">
                All Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" className="cursor-pointer" data-testid="button-view-pricing">
                View Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — authorization → file → CRA processing */}
      <HowItWorksSection />

      {/* Non-Resident Section */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <div className="lg:w-1/2">
              <img
                src={businessTeamImg}
                alt="International Business Team"
                width={720}
                height={480}
                loading="lazy"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
            <div className="lg:w-1/2 space-y-4 md:space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold font-display" data-testid="text-nonresident-title">Are You a Non-Resident Selling in Canada?</h2>
              <p className="text-base md:text-lg text-slate-600">
                New rules require many non-resident businesses to register for GST/HST under the simplified regime. If you sell digital products, services, or goods through fulfillment warehouses, you likely need to register.
              </p>
              <ul className="space-y-4">
                {[
                  "Digital Economy Compliance",
                  "Simplified GST/HST Regime Registration",
                  "Annual Information Return Filing",
                  "Election for Agents"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium text-slate-800">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/services/non-resident-importer-canada">
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-4 cursor-pointer"
                  data-testid="button-nonresident-learn-more"
                >
                  Learn More About Non-Resident Rules
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Refund policy */}
      <section className="py-8 md:py-12 bg-blue-50/50 border-y border-blue-100/50">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <Award className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto mb-3 md:mb-4" />
          <h3 className="text-xl font-bold font-display mb-2">Flat fee. Refund on unfiled work.</h3>
          <p className="text-slate-600 text-sm md:text-base">
            Full refund if you cancel before we submit your filing to the CRA or CBSA.
            If an application is rejected due to our error, we re-file or refund the service fee.
            See our <Link href="/refunds" className="underline hover:text-primary">Refund Policy</Link> for full terms.
          </p>
        </div>
      </section>

      {/* DIY vs us vs accountant comparison */}
      <DiyVsUsComparison />

      {/* Who we serve */}
      <WhoWeServeSection />

      {/* Client access */}
      <section className="py-10 md:py-14 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center">
          <Search className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl md:text-2xl font-bold font-display mb-2">Track your filing</h2>
          <p className="text-slate-600 mb-5 text-sm">
            Active clients can view submission status, documents, and messages in the client portal.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/portal">
              <Button variant="outline" className="cursor-pointer" data-testid="button-home-portal">
                Client Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/tools/shipment-tracking">
              <Button variant="outline" className="cursor-pointer" data-testid="button-home-tracking">
                Shipment Tracking
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPackage={selectedPackage}
      />
    </div>
  );
}

/**
 * Client testimonials will be added here once we have signed consent to
 * publish. Each entry should include: verbatim quote, full name + role,
 * company (if permitted), and the specific service delivered.
 * DO NOT fabricate. A compliance firm loses credibility instantly if a
 * prospect can't verify a named client.
 */
const CLIENT_PROFILES = [
  {
    label: "Canadian small businesses",
    body: "Incorporated companies and sole proprietors registering for their first Business Number, GST/HST, and payroll accounts with the CRA.",
  },
  {
    label: "Non-resident e-commerce sellers",
    body: "US, UK, and APAC sellers using Amazon FBA Canada, Shopify, or marketplace fulfillment — needing BN, GST/HST (simplified or full regime), and CARM onboarding.",
  },
  {
    label: "Importers and wholesalers",
    body: "Businesses moving commercial goods into Canada — CARM portal setup, financial security, RPP enrollment, and customs broker delegation.",
  },
  {
    label: "Logistics and 3PL partners",
    body: "Freight forwarders and fulfillment partners referring clients who need a turnkey Canadian compliance setup so shipments don't get held at the border.",
  },
];

function WhoWeServeSection() {
  return (
    <section className="py-12 md:py-20 bg-slate-900 text-white">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary/80 mb-2">Who we work with</p>
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-3" data-testid="text-who-we-serve-title">
            Built for businesses that need Canadian filings done right.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            Our clients are typically incorporated businesses or sole proprietors with concrete
            compliance needs — not consumers, not hobby projects. If you're in one of these
            categories, we can help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CLIENT_PROFILES.map((profile) => (
            <div
              key={profile.label}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6"
              data-testid={`client-profile-${profile.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <h3 className="text-base font-semibold text-white mb-2">{profile.label}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{profile.body}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center mt-8 max-w-2xl mx-auto">
          Client references are available on request for businesses considering multi-entity or
          recurring engagements. Individual case studies are not published without written consent.
        </p>
      </div>
    </section>
  );
}
