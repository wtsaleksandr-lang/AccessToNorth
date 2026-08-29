import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, ChevronDown, Award, Check, ShoppingCart } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { DiyVsUsComparison } from "@/components/DiyVsUsComparison";

interface PricingItem {
  name: string;
  priceCAD: number;
  pricePrefix?: string;
  note?: string;
  service: string;
  isBundle?: boolean;
  isClearance?: boolean;
  mostPopular?: boolean;
  originalCAD?: number;
}

interface PricingSection {
  id: string;
  title: string;
  items: PricingItem[];
}

const sections: PricingSection[] = [
  {
    id: "business",
    title: "Business Setup",
    items: [
      { name: "Business Number (BN)", priceCAD: 99, service: "bn" },
      { name: "GST/HST Registration", priceCAD: 249, service: "gst_hst" },
      { name: "Non-Resident Setup", priceCAD: 399, service: "non_resident_tax" },
      { name: "Business Starter Bundle", priceCAD: 299, originalCAD: 348, note: "BN + GST/HST — save CA$49", service: "bundle_business_starter", isBundle: true, mostPopular: true },
    ],
  },
  {
    id: "importer",
    title: "Importer Setup",
    items: [
      { name: "CARM Portal Setup", priceCAD: 499, service: "carm_portal" },
      { name: "RPP / Security Coordination", priceCAD: 395, service: "rpp_bond" },
      { name: "Importer Launch Kit", priceCAD: 1500, originalCAD: 1742, note: "BN + GST/HST + CARM + RPP — save CA$242", service: "bundle_complete_importer", isBundle: true, mostPopular: true },
    ],
  },
  {
    id: "clearance",
    title: "Customs Clearance Coordination",
    items: [
      { name: "Low-Value Import Clearance Coordination", priceCAD: 145, note: "Eligible courier goods up to CA$3,300 — paperwork prepared for filing by your licensed broker", service: "clearance-lvs", isClearance: true },
      { name: "Commercial Import Clearance Coordination", priceCAD: 295, note: "Over CA$3,300 or formal entry required — declaration prepared for filing by your licensed broker", service: "clearance-commercial", isClearance: true },
      { name: "Clearance Coordination + Compliance Review", priceCAD: 395, service: "clearance-compliance", isClearance: true },
    ],
  },
  {
    id: "export",
    title: "Export",
    items: [
      { name: "B13 Export Declaration Preparation", priceCAD: 125, service: "b13_export" },
    ],
  },
];

const addons = [
  { name: "HS Code Classification (1 line)", priceCAD: 95, key: "hs1" },
  { name: "Additional HS Line", priceCAD: 25, key: "hs_extra" },
  { name: "Import Permit Submission", priceCAD: 125, key: "import_permit" },
  { name: "CFIA Coordination", priceCAD: 150, key: "cfia" },
  { name: "B2 Correction (prepared for your broker)", priceCAD: 250, key: "b2_correction", pricePrefix: "from " },
  { name: "After-Hours Clearance Coordination", priceCAD: 175, key: "after_hours" },
  { name: "Importer Account Setup", priceCAD: 95, key: "importer_account" },
  { name: "CBSA ID Assistance", priceCAD: 95, key: "cbsa_id" },
];

const tabs = [
  { id: "business", label: "Starting a Business" },
  { id: "importer", label: "Importer Setup" },
  { id: "clearance", label: "Customs Clearance Coordination" },
  { id: "export", label: "Export" },
];

export default function Pricing() {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sections.map((s) => s.id)
  );
  const { formatPrice, isUSD } = useCurrency();
  const { addItem, setIsOpen } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (item: PricingItem) => {
    addItem({
      id: item.service,
      name: item.name,
      price: item.priceCAD,
      serviceKey: item.service,
      category: item.isBundle ? "package" : "service",
    });
    toast({ title: `${item.name} added to cart` });
  };

  const handleAddAddonToCart = (addon: typeof addons[0]) => {
    addItem({
      id: addon.key,
      name: addon.name,
      price: addon.priceCAD,
      serviceKey: addon.key,
      category: "addon",
    });
    toast({ title: `${addon.name} added to cart` });
  };

  usePageMeta({
    title: "Pricing | AccessToNorth.com",
    description: "Transparent, flat-rate pricing for Canadian business registration, GST/HST, CARM, customs clearance coordination, and export services. From CA$99. No hidden fees.",
    canonical: "https://www.accesstonorth.com/pricing",
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const scrollToSection = (id: string) => {
    setExpandedSections((prev) => (prev.includes(id) ? prev : [...prev, id]));
    const el = document.getElementById(`pricing-section-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const buildRequestUrl = (service: string, addonKeys?: string[]) => {
    let url = `/request?service=${service}`;
    if (addonKeys && addonKeys.length > 0) {
      url += `&addons=${addonKeys.join(",")}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-pricing-page-title">
              All-in fees from <span className="text-primary">CA$99</span>.
            </h1>
            <p className="text-lg text-slate-600">
              One-time payment. No subscriptions. No surprise invoices. Pick a service — or save more with a bundle.
            </p>
            {isUSD && (
              <p className="text-xs text-amber-600 mt-2" data-testid="text-usd-notice">
                Prices shown in USD are estimates. All services are billed in CAD.
              </p>
            )}
          </div>

          {/* Quick selector tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8" data-testid="pricing-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer bg-white text-slate-600 border border-slate-200 hover:border-primary/30 hover:text-primary"
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Accordion sections */}
          <div className="space-y-3 mb-10">
            {sections.map((section) => {
              const isOpen = expandedSections.includes(section.id);
              return (
              <Card
                key={section.id}
                id={`pricing-section-${section.id}`}
                className="border border-slate-200 overflow-hidden scroll-mt-28"
                data-testid={`section-${section.id}`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                  data-testid={`toggle-${section.id}`}
                >
                  <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <CardContent className="px-5 pb-5 pt-0">
                    <div className="divide-y divide-slate-100">
                      {section.items.map((item) => (
                        <div
                          key={item.name}
                          className={`flex items-center justify-between gap-4 py-3.5 first:pt-0 ${item.mostPopular ? "-mx-5 px-5 bg-blue-50/40" : ""}`}
                          data-testid={`price-row-${item.service}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-800 text-sm">{item.name}</span>
                              {item.mostPopular ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-white font-semibold uppercase tracking-wide">Most Popular</span>
                              ) : item.isBundle && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Bundle</span>
                              )}
                            </div>
                            {item.note && (
                              <span className="text-xs text-slate-500 mt-0.5 block">{item.note}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex flex-col items-end leading-tight">
                              {item.originalCAD && (
                                <span className="text-xs text-slate-400 line-through">{formatPrice(item.originalCAD)}</span>
                              )}
                              <span className="font-bold text-slate-900 text-sm">{formatPrice(item.priceCAD)}</span>
                            </div>
                            {item.isClearance ? (
                              <Link href="/canadian-customs-clearance">
                                <Button size="sm" className="cursor-pointer" data-testid={`button-select-${item.service}`}>
                                  View Packages
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => handleAddToCart(item)}
                                data-testid={`button-add-${item.service}`}
                              >
                                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                                Add to Cart
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add-ons (shown in clearance and importer) */}
                    {(section.id === "clearance" || section.id === "importer") && (
                      <div className="mt-5 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">Add-ons</h3>
                        <div className="space-y-1.5">
                          {addons.map((addon) => (
                            <div key={addon.key} className="flex items-center justify-between text-sm py-1.5" data-testid={`addon-${addon.key}`}>
                              <span className="text-slate-600">{addon.name}</span>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                <span className="font-medium text-slate-800">{"pricePrefix" in addon && addon.pricePrefix ? addon.pricePrefix : ""}{formatPrice(addon.priceCAD)}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="cursor-pointer text-xs h-7"
                                  onClick={() => handleAddAddonToCart(addon)}
                                  data-testid={`button-add-addon-${addon.key}`}
                                >
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
              );
            })}
          </div>

          {/* DIY / Accountant / Us comparison */}
          <DiyVsUsComparison />

          {/* Refund policy */}
          <div className="py-8 bg-blue-50/50 border border-blue-100/50 rounded-xl text-center mb-10">
            <Award className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold font-display mb-2">Flat fee. Refund on unfiled work.</h3>
            <p className="text-slate-600 text-sm px-6">
              Full refund if you cancel before we submit your filing to the CRA or CBSA.
              If an application is rejected due to our error, we re-file or refund the service fee.
              See our <Link href="/refunds" className="underline hover:text-primary">Refund Policy</Link> for full terms.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-slate-500 mb-3 text-sm">Need something custom?</p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="cursor-pointer" data-testid="button-contact-pricing">
                Contact Us <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
