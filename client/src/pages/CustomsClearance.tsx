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
  Truck,
  Scale,
  Globe,
  DollarSign,
  ExternalLink,
  Anchor,
} from "lucide-react";

const DEEP_NAVY = "#0A1E3D";

export default function CustomsClearance() {
  const [, setLocation] = useLocation();
  const packagesRef = useRef<HTMLDivElement>(null);

  const navigateToContact = () => {
    setLocation("/");
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const navigateToCalculator = () => {
    setLocation("/customs-calculator");
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    document.title = "Canadian Customs Clearance & Import Compliance | AccessToNorth";
    const metaDesc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Professional customs clearance coordination for Canadian imports. HS verification, tariff treatment eligibility, SIMA screening, and CARM alignment. Transparent pricing from $125 CAD.");
    if (ogTitle) ogTitle.setAttribute("content", "Canadian Customs Clearance & Import Compliance | AccessToNorth");
    if (ogDesc) ogDesc.setAttribute("content", "Risk-controlled clearance coordination: customs declarations, HS classification review, compliance screening, and release coordination. Digital-first and structured.");
    return () => {
      document.title = "AccessToNorth.com - Expert GST/HST & Business Number Registration in Canada";
      if (metaDesc) metaDesc.setAttribute("content", "Expert GST/HST & Business Number Registration in Canada. Fast registration for residents and non-residents. CRA Authorized Representatives. Satisfaction Guarantee.");
      if (ogTitle) ogTitle.setAttribute("content", "AccessToNorth.com - GST/HST & Business Registration Canada");
      if (ogDesc) ogDesc.setAttribute("content", "Register your business with the CRA correctly. From Business Numbers to Non-Resident GST/HST, we handle the paperwork.");
    };
  }, []);

  const scrollToPackages = () => {
    packagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const whyDifferentItems = [
    { icon: FileCheck, text: "Customs declaration" },
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
    { step: 1, title: "Submit documents", description: "Send us your commercial invoice, packing list, and bill of lading.", icon: Send },
    { step: 2, title: "We review & confirm scope", description: "We assess documentation, verify completeness, and confirm the service scope.", icon: Search },
    { step: 3, title: "Electronic filing", description: "Your customs entry is filed electronically with CBSA via EDI.", icon: FileText },
    { step: 4, title: "Release confirmation", description: "You receive confirmation once goods are cleared for release.", icon: CheckCircle2 },
    { step: 5, title: "Compliance summary", description: "If applicable, you receive a compliance summary with any flags or recommendations.", icon: ClipboardCheck },
  ];

  const addOnServices = [
    { name: "HS Code Classification (1 line)", price: "$95" },
    { name: "Additional HS Line", price: "$25" },
    { name: "Import Permit Submission", price: "$125" },
    { name: "CFIA Coordination", price: "$150" },
    { name: "B2 Correction", price: "from $250" },
    { name: "After-Hours Clearance", price: "$175" },
    { name: "Importer Account Setup", price: "$95" },
    { name: "CBSA ID Assistance", price: "$95" },
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
                Canadian Customs Clearance & Import Compliance
              </h1>
              <p className="text-base md:text-lg text-white/70 mb-8 max-w-lg" data-testid="text-clearance-subheading">
                Professional coordination of import declarations, HS verification, and regulatory screening — structured, transparent, and digital-first.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 font-semibold shadow-lg shadow-black/10 cursor-pointer"
                  onClick={scrollToPackages}
                  data-testid="button-start-clearance"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Start Clearance
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white cursor-pointer backdrop-blur-sm"
                  onClick={scrollToPackages}
                  data-testid="button-compliance-review"
                >
                  Get Compliance Review
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
                    {["Customs Declaration Filed", "HS Code Verified", "Tariff Treatment Applied", "SIMA Screening Clear", "Release Confirmed"].map((item, i) => (
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
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 font-display" data-testid="text-packages-heading">
              Clearance Packages
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Transparent pricing for every shipment scenario. All prices in CAD.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Package 1: Standard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-6 h-full flex flex-col" data-testid="card-package-standard">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Standard Commercial Clearance</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-900">$145</span>
                    <span className="text-sm text-slate-500">CAD</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">For routine shipments with confirmed HS codes.</p>
                </div>
                <div className="space-y-2.5 flex-1">
                  {["Electronic customs entry (EDI)", "Duty & GST calculation", "Document review", "Release coordination", "Standard tariff treatment (MFN)"].map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-3">Best for: Regular importers, low-risk products</p>
                  <Button className="w-full cursor-pointer" onClick={navigateToContact} data-testid="button-select-standard">
                    Select Package
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Package 2: Compliance Review (Recommended) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="p-6 h-full flex flex-col border-blue-200 ring-2 ring-blue-100" data-testid="card-package-compliance">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-900">Clearance + Compliance Review</h3>
                    <Badge className="no-default-hover-elevate no-default-active-elevate bg-blue-100 text-blue-700 border-blue-200">Recommended</Badge>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-900">$245</span>
                    <span className="text-sm text-slate-500">CAD</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Everything in Standard plus compliance review.</p>
                </div>
                <div className="space-y-2.5 flex-1">
                  {[
                    "Everything in Standard Clearance",
                    "HS code verification (1 line)",
                    "Tariff treatment eligibility review (CUSMA / CPTPP / CETA)",
                    "SIMA screening flag check",
                    "Import control screening (CFIA / EICC / others)",
                    "Risk summary report",
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-blue-100">
                  <p className="text-xs text-slate-400 mb-3">Best for: New importers, first-time products, medium-risk goods</p>
                  <Button className="w-full cursor-pointer bg-blue-600" onClick={navigateToContact} data-testid="button-select-compliance">
                    Select Package
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Package 3: High-Value */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="p-6 h-full flex flex-col" data-testid="card-package-high-value">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">High-Value Shipment Clearance</h3>
                  <p className="text-sm text-slate-500 mt-1">For goods valued above $2,500 CAD.</p>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-600">$2,500 – $10,000</span>
                    <span className="text-sm font-bold text-slate-900">$195</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-600">$10,000 – $50,000</span>
                    <span className="text-sm font-bold text-slate-900">$295</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-600">$50,000+</span>
                    <span className="text-sm font-bold text-slate-900">Custom quote</span>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1">
                  {["Full electronic entry", "Duty calculation", "Value validation review", "Compliance screening"].map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Button className="w-full cursor-pointer" onClick={navigateToContact} data-testid="button-select-high-value">
                    Get a Quote
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Row 2: B13 + RPP */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Package 4: B13 Export */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="p-6 h-full flex flex-col" data-testid="card-package-b13">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">B13 Export Declaration</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-slate-900">$125</span>
                      <span className="text-sm text-slate-500">CAD</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-2.5 flex-1">
                  {["CERS filing", "Confirmation receipt", "Data validation review"].map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">Urgent processing available.</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Button className="w-full cursor-pointer" variant="outline" onClick={navigateToContact} data-testid="button-select-b13">
                    Select Package
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Package 5: RPP Bond */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="p-6 h-full flex flex-col" data-testid="card-package-rpp">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">RPP Bond Coordination</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-slate-900">$395</span>
                      <span className="text-sm text-slate-500">CAD</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-2.5 flex-1">
                  {["Bond coordination", "CARM validation", "Security calculation review", "Release setup assistance"].map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Button className="w-full cursor-pointer" variant="outline" onClick={navigateToContact} data-testid="button-select-rpp">
                    Select Package
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
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
            <p className="text-slate-500">Available alongside any clearance package.</p>
          </motion.div>

          <Card className="divide-y divide-slate-100" data-testid="card-addons">
            {addOnServices.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center justify-between px-5 py-3.5"
                data-testid={`addon-${i}`}
              >
                <span className="text-sm text-slate-700">{service.name}</span>
                <span className="text-sm font-bold text-slate-900 whitespace-nowrap ml-4">{service.price}</span>
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
            <p className="text-slate-500">A clear, structured process from documents to release.</p>
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
                We coordinate licensed brokerage services and compliance review. All customs entries are filed through licensed customs broker partners. Our role is to manage the coordination, documentation review, and compliance screening to ensure your shipment clears efficiently and correctly.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="timeline" className="bg-white rounded-lg border px-4" data-testid="faq-timeline">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4 text-left">
                How long does customs clearance take?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4 text-left">
                Standard commercial clearance is typically processed within 1-2 business days after we receive complete documentation. Compliance review packages may take an additional business day. Urgent processing is available for time-sensitive shipments.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="documents" className="bg-white rounded-lg border px-4" data-testid="faq-documents">
              <AccordionTrigger className="text-sm font-medium text-slate-800 py-4 text-left">
                What documents do I need to provide?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-4 text-left">
                At minimum: commercial invoice, packing list, and bill of lading or airway bill. Depending on the goods, you may also need certificates of origin, import permits, or product-specific documentation. We will advise you on any additional requirements during the scope confirmation step.
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
              Ready to clear your shipment?
            </h2>
            <p className="text-slate-500 mb-6 max-w-lg mx-auto">
              Submit your documents and we will confirm scope, pricing, and timeline within one business day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="min-w-[220px] w-full sm:w-auto justify-center cursor-pointer"
                onClick={navigateToContact}
                data-testid="button-cta-contact"
              >
                Contact Us to Start
                <ArrowRight className="w-4 h-4 ml-1" />
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
