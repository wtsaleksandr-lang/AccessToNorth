import { lazy, Suspense, useState } from "react";
import { Link } from "wouter";
import businessTeamImg from "@/assets/images/business-team.jpg";
import { Button } from "@/components/ui/button";
import { DiyVsUsComparison } from "@/components/DiyVsUsComparison";
import { HowItWorksSection } from "@/components/HowItWorks";
import { HeroFilingWorkflow } from "@/components/HeroFilingWorkflow";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  ArrowRight, CheckCircle2, Star, Award, Landmark, Shield, Calculator,
  Package, Globe, FileCheck, Search, Boxes,
} from "lucide-react";

const RegistrationModal = lazy(() =>
  import("@/components/RegistrationModal").then((module) => ({ default: module.RegistrationModal })),
);

/**
 * Card-on-canvas shell.
 *
 * Every section is an object sitting on the #F2F4F7 canvas rather than a
 * full-bleed band, so the page reads as a stack of cards. 98% width, capped at
 * the 1328px outer container; 12px radius (the only large radius in the system).
 *
 * The 1px border is what makes the card read as an object: the hero wash
 * (#EFF6FF) and the canvas (#F2F4F7) sit within a point of each other in
 * lightness, so without an edge the hero dissolves into the page and the
 * composition looks like a background that failed to load. Border colour is
 * left to Tailwind's default (`--border`, the #E2E8F0 hairline); the dark card
 * overrides it with `border-white/10`.
 */
const SHELL = "w-[98%] max-w-container-outer mx-auto rounded-lg border overflow-hidden";

/**
 * Asymmetric section padding, measured from the reference. Adjacent sections
 * pull from different pairs so the vertical rhythm alternates instead of
 * stacking two equal gaps against each other.
 *
 * The reference's extremes (120/20, 80/0) were measured on full-bleed bands,
 * where the zero side simply butts onto the next band. Inside a rounded card a
 * 0–20px bottom edge reads as clipped content, so the tight side is floored at
 * the smallest value that still reads as deliberate padding.
 */
const PAD = {
  even: "pt-10 pb-10 md:pt-[76px] md:pb-[76px]",      // 40/40   → 76/76
  topHeavy: "pt-16 pb-10 md:pt-20 md:pb-[60px]",      // 64/40   → 80/60
  tight: "pt-12 pb-10 md:pt-[72px] md:pb-14",         // 48/40   → 72/56
  closing: "pt-14 pb-10 md:pt-20 md:pb-16",           // 56/40   → 80/64
} as const;

/** Inner content rail: 1280px of content inside the 1328px shell. */
const RAIL = "mx-auto max-w-container px-5 md:px-10";

/**
 * The three highest-intent entry points. Every destination already existed on
 * this page (they were a text link row buried under the services grid); they
 * are promoted into the hero card rather than invented.
 */
const HERO_ACTIONS = [
  {
    icon: Search,
    title: "Canadian HS Code Finder",
    desc: "Look up the tariff classification for what you ship.",
    href: "/tools/hs-code-finder",
    testId: "hero-action-hs-code-finder",
  },
  {
    icon: Boxes,
    title: "Container Loading Calculator",
    desc: "Plan a 3D load and check what actually fits.",
    href: "/tools/container-calculator",
    testId: "hero-action-container-calculator",
  },
  {
    icon: Calculator,
    title: "Customs Duty Calculator",
    desc: "Estimate duty, GST/HST, and landed cost.",
    href: "/customs-calculator",
    testId: "hero-action-customs-calculator",
  },
];

const SERVICES = [
  { icon: Package, title: "Customs Clearance Coordination", desc: "Flat-rate clearance coordination — declaration prepared for filing by your licensed broker.", href: "/services/customs-clearance-canada" },
  { icon: Landmark, title: "CARM Registration", desc: "End-to-end CARM portal onboarding for importers.", href: "/services/carm-registration-canada" },
  { icon: Globe, title: "Non-Resident Importer", desc: "Full NRI setup for foreign businesses selling in Canada.", href: "/services/non-resident-importer-canada" },
  { icon: FileCheck, title: "HS Code Classification", desc: "Accurate tariff classification to avoid penalties.", href: "/services/hs-code-classification-canada" },
  { icon: Shield, title: "Import Compliance", desc: "Comprehensive audit of your import operations.", href: "/services/import-compliance-review" },
  { icon: Calculator, title: "Trade Tools", desc: "Free calculators for duties, CARM, and HS codes.", href: "/tools" },
];

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("gst-hst");
  const [heroHelpRequested, setHeroHelpRequested] = useState(false);

  usePageMeta({
    title: "AccessToNorth.com | Canadian Business & Import Registration",
    description: "Flat-fee Canadian business registration. GST/HST, Business Numbers, CARM, customs clearance, and non-resident compliance. From CA$99. 5–10 business days.",
    canonical: "/",
  });

  const handleOpenModal = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const scrollToAssistant = () =>
    document.getElementById("filing-assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-surface-canvas font-sans">
      {/*
        The Navbar is `position: fixed` (83px tall at every breakpoint), so it
        reserves no space in flow — each page has to clear it itself. The old
        hero did that with `pt-24 md:pt-32` on the section; now that the hero is
        a card, the clearance belongs on `main` instead, so the canvas (and the
        card's top edge) stay visible under the header: 83px nav + the 16px
        inter-card gap.
      */}
      <main className="flex flex-col gap-4 pb-4 pt-[99px]">

        {/* ── Hero card ───────────────────────────────────────────────── */}
        <section className={`${SHELL} surface-hero-wash ${PAD.even}`}>
          <div className={RAIL}>
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
              <div className="min-w-0 lg:w-1/2">
                <p className="text-eyebrow uppercase text-text-muted" data-testid="text-hero-eyebrow">
                  Canadian business &amp; import registrations
                </p>

                <h1
                  className="mt-4 text-h1-sm text-text-primary md:text-h1"
                  data-testid="text-hero-title"
                >
                  Get your Canadian{" "}
                  <span className="text-brand">tax and import accounts</span>{" "}
                  set up correctly.
                </h1>

                <p className="mt-5 max-w-lg text-lead text-text-muted">
                  Choose what you need, upload your documents securely, and track the filing
                  online. Fixed pricing for Canadian and non-resident businesses.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                    data-testid="button-start-registration"
                    onClick={scrollToAssistant}
                  >
                    Choose your registration
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                    onClick={() => {
                      setHeroHelpRequested(true);
                      scrollToAssistant();
                    }}
                    data-testid="button-help-choose"
                  >
                    Help me choose
                  </Button>
                </div>

                <div className="mt-6 flex items-center gap-3" data-testid="hero-client-proof">
                  <div className="flex -space-x-2.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className="h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-surface-canvas">
                        <img src={`/images/avatar-${index}.webp`} alt="" width={36} height={36} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="flex text-amber-400" aria-label="Five stars">
                      {[1, 2, 3, 4, 5].map((index) => <Star key={index} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />)}
                    </div>
                    <p className="mt-0.5 text-body font-medium leading-tight text-text-muted">Canadian &amp; non-resident clients</p>
                  </div>
                </div>

                <Link
                  href="/resources/how-to-import-into-canada"
                  /*
                    `inline`, not `inline-flex`: as a flex container the arrow
                    stays on its own flex line and drifts to the far right when
                    the label wraps to two lines (visible at 1024 and 375).
                    Inline keeps it attached to the final word.
                  */
                  className="group mt-5 inline-block max-w-lg text-body font-semibold text-text-secondary transition-colors duration-state hover:text-brand"
                  data-testid="link-hero-import-guide"
                >
                  New to importing? Read the 2026 step-by-step Canada import guide
                  <ArrowRight
                    className="ml-1.5 inline h-4 w-4 align-[-3px] transition-transform duration-state group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>

              <div className="w-full min-w-0 lg:w-1/2">
                <HeroFilingWorkflow onStart={handleOpenModal} helpRequested={heroHelpRequested} />
              </div>
            </div>

            {/*
              Highest-intent actions, inside the same hero card.
              The divider here is GAP, not a border: a 4px grid gap over the
              #F2F4F7 canvas shell, so the shell itself reads as the rule.
              Concentric radii — 12px shell, 4px padding, 8px children.
            */}
            <div className="mt-10 rounded-lg bg-surface-canvas p-1 md:mt-12" data-testid="hero-actions">
              <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
                {HERO_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex flex-col rounded-md border border-transparent bg-white p-5 transition-colors duration-state hover:border-brand"
                    data-testid={action.testId}
                  >
                    <action.icon className="h-5 w-5 text-brand" aria-hidden="true" />
                    <h3 className="mt-3 text-h3 text-text-primary">{action.title}</h3>
                    <p className="mt-1.5 text-body text-text-muted">{action.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-body font-semibold text-text-secondary transition-colors duration-state group-hover:text-brand">
                      Open tool
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-state group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Services bento ──────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.topHeavy}`}>
          <div className={RAIL}>
            <div className="max-w-2xl">
              <p className="text-eyebrow uppercase text-text-muted">What we do</p>
              <h2 className="mt-3 text-h2 text-text-primary">Our services</h2>
              <p className="mt-4 text-lead text-text-muted">
                End-to-end coordination of Canadian tax and customs work — from CRA registrations we
                perform in-house to CARM onboarding and commercial clearance coordination prepared for
                filing by your licensed broker.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SERVICES.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex flex-col rounded-lg border border-border-hairline bg-white p-6 transition-colors duration-state hover:border-brand"
                  data-testid={`card-home-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className="h-5 w-5 text-brand" aria-hidden="true" />
                  <h3 className="mt-4 text-h3 text-text-primary">{item.title}</h3>
                  <p className="mt-2 flex-1 text-body text-text-muted">{item.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-body font-semibold text-text-secondary transition-colors duration-state group-hover:text-brand">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-state group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/services">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand sm:w-auto"
                  data-testid="button-all-services"
                >
                  All Services
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  className="w-full bg-brand text-white transition-colors duration-state hover:bg-brand-hover sm:w-auto"
                  data-testid="button-view-pricing"
                >
                  View Pricing
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────── */}
        <HowItWorksSection shellClassName={SHELL} padClassName={PAD.tight} railClassName={RAIL} />

        {/* ── Non-resident ────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-surface-recessed ${PAD.closing}`}>
          <div className={RAIL}>
            <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-12">
              <div className="w-full min-w-0 lg:w-1/2">
                <img
                  src={businessTeamImg}
                  alt="International Business Team"
                  width={720}
                  height={480}
                  loading="lazy"
                  className="h-auto w-full rounded-lg"
                />
              </div>
              <div className="min-w-0 lg:w-1/2">
                <h2 className="text-h2 text-text-primary" data-testid="text-nonresident-title">
                  Are You a Non-Resident Selling in Canada?
                </h2>
                <p className="mt-4 text-lead text-text-muted">
                  New rules require many non-resident businesses to register for GST/HST under the simplified regime. If you sell digital products, services, or goods through fulfillment warehouses, you likely need to register.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Digital Economy Compliance",
                    "Simplified GST/HST Regime Registration",
                    "Annual Information Return Filing",
                    "Election for Agents",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand" aria-hidden="true" />
                      <span className="text-body font-medium text-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/services/non-resident-importer-canada">
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-7 border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                    data-testid="button-nonresident-learn-more"
                  >
                    Learn More About Non-Resident Rules
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Refund policy ───────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.tight}`}>
          <div className={RAIL}>
            <div className="max-w-2xl">
              <Award className="h-6 w-6 text-brand" aria-hidden="true" />
              <h2 className="mt-4 text-h2 text-text-primary">Flat fee. Refund on unfiled work.</h2>
              <p className="mt-4 text-lead text-text-muted">
                Full refund if you cancel before we submit your filing to the CRA or CBSA.
                If an application is rejected due to our error, we re-file or refund the service fee.
                See our{" "}
                <Link href="/refunds" className="font-semibold text-text-secondary underline underline-offset-4 transition-colors duration-state hover:text-brand">
                  Refund Policy
                </Link>{" "}
                for full terms.
              </p>
            </div>
          </div>
        </section>

        {/* ── DIY vs us vs accountant ─────────────────────────────────── */}
        <DiyVsUsComparison shellClassName={SHELL} padClassName={PAD.topHeavy} railClassName={RAIL} />

        {/* ── Who we serve (dark) ─────────────────────────────────────── */}
        <WhoWeServeSection />

        {/* ── Client access ───────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.closing}`}>
          <div className={RAIL}>
            <div className="max-w-2xl">
              <p className="text-eyebrow uppercase text-text-muted">Already a client</p>
              <h2 className="mt-3 text-h2 text-text-primary">Track your filing</h2>
              <p className="mt-4 text-lead text-text-muted">
                Active clients can view submission status, documents, and messages in the client portal.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/portal">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand sm:w-auto"
                    data-testid="button-home-portal"
                  >
                    Client Portal
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/tools/shipment-tracking">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand sm:w-auto"
                    data-testid="button-home-tracking"
                  >
                    Shipment Tracking
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {modalOpen && (
        <Suspense fallback={null}>
          <RegistrationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            defaultPackage={selectedPackage}
          />
        </Suspense>
      )}
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

/**
 * Dark feature card. FLAT #0C111D with a 1px rgba(255,255,255,.1) inner
 * hairline — no gradient. Headings carry an explicit light colour because the
 * global `h1..h6 { @apply text-foreground }` base rule overrides an inherited
 * `text-white` from an ancestor (see PR notes).
 */
function WhoWeServeSection() {
  return (
    <section className={`${SHELL} border-white/10 surface-dark ${PAD.topHeavy}`}>
      <div className={RAIL}>
        <div className="max-w-2xl">
          <p className="text-eyebrow uppercase text-text-deemphasis">Who we work with</p>
          <h2 className="mt-3 text-h2 text-white" data-testid="text-who-we-serve-title">
            Built for businesses that need Canadian filings done right.
          </h2>
          <p className="mt-4 text-lead text-text-deemphasis">
            Our clients are typically incorporated businesses or sole proprietors with concrete
            compliance needs — not consumers, not hobby projects. If you're in one of these
            categories, we can help.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {CLIENT_PROFILES.map((profile) => (
            <div
              key={profile.label}
              className="rounded-lg border border-white/10 p-6"
              data-testid={`client-profile-${profile.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <h3 className="text-h3 text-white">{profile.label}</h3>
              <p className="mt-2 text-body text-text-deemphasis">{profile.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-body text-text-deemphasis">
          Client references are available on request for businesses considering multi-entity or
          recurring engagements. Individual case studies are not published without written consent.
        </p>
      </div>
    </section>
  );
}
