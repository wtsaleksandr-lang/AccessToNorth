import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Shield,
  FileCheck,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
  Check,
  ChevronDown,
  Package,
  Search,
  FileText,
  Send,
  CheckCircle2,
  Scale,
  Globe,
  DollarSign,
  Anchor,
  ShoppingCart,
  Plus,
} from "lucide-react";

const DEEP_NAVY = "#0A1E3D";

const PACKAGES = [
  {
    id: "lvs-clearance",
    name: "Low Value Shipment (LVS) Coordination",
    price: 145,
    priceLabel: "$145",
    subtitle: "For goods valued under CA$2,500 — paperwork prepared for filing by your licensed broker",
    features: [
      "Customs entry paperwork prepared for your broker (EDI-ready)",
      "Duty & GST calculation",
      "Document review",
      "Release coordination with your broker and carrier",
      "Standard tariff treatment (MFN)",
    ],
    bestFor: "Regular importers, low-risk goods under CA$2,500",
    highlighted: false,
  },
  {
    id: "commercial-clearance",
    name: "Commercial Import Clearance Coordination",
    price: 295,
    priceLabel: "$295",
    subtitle: "For any goods valued over CA$2,500 — declaration prepared for filing by your licensed broker",
    features: [
      "Full customs declaration prepared for your broker to file",
      "Duty & tax calculation",
      "Value validation review",
      "Release coordination with your broker and carrier",
      "Standard tariff treatment",
      "Basic compliance screening",
    ],
    bestFor: "All commercial shipments over CA$2,500",
    highlighted: false,
  },
  {
    id: "compliance-clearance",
    name: "Clearance Coordination + Compliance Review",
    price: 395,
    priceLabel: "$395",
    subtitle: "Coordinated clearance preparation plus regulatory compliance analysis",
    features: [
      "Everything in Commercial Import Clearance Coordination",
      "HS code verification (1 line)",
      "Tariff treatment eligibility review (CUSMA / CPTPP / CETA)",
      "SIMA screening flag check",
      "Import control screening (CFIA / EICC / others)",
      "Risk summary report",
    ],
    bestFor: "New importers, first-time products, regulated goods",
    highlighted: true,
  },
];

const ADDONS = [
  { id: "addon-hs-classification", name: "HS Code Classification (1 line)", price: 95, priceLabel: "$95" },
  { id: "addon-hs-additional", name: "Additional HS Line", price: 25, priceLabel: "$25" },
  { id: "addon-import-permit", name: "Import Permit Submission", price: 125, priceLabel: "$125" },
  { id: "addon-cfia", name: "CFIA Coordination", price: 150, priceLabel: "$150" },
  { id: "addon-b2-correction", name: "B2 Correction (prepared for your broker)", price: 250, priceLabel: "from $250" },
  { id: "addon-after-hours", name: "After-Hours Clearance Coordination", price: 175, priceLabel: "$175" },
  { id: "addon-importer-setup", name: "Importer Account Setup", price: 95, priceLabel: "$95" },
  { id: "addon-cbsa-id", name: "CBSA ID Assistance", price: 95, priceLabel: "$95" },
];

export default function CustomsClearance() {
  const [, setLocation] = useLocation();
  const packagesRef = useRef<HTMLDivElement>(null);
  const { addItem, setIsOpen } = useCart();
  const { formatPrice, isUSD } = useCurrency();

  const navigateToCalculator = () => {
    setLocation("/customs-calculator");
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    document.title = "Canadian Customs Clearance & Import Compliance | AccessToNorth";
    const metaDesc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Professional customs clearance coordination for Canadian imports — we prepare your declaration paperwork for filing by your licensed broker. Transparent flat pricing: LVS from CA$145, Commercial Coordination CA$295, Compliance Review CA$395.");
    if (ogTitle) ogTitle.setAttribute("content", "Canadian Customs Clearance Coordination & Import Compliance | AccessToNorth");
    if (ogDesc) ogDesc.setAttribute("content", "Structured, transparent customs clearance coordination. We prepare declaration paperwork for filing by your licensed broker. Flat-rate packages for every shipment.");
    return () => {
      document.title = "AccessToNorth.com - Expert GST/HST & Business Number Registration in Canada";
      if (metaDesc) metaDesc.setAttribute("content", "Canadian GST/HST, Business Number, CARM, and customs filings coordinated under signed authorization. Flat-fee service for residents and non-residents. From CA$99.");
      if (ogTitle) ogTitle.setAttribute("content", "AccessToNorth.com - GST/HST & Business Registration Canada");
      if (ogDesc) ogDesc.setAttribute("content", "Register your business with the CRA correctly. From Business Numbers to Non-Resident GST/HST, we handle the paperwork.");
    };
  }, []);

  const scrollToPackages = () => {
    packagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAddPackage = (pkg: typeof PACKAGES[0]) => {
    addItem({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      serviceKey: pkg.id,
      category: "package",
    });
  };

  const handleAddAddon = (addon: typeof ADDONS[0]) => {
    addItem({
      id: addon.id,
      name: addon.name,
      price: addon.price,
      serviceKey: addon.id,
      category: "addon",
    });
  };

  const whyDifferentItems = [
    { icon: FileCheck, text: "Customs declaration paperwork prepared for your broker" },
    { icon: Search, text: "HS classification review" },
    { icon: Scale, text: "Tariff treatment eligibility" },
    { icon: AlertTriangle, text: "SIMA & safeguard screening" },
    { icon: ClipboardCheck, text: "Import permit checks" },
    { icon: Shield, text: "CARM alignment" },
  ];

  const risksReduced = [
    "Rejections",
    "Post-entry corrections",
    "Costly penalties",
    "Delays at release",
  ];

  const processSteps = [
    { step: 1, title: "Select your services", description: "Choose a clearance coordination package and any add-ons, then proceed to checkout.", icon: ShoppingCart },
    { step: 2, title: "Submit required documents", description: "Upload your commercial invoice, packing list, and other documents based on your selected services.", icon: Send },
    { step: 3, title: "We review & confirm scope", description: "We assess documentation, verify completeness, and confirm the service scope.", icon: Search },
    { step: 4, title: "We prepare your declaration for filing", description: "We assemble your EDI-ready customs declaration and broker-handoff package. Your licensed customs broker files it with CBSA. If you don't have a broker, we'll introduce you to a vetted partner.", icon: FileText },
    { step: 5, title: "Release confirmation", description: "Your broker confirms release with CBSA and we relay the confirmation to you, plus a compliance summary if applicable.", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkHero />

      {/* HERO SECTION */}
      <section
        className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 20% 10%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(180deg, ${DEEP_NAVY} 0%, #061428 60%, #0D1F3A 100%)`,
        }}
        data-testid="section-hero"
      >
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-6 border border-white/10">
                <Anchor className="w-4 h-4" />
                Cross-Border Compliance Infrastructure
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-display leading-tight" data-testid="text-clearance-heading">
                Canadian Customs Clearance Coordination & Import Compliance
              </h1>
              <p className="text-base md:text-lg text-white/70 mb-8 max-w-lg" data-testid="text-clearance-subheading">
                Flat-rate, transparent pricing. We coordinate your clearance and prepare the declaration paperwork — your licensed customs broker files it with CBSA. No negotiations, no manual quotes.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 font-semibold shadow-lg shadow-black/10 cursor-pointer"
                  onClick={scrollToPackages}
                  data-testid="button-start-clearance"
                >
                  <Package className="w-4 h-4 mr-2" />
                  View Packages
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white cursor-pointer backdrop-blur-sm"
                  onClick={navigateToCalculator}
                  data-testid="button-estimate-duties"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Estimate Duties First
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="relative">
                <div className="absolute -top-8 -right-8 w-56 h-56 bg-blue-400/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-56 h-56 bg-indigo-400/10 rounded-full blur-2xl"></div>
                <Card className="relative z-10 bg-white/5 border-white/10 backdrop-blur-sm p-6">
                  <div className="space-y-3">
                    {["Declaration Prepared for Broker", "HS Code Verified", "Tariff Treatment Applied", "SIMA Screening Clear", "Release Confirmed"].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i < 4 ? "bg-green-500/20" : "bg-white/10"}`}>
                          {i < 4 ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse"></div>
                          )}
                        </div>
                        <span className={`text-sm ${i < 4 ? "text-white/80" : "text-white/40"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs text-white/40">Clearance Status</span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">In Progress</span>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 1 — WHY THIS IS DIFFERENT */}
      <section className="py-12 md:py-20 bg-slate-50" data-testid="section-why-different">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 font-display" data-testid="text-why-different-heading">
              Most brokers only file entries. We coordinate.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              A structured approach to import compliance that goes beyond basic filing.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {whyDifferentItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="p-4 flex items-center gap-3 hover-elevate" data-testid={`card-coordination-${i}`}>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item.text}</span>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-5 bg-amber-50 border-amber-100">
              <p className="text-sm font-semibold text-amber-800 mb-3">This reduces risk of:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {risksReduced.map((risk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="text-sm text-amber-700">{risk}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — CLEARANCE PACKAGES */}
      <section className="py-12 md:py-20" ref={packagesRef} data-testid="section-packages">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 font-display" data-testid="text-packages-heading">
              Clearance Packages
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Transparent, flat-rate pricing. No value-based tiers. All prices in CAD.
            </p>
          </motion.div>

          <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Under CA$2,500</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium text-slate-700">LVS</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Over CA$2,500</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium text-slate-700">Commercial</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card
                  className={`p-6 h-full flex flex-col ${pkg.highlighted ? "border-blue-200 ring-2 ring-blue-100" : ""}`}
                  data-testid={`card-package-${pkg.id}`}
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                      {pkg.highlighted && (
                        <Badge className="no-default-hover-elevate no-default-active-elevate bg-blue-100 text-blue-700 border-blue-200">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-slate-900">{formatPrice(pkg.price)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{pkg.subtitle}</p>
                  </div>
                  <div className="space-y-2.5 flex-1">
                    {pkg.features.map((f, fi) => (
                      <div key={fi} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.highlighted ? "text-blue-600" : "text-green-600"}`} />
                        <span className="text-sm text-slate-600">{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-3">Best for: {pkg.bestFor}</p>
                    <Button
                      className={`w-full cursor-pointer ${pkg.highlighted ? "bg-blue-600" : ""}`}
                      onClick={() => handleAddPackage(pkg)}
                      data-testid={`button-add-${pkg.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — ADD-ON SERVICES */}
      <section className="py-12 md:py-20 bg-slate-50" data-testid="section-addons">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 font-display" data-testid="text-addons-heading">
              Add-On Services
            </h2>
            <p className="text-slate-500">Available alongside any clearance package. All prices in CAD.</p>
          </motion.div>

          <Card className="divide-y divide-slate-100" data-testid="card-addons">
            {ADDONS.map((addon, i) => (
              <motion.div
                key={addon.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center justify-between px-5 py-3.5 gap-3"
                data-testid={`addon-${addon.id}`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-700">{addon.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{addon.id === "addon-b2-correction" ? "from " : ""}{formatPrice(addon.price)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleAddAddon(addon)}
                    data-testid={`button-add-${addon.id}`}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </motion.div>
            ))}
          </Card>
        </div>
      </section>

      {/* SECTION 4 — PROCESS */}
      <section className="py-12 md:py-20" data-testid="section-process">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 font-display" data-testid="text-process-heading">
              How It Works
            </h2>
            <p className="text-slate-500">A clear, structured process from selection to release.</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 hidden sm:block" aria-hidden="true"></div>
            <div className="space-y-6">
              {processSteps.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-start gap-4 sm:gap-5"
                  data-testid={`process-step-${item.step}`}
                >
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-bold text-slate-900 mb-0.5">Step {item.step}: {item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FAQ */}
      <section className="py-12 md:py-16 bg-slate-50" data-testid="section-faq">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 font-display" data-testid="text-faq-heading">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="pricing" className="bg-white rounded-lg border px-4" data-testid="faq-pricing">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4 text-left">
                Why flat-rate pricing instead of percentage-based?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4 text-left">
                Flat-rate pricing provides full transparency. You know the exact cost before you begin. No surprises, no negotiations, no hidden fees based on shipment value. This is how modern platforms operate.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="duty-rates" className="bg-white rounded-lg border px-4" data-testid="faq-duty-rates">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4 text-left">
                Do you guarantee duty rates?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4 text-left">
                No. Final assessment of duties and taxes is determined by the Canada Border Services Agency (CBSA). Our estimates and reviews are based on current tariff schedules and applicable trade agreements, but CBSA retains final authority on all assessments.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sima" className="bg-white rounded-lg border px-4" data-testid="faq-sima">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4 text-left">
                Are SIMA duties included in the clearance?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4 text-left">
                We screen for SIMA (Special Import Measures Act) risk as part of our compliance review packages, but final SIMA assessment is made by CBSA. If your goods are potentially subject to anti-dumping or countervailing duties, we will flag this in your compliance summary.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="broker" className="bg-white rounded-lg border px-4" data-testid="faq-broker">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4 text-left">
                Do you act as a licensed customs broker?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4 text-left">
                No. AccessToNorth is not a licensed customs broker and does not file declarations with CBSA. We coordinate the clearance, review your documentation, screen for compliance issues, and prepare an EDI-ready declaration package — your licensed customs broker files it with CBSA. If you don't have a broker, we'll introduce you to a vetted partner.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="timeline" className="bg-white rounded-lg border px-4" data-testid="faq-timeline">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4 text-left">
                How long does customs clearance take?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4 text-left">
                Our coordination and document-preparation work is typically complete within 1–2 business days after we receive complete documentation. Compliance review packages may take an additional business day. Final release timing depends on your broker's filing turnaround and CBSA processing. Urgent coordination is available for time-sensitive shipments.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-12 md:py-20" data-testid="section-cta">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 font-display">
              Ready to coordinate your shipment's clearance?
            </h2>
            <p className="text-slate-500 mb-6 max-w-lg mx-auto">
              Select a clearance coordination package, add any services you need, and proceed to checkout. We prepare the paperwork — your licensed broker files it with CBSA. Structured. Transparent. Platform-based.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="min-w-[220px] w-full sm:w-auto justify-center cursor-pointer"
                onClick={scrollToPackages}
                data-testid="button-cta-packages"
              >
                <Package className="w-4 h-4 mr-1" />
                View Packages
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-w-[220px] w-full sm:w-auto justify-center cursor-pointer"
                onClick={navigateToCalculator}
                data-testid="button-cta-calculator"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Estimate Duties First
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
