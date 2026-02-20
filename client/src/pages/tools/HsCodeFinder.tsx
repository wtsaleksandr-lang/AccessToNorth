import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Search,
  Loader2,
  Copy,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  FileSearch,
  ShieldAlert,
  AlertTriangle,
  Calculator,
  Ship,
} from "lucide-react";

interface HsCodeResult {
  code: string;
  description: string;
  descriptionFull?: string;
  chapter: string;
  unitOfMeasure: string | null;
}

const DEEP_BLUE = "#0A2540";

const RISK_CHAPTERS = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
  "16", "17", "18", "19", "20", "21", "22", "23", "24",
  "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38",
  "44", "47", "48",
  "72", "73",
  "84", "85",
  "87", "88", "89",
  "93",
]);

const FREQUENTLY_REVIEWED_CHAPTERS = new Set([
  "39", "42", "61", "62", "63", "64", "65",
  "71", "83", "85", "90", "94", "95", "96",
]);

const faqItems = [
  {
    q: "What is an HS code?",
    a: "An HS (Harmonized System) code is a standardized numerical method of classifying traded products. It is used by customs authorities worldwide, including the Canada Border Services Agency (CBSA), to identify products for tariff and regulatory purposes. Canadian tariff item numbers are 10 digits long and based on the international 6-digit HS system.",
  },
  {
    q: "What is the difference between HS, HTS, and Canadian tariff item?",
    a: "The HS code is the international 6-digit standard maintained by the World Customs Organization. The HTS (Harmonized Tariff Schedule) is the U.S. version with additional digits. Canada uses its own 10-digit tariff item numbers based on the same HS framework, published in the Canadian Customs Tariff.",
  },
  {
    q: "Why does country of origin matter for HS classification?",
    a: "Country of origin determines which tariff treatment applies to your goods. Canada has free trade agreements (e.g., CUSMA, CPTPP, CETA) that may reduce or eliminate duties for qualifying goods from specific countries. The same HS code can have very different duty rates depending on origin.",
  },
  {
    q: "What are common HS classification mistakes?",
    a: "Common errors include confusing similar products (e.g., 'pants' vs 'underpants' fall under different chapters), misclassifying parts vs accessories, overlooking material composition requirements, and not accounting for sets or kits which have special classification rules under GRI 3.",
  },
  {
    q: "How do I verify my HS code?",
    a: "You can verify HS codes by consulting the Canadian Customs Tariff on the CBSA website, requesting an Advance Ruling from CBSA, or engaging a licensed customs broker. Our HS Code Classification service can also help confirm the correct code for your shipment.",
  },
  {
    q: "Does this tool provide official classification?",
    a: "No. This tool provides suggested HS codes based on keyword matching against the Canadian Customs Tariff database. It is for estimation and research purposes only. Official classification is determined by the CBSA. We recommend verifying codes with a customs broker or requesting an Advance Ruling for high-value or complex shipments.",
  },
  {
    q: "What happens if I use the wrong HS code?",
    a: "Using an incorrect HS code can result in overpaying or underpaying duties, shipment delays at the border, penalties from CBSA, and potential seizure of goods. It is important to classify goods correctly before importing.",
  },
  {
    q: "Can I search by product name instead of HS code number?",
    a: "Yes. This tool supports both numeric HS code lookup and keyword-based product name search. Simply type a product description (e.g., 'cotton t-shirt', 'steel bolts') and the tool will return suggested matching HS codes with descriptions.",
  },
];

const classificationTiers = [
  {
    name: "Basic",
    priceCAD: 29,
    param: "basic",
    popular: false,
    features: [
      "1 HS code classification",
      "Supporting rationale summary",
      "Special measure awareness flag",
      "Delivered within 1 business day",
      "Email support",
    ],
    cta: "Order Classification",
  },
  {
    name: "Business",
    priceCAD: 99,
    param: "business",
    popular: true,
    features: [
      "Up to 10 HS codes",
      "Cross-consistency review",
      "Special measure awareness screening",
      "Structured summary report",
      "Delivered within 1 business day",
    ],
    cta: "Order Bundle",
  },
  {
    name: "Pro",
    priceCAD: 249,
    param: "pro",
    popular: false,
    features: [
      "Up to 50 HS codes",
      "Invoice-level consistency check",
      "Special measures screening",
      "Risk summary overview",
      "Delivered within 48 business hours",
    ],
    cta: "Request Bulk Review",
  },
];

export default function HsCodeFinder() {
  const { formatPrice } = useCurrency();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HsCodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  usePageMeta({
    title: "HS Code Finder (Canada) — Search Tariff Codes by Product Name | AccessToNorth.com",
    description:
      "Search Canadian HS codes by product name or code number. Find suggested tariff classifications, then calculate duty and tax in one click. Free tool by AccessToNorth.com.",
    canonical: "https://www.accesstonorth.com/tools/hs-code-finder",
  });

  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    };
    let script = document.getElementById("faq-schema") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "faq-schema";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(faqSchema);
    return () => {
      script?.remove();
    };
  }, []);

  const searchHsCodes = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customs/hs-search?q=${encodeURIComponent(q)}&limit=20`);
        const data = await res.json();
        setResults(data);
        setHasSearched(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* clipboard may fail in some browsers */
    }
  };

  const handleUseDutyCalc = (code: string, q: string) => {
    navigate(`/customs-calculator?hs=${encodeURIComponent(code)}&src=hsfinder&q=${encodeURIComponent(q)}`);
  };

  const getConfidenceTag = (index: number): { label: string; color: string; variant: "default" | "secondary" | "outline" } => {
    if (index < 3) return { label: "High", color: "text-emerald-600", variant: "default" };
    if (index < 10) return { label: "Medium", color: "text-amber-600", variant: "secondary" };
    return { label: "Low", color: "text-red-500", variant: "outline" };
  };

  const getConfidenceDot = (index: number) => {
    if (index < 3) return "bg-emerald-500";
    if (index < 10) return "bg-amber-500";
    return "bg-red-500";
  };

  const getRiskFlags = (item: HsCodeResult): string[] => {
    const flags: string[] = [];
    const ch = item.chapter?.padStart(2, "0") || item.code.substring(0, 2);
    if (RISK_CHAPTERS.has(ch)) flags.push("May be subject to special measures");
    if (FREQUENTLY_REVIEWED_CHAPTERS.has(ch)) flags.push("Frequently reviewed category");
    return flags;
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setExpandedCode(null);
    inputRef.current?.focus();
  };

  const hasMediumOrLowConfidence = hasSearched && results.length > 3;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <Breadcrumbs
            items={[
              { label: "Tools", href: "/tools" },
              { label: "HS Code Finder" },
            ]}
          />

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${DEEP_BLUE}10` }}
              >
                <FileSearch className="w-7 h-7" style={{ color: DEEP_BLUE }} />
              </div>
            </div>
            <h1
              className="text-3xl md:text-4xl font-extrabold font-display mb-3 text-slate-900"
              data-testid="text-hs-finder-title"
            >
              HS Code Finder (Canada)
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-2">
              Search by product name to see suggested HS codes and descriptions. Then calculate duty & tax in one click.
            </p>
            <p className="text-sm text-amber-700 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Estimates only — final classification is confirmed by CBSA or your customs broker.
            </p>
          </div>

          {/* ===== SECTION 1: HS FINDER TOOL ===== */}
          <Card className="p-6 md:p-8 shadow-lg mb-8" data-testid="card-hs-search">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${DEEP_BLUE}10` }}
              >
                <Search className="w-5 h-5" style={{ color: DEEP_BLUE }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Search HS Codes</h2>
                <p className="text-sm text-slate-500">Enter an HS code number or describe your product</p>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  ref={inputRef}
                  data-testid="input-hs-search"
                  placeholder="e.g. 6110, men's cotton pants, stainless steel bolts, chocolate"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    searchHsCodes(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchHsCodes(query);
                    }
                  }}
                  className="pl-9"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
              </div>
              {query && (
                <Button variant="outline" onClick={handleClear} data-testid="button-clear-search">
                  Clear
                </Button>
              )}
            </div>

            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              Suggested matches only. HS classification depends on product details. Verify before relying on results.
            </p>
          </Card>

          {/* ===== RESULTS WITH CONFIDENCE + RISK ===== */}
          {hasSearched && (
            <div ref={resultsRef} className="mb-8">
              {results.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-800">
                      {results.length} suggested code{results.length !== 1 ? "s" : ""} found
                    </h3>
                    <p className="text-xs text-slate-500">Ranked by relevance to your search</p>
                  </div>
                  <div className="space-y-3" data-testid="list-hs-results">
                    {results.map((item, index) => {
                      const conf = getConfidenceTag(index);
                      const dotColor = getConfidenceDot(index);
                      const isExpanded = expandedCode === item.code;
                      const fullDesc = item.descriptionFull || item.description;
                      const shortDesc =
                        fullDesc.length > 120 ? fullDesc.substring(0, 120) + "..." : fullDesc;
                      const riskFlags = getRiskFlags(item);

                      return (
                        <motion.div
                          key={item.code}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card
                            className="border border-slate-200 hover:border-blue-200 transition-colors"
                            data-testid={`card-hs-result-${item.code}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span
                                      className="text-base font-mono font-bold text-blue-700"
                                      data-testid={`text-hs-code-${item.code}`}
                                    >
                                      {item.code}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                      <Badge variant={conf.variant} data-testid={`badge-confidence-${item.code}`}>
                                        {conf.label}
                                      </Badge>
                                    </div>
                                    {item.unitOfMeasure && (
                                      <span className="text-xs text-slate-400">({item.unitOfMeasure})</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600">
                                    {isExpanded ? fullDesc : shortDesc}
                                  </p>
                                  {fullDesc.length > 120 && (
                                    <button
                                      type="button"
                                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-0.5 cursor-pointer"
                                      onClick={() => setExpandedCode(isExpanded ? null : item.code)}
                                      data-testid={`button-expand-${item.code}`}
                                    >
                                      {isExpanded ? (
                                        <>
                                          Show less <ChevronUp className="w-3 h-3" />
                                        </>
                                      ) : (
                                        <>
                                          Show full description <ChevronDown className="w-3 h-3" />
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {riskFlags.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {riskFlags.map((flag) => (
                                        <p key={flag} className="text-xs text-amber-700 flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                          {flag}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(item.code)}
                                    data-testid={`button-copy-${item.code}`}
                                  >
                                    {copiedCode === item.code ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 mr-1" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 mr-1" />
                                        Copy
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUseDutyCalc(item.code, query)}
                                    data-testid={`button-use-calc-${item.code}`}
                                  >
                                    Calculate Duty
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Advisory box for Medium/Low confidence */}
                  {hasMediumOrLowConfidence && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Card className="border-amber-200 bg-amber-50/60" data-testid="card-confidence-advisory">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                              <ShieldAlert className="w-5 h-5 text-amber-700" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 mb-1">
                                Not 100% sure about your classification?
                              </p>
                              <p className="text-sm text-slate-600 mb-3">
                                Misclassification can lead to reassessments or shipment delays. Consider a professional review before importing.
                              </p>
                              <a href="#classification-pricing">
                                <Button size="sm" data-testid="button-get-review-advisory">
                                  Get Professional Classification Review
                                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-slate-500 mb-2">No matching HS codes found for "{query}".</p>
                  <p className="text-sm text-slate-400">
                    Try different keywords, check spelling, or use more general terms.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ===== SECTION 2: PROFESSIONAL HS CLASSIFICATION PRICING ===== */}
          <div id="classification-pricing" className="mb-12 scroll-mt-24">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-900 mb-3">
                Professional HS Code Classification Review
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Incorrect tariff classification can result in reassessments, penalties, or unexpected duty exposure. Our team provides structured tariff classification guidance reviewed for compliance accuracy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="grid-classification-pricing">
              {classificationTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`relative border ${
                    tier.popular
                      ? "border-blue-300 ring-2 ring-blue-100"
                      : "border-slate-200"
                  }`}
                  data-testid={`card-tier-${tier.param}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white border-0">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-7">
                    <div className="text-center mb-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{tier.name}</h3>
                      <p className="text-3xl font-extrabold text-slate-900">{formatPrice(tier.priceCAD)}</p>
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/order/hs-classification?package=${tier.param}`}>
                      <Button
                        className="w-full"
                        variant={tier.popular ? "default" : "outline"}
                        data-testid={`button-order-${tier.param}`}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ===== SECTION 3: NEXT STEPS ===== */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">
                Planning Your Import?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="grid-next-steps">
              <Card className="border border-slate-200" data-testid="card-next-duty-calc">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-blue-700" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">Calculate Duty & Import Tax</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Estimate duties, GST, and provincial taxes for your goods before importing.
                  </p>
                  <Link href={results.length > 0 ? `/customs-calculator?hs=${encodeURIComponent(results[0].code)}&src=hsfinder&q=${encodeURIComponent(query)}` : "/customs-calculator"}>
                    <Button variant="outline" data-testid="button-next-duty-calc">
                      Open Duty Calculator
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className="border border-slate-200" data-testid="card-next-customs">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <Ship className="w-6 h-6 text-blue-700" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">Need Full Customs Clearance?</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Let us handle customs brokerage, documentation, and border clearance for your shipment.
                  </p>
                  <Link href="/canadian-customs-clearance">
                    <Button variant="outline" data-testid="button-next-customs">
                      View Customs Clearance
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ===== FAQ ===== */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold font-display text-slate-900 mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2 max-w-3xl mx-auto" data-testid="list-faq">
              {faqItems.map((item, i) => (
                <Card key={i} className="border border-slate-200">
                  <button
                    type="button"
                    className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    data-testid={`button-faq-${i}`}
                  >
                    <span className="text-sm font-medium text-slate-800">{item.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          </div>

          {/* ===== SECTION 4: COMPLIANCE DISCLAIMER ===== */}
          <div className="text-center mb-4">
            <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="text-disclaimer">
              AccessToNorth provides independent tariff classification guidance. Final determination of tariff treatment is made by the Canada Border Services Agency (CBSA).
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
