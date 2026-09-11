import { useState, useRef } from "react";
import { ToolWorkedExample } from "@/components/ToolWorkedExample";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Callout,
  FieldLabel,
  Input,
  ResultCard,
  Select,
  SelectItem,
  StepRibbon,
  TOOL_SUCCESS,
} from "@/components/tools";
import {
  Calculator,
  Shield,
  Banknote,
  CheckCircle2,
  Check,
  Info,
  Mail,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Globe,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateCarmSecurity } from "@shared/customsEstimate";
import { usePageMeta } from "@/hooks/use-page-meta";

type SecurityType = "both" | "bond" | "cash";
type Frequency = "occasional" | "regular" | "high-volume";

/**
 * Card-on-canvas shell, matching Home and the Customs Calculator. Each section
 * is an object on the #F2F4F7 canvas rather than a full-bleed band.
 */
const SHELL = "w-[98%] max-w-container-outer mx-auto rounded-lg border overflow-hidden";

/** Inner content rail: 1280px of content inside the 1328px shell. */
const RAIL = "mx-auto max-w-container px-5 md:px-10";

/** The calculator itself reads better narrow than the full 1280px rail. */
const FORM_RAIL = "mx-auto max-w-3xl px-5 md:px-10";

/** Asymmetric section padding — adjacent sections pull from different pairs. */
const PAD = {
  even: "pt-10 pb-10 md:pt-[76px] md:pb-[76px]",
  topHeavy: "pt-16 pb-10 md:pt-20 md:pb-[60px]",
  tight: "pt-12 pb-10 md:pt-[72px] md:pb-14",
} as const;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseNumericInput(value: string): number {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

function formatInputCurrency(value: string): string {
  const num = parseNumericInput(value);
  if (num === 0 && value === "") return "";
  return num.toLocaleString("en-CA");
}

export default function CarmSecurityCalculator() {
  const [monthlyPayable, setMonthlyPayable] = useState("");
  const [securityType, setSecurityType] = useState<SecurityType>("both");
  const [frequency, setFrequency] = useState<Frequency | "">("");
  const [isNonResident, setIsNonResident] = useState(false);
  const [inputError, setInputError] = useState("");

  const [showResults, setShowResults] = useState(false);
  const [bondEstimate, setBondEstimate] = useState(0);
  const [cashEstimate, setCashEstimate] = useState(0);
  const [annualPremium, setAnnualPremium] = useState(0);
  const [minimumApplied, setMinimumApplied] = useState(false);
  const [maximumApplied, setMaximumApplied] = useState(false);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadImportRange, setLeadImportRange] = useState("");
  const [leadCurrentlyImporting, setLeadCurrentlyImporting] = useState<boolean | null>(null);
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});

  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  usePageMeta({
    title: "CARM Financial Security Calculator (Bond vs Cash) | AccessToNorth.com",
    description: "Estimate CARM RPP written security and cash deposits from the highest monthly CBSA accounts receivable for each BN15 importer account.",
    canonical: "/carm-security-calculator",
  });

  const handleMonthlyPayableChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, "");
    setMonthlyPayable(formatInputCurrency(cleaned));
    setInputError("");
  };

  const handleCalculate = () => {
    const amount = parseNumericInput(monthlyPayable);
    if (!monthlyPayable || amount === 0) {
      setInputError("Please enter your highest monthly amount payable.");
      return;
    }
    if (amount < 0) {
      setInputError("Amount cannot be negative.");
      return;
    }
    if (amount > 999999999) {
      setInputError("Amount seems too high. Please check your number.");
      return;
    }
    setInputError("");
    setShowResults(false);

    const premiumRate = isNonResident ? 0.0225 : 0.015;
    const calculation = calculateCarmSecurity(amount, premiumRate);
    setBondEstimate(calculation.writtenSecurity);
    setCashEstimate(calculation.cashSecurity);
    setAnnualPremium(calculation.estimatedAnnualPremium);
    setMinimumApplied(calculation.minimumApplied);
    setMaximumApplied(calculation.maximumApplied);
    setShowResults(true);

    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const validateLeadForm = () => {
    const errors: Record<string, string> = {};
    if (!leadEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) errors.email = "Valid email is required";
    if (!leadCompany.trim()) errors.companyName = "Company name is required";
    if (!leadImportRange) errors.importValueRange = "Please select a range";
    if (leadCurrentlyImporting === null) errors.currentlyImporting = "Please select Yes or No";
    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLeadSubmit = async () => {
    if (!validateLeadForm()) return;
    setLeadSubmitting(true);
    try {
      await apiRequest("POST", "/api/leads/carm-security", {
        email: leadEmail,
        companyName: leadCompany,
        importValueRange: leadImportRange,
        currentlyImporting: leadCurrentlyImporting,
        phone: leadPhone || undefined,
        highestMonthlyPayable: monthlyPayable,
        bondEstimate: bondEstimate.toString(),
        cashEstimate: cashEstimate.toString(),
        applyMinimum: minimumApplied,
        frequency: frequency || undefined,
        isNonResident,
      });

      setLeadSubmitted(true);

      const isLowPriority = !leadCurrentlyImporting || leadImportRange === "< $10k";
      if (isLowPriority) {
        toast({
          title: "Request received",
          description: "Your request is saved. For low-volume importers, self-serve guidance is usually enough.",
        });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    } finally {
      setLeadSubmitting(false);
    }
  };

  const frequencyHelperText: Record<string, string> = {
    occasional: "For occasional importers, a surety bond is often the most cost-effective option.",
    regular: "Regular importers typically benefit from a surety bond to free up cash flow.",
    "high-volume": "High-volume importers should speak to a broker about optimal security structuring.",
  };

  /**
   * Read-out of progress through the flow. Derived from state the form already
   * holds — it renders no controls and gates nothing, so it cannot change the
   * amount that gets calculated.
   */
  const doneSteps: number[] = [];
  if (parseNumericInput(monthlyPayable) > 0) doneSteps.push(0);
  if (showResults) doneSteps.push(1);
  const currentStep = [0, 1, 2].find((i) => !doneSteps.includes(i)) ?? 2;

  return (
    <div className="min-h-screen bg-surface-canvas font-sans">
      {/*
        The Navbar is `position: fixed` (83px tall at every breakpoint) and
        reserves no space in flow, so the page clears it here: 83px nav + the
        16px inter-card gap.
      */}
      <main className="flex flex-col gap-4 pb-4 pt-[99px]">

        {/* ── Hero card ───────────────────────────────────────────────── */}
        <section className={`${SHELL} border-white/10 surface-dark ${PAD.even}`}>
          <div className={RAIL}>
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
              <div className="min-w-0 lg:w-1/2">
                <p className="text-eyebrow uppercase text-text-deemphasis">Free Estimate Tool</p>
                <h1
                  className="mt-4 text-h1-sm text-white md:text-h1"
                  data-testid="text-calc-heading"
                >
                  CARM Financial Security Estimate
                </h1>
                <p className="mt-5 max-w-lg text-lead text-text-deemphasis" data-testid="text-calc-subheading">
                  Estimate written security versus cash using your highest monthly CBSA accounts receivable.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                    onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    data-testid="button-hero-calculate"
                  >
                    <Calculator className="mr-2 h-4 w-4" aria-hidden="true" />
                    Calculate my estimate
                    <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Button>
                  <button
                    type="button"
                    className="cursor-pointer text-body font-semibold text-text-deemphasis underline underline-offset-4 transition-colors duration-state hover:text-white sm:self-center"
                    onClick={() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    data-testid="link-what-is-carm"
                  >
                    What is CARM security?
                  </button>
                </div>
              </div>

              {/*
                Illustrative panel. It carries NO dollar amounts — the two tiles
                show the labels the real result cards use and nothing else. A
                decorative figure sitting beside a live security calculator could
                be mistaken for a real requirement, so there is none, and the
                panel says "Sample layout" on its face.
              */}
              <div className="w-full min-w-0 lg:w-1/2">
                <div
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
                  data-testid="card-hero-mockup"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-eyebrow uppercase text-text-deemphasis">Sample layout</span>
                    <div
                      className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5"
                      data-testid="badge-estimate-ready"
                    >
                      <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                      <div>
                        <p className="text-[12px] font-semibold leading-tight text-white">Estimate ready</p>
                        <p className="text-[11px] leading-tight text-text-deemphasis">Based on your inputs</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 space-y-3" aria-hidden="true">
                    <div className="h-3 w-3/4 rounded-md bg-white/10" />
                    <div className="h-9 rounded-md border border-white/10 bg-white/[0.06]" />
                    <div className="h-3 w-1/2 rounded-md bg-white/10" />
                    <div className="h-9 rounded-md border border-white/10 bg-white/[0.06]" />
                    <div className="h-3 w-2/3 rounded-md bg-white/10" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {["Written security (bond)", "Cash deposit"].map((label) => (
                      <div key={label} className="rounded-md border border-white/10 p-3">
                        <p className="text-[12px] leading-tight text-text-deemphasis">{label}</p>
                        <div className="mt-2 h-4 w-3/4 rounded-[4px] bg-white/10" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Calculator ──────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.topHeavy}`} ref={formRef}>
          <div className={FORM_RAIL}>
            <div data-testid="card-calculator-form">
              <StepRibbon
                steps={[{ label: "Amount" }, { label: "Compare" }, { label: "Next steps" }]}
                current={currentStep}
                completed={doneSteps}
                className="mb-5"
                data-testid="step-ribbon-carm"
              />

              <h2 className="text-h2 text-text-primary">Enter Your Details</h2>
              <p className="mt-2 text-lead text-text-muted">
                One BN15 importer program account at a time.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  {/*
                    The help text qualifies WHAT number belongs in the field, so
                    it sits above the control — a reader who meets it underneath
                    has already typed the wrong figure.
                  */}
                  <FieldLabel
                    htmlFor="monthly-payable"
                    required
                    help={
                      <span className="flex items-start gap-1.5">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Include GST, duties, and surtax for one importer program account (BN15). Check the CARM portal or your broker statement.
                      </span>
                    }
                  >
                    Highest monthly CBSA accounts receivable (last 12 months)
                  </FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] leading-5 text-text-deemphasis">
                      CAD $
                    </span>
                    <Input
                      id="monthly-payable"
                      data-testid="input-monthly-payable"
                      value={monthlyPayable}
                      onChange={(e) => handleMonthlyPayableChange(e.target.value)}
                      placeholder="e.g. 25,000"
                      className={`pl-[68px] tabular-nums ${inputError ? "border-[#B42318]" : ""}`}
                    />
                  </div>
                  {inputError && (
                    <p className="mt-2 text-[14px] leading-5 text-[#B42318]" role="alert" data-testid="text-input-error">
                      {inputError}
                    </p>
                  )}
                </div>

                <div>
                  <FieldLabel required>Choose security type to compare</FieldLabel>
                  {/*
                    Selection is the 2px border swap #EAECF0 -> #3356EE. The
                    border is 2px in BOTH states, so picking an option repaints
                    an edge and moves nothing.
                  */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {([
                      { value: "both", label: "Show both", sub: "Recommended" },
                      { value: "bond", label: "Bond only", sub: "Written security" },
                      { value: "cash", label: "Cash only", sub: "Cash deposit" },
                    ] as const).map((option) => {
                      const active = securityType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={active}
                          data-testid={`radio-security-${option.value}`}
                          onClick={() => setSecurityType(option.value)}
                          className={`cursor-pointer rounded-lg border-2 p-4 text-left transition-colors duration-state ${
                            active
                              ? "border-brand bg-white"
                              : "border-border-app bg-surface-recessed hover:border-border-control"
                          }`}
                        >
                          <span className="block text-[14px] font-semibold leading-5 text-text-primary">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-[13px] leading-[18px] text-text-muted">
                            {option.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="frequency">Import frequency (optional)</FieldLabel>
                  <Select
                    id="frequency"
                    value={frequency}
                    onValueChange={(v) => setFrequency(v as Frequency)}
                    placeholder="Select your import frequency"
                    data-testid="select-frequency"
                  >
                    <SelectItem value="occasional">Occasional (1-3 shipments/month)</SelectItem>
                    <SelectItem value="regular">Regular (1-3 shipments/week)</SelectItem>
                    <SelectItem value="high-volume">High volume (daily/near-daily)</SelectItem>
                  </Select>
                  {frequency && frequencyHelperText[frequency] && (
                    <p className="mt-2 text-[14px] leading-5 text-text-secondary">
                      {frequencyHelperText[frequency]}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-border-hairline bg-surface-recessed p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <label
                        htmlFor="non-resident-toggle"
                        className="block cursor-pointer text-[14px] font-semibold leading-5 text-text-primary"
                      >
                        Non-resident / foreign company
                      </label>
                      <p className="mt-1 text-[13px] leading-[18px] text-text-muted">
                        Selling into Canada from outside
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="non-resident-toggle"
                    data-testid="switch-non-resident"
                    checked={isNonResident}
                    onCheckedChange={setIsNonResident}
                  />
                </div>

                {isNonResident && (
                  <Callout tone="warning" title="Non-Resident Importer">
                    <p>
                      Non-residents may need additional documentation and a resident agent. Our Non-Resident package can help.{" "}
                      <a
                        href="/services/non-resident-importer-canada"
                        className="font-semibold underline underline-offset-2 transition-colors duration-state hover:text-brand"
                      >
                        Learn more
                      </a>
                    </p>
                  </Callout>
                )}

                {/*
                  The floor and the ceiling govern every figure this tool
                  prints, so they are stated at 14px in a Callout BEFORE the
                  calculate button — not as 12px grey small print after it.
                */}
                <Callout tone="info">
                  <p>
                    Written security has a $5,000 minimum and a standard $10 million maximum per BN15. A cash deposit is 100% of the calculated requirement and has no $5,000 floor.
                  </p>
                </Callout>

                <Button
                  size="lg"
                  className="h-12 w-full bg-brand text-[15px] font-semibold text-white transition-colors duration-state hover:bg-brand-hover"
                  onClick={handleCalculate}
                  data-testid="button-calculate"
                >
                  <Calculator className="mr-2 h-4 w-4" aria-hidden="true" />
                  Calculate my estimate
                </Button>
              </div>
            </div>

            {/* ── Results ───────────────────────────────────────────── */}
            {showResults && (
              <div ref={resultsRef} className="mt-10 space-y-4" data-testid="section-results">
                <h2 className="text-h2 text-text-primary">Your security estimate</h2>

                {/*
                  Both of these qualify the figures below them, so both render
                  ABOVE the result cards, at the same 14px as the figures. A
                  caveat placed under a number is a caveat already acted past.
                */}
                {minimumApplied && (
                  <Callout
                    tone="warning"
                    role="alert"
                    title="Minimum security floor of $5,000 applied"
                    data-testid="alert-minimum-applied"
                  >
                    <p>
                      Your calculated 50% amount was below the CBSA minimum. The required $5,000 floor has been automatically applied.
                    </p>
                  </Callout>
                )}

                {maximumApplied && (
                  <Callout
                    tone="info"
                    role="alert"
                    title="Standard written-security maximum applied"
                    data-testid="alert-maximum-applied"
                  >
                    <p>
                      CBSA lists a $10 million maximum per BN15, although an importer may choose to post more when receivables exceed it. Cash remains calculated at 100%.
                    </p>
                  </Callout>
                )}

                <div className={`grid gap-4 ${securityType === "both" ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
                  {(securityType === "both" || securityType === "bond") && (
                    <ResultCard
                      data-testid="card-bond-result"
                      title={
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-text-muted" aria-hidden="true" />
                          Required Security Amount (Bond)
                        </span>
                      }
                      figureLabel="Written security (CAD)"
                      figure={formatCurrency(bondEstimate)}
                      figureTestId="text-bond-estimate"
                    >
                      <div className="space-y-3 px-5 pb-5 pt-4">
                        <p
                          className="rounded-md border border-border-hairline bg-surface-recessed px-3 py-2 text-[14px] font-semibold leading-5 text-text-primary tabular-nums"
                          data-testid="text-annual-premium"
                        >
                          Estimated Annual Premium: {formatCurrency(annualPremium)}/year
                        </p>
                        <p className="text-[14px] leading-5 text-text-secondary">
                          The provider charges an annual premium; underwriting, collateral, and final pricing depend on the provider.
                        </p>
                        <p
                          className="flex items-start gap-1.5 text-[14px] leading-5 text-text-muted"
                          data-testid="text-premium-rate"
                        >
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="tabular-nums">
                            Assumed premium rate: {isNonResident ? "2.25% (NRI estimate)" : "1.5% standard estimate"}
                          </span>
                        </p>
                        {isNonResident && (
                          <Callout tone="warning">
                            <p>
                              Non-Resident Importers may face higher underwriting review. Actual bond premium may vary.
                            </p>
                          </Callout>
                        )}
                      </div>
                    </ResultCard>
                  )}

                  {(securityType === "both" || securityType === "cash") && (
                    <ResultCard
                      data-testid="card-cash-result"
                      title={
                        <span className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-text-muted" aria-hidden="true" />
                          Required Cash Deposit
                        </span>
                      }
                      figureLabel="Cash deposit (CAD)"
                      figure={formatCurrency(cashEstimate)}
                      figureTestId="text-cash-estimate"
                    >
                      <div className="space-y-3 px-5 pb-5 pt-4">
                        <p className="text-[14px] leading-5 text-text-secondary">
                          This amount must be deposited with CBSA. Funds are tied up while active.
                        </p>
                        <p className="text-eyebrow uppercase text-text-muted">Key details</p>
                        <ul className="space-y-2 text-[14px] leading-5 text-text-secondary">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TOOL_SUCCESS }} aria-hidden="true" />
                            No credit check needed
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TOOL_SUCCESS }} aria-hidden="true" />
                            No annual premium to pay
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                            Full amount tied up with CBSA
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                            Higher upfront capital required vs bond
                          </li>
                        </ul>
                      </div>
                    </ResultCard>
                  )}
                </div>

                <Callout tone="info">
                  <p>
                    CARM updates the requirement each October 20 using the October 20–October 19 review period. Required increases must be posted by January 15.
                  </p>
                </Callout>

                <div className="rounded-lg border border-border-hairline bg-white p-5" data-testid="card-next-steps">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    <h3 className="text-h3 text-text-primary">What this means — next steps</h3>
                  </div>
                  <ol className="mt-5 space-y-5">
                    {[
                      { step: 1, title: "Confirm your highest monthly receivable", desc: "Review the CARM or broker statements for this BN15 and use the single highest month." },
                      { step: 2, title: "Check your CARM portal security status", desc: "Log into your CARM portal to see your current Release Prior to Payment (RPP) security requirements." },
                      { step: 3, title: "Post bond or cash via your provider", desc: "Work with a surety bond provider or post cash through your CARM portal." },
                    ].map((item) => (
                      <li key={item.step} className="flex gap-4">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-dark text-[14px] font-bold text-white tabular-nums"
                          aria-hidden="true"
                        >
                          {item.step}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold leading-5 text-text-primary">{item.title}</p>
                          <p className="mt-1 text-[14px] leading-5 text-text-muted">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-border-hairline bg-surface-recessed p-5" data-testid="card-lead-cta">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-h3 text-text-primary">Request help with CARM security</h3>
                      <p className="mt-1.5 text-[14px] leading-5 text-text-muted">
                        Save this estimate with your contact details and ask our team to follow up about setup.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="shrink-0 bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                      onClick={() => setShowLeadModal(true)}
                      data-testid="button-email-summary"
                    >
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      Request follow-up
                      <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-surface-recessed ${PAD.tight}`} ref={faqRef} data-testid="section-faq">
          <div className={FORM_RAIL}>
            <p className="text-eyebrow uppercase text-text-muted">Frequently Asked Questions</p>
            <h2 className="mt-3 text-h2 text-text-primary">How CARM financial security works</h2>

            <Accordion type="multiple" className="mt-8 space-y-3">
              {[
                {
                  q: "What is CARM?",
                  a: "CARM (CBSA Assessment and Revenue Management) is the Canada Border Services Agency's system for managing trade-related accounting. It modernizes how importers interact with CBSA, including how duties and taxes are assessed and paid.",
                },
                {
                  q: "What is financial security under CARM?",
                  a: "Financial security is a guarantee (bond or cash deposit) that importers must post with CBSA to continue releasing goods prior to payment. It protects CBSA against potential non-payment of duties, taxes, and other charges.",
                },
                {
                  q: "What's the difference between a bond and a cash deposit?",
                  a: "A written security agreement generally covers at least 50% of the system-calculated requirement, subject to the $5,000 minimum and standard $10 million maximum per BN15. A cash deposit is 100% of the highest monthly accounts receivable. Provider premiums, underwriting, and collateral requirements vary.",
                },
                {
                  q: "What number should I enter in the calculator?",
                  a: "Enter the highest monthly accounts receivable for one BN15 importer account over the last 12 months, including GST, duties, and surtax. Find it in CARM or ask your customs broker.",
                },
                {
                  q: "Can AccessToNorth help me set this up?",
                  a: "Yes! Our CARM Portal Registration package and Complete Importer Bundle include assistance with CARM registration, which is the first step toward posting your financial security. We coordinate the documentation — you focus on your business.",
                },
              ].map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-lg border border-border-hairline bg-white px-4"
                >
                  <AccordionTrigger
                    className="py-4 text-left text-h3 text-text-primary"
                    data-testid={`faq-trigger-${i}`}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-left text-body text-text-muted">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── Disclaimer ──────────────────────────────────────────────── */}
        {/*
          EXPANDED BY DEFAULT (`defaultValue="disclaimer"`). On main this panel
          shipped collapsed, so the three sentences that say the figures above
          are not advice were invisible until clicked. The trigger is kept, so a
          reader can still fold it away — but the default is open and the body
          is 14px text-secondary rather than the old grey small print.
        */}
        <section className={`${SHELL} bg-white ${PAD.tight}`} data-testid="section-disclaimer">
          <div className={FORM_RAIL}>
            <Accordion type="single" collapsible defaultValue="disclaimer">
              <AccordionItem value="disclaimer" className="rounded-lg border border-border-hairline px-4">
                <AccordionTrigger
                  className="py-4 text-left text-h3 text-text-primary"
                  data-testid="disclaimer-trigger"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309]" aria-hidden="true" />
                    Disclaimer
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="space-y-2.5 text-[14px] leading-[20px] text-text-secondary">
                    <p>This calculator provides an estimate only and is not legal, tax, or customs advice.</p>
                    <p>Actual requirements depend on CBSA/CARM rules, your account structure, and your import activity.</p>
                    <p>Confirm with CBSA guidance and/or your customs broker before making decisions based on these estimates.</p>
                  </div>
                  <div className="mt-4 border-t border-border-hairline pt-4">
                    <p className="text-eyebrow uppercase text-text-muted">Sources</p>
                    <ul className="mt-2 space-y-1.5">
                      <li>
                        <a
                          href="https://www.canada.ca/en/border-services-agency/services/carm/release-prior-payment/get-ready-enrol.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[14px] leading-5 font-semibold text-text-secondary underline underline-offset-2 transition-colors duration-state hover:text-brand"
                          data-testid="link-cbsa-carm"
                        >
                          CBSA CARM financial security rules
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[14px] leading-5 font-semibold text-text-secondary underline underline-offset-2 transition-colors duration-state hover:text-brand"
                          data-testid="link-cra-gst"
                        >
                          CRA Import GST Info
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

      </main>

      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="rounded-lg border-border-hairline sm:max-w-md" data-testid="modal-lead-form">
          <DialogHeader>
            <DialogTitle className="text-h2 text-text-primary">Request CARM security follow-up</DialogTitle>
            <DialogDescription className="text-body text-text-muted">
              Save your estimate and contact details so our team can follow up about setup.
            </DialogDescription>
          </DialogHeader>

          {leadSubmitted ? (
            <div className="flex flex-col items-center py-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2" style={{ borderColor: TOOL_SUCCESS }}>
                <CheckCircle2 className="h-6 w-6" style={{ color: TOOL_SUCCESS }} aria-hidden="true" />
              </div>
              <h3 className="text-h3 text-text-primary" data-testid="text-lead-success">Request saved</h3>
              <p className="mt-1.5 text-center text-body text-text-muted">
                We've received your request and will follow up shortly.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                onClick={() => { setShowLeadModal(false); }}
                data-testid="button-close-lead"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              <div>
                <FieldLabel htmlFor="lead-email" required>Email</FieldLabel>
                <Input
                  id="lead-email"
                  data-testid="input-lead-email"
                  type="email"
                  value={leadEmail}
                  onChange={(e) => { setLeadEmail(e.target.value); setLeadErrors((p) => ({ ...p, email: "" })); }}
                  placeholder="you@company.com"
                  className={leadErrors.email ? "border-[#B42318]" : ""}
                />
                {leadErrors.email && <p className="mt-1.5 text-body text-[#B42318]">{leadErrors.email}</p>}
              </div>

              <div>
                <FieldLabel htmlFor="lead-company" required>Company name</FieldLabel>
                <Input
                  id="lead-company"
                  data-testid="input-lead-company"
                  value={leadCompany}
                  onChange={(e) => { setLeadCompany(e.target.value); setLeadErrors((p) => ({ ...p, companyName: "" })); }}
                  placeholder="Your Company Inc."
                  className={leadErrors.companyName ? "border-[#B42318]" : ""}
                />
                {leadErrors.companyName && <p className="mt-1.5 text-body text-[#B42318]">{leadErrors.companyName}</p>}
              </div>

              <div>
                <FieldLabel htmlFor="lead-import-range" required>Monthly import value range</FieldLabel>
                <Select
                  id="lead-import-range"
                  value={leadImportRange}
                  onValueChange={(v) => { setLeadImportRange(v); setLeadErrors((p) => ({ ...p, importValueRange: "" })); }}
                  placeholder="Select range"
                  data-testid="select-lead-import-range"
                  className={leadErrors.importValueRange ? "border-[#B42318]" : ""}
                >
                  <SelectItem value="< $10k">Less than $10k</SelectItem>
                  <SelectItem value="$10k–$50k">$10k - $50k</SelectItem>
                  <SelectItem value="$50k–$250k">$50k - $250k</SelectItem>
                  <SelectItem value="$250k+">$250k+</SelectItem>
                </Select>
                {leadErrors.importValueRange && <p className="mt-1.5 text-body text-[#B42318]">{leadErrors.importValueRange}</p>}
              </div>

              <div>
                <FieldLabel required>Are you currently importing?</FieldLabel>
                <div className="flex gap-3">
                  {([
                    { value: true, label: "Yes", testId: "button-currently-importing-yes" },
                    { value: false, label: "No", testId: "button-currently-importing-no" },
                  ] as const).map((option) => {
                    const active = leadCurrentlyImporting === option.value;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        aria-pressed={active}
                        data-testid={option.testId}
                        onClick={() => { setLeadCurrentlyImporting(option.value); setLeadErrors((p) => ({ ...p, currentlyImporting: "" })); }}
                        className={`h-12 flex-1 cursor-pointer rounded-md border-2 text-[15px] font-semibold transition-colors duration-state ${
                          active
                            ? "border-brand bg-white text-text-primary"
                            : "border-border-app bg-surface-recessed text-text-muted hover:border-border-control"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {leadErrors.currentlyImporting && <p className="mt-1.5 text-body text-[#B42318]">{leadErrors.currentlyImporting}</p>}
              </div>

              <div>
                <FieldLabel htmlFor="lead-phone">Phone (optional)</FieldLabel>
                <Input
                  id="lead-phone"
                  data-testid="input-lead-phone"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <Button
                className="h-12 w-full bg-brand text-[15px] font-semibold text-white transition-colors duration-state hover:bg-brand-hover"
                onClick={handleLeadSubmit}
                disabled={leadSubmitting}
                data-testid="button-submit-lead"
              >
                {leadSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Save and request follow-up
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ToolWorkedExample kind="carm" />
    </div>
  );
}
