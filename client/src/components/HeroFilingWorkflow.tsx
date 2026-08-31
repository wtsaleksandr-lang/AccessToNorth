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
    <div id="filing-assistant" className="relative mx-auto w-full max-w-[620px] scroll-mt-24" data-testid="hero-filing-workflow">
      <div className="absolute inset-x-8 -bottom-4 top-8 rounded-[30px] bg-slate-300/50 blur-2xl" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.55)]" data-testid="hero-workflow-card">
        <div className="border-b border-slate-200 bg-slate-950 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Filing assistant
              </div>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">What do you need set up?</h2>
              <p className="mt-1 text-xs text-slate-400">Select a service to see the exact price and next step.</p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold text-blue-200 sm:block">Fixed pricing</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5" role="list" aria-label="Registration services">
            {filingOptions.map((option) => {
              const active = option.id === selected.id;
              const Icon = option.icon;
              return (
                <div key={option.id} role="listitem">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setSelectedId(option.id); setShowHelp(false); }}
                    className={`h-full w-full min-w-0 rounded-2xl border p-3 text-left transition-all sm:p-3.5 ${active ? "border-primary bg-blue-50 shadow-[0_8px_22px_-16px_rgba(0,113,227,0.8)] ring-1 ring-primary/15" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                    data-testid={`hero-option-${option.id}`}
                  >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className={`text-xs font-bold ${active ? "text-primary" : "text-slate-800"}`}>{option.price}</span>
                  </div>
                  <span className="mt-2.5 block text-xs font-bold leading-tight text-slate-900 sm:text-sm">{option.title}</span>
                  <span className="mt-1 block text-[10px] leading-snug text-slate-500 sm:text-[11px]">{option.short}</span>
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowHelp((current) => !current)}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:text-primary"
            aria-expanded={showHelp}
            data-testid="hero-help-choose"
          >
            <span className="flex items-center gap-2"><CircleHelp className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Not sure which service fits?</span>
            <span className="shrink-0 text-primary">Help me choose</span>
          </button>

          {showHelp ? (
            <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-[11px] leading-relaxed text-slate-600" data-testid="hero-choice-guide">
              <p><strong className="text-slate-800">Starting a business?</strong> Choose BN + GST/HST. <strong className="text-slate-800">Only need a CRA identifier?</strong> Choose Business Number. <strong className="text-slate-800">Collecting Canadian sales tax?</strong> Choose GST/HST. <strong className="text-slate-800">Importing commercial goods?</strong> Choose the Importer Launch Kit.</p>
            </div>
          ) : null}

          <div className="mt-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4" data-testid="hero-selected-service">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Selected service</p>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{selected.title}</h3>
              </div>
              <p className="shrink-0 text-base font-extrabold text-slate-900">{selected.price}</p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selected.includes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-[11px] font-medium leading-snug text-slate-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
              <p><strong className="text-slate-700">Prepare:</strong> {selected.documents}</p>
              <p><strong className="text-slate-700">Timing:</strong> {selected.timing}</p>
            </div>

            <Button type="button" className="mt-3.5 w-full shadow-md shadow-primary/15" onClick={() => onStart(selected.serviceKey)} data-testid="hero-start-selected">
              Start this filing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-2 text-center text-[10px] text-slate-400">One-time service fee. Government approval and processing remain outside our control.</p>
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="hero-trust-signals">
        {trustSignals.map((signal) => (
          <div key={signal.testId} data-testid={signal.testId} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-sm sm:items-start">
            <signal.icon className="h-4 w-4 shrink-0 text-primary sm:mt-0.5" aria-hidden="true" />
            <span className="text-[11px] font-medium leading-snug text-slate-600">{signal.label}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-2.5 rounded-xl border border-slate-200/90 bg-white/75 px-3 py-2.5 backdrop-blur-sm" data-testid="hero-agency-row">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Canada &amp; US filing environments</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 sm:justify-end">
            {agencies.map((agency) => (
              <span key={agency.testId} data-testid={agency.testId} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <agency.icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{agency.label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-1.5 text-center text-[9px] leading-relaxed text-slate-400 sm:text-right">Reference agencies only—not affiliated with or endorsed by them.</p>
      </div>

      <div className="relative mt-2 text-center">
        <Link href="/pricing" className="text-[11px] font-semibold text-slate-500 underline-offset-4 hover:text-primary hover:underline">View every service and price</Link>
      </div>
    </div>
  );
}
