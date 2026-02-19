declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
    };
  }
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import businessTeamImg from "@/assets/images/business-team.jpg";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrationModal } from "@/components/RegistrationModal";
import { usePageMeta } from "@/hooks/use-page-meta";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, ShieldCheck, Award, Lock, BadgeCheck, ChevronLeft, ChevronRight, Building2, Landmark, Shield, Calculator, Package, Globe, FileCheck, Search } from "lucide-react";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("gst-hst");
  const [, setLocation] = useLocation();

  usePageMeta({
    title: "AccessToNorth.com | Canadian GST/HST & Business Registration Services",
    description: "Expert Canadian business registration services. GST/HST, Business Numbers, CARM, customs clearance, and non-resident compliance. Trusted by 10,000+ businesses.",
    canonical: "https://www.accesstonorth.com",
  });

  const handleOpenModal = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 maple-bg">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 space-y-4 md:space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Official CRA Authorized Representatives
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-display text-slate-900 leading-[1.05] tracking-tight" data-testid="text-hero-title" style={{ letterSpacing: '-0.02em' }}>
                Expert GST/HST & <br />
                <span className="text-primary">Business Registration</span>
              </h1>

              <p className="text-base md:text-lg text-slate-600 max-w-lg leading-relaxed">
                Register your business with the CRA correctly and efficiently. From Business Numbers to Non-Resident GST/HST, we handle the paperwork so you can focus on business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/request">
                  <Button
                    size="lg"
                    className="bg-primary text-lg px-8 shadow-lg shadow-primary/25 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#0056b3] hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-100"
                    data-testid="button-start-registration"
                  >
                    Start Registration
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 px-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                        <img src={`/images/avatar-${i}.png`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    <span className="text-slate-600 font-medium">Trusted by 10k+ businesses</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <div className="relative z-10 glass-card rounded-2xl p-6 md:p-8 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="h-2 w-20 bg-slate-200 rounded mb-2"></div>
                      <div className="h-2 w-32 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-primary w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full bg-slate-200 rounded mb-1.5"></div>
                          <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Registration Status</span>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">Completed</span>
                  </div>
                </div>

                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className="absolute left-[-10px] lg:left-[-14px] top-[12%] flex flex-col gap-2.5 lg:gap-3">
                    {[
                      { icon: Landmark, label: "CRA", testId: "inst-badge-cra" },
                      { icon: Building2, label: "CBSA", testId: "inst-badge-cbsa" },
                      { icon: Shield, label: "IRS", testId: "inst-badge-irs" },
                      { icon: BadgeCheck, label: "USPTO", testId: "inst-badge-uspto", hideOnSmall: true },
                      { icon: Building2, label: "SBA", testId: "inst-badge-sba", hideOnSmall: true },
                    ].map((badge, i) => (
                      <div
                        key={badge.testId}
                        data-testid={badge.testId}
                        className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-[14px] border border-white/60 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 ${badge.hideOnSmall ? 'hidden sm:flex' : 'flex'}`}
                        style={{ marginLeft: `${(i % 2) * 6}px` }}
                      >
                        <badge.icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-medium text-slate-700">{badge.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="absolute right-[-10px] lg:right-[-14px] top-[28%] flex flex-col gap-2.5 lg:gap-3 items-end">
                    {[
                      { icon: ShieldCheck, label: "CRA Authorized Rep", testId: "trust-badge-cra" },
                      { icon: Award, label: "Satisfaction Guarantee", testId: "trust-badge-guarantee" },
                      { icon: Lock, label: "Secure & Confidential", testId: "trust-badge-secure" },
                    ].map((badge, i) => (
                      <div
                        key={badge.testId}
                        data-testid={badge.testId}
                        className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-[14px] border border-white/60 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
                        style={{ marginRight: `${(i % 2) * 6}px` }}
                      >
                        <badge.icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs lg:text-sm font-medium text-slate-700 whitespace-nowrap">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do — Service Highlights */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">What We Do</h2>
            <p className="text-base md:text-lg text-slate-600">
              Navigating Canadian tax and trade compliance shouldn't be a burden. We simplify it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mb-10">
            {[
              { icon: Package, title: "Customs Clearance", desc: "Flat-rate commercial import clearance into Canada.", href: "/services/customs-clearance-canada" },
              { icon: Landmark, title: "CARM Registration", desc: "End-to-end CARM portal onboarding for importers.", href: "/services/carm-registration-canada" },
              { icon: Globe, title: "Non-Resident Importer", desc: "Full NRI setup for foreign businesses selling in Canada.", href: "/services/non-resident-importer-canada" },
              { icon: FileCheck, title: "HS Code Classification", desc: "Accurate tariff classification to avoid penalties.", href: "/services/hs-code-classification-canada" },
              { icon: Shield, title: "Import Compliance", desc: "Comprehensive audit of your import operations.", href: "/services/import-compliance-review" },
              { icon: Calculator, title: "Trade Tools", desc: "Free calculators for duties, CARM, and HS codes.", href: "/tools" },
            ].map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="h-full cursor-pointer border border-slate-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300" data-testid={`card-home-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/services">
              <Button variant="outline" size="lg" className="cursor-pointer" data-testid="button-all-services">
                All Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" className="cursor-pointer" data-testid="button-view-pricing">
                View Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Non-Resident Section */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <div className="lg:w-1/2">
              <img
                src={businessTeamImg}
                alt="International Business Team"
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div className="lg:w-1/2 space-y-4 md:space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold font-display" data-testid="text-nonresident-title">Are You a Non-Resident Selling in Canada?</h2>
              <p className="text-base md:text-lg text-slate-600">
                New rules require many non-resident businesses to register for GST/HST under the simplified regime. If you sell digital products, services, or goods through fulfillment warehouses, you likely need to register.
              </p>
              <ul className="space-y-4">
                {[
                  "Digital Economy Compliance",
                  "Simplified GST/HST Regime Registration",
                  "Annual Information Return Filing",
                  "Election for Agents"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium text-slate-800">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/services/non-resident-importer-canada">
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-4 cursor-pointer"
                  data-testid="button-nonresident-learn-more"
                >
                  Learn More About Non-Resident Rules
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-8 md:py-12 bg-blue-50/50 border-y border-blue-100/50">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <Award className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto mb-3 md:mb-4" />
          <h3 className="text-xl font-bold font-display mb-2">Satisfaction Guarantee</h3>
          <p className="text-slate-600">
            If we fall short on our registration process due to our error, you receive a full refund. We stand behind every filing.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Tracking Teaser */}
      <section className="py-10 md:py-14 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center">
          <Search className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl md:text-2xl font-bold font-display mb-2">Track Your Application</h2>
          <p className="text-slate-600 mb-5 text-sm">
            Already a client? Check the status of your registration or clearance order.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/portal">
              <Button variant="outline" className="cursor-pointer" data-testid="button-home-portal">
                Client Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/tools/shipment-tracking">
              <Button variant="outline" className="cursor-pointer" data-testid="button-home-tracking">
                Shipment Tracking
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPackage={selectedPackage}
      />
    </div>
  );
}

const testimonials = [
  {
    text: "The process was incredibly smooth. I tried doing it myself but got confused by the CRA forms. AccessToNorth handled it seamlessly.",
    author: "Sarah Johnson",
    role: "E-commerce Founder",
    verified: true,
  },
  {
    text: "As a US company selling software to Canadians, I had no idea about the new tax laws. AccessToNorth sorted out our compliance perfectly.",
    author: "Michael Roberts",
    role: "SaaS CEO",
    verified: true,
  },
  {
    text: "Worth every penny. The premium package set up our payroll and import accounts along with the GST number. Huge time saver.",
    author: "David Chen",
    role: "Import/Export Director",
    verified: true,
  },
  {
    text: "Registered my non-resident GST/HST quickly and without any hassle. The team was knowledgeable and responsive throughout.",
    author: "John Delaney",
    role: "US E-commerce Seller",
    verified: true,
  },
  {
    text: "The Complete Importer Bundle was exactly what we needed. CARM setup was smooth and now we are fully compliant for importing.",
    author: "Priya Mehta",
    role: "Logistics Manager",
    verified: true,
  },
  {
    text: "We were dreading the CARM registration process but AccessToNorth made it painless. Everything was handled professionally from start to finish.",
    author: "Lisa Tremblay",
    role: "Operations VP, Supply Chain Co.",
    verified: true,
  },
];

function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-12 md:py-20 bg-slate-900 text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-3" data-testid="text-testimonials-title">What Our Clients Say</h2>
          <p className="text-slate-400">Rated 4.9/5 based on 500+ verified reviews</p>
        </div>

        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 hidden md:flex"
              data-testid="button-testimonial-prev"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 hidden md:flex"
              data-testid="button-testimonial-next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[320px] md:w-[360px] bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 snap-start flex flex-col"
                data-testid={`testimonial-card-${i}`}
              >
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {t.author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-white truncate">{t.author}</p>
                      {t.verified && (
                        <BadgeCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
