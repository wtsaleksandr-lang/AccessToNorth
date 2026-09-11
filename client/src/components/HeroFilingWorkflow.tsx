import { useEffect, useState } from "react";
import {
  ArrowRight, Award, BadgeCheck, BriefcaseBusiness, Building2, Check,
  CircleHelp, FileText, Landmark, Lock, ReceiptText, Shield, ShieldCheck, Ship,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type FilingOption = {
  id: string;
  serviceKey: string;
  title: string;
  short: string;
  price: string;
  includes: string[];
  documents: string;
  timing: string;
  icon: typeof BriefcaseBusiness;
};

const filingOptions: FilingOption[] = [
  {
    id: "business-starter",
    serviceKey: "bundle_business_starter",
    title: "BN + GST/HST",
    short: "Starting or formalizing a Canadian business",
    price: "CA$299",
    includes: ["Business Number application", "GST/HST account registration"],
    documents: "Business, owner/director, and activity details",
    timing: "CRA commonly issues a BN in 5–10 business days",
    icon: BriefcaseBusiness,
  },
  {
    id: "business-number",
    serviceKey: "bn",
    title: "Business Number",
    short: "You need a CRA business identifier first",
    price: "CA$99",
    includes: ["BN application preparation", "CRA confirmation record"],
    documents: "Legal business and owner/director details",
    timing: "CRA commonly issues a BN in 5–10 business days",
    icon: Landmark,
  },
  {
    id: "gst-hst",
    serviceKey: "gst_hst",
    title: "GST/HST Account",
    short: "You need to collect and remit Canadian sales tax",
    price: "CA$249",
    includes: ["Registration preparation", "Account confirmation record"],
    documents: "Business, revenue, sales, and effective-date details",
    timing: "Timing depends on CRA review and account readiness",
    icon: ReceiptText,
  },
  {
    id: "importer-launch",
    serviceKey: "bundle_complete_importer",
    title: "Importer Launch Kit",
    short: "You plan to import commercial goods into Canada",
    price: "CA$1,500",
    includes: ["BN + GST/HST setup", "CARM portal + RPP coordination"],
    documents: "Business ownership and planned import activity details",
    timing: "Timeline is confirmed after account-readiness review",
    icon: Ship,
  },
];

const trustSignals = [
  { icon: ShieldCheck, label: "Submitted under your signed authorization", testId: "trust-badge-cra" },
  { icon: Award, label: "Fixed fee · refund before filing", testId: "trust-badge-guarantee" },
  { icon: Lock, label: "Encrypted document handling", testId: "trust-badge-secure" },
];

/**
 * Reference agencies, NOT endorsements or partners.
 *
 * AccessToNorth is not affiliated with, endorsed by, or acting on behalf of
 * any of these bodies — the caveat below the row says so, and it must stay.
 * These are rendered deliberately greyscale and de-emphasised so the row reads
 * as "these are the filing environments we work in", never as a logo wall of
 * customers or partners. Do not restyle this into social proof, and do not add
 * customer logos, client counts, or ratings here.
 */
const agencies = [
  { icon: Landmark, label: "CRA", testId: "inst-badge-cra" },
  { icon: Building2, label: "CBSA", testId: "inst-badge-cbsa" },
  { icon: Shield, label: "IRS", testId: "inst-badge-irs" },
  { icon: BadgeCheck, label: "USPTO", testId: "inst-badge-uspto" },
  { icon: Building2, label: "SBA", testId: "inst-badge-sba" },
];

interface HeroFilingWorkflowProps {
  onStart: (serviceKey: string) => void;
  helpRequested?: boolean;
}

export function HeroFilingWorkflow({ onStart, helpRequested = false }: HeroFilingWorkflowProps) {
  const [selectedId, setSelectedId] = useState(filingOptions[0].id);
  const [showHelp, setShowHelp] = useState(false);
  const selected = filingOptions.find((option) => option.id === selectedId) ?? filingOptions[0];

  useEffect(() => {
    if (helpRequested) setShowHelp(true);
  }, [helpRequested]);

  return (
    <div
      id="filing-assistant"
      className="mx-auto w-full max-w-[620px] scroll-mt-24"
      data-testid="hero-filing-workflow"
    >
      <div
        className="overflow-hidden rounded-lg border border-border-hairline bg-white shadow-md"
        data-testid="hero-workflow-card"
      >
        {/*
          Dark panel header. `text-white` on this wrapper is NOT enough for the
          heading: the global `h1..h6 { @apply text-foreground }` base rule sets
          the colour on the element itself, which beats an inherited value — so
          the h2 painted #020618 ink on #0C111D and was invisible. Every heading
          on a dark surface needs its colour stated explicitly.

          Layout: the badge is in normal flow with `shrink-0`, and the text
          column is `min-w-0`, so the two can never stack on top of each other —
          they wrap instead.
        */}
        <div className="surface-dark px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-eyebrow uppercase text-text-deemphasis">
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Filing assistant
              </p>
              <h2 className="mt-2 text-h3 text-white sm:text-lead sm:font-semibold">
                What do you need set up?
              </h2>
            </div>
            <span className="shrink-0 rounded-sm border border-white/10 px-2.5 py-1 text-eyebrow uppercase text-text-deemphasis">
              Fixed pricing
            </span>
          </div>
          <p className="mt-2 text-body text-text-deemphasis">
            Select a service to see the exact price and next step.
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="list" aria-label="Registration services">
            {filingOptions.map((option) => {
              const active = option.id === selected.id;
              const Icon = option.icon;
              return (
                <div key={option.id} role="listitem">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setSelectedId(option.id); setShowHelp(false); }}
                    /*
                      Selection is a 2px border COLOUR swap only
                      (#EAECF0 → #3356EE). The width never changes, so
                      selecting a card reflows nothing, and there is no bright
                      fill competing with the text.
                    */
                    className={`h-full w-full min-w-0 rounded-md border-2 bg-white p-4 text-left transition-colors duration-state ${
                      active ? "border-brand" : "border-border-app hover:border-border-control"
                    }`}
                    data-testid={`hero-option-${option.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Icon
                        className={`h-5 w-5 shrink-0 ${active ? "text-brand" : "text-text-deemphasis"}`}
                        aria-hidden="true"
                      />
                      <span className={`text-body font-bold ${active ? "text-brand" : "text-text-primary"}`}>
                        {option.price}
                      </span>
                    </div>
                    <span className="mt-3 block text-h3 text-text-primary">{option.title}</span>
                    <span className="mt-1 block text-body leading-snug text-text-muted">{option.short}</span>
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowHelp((current) => !current)}
            className="mt-2 flex w-full items-center justify-between gap-3 rounded-md border-2 border-border-app bg-white px-4 py-3 text-left text-body font-semibold text-text-secondary transition-colors duration-state hover:border-brand"
            aria-expanded={showHelp}
            data-testid="hero-help-choose"
          >
            <span className="flex min-w-0 items-center gap-2">
              <CircleHelp className="h-4 w-4 shrink-0 text-text-deemphasis" aria-hidden="true" />
              Not sure which service fits?
            </span>
            <span className="shrink-0 text-brand">Help me choose</span>
          </button>

          {showHelp ? (
            <div
              className="mt-2 rounded-md border border-border-hairline bg-surface-recessed p-4 text-body leading-relaxed text-text-muted"
              data-testid="hero-choice-guide"
            >
              <p>
                <strong className="text-text-primary">Starting a business?</strong> Choose BN + GST/HST.{" "}
                <strong className="text-text-primary">Only need a CRA identifier?</strong> Choose Business Number.{" "}
                <strong className="text-text-primary">Collecting Canadian sales tax?</strong> Choose GST/HST.{" "}
                <strong className="text-text-primary">Importing commercial goods?</strong> Choose the Importer Launch Kit.
              </p>
            </div>
          ) : null}

          <div
            className="mt-2 rounded-md border border-border-hairline bg-surface-recessed p-4"
            data-testid="hero-selected-service"
          >
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                <p className="text-eyebrow uppercase text-text-deemphasis">Selected service</p>
                <h3 className="mt-1 text-h3 text-text-primary">{selected.title}</h3>
              </div>
              <p className="shrink-0 text-lead font-bold text-text-primary">{selected.price}</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {selected.includes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-body font-medium leading-snug text-text-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-700" strokeWidth={2.5} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 border-t border-border-hairline pt-4 text-body leading-relaxed text-text-muted">
              <p><strong className="font-semibold text-text-secondary">Prepare:</strong> {selected.documents}</p>
              <p><strong className="font-semibold text-text-secondary">Timing:</strong> {selected.timing}</p>
            </div>

            <Button
              type="button"
              className="mt-4 w-full bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
              onClick={() => onStart(selected.serviceKey)}
              data-testid="hero-start-selected"
            >
              Start this filing
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="mt-3 text-center text-body text-text-deemphasis">
              One-time service fee. Government approval and processing remain outside our control.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="hero-trust-signals">
        {trustSignals.map((signal) => (
          <div
            key={signal.testId}
            data-testid={signal.testId}
            className="flex items-start gap-2 rounded-md border border-border-hairline bg-white px-4 py-3"
          >
            <signal.icon className="mt-0.5 h-4 w-4 shrink-0 text-text-deemphasis" aria-hidden="true" />
            <span className="min-w-0 text-body font-medium leading-snug text-text-secondary">{signal.label}</span>
          </div>
        ))}
      </div>

      {/*
        Reference-agency row. Restyled — flat, greyscale, legible — but the
        MEANING is unchanged: these are the filing environments we work in, not
        endorsements, and the caveat underneath stays verbatim.

        Laid out as a grid rather than a wrapping flex row: 3 + 2 at mobile,
        5 across from `sm`. A wrapping flex row put the pills hard against the
        panel's padding edge and could strand a single pill on its own line.
      */}
      <div
        className="mt-2 rounded-md border border-border-hairline bg-white px-4 py-3"
        data-testid="hero-agency-row"
      >
        <p className="text-eyebrow uppercase text-text-deemphasis">Canada &amp; US filing environments</p>
        <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-5">
          {agencies.map((agency) => (
            <span
              key={agency.testId}
              data-testid={agency.testId}
              className="inline-flex min-w-0 items-center gap-1.5 text-body font-semibold text-text-muted"
            >
              <agency.icon className="h-4 w-4 shrink-0 text-text-deemphasis" aria-hidden="true" />
              <span className="truncate">{agency.label}</span>
            </span>
          ))}
        </div>
        <p className="mt-3 border-t border-border-hairline pt-3 text-body leading-relaxed text-text-deemphasis">
          Reference agencies only—not affiliated with or endorsed by them.
        </p>
      </div>

      <div className="mt-3 text-center">
        <Link
          href="/pricing"
          className="text-body font-semibold text-text-muted underline-offset-4 transition-colors duration-state hover:text-brand hover:underline"
        >
          View every service and price
        </Link>
      </div>
    </div>
  );
}
