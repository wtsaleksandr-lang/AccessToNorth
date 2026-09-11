import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Callout,
  FieldLabel,
  Input,
  ResultCard,
  SegmentedControl,
  Select,
  SelectItem,
  StepRibbon,
  type ResultRow,
} from "@/components/tools";
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
  FileText,
  Upload,
  Download,
  ArrowRight,
  X,
  AlertTriangle,
  ExternalLink,
  Mail,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageMeta } from "@/hooks/use-page-meta";
import Papa from "papaparse";

/**
 * Card-on-canvas shell, matching Home. Each section is an object on the
 * #F2F4F7 canvas rather than a full-bleed band: 98% width capped at the 1328px
 * outer container, 12px radius, 1px hairline edge, 16px gap between cards.
 */
const SHELL = "w-[98%] max-w-container-outer mx-auto rounded-lg border overflow-hidden";

/** Inner content rail: 1280px of content inside the 1328px shell. */
const RAIL = "mx-auto max-w-container px-5 md:px-10";

/**
 * The tool itself reads better narrow — a 1280px-wide form makes the eye travel
 * the full width between a label and its control.
 */
const FORM_RAIL = "mx-auto max-w-3xl px-5 md:px-10";

/**
 * Asymmetric section padding. Adjacent sections pull from different pairs so
 * the vertical rhythm alternates instead of stacking two equal gaps.
 */
const PAD = {
  even: "pt-10 pb-10 md:pt-[76px] md:pb-[76px]",
  topHeavy: "pt-16 pb-10 md:pt-20 md:pb-[60px]",
  tight: "pt-12 pb-10 md:pt-[72px] md:pb-14",
  closing: "pt-14 pb-10 md:pt-20 md:pb-16",
} as const;

interface HsCodeResult {
  code: string;
  description: string;
  descriptionFull?: string;
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
    warnings?: string[];
    requiresManualReview?: boolean;
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
    shipmentType: "commercial" | "personal";
    originConfirmed: boolean;
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

const TARIFF_TOOLTIPS: Record<string, { title: string; description: string }> = {
  MFN: { title: "Most Favoured Nation (MFN)", description: "The default tariff rate applied to imports from countries that do not have a preferential trade agreement with Canada." },
  GPT: { title: "General Preferential Tariff (GPT)", description: "A Canadian tariff program providing reduced or zero duty rates for imports from eligible developing countries." },
  LDCT: { title: "Least Developed Country Tariff (LDCT)", description: "Duty-free or reduced-rate access for imports from the world's least developed countries, as designated by the United Nations." },
  CCCT: { title: "Commonwealth Caribbean Countries Tariff (CCCT)", description: "Preferential tariff rates for imports from Commonwealth Caribbean nations under the CARIBCAN program." },
  UST: { title: "United States Tariff (UST)", description: "Preferential tariff rate for qualifying goods originating in the United States under CUSMA (formerly NAFTA)." },
  MXT: { title: "Mexico Tariff (MXT)", description: "Preferential tariff rate for qualifying goods originating in Mexico under CUSMA (formerly NAFTA)." },
  CPTPT: { title: "Comprehensive and Progressive Agreement for Trans-Pacific Partnership (CPTPP)", description: "A trade agreement between Canada and multiple Indo-Pacific partner countries that can reduce duties on qualifying goods. Eligibility depends on rules of origin and valid proof." },
  CT: { title: "Chile Tariff (CT)", description: "Preferential tariff rate for qualifying goods originating in Chile under the Canada–Chile Free Trade Agreement." },
  CEUT: { title: "Canada–European Union Tariff (CETA)", description: "Preferential tariff rate under the Comprehensive Economic and Trade Agreement between Canada and the European Union." },
  UKT: { title: "Canada–United Kingdom Tariff (CUKTCA)", description: "Preferential tariff rate under the Canada–United Kingdom Trade Continuity Agreement." },
  AUT: { title: "Australia Tariff (AUT)", description: "Preferential tariff rate for qualifying goods originating in Australia under the Canada–Australia trade arrangement." },
  NZT: { title: "New Zealand Tariff (NZT)", description: "Preferential tariff rate for qualifying goods originating in New Zealand under the applicable trade arrangement." },
  CIAT: { title: "Canada–Israel Agreement Tariff (CIAT)", description: "Preferential tariff rate for qualifying goods originating in Israel under the Canada–Israel Free Trade Agreement." },
  COLT: { title: "Colombia Tariff (COLT)", description: "Preferential tariff rate for qualifying goods originating in Colombia under the Canada–Colombia Free Trade Agreement." },
  CRT: { title: "Costa Rica Tariff (CRT)", description: "Preferential tariff rate for qualifying goods originating in Costa Rica under the Canada–Costa Rica Free Trade Agreement." },
  HNT: { title: "Honduras Tariff (HNT)", description: "Preferential tariff rate for qualifying goods originating in Honduras under the Canada–Honduras Free Trade Agreement." },
  PAT: { title: "Panama Tariff (PAT)", description: "Preferential tariff rate for qualifying goods originating in Panama under the Canada–Panama Free Trade Agreement." },
  PT: { title: "Peru Tariff (PT)", description: "Preferential tariff rate for qualifying goods originating in Peru under the Canada–Peru Free Trade Agreement." },
  KRT: { title: "Korea Tariff (KRT)", description: "Preferential tariff rate for qualifying goods originating in South Korea under the Canada–Korea Free Trade Agreement." },
  JT: { title: "Jordan Tariff (JT)", description: "Preferential tariff rate for qualifying goods originating in Jordan under the Canada–Jordan Free Trade Agreement." },
  IT: { title: "Iceland Tariff (IT)", description: "Preferential tariff rate for qualifying goods originating in Iceland under the Canada–EFTA Free Trade Agreement." },
  NT: { title: "Norway Tariff (NT)", description: "Preferential tariff rate for qualifying goods originating in Norway under the Canada–EFTA Free Trade Agreement." },
  SLT: { title: "Switzerland–Liechtenstein Tariff (SLT)", description: "Preferential tariff rate for qualifying goods originating in Switzerland or Liechtenstein under the Canada–EFTA Free Trade Agreement." },
  UAT: { title: "Ukraine Tariff (UAT)", description: "Preferential tariff rate for qualifying goods originating in Ukraine under the Canada–Ukraine Free Trade Agreement." },
  CUSMA: { title: "Canada–United States–Mexico Agreement (CUSMA)", description: "A trade agreement between Canada, the US, and Mexico. Goods must meet specific regional value content and origin rules to qualify for preferential rates." },
  CPTPP: { title: "Comprehensive and Progressive Agreement for Trans-Pacific Partnership (CPTPP)", description: "A trade agreement between Canada and multiple Indo-Pacific partner countries that can reduce duties on qualifying goods. Eligibility depends on rules of origin and valid proof." },
  CETA: { title: "Canada–EU Comprehensive Economic and Trade Agreement (CETA)", description: "A trade agreement reducing duties on qualifying goods traded between Canada and EU member states." },
  CUKTCA: { title: "Canada–UK Trade Continuity Agreement (CUKTCA)", description: "A trade agreement maintaining preferential tariff treatment for goods traded between Canada and the UK." },
};

function getTariffTooltipData(code: string): { title: string; description: string } {
  if (TARIFF_TOOLTIPS[code]) return TARIFF_TOOLTIPS[code];
  return {
    title: `Tariff Treatment: ${code}`,
    description: "This is a Canadian tariff treatment category. Eligibility depends on origin and proof. If unsure, use MFN or request a review.",
  };
}

/**
 * A tariff abbreviation that explains itself on click.
 *
 * The dotted underline is the affordance; the accent is reserved for focus and
 * hover, so the resting state is `#314158` secondary ink (7.8:1) rather than a
 * link blue. An importer must be able to read the abbreviation either way —
 * the popover adds detail, it never hides anything required.
 */
function TariffTooltip({ abbr, title, description }: { abbr: string; title: string; description: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer font-semibold text-text-secondary underline decoration-dotted underline-offset-2 transition-colors duration-state hover:text-brand"
          data-testid={`tooltip-trigger-${abbr.toLowerCase()}`}
        >
          {abbr}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-lg border-border-hairline p-4" side="top">
        <p className="text-[14px] font-semibold leading-5 text-text-primary">{title}</p>
        <p className="mt-1 text-[13px] leading-[18px] text-text-muted">{description}</p>
      </PopoverContent>
    </Popover>
  );
}

export default function CustomsCalculator() {

  const [hsQuery, setHsQuery] = useState("");
  const [hsResults, setHsResults] = useState<HsCodeResult[]>([]);
  const [selectedHsCode, setSelectedHsCode] = useState<HsCodeResult | null>(null);
  const [showHsDropdown, setShowHsDropdown] = useState(false);
  const [hsSearching, setHsSearching] = useState(false);


  const [countries, setCountries] = useState<Country[]>([]);
  const [tariffUnavailable, setTariffUnavailable] = useState<string | null>(null);
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
  const [pdfExporting, setPdfExporting] = useState(false);

  const [measuresOpen, setMeasuresOpen] = useState(false);
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
  const [prefillSource, setPrefillSource] = useState<string | null>(null);

  usePageMeta({
    title: "Canadian Customs Duty & Tax Calculator | AccessToNorth.com",
    description: "Estimate Canadian customs duty and border taxes using the current T2026 tariff, country of origin, shipment type, and destination province.",
    canonical: "/customs-calculator",
  });

  useEffect(() => {
    fetch("/api/customs/countries")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        // Defensive: only accept arrays. A non-200 or malformed response used
        // to be passed straight into setCountries, which crashed the page on
        // the next render with "countries.map is not a function".
        if (Array.isArray(data)) {
          setCountries(data);
          setTariffUnavailable(null);
        } else {
          console.error("[CustomsCalculator] /api/customs/countries returned non-array:", data);
          setCountries([]);
        }
      })
      .catch((err) => {
        console.error("[CustomsCalculator] failed to load countries:", err);
        setCountries([]);
        setTariffUnavailable("Canadian tariff data is temporarily unavailable. Calculations are paused so we do not show an unreliable estimate.");
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hsParam = params.get("hs");
    const srcParam = params.get("src");
    if (hsParam) {
      setHsQuery(hsParam);
      setHsSearching(true);
      fetch(`/api/customs/hs-search?q=${encodeURIComponent(hsParam)}&limit=5`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: HsCodeResult[]) => {
          const exact = data.find((d) => d.code === hsParam);
          if (exact) {
            const displayDesc = exact.descriptionFull || exact.description;
            setSelectedHsCode({ ...exact, descriptionFull: displayDesc });
            setHsQuery(`${exact.code} - ${displayDesc.length > 80 ? displayDesc.substring(0, 80) + "..." : displayDesc}`);
          } else {
            setHsResults(data);
            setShowHsDropdown(data.length > 0);
          }
        })
        .catch(() => setTariffUnavailable("Canadian tariff data is temporarily unavailable. Please try again shortly."))
        .finally(() => setHsSearching(false));
      if (srcParam === "hsfinder") {
        setPrefillSource("hsfinder");
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHsResults(data);
        setShowHsDropdown(data.length > 0);
      } catch {
        setHsResults([]);
        setTariffUnavailable("Canadian tariff data is temporarily unavailable. Please try again shortly.");
      } finally {
        setHsSearching(false);
      }
    }, 300);
  }, []);

  const handleHsSelect = (item: HsCodeResult) => {
    const displayDesc = item.descriptionFull || item.description;
    setSelectedHsCode({ ...item, descriptionFull: displayDesc });
    setHsQuery(`${item.code} - ${displayDesc.length > 80 ? displayDesc.substring(0, 80) + "..." : displayDesc}`);
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

    setCalcStep(2);
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
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      const msg = err?.message || "Calculation failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setBulkCalculating(true);
    setBulkResult(null);
    setResult(null);

    try {
      const text = await csvFile.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
      });
      if (parsed.errors.length || parsed.data.length === 0) {
        const detail = parsed.errors[0]?.message || "CSV must have a header row and at least one data row.";
        toast({ title: "Invalid CSV", description: detail, variant: "destructive" });
        return;
      }

      const items = parsed.data.map((row) => {
        return {
          hsCode: row.hs_code?.trim() || "",
          countryOfOrigin: row.country?.trim() || "Other / Unknown",
          valueCAD: Number.parseFloat(row.value_cad) || 0,
          quantity: Number.parseFloat(row.quantity) || 0,
          description: row.description?.trim() || undefined,
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
        confirmedOrigin,
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

  const exportPDF = async () => {
    if (!result && !bulkResult) return;
    setPdfExporting(true);
    try {
      const [{ generateCustomsEstimatePdfBlob }, { loadAccessToNorthLogoDataUrl }] = await Promise.all([
        import("@/lib/customsPdf"),
        import("@/lib/loadingReportPdfBrand"),
      ]);
      const logoDataUrl = await loadAccessToNorthLogoDataUrl();
      const pdfData = result
        ? {
            title: "Canadian Customs Estimate",
            items: [{
              hsCode: result.hsCode,
              description: result.description,
              countryOfOrigin: result.countryOfOrigin,
              valueCAD: result.valueCAD,
              quantity: result.quantity,
              dutyRate: result.dutyRate,
              dutyAmount: result.dutyAmount,
              gstAmount: result.gstAmount,
              provincialTaxAmount: result.provincialTaxAmount,
              totalForItem: result.totalLandedCost,
              warnings: result.warnings,
            }],
            summary: {
              totalValue: result.valueCAD,
              totalDuty: result.dutyAmount,
              totalGST: result.gstAmount,
              totalProvincialTax: result.provincialTaxAmount,
              totalDutiesAndTaxes: result.totalDutiesAndTaxes,
              totalLandedCost: result.totalLandedCost,
              provinceName: result.provinceName,
              shipmentType: result.shipmentType,
            },
            tariffTreatment: `${result.appliedTreatmentName} (${result.appliedTreatment})`,
            warnings: result.warnings,
            logoDataUrl,
          }
        : {
            title: "Canadian Customs Bulk Estimate",
            items: bulkResult!.items,
            summary: { ...bulkResult!.summary, shipmentType },
            warnings: bulkResult!.items.flatMap((item: any) => item.warnings || []),
            logoDataUrl,
          };
      const blob = await generateCustomsEstimatePdfBlob(pdfData);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `AccessToNorth-customs-estimate-${new Date().toISOString().slice(0, 10)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF report downloaded", description: "The calculation basis, assumptions, classifications, and border charges are included." });
    } catch (error) {
      console.error("Customs PDF export failed", error);
      toast({ title: "PDF export failed", description: "Please try again. Your estimate is still available on screen.", variant: "destructive" });
    } finally {
      setPdfExporting(false);
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

  /**
   * Read-out of progress through the flow. Derived from state the form already
   * holds — it gates nothing and submits nothing, so it cannot change what is
   * sent to /api/customs/calculate.
   */
  const doneSteps: number[] = [];
  if (selectedHsCode) doneSteps.push(0);
  if (selectedCountry && goodsValue.trim()) doneSteps.push(1);
  if (result) doneSteps.push(2);
  const currentStep = [0, 1, 2].find((i) => !doneSteps.includes(i)) ?? 2;

  /**
   * Breakdown rows. The figures come straight from the API response and are
   * formatted by the same two helpers as before — this is layout only.
   */
  const breakdownRows: ResultRow[] = result
    ? [
        {
          label: "Customs Duty",
          meta: result.dutyRate,
          value: formatCurrency(result.dutyAmount),
          testId: "row-customs-duty",
          valueTestId: "text-duty-amount",
        },
        {
          label: result.gstLabel,
          meta: formatPercent(result.gstRate),
          value: formatCurrency(result.gstAmount),
          testId: "row-gst",
          valueTestId: "text-gst-amount",
        },
        ...(result.provincialTaxAmount > 0
          ? [
              {
                label: result.provincialTaxName,
                meta: formatPercent(result.provincialTaxRate),
                value: formatCurrency(result.provincialTaxAmount),
                testId: "row-provincial-tax",
                valueTestId: "text-provincial-tax-amount",
              },
            ]
          : []),
        {
          label: "Total Duties & Taxes",
          value: formatCurrency(result.totalDutiesAndTaxes),
          emphasis: true,
          valueTestId: "text-total-duties",
        },
      ]
    : [];

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
                <p className="text-eyebrow uppercase text-text-deemphasis">
                  Free Import Calculator
                </p>
                <h1
                  className="mt-4 text-h1-sm text-white md:text-h1"
                  data-testid="text-customs-heading"
                >
                  Canadian Customs Duty &amp; Tax Calculator
                </h1>
                <p className="mt-5 max-w-lg text-lead text-text-deemphasis" data-testid="text-customs-subheading">
                  Estimate customs duty and taxes normally payable at the Canadian border. Commercial and personal imports are calculated separately.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                    onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    data-testid="button-hero-calculate"
                  >
                    <Calculator className="mr-2 h-4 w-4" aria-hidden="true" />
                    Start calculating
                    <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Button>
                  <button
                    type="button"
                    className="cursor-pointer text-body font-semibold text-text-deemphasis underline underline-offset-4 transition-colors duration-state hover:text-white sm:self-center"
                    onClick={() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    data-testid="link-faq"
                  >
                    How does this work?
                  </button>
                </div>
              </div>

              {/*
                Illustrative panel. Labelled "Sample output" because the tile
                figures are made up: a decorative dollar amount next to a live
                duty calculator must not be mistakable for a real estimate.
              */}
              <div className="w-full min-w-0 lg:w-1/2">
                <div
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
                  data-testid="card-hero-mockup"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-eyebrow uppercase text-text-deemphasis">Sample output</span>
                    <div
                      className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5"
                      data-testid="badge-tariff-updated"
                    >
                      <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                      <div>
                        <p className="text-[12px] font-semibold leading-tight text-white">2026 Rates Updated</p>
                        <p className="text-[11px] leading-tight text-text-deemphasis">Official CBSA tariff data</p>
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

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Duty", value: "$450.00" },
                      { label: "GST", value: "$272.50" },
                      { label: "Total", value: "$5,722" },
                    ].map((tile) => (
                      <div key={tile.label} className="rounded-md border border-white/10 p-3">
                        <p className="text-[12px] leading-tight text-text-deemphasis">{tile.label}</p>
                        <p className="mt-1 text-[14px] font-bold leading-tight text-white tabular-nums">{tile.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What the tool covers ────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.tight}`} data-testid="section-features">
          <div className={RAIL}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
              {[
                { icon: Search, title: "8 & 10-digit tariff", desc: "Full 2026 Canadian Customs Tariff" },
                { icon: Globe, title: "90+ Countries", desc: "CUSMA, CPTPP, CETA & more" },
                { icon: MapPin, title: "Import Type Aware", desc: "Commercial vs personal tax treatment" },
                { icon: Upload, title: "Bulk CSV Upload", desc: "Calculate multiple items at once" },
              ].map((feat) => (
                <div key={feat.title}>
                  <feat.icon className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  <p className="mt-3 text-h3 text-text-primary">{feat.title}</p>
                  <p className="mt-1.5 text-body text-text-muted">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Calculator ──────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.topHeavy}`} ref={formRef}>
          <div className={FORM_RAIL}>
            <div data-testid="card-calculator-form">
              <StepRibbon
                steps={[{ label: "Classify" }, { label: "Shipment" }, { label: "Duty & tax" }]}
                current={currentStep}
                completed={doneSteps}
                className="mb-5"
                data-testid="step-ribbon-customs"
              />

              <h2 className="text-h2 text-text-primary">Import Duty Calculator</h2>
              <p className="mt-2 text-lead text-text-muted">Enter your product details below</p>

              <div className="mt-8 space-y-6">
                {tariffUnavailable && (
                  <Callout
                    tone="error"
                    role="alert"
                    title="Tariff service temporarily unavailable"
                    data-testid="alert-tariff-unavailable"
                  >
                    <p>{tariffUnavailable}</p>
                  </Callout>
                )}

                <div className="relative">
                  <FieldLabel
                    htmlFor="hs-code"
                    helpTone="warning"
                    help={
                      <span className="flex items-start gap-1.5">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Suggested matches only. HS classification depends on product details. Verify before relying on results.
                      </span>
                    }
                  >
                    HS Code Lookup
                  </FieldLabel>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
                    <Input
                      ref={hsInputRef}
                      id="hs-code"
                      data-testid="input-hs-code"
                      placeholder="Enter HS code or product name (e.g. 6110, milk, chocolate)"
                      value={hsQuery}
                      onChange={(e) => {
                        setHsQuery(e.target.value);
                        setSelectedHsCode(null);
                        searchHsCodes(e.target.value);
                      }}
                      onFocus={() => {
                        if (hsResults.length > 0) setShowHsDropdown(true);
                      }}
                      hasLeadingIcon
                      hasTrailingIcon={hsSearching}
                    />
                    {hsSearching && (
                      <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-deemphasis" aria-hidden="true" />
                    )}
                  </div>

                  {showHsDropdown && hsResults.length > 0 && (
                    <div
                      ref={hsDropdownRef}
                      className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-border-hairline bg-white shadow-md"
                      data-testid="dropdown-hs-results"
                    >
                      {hsResults.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="w-full cursor-pointer border-b border-border-hairline px-4 py-3 text-left transition-colors duration-state last:border-b-0 hover:bg-surface-recessed"
                          onClick={() => handleHsSelect(item)}
                          data-testid={`option-hs-${item.code}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 rounded-md bg-surface-canvas px-2 py-0.5 font-mono text-[13px] font-semibold tabular-nums text-text-primary">
                              {item.code}
                            </span>
                            <span className="line-clamp-2 text-body text-text-secondary">
                              {(item.descriptionFull || item.description).length > 140
                                ? (item.descriptionFull || item.description).substring(0, 140) + "..."
                                : (item.descriptionFull || item.description)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!selectedHsCode && hsQuery.length >= 2 && !hsSearching && hsResults.length === 0 && (
                    <p className="mt-2 text-body text-text-muted">No matches found. Try different keywords or a specific HS code.</p>
                  )}

                  {!selectedHsCode && (
                    <div className="mt-3 rounded-md border border-border-hairline bg-surface-recessed p-3">
                      <p className="text-body text-text-muted">
                        Need help finding an HS code?{" "}
                        <Link
                          href="/tools/hs-code-finder"
                          className="font-semibold text-text-secondary underline underline-offset-2 transition-colors duration-state hover:text-brand"
                          data-testid="link-hs-finder"
                        >
                          Use HS Code Finder
                        </Link>
                        {" "} | {" "}
                        <a
                          href="/services/hs-code-classification-canada"
                          className="font-semibold text-text-secondary underline underline-offset-2 transition-colors duration-state hover:text-brand"
                          data-testid="link-hs-review-cta"
                        >
                          Order an HS code &amp; duty review
                        </a>
                      </p>
                    </div>
                  )}

                  {selectedHsCode && (
                    <div
                      className="mt-3 rounded-md border-2 border-brand bg-white p-4"
                      data-testid="selected-hs-info"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-body font-semibold text-text-primary">
                            Selected: <span className="font-mono tabular-nums">{selectedHsCode.code}</span>
                            {prefillSource === "hsfinder" && (
                              <span className="ml-2 font-normal text-text-muted" data-testid="text-prefill-notice">
                                (prefilled from HS Code Finder)
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-body text-text-muted">
                            {((selectedHsCode.descriptionFull || selectedHsCode.description).length > 120
                              ? (selectedHsCode.descriptionFull || selectedHsCode.description).substring(0, 120) + "..."
                              : (selectedHsCode.descriptionFull || selectedHsCode.description))}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 cursor-pointer rounded-md p-1 text-text-muted transition-colors duration-state hover:text-text-primary"
                          onClick={() => {
                            setSelectedHsCode(null);
                            setHsQuery("");
                            setPrefillSource(null);
                            hsInputRef.current?.focus();
                          }}
                          data-testid="button-clear-hs"
                          aria-label="Clear selected HS code"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="country">Country of Origin</FieldLabel>
                    <Select
                      id="country"
                      value={selectedCountry}
                      onValueChange={setSelectedCountry}
                      disabled={Boolean(tariffUnavailable)}
                      placeholder="Select country"
                      data-testid="select-country"
                    >
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.name} data-testid={`option-country-${c.name.replace(/\s/g, '-')}`}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="province">Destination Province</FieldLabel>
                    <Select
                      id="province"
                      value={selectedProvince}
                      onValueChange={setSelectedProvince}
                      placeholder="Select province"
                      data-testid="select-province"
                    >
                      {PROVINCES.map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="value">Value of Goods (CAD)</FieldLabel>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
                      <Input
                        id="value"
                        data-testid="input-goods-value"
                        placeholder="e.g. 5,000"
                        value={goodsValue}
                        onChange={(e) => setGoodsValue(e.target.value)}
                        hasLeadingIcon
                        className="tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel
                      htmlFor="quantity"
                      help={
                        selectedHsCode?.unitOfMeasure
                          ? `Unit: ${selectedHsCode.unitOfMeasure}`
                          : "Required for per-unit duty rates"
                      }
                    >
                      Quantity{selectedHsCode?.unitOfMeasure ? ` (${selectedHsCode.unitOfMeasure})` : " (optional)"}
                    </FieldLabel>
                    <div className="relative">
                      <Package className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
                      <Input
                        id="quantity"
                        data-testid="input-quantity"
                        placeholder="e.g. 100"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        hasLeadingIcon
                        className="tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel>Shipment Type</FieldLabel>
                  <SegmentedControl
                    ariaLabel="Shipment Type"
                    value={shipmentType}
                    onChange={setShipmentType}
                    options={[
                      { value: "commercial", label: "Commercial", testId: "button-commercial" },
                      { value: "personal", label: "Personal", testId: "button-personal" },
                    ]}
                  />
                </div>

                {/*
                  LEGALLY LOAD-BEARING CONTROL — do not quieten this.
                  Ticking it switches which tariff treatment the backend applies
                  (preferential vs MFN), so it must read as an unticked decision
                  the importer actively makes, never as a pre-accepted default.
                  Hence: 20px box, never pre-checked, the block's own border is
                  the 2px selection swap (#EAECF0 -> #3356EE) so the confirmed
                  state is unmistakable at a glance, and the border is 2px in
                  both states so nothing reflows when it is ticked.
                */}
                <div
                  className={`rounded-lg border-2 p-4 transition-colors duration-state ${
                    confirmedOrigin ? "border-brand bg-white" : "border-border-app bg-surface-recessed"
                  }`}
                >
                  <p className="text-[14px] font-semibold leading-5 text-text-primary">Preferential Tariff Eligibility</p>
                  <div className="mt-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="confirmedOrigin"
                      checked={confirmedOrigin}
                      onChange={(e) => setConfirmedOrigin(e.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-[4px] border-2 border-border-control accent-brand"
                      data-testid="checkbox-origin-confirmation"
                    />
                    <label htmlFor="confirmedOrigin" className="cursor-pointer text-[14px] leading-[20px] text-text-secondary">
                      I confirm that I have proof that these goods qualify under the selected trade agreement rules of origin
                      (e.g., <TariffTooltip abbr="CUSMA" {...TARIFF_TOOLTIPS.CUSMA} />,{" "}
                      <TariffTooltip abbr="CPTPP" {...TARIFF_TOOLTIPS.CPTPP} />,{" "}
                      <TariffTooltip abbr="CETA" {...TARIFF_TOOLTIPS.CETA} />).
                    </label>
                  </div>
                  <p className="mt-3 pl-8 text-[14px] leading-[20px] text-text-muted">
                    If unsure, leave unchecked and <TariffTooltip abbr="MFN" {...TARIFF_TOOLTIPS.MFN} /> rate will apply.
                  </p>
                </div>

                {inputError && (
                  <Callout tone="error" role="alert">
                    <p data-testid="text-input-error">{inputError}</p>
                  </Callout>
                )}

                <Button
                  size="lg"
                  className="h-12 w-full bg-brand text-[15px] font-semibold text-white transition-colors duration-state hover:bg-brand-hover"
                  onClick={handleCalculate}
                  disabled={isCalculating || Boolean(tariffUnavailable)}
                  data-testid="button-calculate"
                >
                  {isCalculating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Calculating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" aria-hidden="true" />
                      Calculate Duties &amp; Taxes
                    </span>
                  )}
                </Button>

                {isCalculating && (
                  <div className="space-y-2 pt-1" data-testid="section-calc-steps">
                    {calcStepLabels.map((label, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {calcStep > i ? (
                          <Check className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                        ) : calcStep === i ? (
                          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-border-control" aria-hidden="true" />
                        )}
                        <span className={`text-body ${calcStep >= i ? "text-text-secondary" : "text-text-deemphasis"}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Bulk CSV ──────────────────────────────────────────── */}
            <div className="mt-8 rounded-lg border border-border-hairline bg-surface-recessed p-5" data-testid="card-csv-upload">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-h3 text-text-primary">Bulk CSV Upload</h3>
                  <p className="mt-1 text-body text-text-muted">Calculate multiple items at once</p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-border-hairline bg-white p-3">
                <p className="text-body text-text-muted">
                  CSV format: <code className="rounded-[4px] bg-surface-canvas px-1.5 py-0.5 font-mono text-[13px] text-text-primary">hs_code, country, value_cad, quantity, description</code>
                </p>
                <p className="mt-2 text-body text-text-muted">
                  Example: <code className="font-mono text-[13px] text-text-secondary">6110.20.00, China, 5000, 100, Cotton sweaters</code>
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept=".csv"
                  data-testid="input-csv-upload"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="flex-1 py-3"
                />
                <Button
                  className="h-12 shrink-0 bg-brand px-5 text-[15px] font-semibold text-white transition-colors duration-state hover:bg-brand-hover"
                  onClick={handleCsvUpload}
                  disabled={!csvFile || bulkCalculating || Boolean(tariffUnavailable)}
                  data-testid="button-upload-csv"
                >
                  {bulkCalculating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Calculate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ── Single-item results ───────────────────────────────── */}
            {result && (
              <div ref={resultsRef} className="mt-10 space-y-4" data-testid="section-results">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-h2 text-text-primary">Duty &amp; Tax Breakdown</h2>
                  <Button
                    variant="outline"
                    className="border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                    onClick={exportPDF}
                    disabled={pdfExporting}
                    data-testid="button-export-pdf"
                  >
                    {pdfExporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                    Complete PDF
                  </Button>
                </div>

                {/*
                  Warnings sit ABOVE every figure they qualify, at the same
                  14px as the figures themselves. A caveat placed under a
                  number is a caveat the reader has already acted past.
                */}
                {result.warnings && result.warnings.length > 0 && (
                  <Callout role="alert" data-testid="card-warnings">
                    {result.warnings.map((warning, i) => (
                      <p key={i}>{warning}</p>
                    ))}
                  </Callout>
                )}

                <div className="rounded-lg border border-border-hairline bg-white p-5" data-testid="card-product-details">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    <span className="text-h3 text-text-primary">Product Details</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-3">
                    <div>
                      <dt className="text-[13px] leading-[18px] text-text-muted">HS Code</dt>
                      <dd className="mt-0.5 font-mono text-body font-semibold tabular-nums text-text-primary">{result.hsCode}</dd>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <dt className="text-[13px] leading-[18px] text-text-muted">Description</dt>
                      <dd className="mt-0.5 text-body text-text-primary">{result.description}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] leading-[18px] text-text-muted">Origin</dt>
                      <dd className="mt-0.5 text-body text-text-primary">{result.countryOfOrigin}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] leading-[18px] text-text-muted">Value</dt>
                      <dd className="mt-0.5 text-body font-semibold tabular-nums text-text-primary">{formatCurrency(result.valueCAD)}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] leading-[18px] text-text-muted">Tariff Treatment</dt>
                      <dd className="mt-0.5 text-body text-text-primary">
                        <TariffTooltip abbr={result.appliedTreatment} {...getTariffTooltipData(result.appliedTreatment)} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[13px] leading-[18px] text-text-muted">Province</dt>
                      <dd className="mt-0.5 text-body text-text-primary">{result.provinceName}</dd>
                    </div>
                  </dl>
                </div>

                {/*
                  `figureNote` carries the currency designation the old table
                  header ("Amount (CAD)") used to carry — dropping the header
                  row must not drop the units.
                */}
                <ResultCard
                  data-testid="card-duty-breakdown"
                  figureLabel="Goods + Border Charges"
                  figure={formatCurrency(result.totalLandedCost)}
                  figureNote="All amounts in Canadian dollars (CAD)."
                  figureRowTestId="row-total-landed"
                  figureTestId="text-total-landed"
                  rows={breakdownRows}
                />

                {Object.keys(result.availableTreatments).length > 1 && (
                  <div className="rounded-lg border border-border-hairline bg-white p-5" data-testid="card-alternative-treatments">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-text-muted" aria-hidden="true" />
                      <span className="text-h3 text-text-primary">Available Tariff Treatments</span>
                    </div>
                    <div className="mt-4 rounded-lg bg-surface-canvas p-1">
                      <div className="space-y-1">
                        {Object.entries(result.availableTreatments).map(([treatment, data]) => (
                          <div
                            key={treatment}
                            className={`flex items-center justify-between gap-3 rounded-md border-2 px-3 py-2.5 ${
                              treatment === result.appliedTreatment
                                ? "border-brand bg-white"
                                : "border-transparent bg-white"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {treatment === result.appliedTreatment && (
                                <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                              )}
                              <span className="text-body text-text-secondary">
                                <TariffTooltip abbr={treatment} {...getTariffTooltipData(treatment)} />
                              </span>
                              {treatment === result.appliedTreatment && (
                                <span className="text-[13px] text-text-muted">applied</span>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-4">
                              <span className="text-[13px] tabular-nums text-text-muted">{data.rate}</span>
                              <span className="min-w-[92px] text-right text-body font-semibold tabular-nums text-text-primary">{formatCurrency(data.duty)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Callout title="Important Disclaimer:">
                  <p>This is an estimate only. Actual duties and taxes are determined by CBSA at the time of importation.</p>
                  <p>Not included in this estimate: SIMA duties (anti-dumping &amp; countervailing), excise duties and taxes, surtaxes, temporary safeguard measures, or any other special levies. Some goods may also be subject to import permits, quotas, or prohibitions.</p>
                  <p>Preferential tariff rates require valid proof of origin documentation. Consult a licensed customs broker or CBSA for binding rulings and accurate assessments.</p>
                </Callout>

                <Collapsible open={measuresOpen} onOpenChange={setMeasuresOpen}>
                  <div className="rounded-lg border border-border-hairline bg-white">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-4 text-left transition-colors duration-state hover:bg-surface-recessed"
                        data-testid="button-additional-measures"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-[#B45309]" aria-hidden="true" />
                          <span className="text-h3 text-text-primary">Additional Measures Check</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-state ${measuresOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-3 px-4 pb-4">
                        {[
                          {
                            href: "https://www.cbsa-asfc.gc.ca/sima-lmsi/menu-eng.html",
                            testId: "link-sima",
                            title: "SIMA (Anti-Dumping & Countervailing Duties)",
                            body: "This tool does not automatically calculate SIMA duties. Certain goods from specific countries may be subject to additional anti-dumping or countervailing duties. Check the CBSA SIMA measures list for your product.",
                          },
                          {
                            href: "https://www.canada.ca/en/revenue-agency/services/tax/excise-duties-levies.html",
                            testId: "link-excise",
                            title: "Excise Duties",
                            body: "Alcohol, tobacco, cannabis, fuel, and certain vehicles may be subject to excise duties not calculated here. These are assessed separately by CBSA.",
                          },
                          {
                            href: "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/surtax-eng.html",
                            testId: "link-surtax",
                            title: "Surtaxes & Temporary Measures",
                            body: "Retaliatory or temporary surtaxes may apply to certain goods from specific countries. These measures change periodically and are not included in this estimate.",
                          },
                          {
                            href: "https://www.international.gc.ca/controls-controles/about-a_propos/impor/permits-licences.aspx?lang=eng",
                            testId: "link-import-controls",
                            title: "Import Controls (Permits, Quotas, Prohibitions)",
                            body: "Certain goods require import permits, are subject to tariff rate quotas, or are prohibited. Check with CBSA or Global Affairs Canada for your product category.",
                          },
                        ].map((measure) => (
                          <div key={measure.testId} className="rounded-md border border-border-hairline bg-surface-recessed p-4">
                            <a
                              href={measure.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-body font-semibold text-text-secondary transition-colors duration-state hover:text-brand"
                              data-testid={measure.testId}
                            >
                              {measure.title}
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            </a>
                            <p className="mt-1.5 text-body text-text-muted">{measure.body}</p>
                          </div>
                        ))}
                        <div className="pt-1">
                          <a
                            href="/services/import-compliance-review"
                            className="text-body font-semibold text-text-secondary underline underline-offset-2 transition-colors duration-state hover:text-brand"
                            data-testid="link-measures-review"
                          >
                            Need help? Order a professional customs review
                          </a>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <div className="rounded-lg border border-border-hairline bg-surface-recessed p-5" data-testid="card-lead-cta">
                  <p className="text-h3 text-text-primary">Want a detailed breakdown emailed to you?</p>
                  <p className="mt-1.5 text-body text-text-muted">Get your full customs estimate as a PDF report.</p>
                  <Button
                    className="mt-4 bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                    onClick={() => { setLeadSubmitted(false); setShowLeadModal(true); }}
                    data-testid="button-email-estimate"
                  >
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Email me this estimate
                  </Button>
                </div>
              </div>
            )}

            {/* ── Bulk results ──────────────────────────────────────── */}
            {bulkResult && (
              <div
                ref={!result ? resultsRef : undefined}
                className="mt-10 space-y-4"
                data-testid="section-bulk-results"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-h2 text-text-primary">
                    Bulk Results ({bulkResult.summary.totalItems} items)
                  </h2>
                  <Button
                    variant="outline"
                    className="border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                    onClick={exportPDF}
                    disabled={pdfExporting}
                    data-testid="button-export-bulk-pdf"
                  >
                    {pdfExporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                    Complete PDF
                  </Button>
                </div>

                <Callout role="alert">
                  <p>
                    These are estimates only. Consult a licensed customs broker for accurate assessments.
                  </p>
                </Callout>

                <div className="overflow-x-auto rounded-lg border border-border-hairline bg-white" data-testid="card-bulk-table">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-hairline bg-surface-recessed">
                        <th className="px-4 py-3 text-left text-[13px] font-semibold text-text-muted">HS Code</th>
                        <th className="px-4 py-3 text-left text-[13px] font-semibold text-text-muted">Description</th>
                        <th className="px-4 py-3 text-left text-[13px] font-semibold text-text-muted">Origin</th>
                        <th className="px-4 py-3 text-right text-[13px] font-semibold text-text-muted">Value</th>
                        <th className="px-4 py-3 text-right text-[13px] font-semibold text-text-muted">Duty</th>
                        <th className="px-4 py-3 text-right text-[13px] font-semibold text-text-muted">Tax</th>
                        <th className="px-4 py-3 text-right text-[13px] font-semibold text-text-muted">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResult.items.map((item, i) => (
                        <tr key={i} className="border-b border-border-hairline last:border-b-0">
                          <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-text-primary">{item.hsCode}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-body text-text-secondary">{item.description}</td>
                          <td className="px-4 py-3 text-body text-text-secondary">{item.countryOfOrigin}</td>
                          <td className="px-4 py-3 text-right text-body tabular-nums text-text-primary">{item.error ? "-" : formatCurrency(item.valueCAD)}</td>
                          <td className="px-4 py-3 text-right text-body tabular-nums text-text-primary">{item.error || formatCurrency(item.dutyAmount)}</td>
                          <td className="px-4 py-3 text-right text-body tabular-nums text-text-primary">{item.error || formatCurrency(item.gstAmount + item.provincialTaxAmount)}</td>
                          <td className="px-4 py-3 text-right text-body font-semibold tabular-nums text-text-primary">{item.error || formatCurrency(item.totalForItem)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ResultCard
                  data-testid="card-bulk-summary"
                  title={`Summary (${bulkResult.summary.provinceName})`}
                  figureLabel="Goods + Border Charges"
                  figure={formatCurrency(bulkResult.summary.totalLandedCost)}
                  figureNote="All amounts in Canadian dollars (CAD)."
                  rows={[
                    { label: "Total Value", value: formatCurrency(bulkResult.summary.totalValue) },
                    { label: "Total Duty", value: formatCurrency(bulkResult.summary.totalDuty) },
                    {
                      label: "Total Taxes",
                      value: formatCurrency(bulkResult.summary.totalGST + bulkResult.summary.totalProvincialTax),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-surface-recessed ${PAD.tight}`} ref={faqRef} data-testid="section-faq">
          <div className={FORM_RAIL}>
            <p className="text-eyebrow uppercase text-text-muted">Frequently Asked Questions</p>
            <h2 className="mt-3 text-h2 text-text-primary">How Canadian Import Duties Work</h2>

            <Accordion type="single" collapsible className="mt-8 space-y-3">
              {[
                {
                  value: "what-is-hs",
                  testId: "faq-what-is-hs",
                  q: "What is an HS Code?",
                  a: (
                    <>
                      An HS (Harmonized System) code is an internationally standardized classification number for traded products.
                      Canada uses 10-digit codes from the Canadian Customs Tariff to determine the duty rate for each product.
                      The first 6 digits are internationally standardized, while the remaining digits are Canada-specific.
                    </>
                  ),
                },
                {
                  value: "tariff-treatments",
                  testId: "faq-tariff-treatments",
                  q: "What are tariff treatments (MFN, CUSMA, CPTPP)?",
                  a: (
                    <>
                      Canada has free trade agreements with many countries that reduce or eliminate import duties.
                      The calculator automatically applies the best available rate based on the country of origin.
                      Key agreements include <TariffTooltip abbr="CUSMA" {...TARIFF_TOOLTIPS.CUSMA} /> (US/Mexico),{" "}
                      <TariffTooltip abbr="CPTPP" {...TARIFF_TOOLTIPS.CPTPP} /> (Indo-Pacific),{" "}
                      <TariffTooltip abbr="CETA" {...TARIFF_TOOLTIPS.CETA} /> (EU), and{" "}
                      <TariffTooltip abbr="CUKTCA" {...TARIFF_TOOLTIPS.CUKTCA} /> (UK).{" "}
                      <TariffTooltip abbr="MFN" {...TARIFF_TOOLTIPS.MFN} /> is the default rate for countries without a special trade agreement.
                    </>
                  ),
                },
                {
                  value: "gst-hst",
                  testId: "faq-gst-hst",
                  q: "How is GST/HST calculated on imports?",
                  a: (
                    <>
                      Commercial imports are generally charged GST or the federal part of HST at the border on the value for tax plus applicable duties.
                      The provincial part is normally not collected at commercial importation, although later self-assessment can apply. Taxable personal imports
                      can be subject to HST or participating provincial taxes based on the importer and destination province.
                    </>
                  ),
                },
                {
                  value: "duty-types",
                  testId: "faq-duty-types",
                  q: "What types of duty rates exist?",
                  a: (
                    <>
                      There are three main types: <strong>Ad valorem</strong> (percentage of value, e.g., "8%"),
                      <strong>specific</strong> (fixed amount per unit, e.g., "$1.45/kg"), and
                      <strong>compound</strong> (combination, e.g., "5% but not less than $0.50/kg").
                      Many products under free trade agreements have a "Free" duty rate.
                    </>
                  ),
                },
                {
                  value: "accuracy",
                  testId: "faq-accuracy",
                  q: "How accurate are these estimates?",
                  a: (
                    <>
                      This calculator uses the official 2026 Canadian Customs Tariff (T2026) published by CBSA.
                      However, estimates may differ from final assessments because: (1) HS code classification can vary,
                      (2) special duties (anti-dumping, countervailing) are not included,
                      (3) excise duties on alcohol/tobacco are not calculated,
                      (4) origin rules and documentation requirements may affect eligibility for preferential rates.
                      Always consult a licensed customs broker for commercial imports.
                    </>
                  ),
                },
              ].map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="rounded-lg border border-border-hairline bg-white px-4"
                >
                  <AccordionTrigger className="py-4 text-left text-h3 text-text-primary" data-testid={item.testId}>
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

        {/* ── Closing CTA ─────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.closing}`}>
          <div className={RAIL}>
            <div className="max-w-2xl">
              <h2 className="text-h2 text-text-primary">Need help with your import?</h2>
              <p className="mt-4 text-lead text-text-muted">
                Our team can help you with CARM registration, business numbers, GST/HST accounts, and import/export accounts.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  size="lg"
                  className="w-full bg-brand text-white transition-colors duration-state hover:bg-brand-hover sm:w-auto"
                  onClick={() => window.location.href = "/services"}
                  data-testid="button-view-services"
                >
                  View Our Services
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand sm:w-auto"
                  onClick={() => window.location.href = "/carm-security-calculator"}
                  data-testid="button-carm-calculator"
                >
                  CARM Security Calculator
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand sm:w-auto"
                  onClick={() => window.location.href = "/resources/how-to-import-into-canada"}
                  data-testid="button-import-guide"
                >
                  How to Import Into Canada
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>

      <ToolWorkedExample kind="customs" />

      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="rounded-lg border-border-hairline sm:max-w-md" data-testid="dialog-lead-capture">
          <DialogHeader>
            <DialogTitle className="text-h2 text-text-primary">
              {leadSubmitted ? "Thank you!" : "Get a detailed breakdown"}
            </DialogTitle>
            <DialogDescription className="text-body text-text-muted">
              {leadSubmitted
                ? "We've saved your estimate. Our team will reach out if you need help with your import."
                : "Save your calculation details and ask our team to follow up if you need import help."}
            </DialogDescription>
          </DialogHeader>

          {leadSubmitted ? (
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#15803D]">
                <Check className="h-6 w-6 text-[#15803D]" aria-hidden="true" />
              </div>
              <p className="text-center text-body text-text-muted">Your request is saved. You can download the complete PDF directly from the results.</p>
              <Button
                className="mt-4 bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                onClick={() => setShowLeadModal(false)}
                data-testid="button-close-lead"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              <div>
                <FieldLabel htmlFor="lead-email" required>
                  Email address
                </FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
                  <Input
                    id="lead-email"
                    data-testid="input-lead-email"
                    placeholder="you@company.com"
                    value={leadEmail}
                    onChange={(e) => { setLeadEmail(e.target.value); setLeadErrors({}); }}
                    hasLeadingIcon
                  />
                </div>
                {leadErrors.email && <p className="mt-1.5 text-body text-[#B42318]">{leadErrors.email}</p>}
              </div>

              <div>
                <FieldLabel htmlFor="lead-company">Company name (optional)</FieldLabel>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
                  <Input
                    id="lead-company"
                    data-testid="input-lead-company"
                    placeholder="Your company"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    hasLeadingIcon
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="lead-phone">Phone (optional)</FieldLabel>
                <Input
                  id="lead-phone"
                  data-testid="input-lead-phone"
                  placeholder="+1 (555) 123-4567"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                />
              </div>

              <Button
                className="h-12 w-full bg-brand text-[15px] font-semibold text-white transition-colors duration-state hover:bg-brand-hover"
                onClick={handleLeadSubmit}
                disabled={leadSubmitting}
                data-testid="button-submit-lead"
              >
                {leadSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {leadSubmitting ? "Saving..." : "Save and request follow-up"}
              </Button>

              <p className="text-center text-body text-text-muted">
                We respect your privacy. No spam, ever.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
