import { useState, useEffect, useRef } from "react";
import { useSearch, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RegistrationModal } from "@/components/RegistrationModal";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DEEP_BLUE = "#0A2540";

const tiers = [
  {
    name: "Basic",
    price: "$29",
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
    price: "$99",
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
    price: "$249",
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

export default function HsClassificationOrder() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const packageParam = params.get("package") || "";
  const ctaRef = useRef<HTMLDivElement>(null);

  const matchedTier = tiers.find((t) => t.param === packageParam);
  const [selectedTier, setSelectedTier] = useState(matchedTier?.param || "");
  const [modalOpen, setModalOpen] = useState(false);

  usePageMeta({
    title: "Order HS Code Classification Review | AccessToNorth.com",
    description:
      "Order a professional HS code classification review. Choose from Basic ($29), Business ($99), or Pro ($249) packages. Accurate tariff classification for Canadian imports.",
    canonical: "https://www.accesstonorth.com/order/hs-classification",
  });

  useEffect(() => {
    if (matchedTier) {
      setSelectedTier(matchedTier.param);
      setTimeout(() => {
        ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [packageParam]);

  const handleOrder = (tierParam: string) => {
    setSelectedTier(tierParam);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <Breadcrumbs
            items={[
              { label: "Tools", href: "/tools" },
              { label: "HS Code Finder", href: "/tools/hs-code-finder" },
              { label: "Order Classification" },
            ]}
          />

          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${DEEP_BLUE}10` }}
              >
                <ShieldCheck className="w-7 h-7" style={{ color: DEEP_BLUE }} />
              </div>
            </div>
            <h1
              className="text-3xl md:text-4xl font-extrabold font-display mb-3 text-slate-900"
              data-testid="text-order-title"
            >
              Professional HS Code Classification Review
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Incorrect tariff classification can result in reassessments, penalties, or unexpected duty exposure. Our team provides structured tariff classification guidance reviewed for compliance accuracy.
            </p>
          </div>

          {matchedTier && (
            <div className="mb-8 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3" data-testid="selection-banner">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-blue-800" data-testid="text-banner-selection">
                  Selected: {matchedTier.name} — {matchedTier.price}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10" data-testid="grid-classification-tiers">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.param;
              return (
                <Card
                  key={tier.name}
                  className={`relative border transition-all duration-200 ${
                    tier.popular
                      ? "border-blue-300 ring-2 ring-blue-100"
                      : isSelected
                      ? "border-blue-200 ring-1 ring-blue-100"
                      : "border-slate-200"
                  }`}
                  data-testid={`card-order-tier-${tier.param}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white border-0">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-7">
                    <div className="text-center mb-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{tier.name}</h3>
                      <p className="text-3xl font-extrabold text-slate-900">{tier.price}</p>
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => handleOrder(tier.param)}
                      data-testid={`button-order-tier-${tier.param}`}
                    >
                      {tier.cta}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div ref={ctaRef} />

          <div className="text-center mb-8">
            <p className="text-sm text-slate-500">
              Need help choosing?{" "}
              <Link href="/contact" className="text-blue-600 underline underline-offset-2 font-medium">
                Contact us
              </Link>{" "}
              for a free consultation.
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
              AccessToNorth provides independent tariff classification guidance. Final determination of tariff treatment is made by the Canada Border Services Agency (CBSA).
            </p>
          </div>
        </div>
      </main>
      <Footer />

      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPackage="hs_classification"
      />
    </div>
  );
}
