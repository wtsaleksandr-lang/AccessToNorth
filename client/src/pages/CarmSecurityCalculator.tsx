import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToolWorkedExample } from "@/components/ToolWorkedExample";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Shield,
  DollarSign,
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
  Building2,
  Globe,
  TrendingUp,
  HelpCircle,
  LayoutGrid,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateCarmSecurity } from "@shared/customsEstimate";
import { usePageMeta } from "@/hooks/use-page-meta";

type SecurityType = "both" | "bond" | "cash";
type Frequency = "occasional" | "regular" | "high-volume";

const DEEP_GREEN = "#0F3B35";

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

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkHero />

      <section
        className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 20% 10%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(180deg, ${DEEP_GREEN} 0%, #0B2F2A 60%, #122f2b 100%)`,
        }}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-6 border border-white/10">
                <Calculator className="w-4 h-4" />
                Free Estimate Tool
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-display leading-tight" data-testid="text-calc-heading">
                CARM Financial Security Estimate
              </h1>
              <p className="text-base md:text-lg text-white/70 mb-8 max-w-lg" data-testid="text-calc-subheading">
                Estimate written security versus cash using your highest monthly CBSA accounts receivable.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 font-semibold shadow-lg shadow-black/10 cursor-pointer"
                  onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  data-testid="button-hero-calculate"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate my estimate
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <button
                  type="button"
                  className="text-sm text-white/60 hover:text-white/90 transition-colors cursor-pointer underline underline-offset-4"
                  onClick={() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  data-testid="link-what-is-carm"
                >
                  What is CARM security?
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center md:justify-end"
            >
              <motion.div
                className="absolute -top-3 -left-2 md:-left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/95 rounded-xl border border-emerald-200 shadow-md"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                data-testid="badge-estimate-ready"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 leading-tight">Estimate ready</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Based on your inputs</p>
                </div>
              </motion.div>

              <div className="w-full max-w-[400px] rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm shadow-2xl shadow-black/20 p-5" data-testid="card-hero-mockup">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-xs font-semibold text-white/70 tracking-wider uppercase">CARM Tool</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="h-3 bg-white/10 rounded-full w-3/4" />
                  <div className="h-9 bg-white/8 rounded-lg border border-white/10" />
                  <div className="h-3 bg-white/10 rounded-full w-1/2" />
                  <div className="h-9 bg-white/8 rounded-lg border border-white/10" />
                  <div className="h-3 bg-white/10 rounded-full w-2/3" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/20 p-3">
                    <p className="text-[10px] font-medium text-emerald-300 uppercase tracking-wide mb-1">Bond (50%)</p>
                    <div className="h-5 bg-emerald-400/20 rounded w-3/4" />
                  </div>
                  <div className="rounded-xl bg-blue-500/20 border border-blue-400/20 p-3">
                    <p className="text-[10px] font-medium text-blue-300 uppercase tracking-wide mb-1">Cash (100%)</p>
                    <div className="h-5 bg-blue-400/20 rounded w-3/4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" ref={formRef}>
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Card className="p-6 md:p-8" data-testid="card-calculator-form">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: DEEP_GREEN }} />
              Enter Your Details
            </h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="monthly-payable" className="text-sm font-medium mb-1.5 block">
                  Highest monthly CBSA accounts receivable (last 12 months) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">CAD $</span>
                  <Input
                    id="monthly-payable"
                    data-testid="input-monthly-payable"
                    value={monthlyPayable}
                    onChange={(e) => handleMonthlyPayableChange(e.target.value)}
                    placeholder="e.g. 25,000"
                    className={`pl-16 ${inputError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
                {inputError && <p className="text-red-500 text-sm mt-1" data-testid="text-input-error">{inputError}</p>}
                <div className="flex items-start gap-1.5 mt-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500">
                    Include GST, duties, and surtax for one importer program account (BN15). Check the CARM portal or your broker statement.
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Choose security type to compare <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: "both", label: "Show both", sub: "Recommended" },
                    { value: "bond", label: "Bond only", sub: "50%" },
                    { value: "cash", label: "Cash only", sub: "100%" },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      data-testid={`radio-security-${option.value}`}
                      onClick={() => setSecurityType(option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                        securityType === option.value
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm font-medium block">{option.label}</span>
                      <span className="text-xs text-slate-500">{option.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="frequency" className="text-sm font-medium mb-1.5 block">
                  Import frequency <span className="text-xs text-slate-400">(optional)</span>
                </Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger id="frequency" data-testid="select-frequency">
                    <SelectValue placeholder="Select your import frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occasional">Occasional (1-3 shipments/month)</SelectItem>
                    <SelectItem value="regular">Regular (1-3 shipments/week)</SelectItem>
                    <SelectItem value="high-volume">High volume (daily/near-daily)</SelectItem>
                  </SelectContent>
                </Select>
                {frequency && frequencyHelperText[frequency] && (
                  <p className="text-xs text-emerald-700 mt-1.5">{frequencyHelperText[frequency]}</p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <div>
                    <Label htmlFor="non-resident-toggle" className="text-sm font-medium cursor-pointer">
                      Non-resident / foreign company
                    </Label>
                    <p className="text-xs text-slate-500">Selling into Canada from outside</p>
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Non-Resident Importer</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Non-residents may need additional documentation and a resident agent. Our Non-Resident package can help.{" "}
                        <a href="/services/non-resident-importer-canada" className="underline font-medium">Learn more</a>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500">
                    Written security has a $5,000 minimum and a standard $10 million maximum per BN15. A cash deposit is 100% of the calculated requirement and has no $5,000 floor.
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-white font-semibold py-6 text-[23px] bg-[#0f3b35] rounded-xl"
                onClick={handleCalculate}
                data-testid="button-calculate"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate my estimate
              </Button>
            </div>
          </Card>

          <AnimatePresence>
            {showResults && (
              <motion.div
                ref={resultsRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 space-y-6"
                data-testid="section-results"
              >
                {minimumApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-amber-50 border border-amber-200"
                    data-testid="alert-minimum-applied"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Minimum security floor of $5,000 applied</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Your calculated 50% amount was below the CBSA minimum. The required $5,000 floor has been automatically applied.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {maximumApplied && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200" data-testid="alert-maximum-applied">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Standard written-security maximum applied</p>
                        <p className="text-xs text-blue-800 mt-0.5">
                          CBSA lists a $10 million maximum per BN15, although an importer may choose to post more when receivables exceed it. Cash remains calculated at 100%.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`grid gap-6 ${securityType === "both" ? "md:grid-cols-2" : "md:grid-cols-1 max-w-md mx-auto"}`}>
                  {(securityType === "both" || securityType === "bond") && (
                    <Card className="p-6 border-2 border-emerald-200 bg-emerald-50/50" data-testid="card-bond-result">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-emerald-700" />
                        <h3 className="font-semibold text-emerald-900">Required Security Amount (Bond)</h3>
                      </div>
                      <p className="text-4xl font-bold mb-2" style={{ color: DEEP_GREEN }} data-testid="text-bond-estimate">
                        {formatCurrency(bondEstimate)}
                      </p>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-200 mb-3"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-sm font-semibold text-emerald-800" data-testid="text-annual-premium">
                          Estimated Annual Premium: {formatCurrency(annualPremium)}/year
                        </span>
                      </motion.div>
                      <p className="text-sm text-slate-600 mb-3">
                        The provider charges an annual premium; underwriting, collateral, and final pricing depend on the provider.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Info className="w-3 h-3 shrink-0" />
                          <span data-testid="text-premium-rate">
                            Assumed premium rate: {isNonResident ? "2.25% (NRI estimate)" : "1.5% standard estimate"}
                          </span>
                        </div>
                        {isNonResident && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-xs text-amber-700">
                              Non-Resident Importers may face higher underwriting review. Actual bond premium may vary.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  )}

                  {(securityType === "both" || securityType === "cash") && (
                    <Card className="p-6 border-2 border-blue-200 bg-blue-50/50" data-testid="card-cash-result">
                      <div className="flex items-center gap-2 mb-3">
                        <Banknote className="w-5 h-5 text-blue-700" />
                        <h3 className="font-semibold text-blue-900">Required Cash Deposit</h3>
                      </div>
                      <p className="text-4xl font-bold text-blue-800 mb-3" data-testid="text-cash-estimate">
                        {formatCurrency(cashEstimate)}
                      </p>
                      <p className="text-sm text-slate-600 mb-3">
                        This amount must be deposited with CBSA. Funds are tied up while active.
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Key details</p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                            No credit check needed
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                            No annual premium to pay
                          </li>
                          <li className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            Full amount tied up with CBSA
                          </li>
                          <li className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            Higher upfront capital required vs bond
                          </li>
                        </ul>
                      </div>
                    </Card>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500">
                      CARM updates the requirement each October 20 using the October 20–October 19 review period. Required increases must be posted by January 15.
                    </p>
                  </div>
                </div>

                <Card className="p-6 md:p-8" data-testid="card-next-steps">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: DEEP_GREEN }} />
                    What this means — next steps
                  </h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: "Confirm your highest monthly receivable", desc: "Review the CARM or broker statements for this BN15 and use the single highest month." },
                      { step: 2, title: "Check your CARM portal security status", desc: "Log into your CARM portal to see your current Release Prior to Payment (RPP) security requirements." },
                      { step: 3, title: "Post bond or cash via your provider", desc: "Work with a surety bond provider or post cash through your CARM portal." },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: DEEP_GREEN }}
                        >
                          {item.step}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 md:p-8 border-2" style={{ borderColor: DEEP_GREEN + "30", background: DEEP_GREEN + "08" }} data-testid="card-lead-cta">
                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full shrink-0" style={{ backgroundColor: DEEP_GREEN + "15" }}>
                      <Mail className="w-7 h-7" style={{ color: DEEP_GREEN }} />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h3 className="font-semibold text-lg">Request help with CARM security</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Save this estimate with your contact details and ask our team to follow up about setup.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="text-white font-semibold shrink-0"
                      style={{ backgroundColor: DEEP_GREEN }}
                      onClick={() => setShowLeadModal(true)}
                      data-testid="button-email-summary"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Request follow-up
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 space-y-8">
            <div data-testid="section-faq" ref={faqRef}>
              <h2 className="text-2xl font-bold mb-6 font-display">Frequently Asked Questions</h2>
              <Accordion type="multiple" className="space-y-2">
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
                  <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium hover:no-underline" data-testid={`faq-trigger-${i}`}>
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
                        {item.q}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div data-testid="section-disclaimer">
              <Accordion type="single" collapsible>
                <AccordionItem value="disclaimer" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline" data-testid="disclaimer-trigger">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      Disclaimer
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm text-slate-600">
                      <p>This calculator provides an estimate only and is not legal, tax, or customs advice.</p>
                      <p>Actual requirements depend on CBSA/CARM rules, your account structure, and your import activity.</p>
                      <p>Confirm with CBSA guidance and/or your customs broker before making decisions based on these estimates.</p>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium mb-1">Sources</p>
                        <ul className="space-y-1">
                          <li>
                            <a
                              href="https://www.canada.ca/en/border-services-agency/services/carm/release-prior-payment/get-ready-enrol.html"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs hover:underline flex items-center gap-1"
                              style={{ color: DEEP_GREEN }}
                              data-testid="link-cbsa-carm"
                            >
                              CBSA CARM financial security rules
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs hover:underline flex items-center gap-1"
                              style={{ color: DEEP_GREEN }}
                              data-testid="link-cra-gst"
                            >
                              CRA Import GST Info
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="sm:max-w-md" data-testid="modal-lead-form">
          <DialogHeader>
            <DialogTitle>Request CARM security follow-up</DialogTitle>
            <DialogDescription>
              Save your estimate and contact details so our team can follow up about setup.
            </DialogDescription>
          </DialogHeader>

          {leadSubmitted ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg" data-testid="text-lead-success">Request saved</h3>
              <p className="text-sm text-slate-500 mt-1">
                We've received your request and will follow up shortly.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => { setShowLeadModal(false); }} data-testid="button-close-lead">
                Close
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lead-email" className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="lead-email"
                  data-testid="input-lead-email"
                  type="email"
                  value={leadEmail}
                  onChange={(e) => { setLeadEmail(e.target.value); setLeadErrors((p) => ({ ...p, email: "" })); }}
                  placeholder="you@company.com"
                  className={leadErrors.email ? "border-red-500" : ""}
                />
                {leadErrors.email && <p className="text-red-500 text-xs mt-1">{leadErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="lead-company" className="text-sm font-medium">Company name <span className="text-red-500">*</span></Label>
                <Input
                  id="lead-company"
                  data-testid="input-lead-company"
                  value={leadCompany}
                  onChange={(e) => { setLeadCompany(e.target.value); setLeadErrors((p) => ({ ...p, companyName: "" })); }}
                  placeholder="Your Company Inc."
                  className={leadErrors.companyName ? "border-red-500" : ""}
                />
                {leadErrors.companyName && <p className="text-red-500 text-xs mt-1">{leadErrors.companyName}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium">Monthly import value range <span className="text-red-500">*</span></Label>
                <Select value={leadImportRange} onValueChange={(v) => { setLeadImportRange(v); setLeadErrors((p) => ({ ...p, importValueRange: "" })); }}>
                  <SelectTrigger data-testid="select-lead-import-range" className={leadErrors.importValueRange ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< $10k">Less than $10k</SelectItem>
                    <SelectItem value="$10k–$50k">$10k - $50k</SelectItem>
                    <SelectItem value="$50k–$250k">$50k - $250k</SelectItem>
                    <SelectItem value="$250k+">$250k+</SelectItem>
                  </SelectContent>
                </Select>
                {leadErrors.importValueRange && <p className="text-red-500 text-xs mt-1">{leadErrors.importValueRange}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium">Are you currently importing? <span className="text-red-500">*</span></Label>
                <div className="flex gap-3 mt-1.5">
                  <button
                    type="button"
                    data-testid="button-currently-importing-yes"
                    onClick={() => { setLeadCurrentlyImporting(true); setLeadErrors((p) => ({ ...p, currentlyImporting: "" })); }}
                    className={`flex-1 p-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                      leadCurrentlyImporting === true ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    data-testid="button-currently-importing-no"
                    onClick={() => { setLeadCurrentlyImporting(false); setLeadErrors((p) => ({ ...p, currentlyImporting: "" })); }}
                    className={`flex-1 p-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                      leadCurrentlyImporting === false ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    No
                  </button>
                </div>
                {leadErrors.currentlyImporting && <p className="text-red-500 text-xs mt-1">{leadErrors.currentlyImporting}</p>}
              </div>

              <div>
                <Label htmlFor="lead-phone" className="text-sm font-medium">Phone <span className="text-xs text-slate-400">(optional)</span></Label>
                <Input
                  id="lead-phone"
                  data-testid="input-lead-phone"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <Button
                className="w-full text-white font-semibold"
                style={{ backgroundColor: DEEP_GREEN }}
                onClick={handleLeadSubmit}
                disabled={leadSubmitting}
                data-testid="button-submit-lead"
              >
                {leadSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Save and request follow-up
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ToolWorkedExample kind="carm" />
      <Footer />
    </div>
  );
}
