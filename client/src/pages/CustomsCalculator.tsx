import { useState, useRef, useCallback, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Search,
  Globe,
  MapPin,
  Package,
  DollarSign,
  ChevronDown,
  Check,
  Info,
  Loader2,
  LayoutGrid,
  FileText,
  Upload,
  Download,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  X,
  AlertTriangle,
  Mail,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const DEEP_BLUE = "#0A2540";

interface HsCodeResult {
  code: string;
  description: string;
  chapter: string;
  unitOfMeasure: string | null;
}

interface Country {
  id: number;
  name: string;
  code: string | null;
  treatments: string[];
}

interface CalculationResult {
  hsCode: string;
  description: string;
  unitOfMeasure: string | null;
  countryOfOrigin: string;
  valueCAD: number;
  quantity: number;
  province: string;
  provinceName: string;
  shipmentType: string;
  appliedTreatment: string;
  appliedTreatmentName: string;
  dutyRate: string;
  dutyAmount: number;
  gstRate: number;
  gstAmount: number;
  gstLabel: string;
  provincialTaxRate: number;
  provincialTaxAmount: number;
  provincialTaxName: string;
  totalDutiesAndTaxes: number;
  totalLandedCost: number;
  availableTreatments: Record<string, { rate: string; duty: number }>;
  warnings: string[];
  requiresManualReview: boolean;
  preferentialAvailable: boolean;
  originConfirmed: boolean;
}

interface BulkResult {
  items: Array<{
    hsCode: string;
    description: string;
    countryOfOrigin: string;
    valueCAD: number;
    quantity: number;
    appliedTreatment: string;
    dutyRate: string;
    dutyAmount: number;
    gstAmount: number;
    provincialTaxAmount: number;
    totalForItem: number;
    error?: string;
  }>;
  summary: {
    totalItems: number;
    totalValue: number;
    totalDuty: number;
    totalGST: number;
    totalProvincialTax: number;
    totalDutiesAndTaxes: number;
    totalLandedCost: number;
    province: string;
    provinceName: string;
  };
}

const PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value * 100 % 1 === 0 ? 0 : 2)}%`;
}

export default function CustomsCalculator() {
  const [hsQuery, setHsQuery] = useState("");
  const [hsResults, setHsResults] = useState<HsCodeResult[]>([]);
  const [selectedHsCode, setSelectedHsCode] = useState<HsCodeResult | null>(null);
  const [showHsDropdown, setShowHsDropdown] = useState(false);
  const [hsSearching, setHsSearching] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("ON");
  const [goodsValue, setGoodsValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipmentType, setShipmentType] = useState<"commercial" | "personal">("commercial");
  const [confirmedOrigin, setConfirmedOrigin] = useState(false);

  const [isCalculating, setIsCalculating] = useState(false);
  const [calcStep, setCalcStep] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [inputError, setInputError] = useState("");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkCalculating, setBulkCalculating] = useState(false);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const hsInputRef = useRef<HTMLInputElement>(null);
  const hsDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/customs/countries")
      .then((r) => r.json())
      .then(setCountries)
      .catch(console.error);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        hsDropdownRef.current &&
        !hsDropdownRef.current.contains(e.target as Node) &&
        hsInputRef.current &&
        !hsInputRef.current.contains(e.target as Node)
      ) {
        setShowHsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchHsCodes = useCallback((query: string) => {
    if (query.length < 2) {
      setHsResults([]);
      setShowHsDropdown(false);
      return;
    }

    setHsSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customs/hs-search?q=${encodeURIComponent(query)}&limit=15`);
        const data = await res.json();
        setHsResults(data);
        setShowHsDropdown(data.length > 0);
      } catch {
        setHsResults([]);
      } finally {
        setHsSearching(false);
      }
    }, 300);
  }, []);

  const handleHsSelect = (item: HsCodeResult) => {
    setSelectedHsCode(item);
    setHsQuery(`${item.code} - ${item.description}`);
    setShowHsDropdown(false);
    setInputError("");
  };

  const handleCalculate = async () => {
    setInputError("");

    if (!selectedHsCode) {
      setInputError("Please select an HS code from the dropdown.");
      return;
    }
    if (!selectedCountry) {
      setInputError("Please select a country of origin.");
      return;
    }
    const value = parseFloat(goodsValue.replace(/[^0-9.]/g, ""));
    if (!value || value <= 0) {
      setInputError("Please enter a valid goods value.");
      return;
    }

    setIsCalculating(true);
    setCalcStep(0);
    setResult(null);
    setBulkResult(null);

    const timers = [
      setTimeout(() => setCalcStep(1), 400),
      setTimeout(() => setCalcStep(2), 800),
      setTimeout(async () => {
        try {
          const qty = parseFloat(quantity) || 0;
          const res = await apiRequest("POST", "/api/customs/calculate", {
            hsCode: selectedHsCode.code,
            countryOfOrigin: selectedCountry,
            valueCAD: value,
            quantity: qty,
            province: selectedProvince,
            shipmentType,
            confirmedOrigin,
          });
          const data = await res.json();
          setResult(data);
          setCalcStep(3);

          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        } catch (err: any) {
          const msg = err?.message || "Calculation failed. Please try again.";
          toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
          setIsCalculating(false);
        }
      }, 1200),
    ];

    return () => timers.forEach(clearTimeout);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setBulkCalculating(true);
    setBulkResult(null);
    setResult(null);

    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: "Invalid CSV", description: "CSV must have a header row and at least one data row.", variant: "destructive" });
        return;
      }

      const header = lines[0].toLowerCase();
      const hasDescription = header.includes("description");

      const items = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        return {
          hsCode: cols[0] || "",
          countryOfOrigin: cols[1] || "Other / Unknown",
          valueCAD: parseFloat(cols[2]) || 0,
          quantity: parseFloat(cols[3]) || 0,
          description: hasDescription ? cols[4] || undefined : undefined,
        };
      }).filter((item) => item.hsCode && item.valueCAD > 0);

      if (items.length === 0) {
        toast({ title: "No valid items", description: "No valid items found in CSV.", variant: "destructive" });
        return;
      }

      const res = await apiRequest("POST", "/api/customs/calculate-bulk", {
        items,
        province: selectedProvince,
        shipmentType,
      });
      const data = await res.json();
      setBulkResult(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      toast({ title: "Bulk calculation failed", description: err?.message || "Please check your CSV format.", variant: "destructive" });
    } finally {
      setBulkCalculating(false);
    }
  };

  const exportPDF = () => {
    const data = result || bulkResult;
    if (!data) return;

    let html = `
      <html><head><title>Customs Duty Estimate - AccessToNorth.com</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { color: #0A2540; font-size: 24px; }
        h2 { color: #0A2540; font-size: 18px; margin-top: 24px; }
        .header { border-bottom: 2px solid #0A2540; padding-bottom: 16px; margin-bottom: 24px; }
        .subtitle { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        th { background: #f8f9fa; font-weight: 600; color: #374151; }
        .total-row td { font-weight: bold; border-top: 2px solid #0A2540; font-size: 16px; }
        .highlight { background: #f0f9ff; }
        .disclaimer { margin-top: 32px; padding: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; color: #92400e; }
        .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
      </style></head><body>
      <div class="header">
        <h1>Canadian Customs Duty & Tax Estimate</h1>
        <p class="subtitle">Generated by AccessToNorth.com on ${new Date().toLocaleDateString("en-CA")}</p>
      </div>
    `;

    if (result) {
      html += `
        <h2>Product Details</h2>
        <table>
          <tr><th>HS Code</th><td>${result.hsCode}</td></tr>
          <tr><th>Description</th><td>${result.description}</td></tr>
          <tr><th>Country of Origin</th><td>${result.countryOfOrigin}</td></tr>
          <tr><th>Value (CAD)</th><td>${formatCurrency(result.valueCAD)}</td></tr>
          <tr><th>Quantity</th><td>${result.quantity}</td></tr>
          <tr><th>Province</th><td>${result.provinceName}</td></tr>
          <tr><th>Applied Tariff Treatment</th><td>${result.appliedTreatmentName} (${result.appliedTreatment})</td></tr>
        </table>
        <h2>Duty & Tax Breakdown</h2>
        <table>
          <tr><th>Item</th><th>Rate</th><th>Amount (CAD)</th></tr>
          <tr><td>Customs Duty</td><td>${result.dutyRate}</td><td>${formatCurrency(result.dutyAmount)}</td></tr>
          <tr><td>${result.gstLabel}</td><td>${formatPercent(result.gstRate)}</td><td>${formatCurrency(result.gstAmount)}</td></tr>
          ${result.provincialTaxAmount > 0 ? `<tr><td>${result.provincialTaxName}</td><td>${formatPercent(result.provincialTaxRate)}</td><td>${formatCurrency(result.provincialTaxAmount)}</td></tr>` : ""}
          <tr class="total-row"><td>Total Duties & Taxes</td><td></td><td>${formatCurrency(result.totalDutiesAndTaxes)}</td></tr>
          <tr class="total-row highlight"><td>Total Landed Cost</td><td></td><td>${formatCurrency(result.totalLandedCost)}</td></tr>
        </table>
      `;
    }

    if (bulkResult) {
      html += `
        <h2>Bulk Calculation Results</h2>
        <table>
          <tr><th>HS Code</th><th>Description</th><th>Origin</th><th>Value</th><th>Duty</th><th>GST/HST</th><th>Prov Tax</th><th>Total</th></tr>
          ${bulkResult.items.map((item) => `
            <tr>
              <td>${item.hsCode}</td>
              <td>${item.description}</td>
              <td>${item.countryOfOrigin}</td>
              <td>${formatCurrency(item.valueCAD)}</td>
              <td>${item.error || formatCurrency(item.dutyAmount)}</td>
              <td>${item.error || formatCurrency(item.gstAmount)}</td>
              <td>${item.error || formatCurrency(item.provincialTaxAmount)}</td>
              <td>${item.error || formatCurrency(item.totalForItem)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="3">Totals</td>
            <td>${formatCurrency(bulkResult.summary.totalValue)}</td>
            <td>${formatCurrency(bulkResult.summary.totalDuty)}</td>
            <td>${formatCurrency(bulkResult.summary.totalGST)}</td>
            <td>${formatCurrency(bulkResult.summary.totalProvincialTax)}</td>
            <td>${formatCurrency(bulkResult.summary.totalLandedCost)}</td>
          </tr>
        </table>
      `;
    }

    html += `
      <div class="disclaimer">
        <strong>Important Disclaimer:</strong> This estimate is for informational purposes only and does not constitute professional customs brokerage advice.
        Actual duties and taxes are determined by the Canada Border Services Agency (CBSA) at the time of importation.
        Rates are based on the 2026 Canadian Customs Tariff (T2026). <strong>Not included:</strong> SIMA duties (anti-dumping &amp; countervailing),
        excise duties/taxes, surtaxes, temporary safeguard measures, or any other special levies. Some goods may be subject to import permits, quotas, or prohibitions.
        Preferential tariff rates require valid proof of origin documentation. Consult a licensed customs broker or CBSA for binding rulings.
      </div>
      <div class="footer">AccessToNorth.com &mdash; Canadian Tax & Business Registration Services</div>
      </body></html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleLeadSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!leadEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
      errors.email = "Valid email is required";
    }
    if (Object.keys(errors).length > 0) {
      setLeadErrors(errors);
      return;
    }

    setLeadSubmitting(true);
    setLeadErrors({});
    try {
      await apiRequest("POST", "/api/leads/customs-calculator", {
        email: leadEmail,
        companyName: leadCompany || undefined,
        phone: leadPhone || undefined,
        hsCode: result?.hsCode || selectedHsCode?.code,
        countryOfOrigin: selectedCountry,
        goodsValue: String(result?.valueCAD || parseFloat(goodsValue.replace(/[^0-9.]/g, "")) || ""),
        calculatedDuty: result ? String(result.totalDutiesAndTaxes) : undefined,
        source: "customs-calculator",
      });
      setLeadSubmitted(true);
      toast({ title: "Thank you!", description: "We'll send you a detailed breakdown by email." });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    } finally {
      setLeadSubmitting(false);
    }
  };

  const calcStepLabels = [
    "Looking up tariff classification...",
    "Applying trade agreements...",
    "Calculating duties & taxes...",
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkHero />

      <section
        className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 20% 10%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(180deg, ${DEEP_BLUE} 0%, #061B2E 60%, #0D2137 100%)`,
        }}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-6 border border-white/10">
                <Calculator className="w-4 h-4" />
                Free Import Calculator
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-display leading-tight" data-testid="text-customs-heading">
                Canadian Customs Duty & Tax Calculator
              </h1>
              <p className="text-base md:text-lg text-white/70 mb-8 max-w-lg" data-testid="text-customs-subheading">
                Instantly estimate import duties, GST/HST, and provincial taxes for any product entering Canada. Based on the official 2026 CBSA tariff schedule.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 font-semibold shadow-lg shadow-black/10 cursor-pointer"
                  onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  data-testid="button-hero-calculate"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Start calculating
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <button
                  type="button"
                  className="text-sm text-white/60 hover:text-white/90 transition-colors cursor-pointer underline underline-offset-4"
                  onClick={() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  data-testid="link-faq"
                >
                  How does this work?
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
                className="absolute -top-3 -left-2 md:-left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/95 rounded-xl border border-blue-200 shadow-md"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                data-testid="badge-tariff-updated"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 leading-tight">2026 Rates Updated</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Official CBSA tariff data</p>
                </div>
              </motion.div>

              <div className="w-full max-w-[400px] rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm shadow-2xl shadow-black/20 p-5" data-testid="card-hero-mockup">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-xs font-semibold text-white/70 tracking-wider uppercase">Customs Calculator</span>
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/8 border border-white/10">
                    <p className="text-[10px] text-white/50 mb-1">Duty</p>
                    <p className="text-sm font-bold text-white/90">$450.00</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/8 border border-white/10">
                    <p className="text-[10px] text-white/50 mb-1">GST</p>
                    <p className="text-sm font-bold text-white/90">$272.50</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                    <p className="text-[10px] text-blue-200/70 mb-1">Total</p>
                    <p className="text-sm font-bold text-blue-200">$5,722</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50 border-b" data-testid="section-features">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Search, title: "7,050+ HS Codes", desc: "Full 2026 Canadian Customs Tariff" },
              { icon: Globe, title: "90+ Countries", desc: "CUSMA, CPTPP, CETA & more" },
              { icon: MapPin, title: "All Provinces", desc: "GST, HST, PST & QST included" },
              { icon: Upload, title: "Bulk CSV Upload", desc: "Calculate multiple items at once" },
            ].map((feat) => (
              <div key={feat.title} className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mx-auto mb-3">
                  <feat.icon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{feat.title}</p>
                <p className="text-xs text-slate-500 mt-1">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" ref={formRef}>
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Card className="p-6 md:p-8 shadow-lg" data-testid="card-calculator-form">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${DEEP_BLUE}10` }}>
                <Calculator className="w-5 h-5" style={{ color: DEEP_BLUE }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Import Duty Calculator</h2>
                <p className="text-sm text-slate-500">Enter your product details below</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="relative">
                <Label htmlFor="hs-code" className="text-sm font-medium mb-1.5 block">
                  HS Code or Product Description
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    ref={hsInputRef}
                    id="hs-code"
                    data-testid="input-hs-code"
                    placeholder="Search by code (e.g. 6110) or description (e.g. cotton sweater)"
                    value={hsQuery}
                    onChange={(e) => {
                      setHsQuery(e.target.value);
                      setSelectedHsCode(null);
                      searchHsCodes(e.target.value);
                    }}
                    onFocus={() => {
                      if (hsResults.length > 0) setShowHsDropdown(true);
                    }}
                    className="pl-9"
                  />
                  {hsSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                  )}
                </div>

                <AnimatePresence>
                  {showHsDropdown && hsResults.length > 0 && (
                    <motion.div
                      ref={hsDropdownRef}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute z-50 w-full mt-1 bg-white rounded-lg border shadow-xl max-h-64 overflow-y-auto"
                      data-testid="dropdown-hs-results"
                    >
                      {hsResults.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="w-full text-left px-3 py-2.5 hover-elevate cursor-pointer transition-colors border-b last:border-b-0"
                          onClick={() => handleHsSelect(item)}
                          data-testid={`option-hs-${item.code}`}
                        >
                          <span className="text-sm font-mono font-semibold text-blue-700">{item.code}</span>
                          <span className="text-sm text-slate-600 ml-2">
                            {item.description.length > 80 ? item.description.substring(0, 80) + "..." : item.description}
                          </span>
                          {item.unitOfMeasure && (
                            <span className="text-xs text-slate-400 ml-1">({item.unitOfMeasure})</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedHsCode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100"
                    data-testid="selected-hs-info"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-blue-800">
                          Selected: {selectedHsCode.code}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">{selectedHsCode.description}</p>
                      </div>
                      <button
                        type="button"
                        className="p-1 hover-elevate rounded cursor-pointer"
                        onClick={() => {
                          setSelectedHsCode(null);
                          setHsQuery("");
                          hsInputRef.current?.focus();
                        }}
                        data-testid="button-clear-hs"
                      >
                        <X className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="country" className="text-sm font-medium mb-1.5 block">
                    Country of Origin
                  </Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger id="country" data-testid="select-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.name} data-testid={`option-country-${c.name.replace(/\s/g, '-')}`}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="province" className="text-sm font-medium mb-1.5 block">
                    Destination Province
                  </Label>
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger id="province" data-testid="select-province">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="value" className="text-sm font-medium mb-1.5 block">
                    Value of Goods (CAD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="value"
                      data-testid="input-goods-value"
                      placeholder="e.g. 5,000"
                      value={goodsValue}
                      onChange={(e) => setGoodsValue(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium mb-1.5 block">
                    Quantity (optional)
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="quantity"
                      data-testid="input-quantity"
                      placeholder="e.g. 100"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedHsCode?.unitOfMeasure
                      ? `Unit: ${selectedHsCode.unitOfMeasure}`
                      : "Required for per-unit duty rates"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Shipment Type</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={shipmentType === "commercial" ? "default" : "outline"}
                    className={`flex-1 toggle-elevate ${shipmentType === "commercial" ? "toggle-elevated" : ""}`}
                    onClick={() => setShipmentType("commercial")}
                    data-testid="button-commercial"
                  >
                    Commercial
                  </Button>
                  <Button
                    type="button"
                    variant={shipmentType === "personal" ? "default" : "outline"}
                    className={`flex-1 toggle-elevate ${shipmentType === "personal" ? "toggle-elevated" : ""}`}
                    onClick={() => setShipmentType("personal")}
                    data-testid="button-personal"
                  >
                    Personal
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <input
                  type="checkbox"
                  id="confirmedOrigin"
                  checked={confirmedOrigin}
                  onChange={(e) => setConfirmedOrigin(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  data-testid="checkbox-origin-confirmation"
                />
                <label htmlFor="confirmedOrigin" className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer">
                  I confirm the goods qualify under the applicable rules of origin for preferential tariff treatment (e.g., CUSMA, CPTPP, CETA). If unchecked, the Most Favoured Nation (MFN) rate will be applied.
                </label>
              </div>

              <AnimatePresence>
                {inputError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg bg-red-50 border border-red-200"
                  >
                    <p className="text-sm text-red-700" data-testid="text-input-error">{inputError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                size="lg"
                className="w-full text-white font-semibold py-6 text-[23px] rounded-xl"
                style={{ backgroundColor: DEEP_BLUE }}
                onClick={handleCalculate}
                disabled={isCalculating}
                data-testid="button-calculate"
              >
                {isCalculating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Calculate Duties & Taxes
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {isCalculating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-2"
                    data-testid="section-calc-steps"
                  >
                    {calcStepLabels.map((label, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: calcStep >= i ? 1 : 0.3,
                          x: 0,
                        }}
                        className="flex items-center gap-2"
                      >
                        {calcStep > i ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : calcStep === i ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-200" />
                        )}
                        <span className={`text-sm ${calcStep >= i ? "text-slate-700" : "text-slate-400"}`}>
                          {label}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          <div className="mt-6">
            <Card className="p-6" data-testid="card-csv-upload">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-5 h-5 text-slate-500" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Bulk CSV Upload</h3>
                  <p className="text-xs text-slate-500">Calculate multiple items at once</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 mb-4">
                <p className="text-xs text-slate-500 mb-2">
                  CSV format: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">hs_code, country, value_cad, quantity, description</code>
                </p>
                <p className="text-xs text-slate-400">
                  Example: <code className="text-[11px]">6110.20.00, China, 5000, 100, Cotton sweaters</code>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".csv"
                  data-testid="input-csv-upload"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || bulkCalculating}
                  data-testid="button-upload-csv"
                >
                  {bulkCalculating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Calculate
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                ref={resultsRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 space-y-6"
                data-testid="section-results"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Duty & Tax Breakdown</h2>
                  <Button variant="outline" size="sm" onClick={exportPDF} data-testid="button-export-pdf">
                    <Download className="w-4 h-4 mr-1" />
                    Export PDF
                  </Button>
                </div>

                <Card className="p-5 border-2 border-blue-100" data-testid="card-product-details">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Product Details</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">HS Code</p>
                      <p className="font-mono font-semibold text-slate-800">{result.hsCode}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-400">Description</p>
                      <p className="text-slate-800">{result.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Origin</p>
                      <p className="text-slate-800">{result.countryOfOrigin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Value</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(result.valueCAD)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Tariff Treatment</p>
                      <p className="text-slate-800">{result.appliedTreatmentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Province</p>
                      <p className="text-slate-800">{result.provinceName}</p>
                    </div>
                  </div>
                </Card>

                {result.warnings && result.warnings.length > 0 && (
                  <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800" data-testid="card-warnings">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        {result.warnings.map((warning, i) => (
                          <p key={i} className="text-sm text-amber-800 dark:text-amber-200">{warning}</p>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="overflow-hidden" data-testid="card-duty-breakdown">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-5 py-3 font-semibold text-slate-600">Item</th>
                        <th className="text-right px-5 py-3 font-semibold text-slate-600">Rate</th>
                        <th className="text-right px-5 py-3 font-semibold text-slate-600">Amount (CAD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b" data-testid="row-customs-duty">
                        <td className="px-5 py-3 text-slate-700">Customs Duty</td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-mono text-sm">{result.dutyRate}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold" data-testid="text-duty-amount">
                          {formatCurrency(result.dutyAmount)}
                        </td>
                      </tr>
                      <tr className="border-b" data-testid="row-gst">
                        <td className="px-5 py-3 text-slate-700">{result.gstLabel}</td>
                        <td className="px-5 py-3 text-right font-mono">{formatPercent(result.gstRate)}</td>
                        <td className="px-5 py-3 text-right font-semibold" data-testid="text-gst-amount">
                          {formatCurrency(result.gstAmount)}
                        </td>
                      </tr>
                      {result.provincialTaxAmount > 0 && (
                        <tr className="border-b" data-testid="row-provincial-tax">
                          <td className="px-5 py-3 text-slate-700">{result.provincialTaxName}</td>
                          <td className="px-5 py-3 text-right font-mono">{formatPercent(result.provincialTaxRate)}</td>
                          <td className="px-5 py-3 text-right font-semibold" data-testid="text-provincial-tax-amount">
                            {formatCurrency(result.provincialTaxAmount)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">Total Duties & Taxes</td>
                        <td className="px-5 py-3"></td>
                        <td className="px-5 py-3 text-right font-bold text-slate-800" data-testid="text-total-duties">
                          {formatCurrency(result.totalDutiesAndTaxes)}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: `${DEEP_BLUE}08` }} data-testid="row-total-landed">
                        <td className="px-5 py-4 font-bold text-lg" style={{ color: DEEP_BLUE }}>Total Landed Cost</td>
                        <td className="px-5 py-4"></td>
                        <td className="px-5 py-4 text-right font-bold text-lg" style={{ color: DEEP_BLUE }} data-testid="text-total-landed">
                          {formatCurrency(result.totalLandedCost)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>

                {Object.keys(result.availableTreatments).length > 1 && (
                  <Card className="p-5" data-testid="card-alternative-treatments">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">Available Tariff Treatments</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(result.availableTreatments).map(([treatment, data]) => (
                        <div
                          key={treatment}
                          className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
                            treatment === result.appliedTreatment ? "bg-blue-50 border border-blue-100" : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {treatment === result.appliedTreatment && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span className={treatment === result.appliedTreatment ? "font-semibold text-blue-800" : "text-slate-600"}>
                              {treatment}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-xs text-slate-500">{data.rate}</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(data.duty)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <p className="font-semibold">Important Disclaimer:</p>
                      <p>This is an estimate only. Actual duties and taxes are determined by CBSA at the time of importation.</p>
                      <p>Not included in this estimate: SIMA duties (anti-dumping & countervailing), excise duties and taxes, surtaxes, temporary safeguard measures, or any other special levies. Some goods may also be subject to import permits, quotas, or prohibitions.</p>
                      <p>Preferential tariff rates require valid proof of origin documentation. Consult a licensed customs broker or CBSA for binding rulings and accurate assessments.</p>
                    </div>
                  </div>
                </div>

                <Card className="p-5 text-center" style={{ backgroundColor: `${DEEP_BLUE}05` }} data-testid="card-lead-cta">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Want a detailed breakdown emailed to you?</p>
                  <p className="text-xs text-slate-500 mb-3">Get your full customs estimate as a PDF report.</p>
                  <Button
                    style={{ backgroundColor: DEEP_BLUE }}
                    className="text-white font-semibold"
                    onClick={() => { setLeadSubmitted(false); setShowLeadModal(true); }}
                    data-testid="button-email-estimate"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email me this estimate
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {bulkResult && (
              <motion.div
                ref={!result ? resultsRef : undefined}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 space-y-6"
                data-testid="section-bulk-results"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Bulk Results ({bulkResult.summary.totalItems} items)
                  </h2>
                  <Button variant="outline" size="sm" onClick={exportPDF} data-testid="button-export-bulk-pdf">
                    <Download className="w-4 h-4 mr-1" />
                    Export PDF
                  </Button>
                </div>

                <Card className="overflow-x-auto" data-testid="card-bulk-table">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">HS Code</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Origin</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Value</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Duty</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Tax</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResult.items.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2.5 font-mono text-xs">{item.hsCode}</td>
                          <td className="px-4 py-2.5 text-xs max-w-[200px] truncate">{item.description}</td>
                          <td className="px-4 py-2.5 text-xs">{item.countryOfOrigin}</td>
                          <td className="px-4 py-2.5 text-right text-xs">{item.error ? "-" : formatCurrency(item.valueCAD)}</td>
                          <td className="px-4 py-2.5 text-right text-xs">{item.error || formatCurrency(item.dutyAmount)}</td>
                          <td className="px-4 py-2.5 text-right text-xs">{item.error || formatCurrency(item.gstAmount + item.provincialTaxAmount)}</td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold">{item.error || formatCurrency(item.totalForItem)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card className="p-5" style={{ backgroundColor: `${DEEP_BLUE}06` }} data-testid="card-bulk-summary">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Summary ({bulkResult.summary.provinceName})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Total Value</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(bulkResult.summary.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Duty</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(bulkResult.summary.totalDuty)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Taxes</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(bulkResult.summary.totalGST + bulkResult.summary.totalProvincialTax)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Landed Cost</p>
                      <p className="font-bold text-lg" style={{ color: DEEP_BLUE }}>{formatCurrency(bulkResult.summary.totalLandedCost)}</p>
                    </div>
                  </div>
                </Card>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      These are estimates only. Consult a licensed customs broker for accurate assessments.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50" ref={faqRef} data-testid="section-faq">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl font-bold text-slate-900">How Canadian Import Duties Work</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="what-is-hs" className="bg-white rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4" data-testid="faq-what-is-hs">
                What is an HS Code?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4">
                An HS (Harmonized System) code is an internationally standardized classification number for traded products.
                Canada uses 10-digit codes from the Canadian Customs Tariff to determine the duty rate for each product.
                The first 6 digits are internationally standardized, while the remaining digits are Canada-specific.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tariff-treatments" className="bg-white rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4" data-testid="faq-tariff-treatments">
                What are tariff treatments (MFN, CUSMA, CPTPP)?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4">
                Canada has free trade agreements with many countries that reduce or eliminate import duties.
                The calculator automatically applies the best available rate based on the country of origin.
                Key agreements include CUSMA (US/Mexico), CPTPP (Pacific Rim), CETA (EU), and CUKTCA (UK).
                MFN (Most Favoured Nation) is the default rate for countries without a special trade agreement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gst-hst" className="bg-white rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4" data-testid="faq-gst-hst">
                How is GST/HST calculated on imports?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4">
                GST (5% federal) is applied to the value of goods plus any customs duty.
                In provinces with HST (Ontario, Atlantic provinces), a single harmonized rate is charged instead.
                In provinces with separate PST (BC, MB, SK) or QST (Quebec), the provincial tax is charged in addition to GST.
                Alberta, Yukon, NWT, and Nunavut charge only the 5% GST.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="duty-types" className="bg-white rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4" data-testid="faq-duty-types">
                What types of duty rates exist?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4">
                There are three main types: <strong>Ad valorem</strong> (percentage of value, e.g., "8%"),
                <strong>specific</strong> (fixed amount per unit, e.g., "$1.45/kg"), and
                <strong>compound</strong> (combination, e.g., "5% but not less than $0.50/kg").
                Many products under free trade agreements have a "Free" duty rate.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accuracy" className="bg-white rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4" data-testid="faq-accuracy">
                How accurate are these estimates?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4">
                This calculator uses the official 2026 Canadian Customs Tariff (T2026) published by CBSA.
                However, estimates may differ from final assessments because: (1) HS code classification can vary,
                (2) special duties (anti-dumping, countervailing) are not included,
                (3) excise duties on alcohol/tobacco are not calculated,
                (4) origin rules and documentation requirements may affect eligibility for preferential rates.
                Always consult a licensed customs broker for commercial imports.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Need help with your import?</h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            Our team can help you with CARM registration, business numbers, GST/HST accounts, and import/export accounts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              style={{ backgroundColor: DEEP_BLUE }}
              className="text-white font-semibold"
              onClick={() => window.location.href = "/#pricing"}
              data-testid="button-view-services"
            >
              View Our Services
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = "/carm-security-calculator"}
              data-testid="button-carm-calculator"
            >
              CARM Security Calculator
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-lead-capture">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {leadSubmitted ? "Thank you!" : "Get a detailed breakdown"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {leadSubmitted
                ? "We've saved your estimate. Our team will reach out if you need help with your import."
                : "Enter your email and we'll send you a detailed PDF breakdown of your calculation."}
            </DialogDescription>
          </DialogHeader>

          {leadSubmitted ? (
            <div className="flex flex-col items-center py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-slate-600 text-center">Check your email for your detailed estimate.</p>
              <Button className="mt-4" onClick={() => setShowLeadModal(false)} data-testid="button-close-lead">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="lead-email" className="text-sm font-medium mb-1.5 block">
                  Email address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="lead-email"
                    data-testid="input-lead-email"
                    placeholder="you@company.com"
                    value={leadEmail}
                    onChange={(e) => { setLeadEmail(e.target.value); setLeadErrors({}); }}
                    className="pl-9"
                  />
                </div>
                {leadErrors.email && <p className="text-xs text-red-500 mt-1">{leadErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="lead-company" className="text-sm font-medium mb-1.5 block">
                  Company name (optional)
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="lead-company"
                    data-testid="input-lead-company"
                    placeholder="Your company"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lead-phone" className="text-sm font-medium mb-1.5 block">
                  Phone (optional)
                </Label>
                <Input
                  id="lead-phone"
                  data-testid="input-lead-phone"
                  placeholder="+1 (555) 123-4567"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                />
              </div>

              <Button
                className="w-full font-semibold"
                style={{ backgroundColor: DEEP_BLUE }}
                onClick={handleLeadSubmit}
                disabled={leadSubmitting}
                data-testid="button-submit-lead"
              >
                {leadSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {leadSubmitting ? "Sending..." : "Send me the breakdown"}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                We respect your privacy. No spam, ever.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
