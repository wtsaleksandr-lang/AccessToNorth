import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ToolWorkedExample } from "@/components/ToolWorkedExample";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Callout, Input } from "@/components/tools";
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
  ShieldAlert,
  AlertTriangle,
  Calculator,
  Ship,
  BookOpen,
} from "lucide-react";

interface HsCodeResult {
  code: string;
  description: string;
  descriptionFull?: string;
  chapter: string;
  unitOfMeasure: string | null;
  score?: number;
  classificationLevel?: "complete" | "tariff-item";
}

/**
 * Card-on-canvas shell, matching Home and the duty calculator.
 */
const SHELL = "w-[98%] max-w-container-outer mx-auto rounded-lg border overflow-hidden";
const RAIL = "mx-auto max-w-container px-5 md:px-10";
const TOOL_RAIL = "mx-auto max-w-4xl px-5 md:px-10";

const PAD = {
  even: "pt-10 pb-10 md:pt-[76px] md:pb-[76px]",
  topHeavy: "pt-16 pb-10 md:pt-20 md:pb-[60px]",
  tight: "pt-12 pb-10 md:pt-[72px] md:pb-14",
  closing: "pt-14 pb-10 md:pt-20 md:pb-16",
} as const;

/**
 * An HS code is a positional number: chapter, heading, subheading, tariff item,
 * statistical suffix. Reading it means comparing digit columns down a list, so
 * it is set in the platform mono stack (`--font-mono`, no webfont) with
 * `tabular-nums`, on a #F2F4F7 chip that makes the code the first thing the eye
 * lands on in each row.
 */
const HS_CODE_CHIP =
  "inline-block rounded-md bg-surface-canvas px-2.5 py-1 font-mono text-[16px] font-semibold tabular-nums tracking-[0.01em] text-text-primary";

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
    a: "An HS code is the international six-digit foundation used to classify traded products. Canada extends it to an eight-digit tariff item, where duty is assigned, and a complete ten-digit classification number used to report imported goods.",
  },
  {
    q: "What is the difference between HS, HTS, and Canadian tariff item?",
    a: "The HS code is the international 6-digit standard maintained by the World Customs Organization. The HTS is the U.S. version. Canada uses eight-digit tariff items plus a two-digit statistical suffix, creating a complete ten-digit classification number.",
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
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  usePageMeta({
    title: "Canadian HS Code Finder — Free Tariff Lookup | AccessToNorth.com",
    description:
      "Search Canadian HS codes by product name or code number. Find suggested tariff classifications, then calculate duty and tax in one click. Free tool by AccessToNorth.com.",
    canonical: "/tools/hs-code-finder",
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
    setSearchError(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customs/hs-search?q=${encodeURIComponent(q)}&limit=20`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults(data);
        setHasSearched(true);
      } catch {
        setResults([]);
        setHasSearched(true);
        setSearchError("The Canadian tariff dataset is temporarily unavailable. Please try again shortly.");
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
    setSearchError(null);
    inputRef.current?.focus();
  };

  const showClassificationAdvisory = hasSearched && results.length > 0;

  return (
    <div className="min-h-screen bg-surface-canvas font-sans">
      {/* 83px fixed Navbar + the 16px inter-card gap. */}
      <main className="flex flex-col gap-4 pb-4 pt-[99px]">

        {/* ── Hero + search card ──────────────────────────────────────── */}
        <section className={`${SHELL} surface-hero-wash ${PAD.even}`}>
          <div className={TOOL_RAIL}>
            <Breadcrumbs
              items={[
                { label: "Tools", href: "/tools" },
                { label: "HS Code Finder" },
              ]}
            />

            <p className="mt-6 text-eyebrow uppercase text-text-muted">Canadian tariff lookup</p>
            <h1
              className="mt-4 text-h1-sm text-text-primary md:text-h1"
              data-testid="text-hs-finder-title"
            >
              HS Code Finder (Canada)
            </h1>
            <p className="mt-5 max-w-2xl text-lead text-text-muted">
              Search by product name to see suggested HS codes and descriptions. Then calculate duty &amp; tax in one click.
            </p>
            <p className="mt-4 flex max-w-2xl items-start gap-2 text-[14px] leading-[20px] text-[#78350F]">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Estimates only — final classification is confirmed by CBSA or your customs broker.
            </p>

            <div className="mt-8 rounded-lg border border-border-hairline bg-white p-5 md:p-6" data-testid="card-hs-search">
              <h2 className="text-h3 text-text-primary">Search HS Codes</h2>
              <p className="mt-1.5 text-body text-text-muted">Enter an HS code number or describe your product</p>

              <p className="mt-4 flex items-start gap-1.5 text-[13px] leading-[18px] text-[#78350F]">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Suggested matches only. HS classification depends on product details. Verify before relying on results.
              </p>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" aria-hidden="true" />
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
                    hasLeadingIcon
                    hasTrailingIcon={searching}
                  />
                  {searching && (
                    <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-deemphasis" aria-hidden="true" />
                  )}
                </div>
                {query && (
                  <Button
                    variant="outline"
                    className="h-12 shrink-0 border-border-control bg-white px-5 text-[15px] font-semibold text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                    onClick={handleClear}
                    data-testid="button-clear-search"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Results ─────────────────────────────────────────────────── */}
        {hasSearched && (
          <section className={`${SHELL} bg-white ${PAD.tight}`}>
            <div className={TOOL_RAIL} ref={resultsRef}>
              {results.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-h2 text-text-primary">
                      {results.length} suggested code{results.length !== 1 ? "s" : ""} found
                    </h2>
                    <p className="text-body text-text-muted">Search relevance is not classification certainty</p>
                  </div>

                  <div className="mt-6 space-y-3" data-testid="list-hs-results">
                    {results.map((item) => {
                      const isExpanded = expandedCode === item.code;
                      const fullDesc = item.descriptionFull || item.description;
                      const shortDesc =
                        fullDesc.length > 120 ? fullDesc.substring(0, 120) + "..." : fullDesc;
                      const riskFlags = getRiskFlags(item);

                      return (
                        <div
                          key={item.code}
                          className="rounded-lg border border-border-hairline bg-white p-5 transition-colors duration-state hover:border-brand"
                          data-testid={`card-hs-result-${item.code}`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className={HS_CODE_CHIP} data-testid={`text-hs-code-${item.code}`}>
                                  {item.code}
                                </span>
                                <span
                                  className="rounded-md border border-border-control px-2 py-0.5 text-[13px] font-medium text-text-secondary"
                                  data-testid={`badge-level-${item.code}`}
                                >
                                  {item.classificationLevel === "complete" ? "Complete 10-digit" : "8-digit duty level"}
                                </span>
                                {typeof item.score === "number" && (
                                  <span className="text-[13px] tabular-nums text-text-muted">{Math.round(item.score * 100)}% search match</span>
                                )}
                                {item.unitOfMeasure && (
                                  <span className="text-[13px] text-text-muted">({item.unitOfMeasure})</span>
                                )}
                              </div>

                              <p className="mt-3 text-body text-text-secondary">
                                {isExpanded ? fullDesc : shortDesc}
                              </p>

                              {fullDesc.length > 120 && (
                                <button
                                  type="button"
                                  className="mt-2 flex cursor-pointer items-center gap-1 text-body font-semibold text-text-secondary transition-colors duration-state hover:text-brand"
                                  onClick={() => setExpandedCode(isExpanded ? null : item.code)}
                                  data-testid={`button-expand-${item.code}`}
                                >
                                  {isExpanded ? (
                                    <>
                                      Show less <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                                    </>
                                  ) : (
                                    <>
                                      Show full description <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                                    </>
                                  )}
                                </button>
                              )}

                              {riskFlags.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  {riskFlags.map((flag) => (
                                    <p key={flag} className="flex items-start gap-1.5 text-[13px] leading-[18px] text-[#78350F]">
                                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                      {flag}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button
                                variant="outline"
                                className="border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                                onClick={() => handleCopy(item.code)}
                                data-testid={`button-copy-${item.code}`}
                              >
                                {copiedCode === item.code ? (
                                  <>
                                    <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                    Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                className="bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                                onClick={() => handleUseDutyCalc(item.code, query)}
                                data-testid={`button-use-calc-${item.code}`}
                              >
                                Calculate Duty
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Search relevance is not legal classification confidence. */}
                  {showClassificationAdvisory && (
                    <Callout className="mt-6" title="Not 100% sure about your classification?" data-testid="card-confidence-advisory">
                      <p>
                        Misclassification can lead to reassessments or shipment delays. Consider a professional review before importing.
                      </p>
                      <a href="#classification-pricing" className="inline-block pt-1.5">
                        <Button
                          className="bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                          data-testid="button-get-review-advisory"
                        >
                          Get Professional Classification Review
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </a>
                    </Callout>
                  )}
                </>
              ) : searchError ? (
                <Callout tone="error" role="alert" title="Tariff search is temporarily unavailable">
                  <p>{searchError}</p>
                </Callout>
              ) : (
                <div className="rounded-lg border border-border-hairline bg-surface-recessed p-6">
                  <p className="text-lead text-text-primary">No matching HS codes found for "{query}".</p>
                  <p className="mt-2 text-body text-text-muted">Try tariff terms, material, product use, or a broader product name.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Professional classification pricing ─────────────────────── */}
        <section
          id="classification-pricing"
          className={`${SHELL} bg-white scroll-mt-24 ${PAD.topHeavy}`}
        >
          <div className={RAIL}>
            <div className="max-w-2xl">
              <p className="text-eyebrow uppercase text-text-muted">Paid review</p>
              <h2 className="mt-3 text-h2 text-text-primary">
                Professional HS Code Classification Review
              </h2>
              <p className="mt-4 text-lead text-text-muted">
                Incorrect tariff classification can result in reassessments, penalties, or unexpected duty exposure. Our team provides structured tariff classification guidance reviewed for compliance accuracy.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="grid-classification-pricing">
              {classificationTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col rounded-lg border-2 bg-white p-6 ${
                    tier.popular ? "border-brand" : "border-border-app"
                  }`}
                  data-testid={`card-tier-${tier.param}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-h3 text-text-primary">{tier.name}</h3>
                    {tier.popular && (
                      <span className="rounded-md bg-surface-canvas px-2 py-0.5 text-[13px] font-semibold text-text-secondary">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[32px] font-bold leading-[38px] tracking-[-0.02em] tabular-nums text-text-primary">
                    {formatPrice(tier.priceCAD)}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-body text-text-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-text-deemphasis" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/order/hs-classification?package=${tier.param}`} className="mt-6">
                    <Button
                      className={
                        tier.popular
                          ? "w-full bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                          : "w-full border border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                      }
                      variant={tier.popular ? "default" : "outline"}
                      data-testid={`button-order-${tier.param}`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Next steps ──────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-surface-recessed ${PAD.tight}`}>
          <div className={RAIL}>
            <div className="max-w-2xl">
              <p className="text-eyebrow uppercase text-text-muted">Next</p>
              <h2 className="mt-3 text-h2 text-text-primary">Planning Your Import?</h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="grid-next-steps">
              {[
                {
                  icon: Calculator,
                  testId: "card-next-duty-calc",
                  buttonTestId: "button-next-duty-calc",
                  title: "Calculate Duty & Import Tax",
                  desc: "Estimate duties, GST, and provincial taxes for your goods before importing.",
                  cta: "Open Duty Calculator",
                  href:
                    results.length > 0
                      ? `/customs-calculator?hs=${encodeURIComponent(results[0].code)}&src=hsfinder&q=${encodeURIComponent(query)}`
                      : "/customs-calculator",
                },
                {
                  icon: Ship,
                  testId: "card-next-customs",
                  buttonTestId: "button-next-customs",
                  title: "Need Full Customs Clearance?",
                  desc: "Let us handle customs brokerage, documentation, and border clearance for your shipment.",
                  cta: "View Customs Clearance",
                  href: "/canadian-customs-clearance",
                },
                {
                  icon: BookOpen,
                  testId: "card-next-import-guide",
                  buttonTestId: "button-next-import-guide",
                  title: "Importing Into Canada?",
                  desc: "Follow the complete 2026 workflow for BN/RM setup, CARM, documents, duty, release, and delivery.",
                  cta: "Read Import Guide",
                  href: "/resources/how-to-import-into-canada",
                },
              ].map((card) => (
                <div
                  key={card.testId}
                  className="flex flex-col rounded-lg border border-border-hairline bg-white p-6"
                  data-testid={card.testId}
                >
                  <card.icon className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  <h3 className="mt-4 text-h3 text-text-primary">{card.title}</h3>
                  <p className="mt-2 flex-1 text-body text-text-muted">{card.desc}</p>
                  <Link href={card.href} className="mt-5">
                    <Button
                      variant="outline"
                      className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                      data-testid={card.buttonTestId}
                    >
                      {card.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.closing}`}>
          <div className={TOOL_RAIL}>
            <p className="text-eyebrow uppercase text-text-muted">Answers</p>
            <h2 className="mt-3 text-h2 text-text-primary">Frequently Asked Questions</h2>

            <div className="mt-8 space-y-2" data-testid="list-faq">
              {faqItems.map((item, i) => (
                <div key={i} className="rounded-lg border border-border-hairline bg-white">
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg p-4 text-left transition-colors duration-state hover:bg-surface-recessed"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    data-testid={`button-faq-${i}`}
                  >
                    <span className="text-h3 text-text-primary">{item.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4">
                      <p className="text-body text-text-muted">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/*
              Compliance line. It used to be 12px #94A3B8 on #F8FAFC — a 2.4:1
              contrast ratio, i.e. a disclaimer that was effectively unreadable.
              14px #475467 on white is 7.6:1.
            */}
            <p className="mt-10 max-w-2xl text-body text-text-muted" data-testid="text-disclaimer">
              AccessToNorth provides independent tariff classification guidance. Final determination of tariff treatment is made by the Canada Border Services Agency (CBSA).
            </p>
          </div>
        </section>

      </main>

      <ToolWorkedExample kind="hs" />
    </div>
  );
}
