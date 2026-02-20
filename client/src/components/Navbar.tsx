import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";

interface NavbarProps {
  darkHero?: boolean;
}

const serviceLinks = [
  { name: "All Services", href: "/services" },
  { name: "Business Number (BN)", href: "/services/business-number-bn" },
  { name: "GST/HST Registration", href: "/services/gst-hst-registration" },
  { name: "Non-Resident Importer", href: "/services/non-resident-importer-canada" },
  { name: "CARM Registration", href: "/services/carm-registration-canada" },
  { name: "RPP / Bond Coordination", href: "/services/rpp-bond-coordination" },
  { name: "Customs Clearance", href: "/services/customs-clearance-canada" },
  { name: "B13 Export Declaration", href: "/services/b13-export-declaration" },
  { name: "HS Code Classification", href: "/services/hs-code-classification-canada" },
  { name: "Import Compliance Review", href: "/services/import-compliance-review" },
];

const toolLinks = [
  { name: "All Tools", href: "/tools" },
  { name: "HS Code Finder", href: "/tools/hs-code-finder" },
  { name: "Customs Duty & Tax Calculator", href: "/customs-calculator" },
  { name: "CARM Security Calculator", href: "/carm-security-calculator" },
  { name: "Freight Quote", href: "/tools/freight-quote", comingSoon: true },
  { name: "Tracking", href: "/tools/shipment-tracking", comingSoon: true },
];

function CurrencyToggle({ light }: { light?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const base = light
    ? "text-xs font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer"
    : "text-xs font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer";
  const activeLight = light ? "bg-white/20 text-white" : "bg-primary/10 text-primary";
  const inactiveLight = light ? "text-white/50 hover:text-white/80" : "text-slate-400 hover:text-slate-600";
  return (
    <div
      className={`flex items-center rounded-lg p-0.5 ${light ? "bg-white/10" : "bg-slate-100"}`}
      data-testid="currency-toggle"
    >
      <button
        onClick={() => setCurrency("CAD")}
        className={`${base} ${currency === "CAD" ? activeLight : inactiveLight}`}
        data-testid="button-cad"
      >
        CAD
      </button>
      <button
        onClick={() => setCurrency("USD")}
        className={`${base} ${currency === "USD" ? activeLight : inactiveLight}`}
        data-testid="button-usd"
      >
        USD
      </button>
    </div>
  );
}

export function Navbar({ darkHero = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const useLight = darkHero && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
    setMobileExpanded(null);
  }, [location]);

  const navigate = (href: string) => {
    setIsOpen(false);
    setActiveDropdown(null);
    setLocation(href);
    window.scrollTo({ top: 0 });
  };

  const handleDropdownEnter = (name: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(name);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const textClass = useLight ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-primary";

  const renderDropdown = (name: string, links: typeof serviceLinks | typeof toolLinks) => (
    <div
      className="relative"
      onMouseEnter={() => handleDropdownEnter(name)}
      onMouseLeave={handleDropdownLeave}
    >
      <button
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
        onClick={() => navigate(links[0].href)}
        data-testid={`nav-link-${name}`}
      >
        {name.charAt(0).toUpperCase() + name.slice(1)}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === name ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {activeDropdown === name && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50"
            onMouseEnter={() => handleDropdownEnter(name)}
            onMouseLeave={handleDropdownLeave}
          >
            {links.map((link, i) => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                  i === 0
                    ? "font-semibold text-primary hover:bg-primary/5 border-b border-slate-100 mb-1"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                data-testid={`nav-dropdown-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="flex-1">{link.name}</span>
                {"comingSoon" in link && link.comingSoon && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">Soon</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderMobileAccordion = (name: string, links: typeof serviceLinks | typeof toolLinks) => (
    <>
      <button
        onClick={() => setMobileExpanded(mobileExpanded === name ? null : name)}
        className="flex items-center justify-between py-3 px-2 text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50"
        data-testid={`mobile-nav-${name}`}
      >
        {name.charAt(0).toUpperCase() + name.slice(1)}
        <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpanded === name ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {mobileExpanded === name && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-4 space-y-0.5 overflow-hidden"
          >
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="w-full text-left py-2.5 px-3 text-sm text-slate-600 hover:text-primary cursor-pointer rounded-md hover:bg-slate-50 flex items-center gap-2"
                data-testid={`mobile-nav-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="flex-1">{link.name}</span>
                {"comingSoon" in link && link.comingSoon && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">Soon</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="bg-primary p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span
              className={`text-xl font-extrabold tracking-tight transition-colors duration-300 ${useLight ? "text-white" : "text-slate-900"}`}
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" }}
            >
              AccessToNorth<span className={useLight ? "text-white/80" : "text-primary"}>.com</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {renderDropdown("services", serviceLinks)}
            {renderDropdown("tools", toolLinks)}

            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/pricing")} data-testid="nav-link-pricing">Pricing</button>
            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/resources")} data-testid="nav-link-resources">Resources</button>
            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/faq")} data-testid="nav-link-faq">FAQ</button>
            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/contact")} data-testid="nav-link-contact">Contact</button>

            <CurrencyToggle light={useLight} />

            <div className="flex items-center gap-2 ml-3">
              <Button
                variant="outline"
                className={`cursor-pointer ${useLight ? "border-white/30 text-white" : "border-primary/20 text-primary"}`}
                onClick={() => navigate("/portal")}
                data-testid="button-check-status"
              >
                Check Status
              </Button>
              <Button
                className={`shadow-lg cursor-pointer ${useLight ? "bg-white text-slate-900 shadow-black/10" : "bg-primary shadow-primary/20"}`}
                onClick={() => navigate("/request")}
                data-testid="button-register-now"
              >
                Register Now
              </Button>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className={`lg:hidden cursor-pointer ${useLight ? "text-white" : "text-slate-700"}`}
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t mt-3 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-1">
              {renderMobileAccordion("services", serviceLinks)}
              {renderMobileAccordion("tools", toolLinks)}

              <button onClick={() => navigate("/pricing")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-pricing">Pricing</button>
              <button onClick={() => navigate("/resources")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-resources">Resources</button>
              <button onClick={() => navigate("/faq")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-faq">FAQ</button>
              <button onClick={() => navigate("/contact")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-contact">Contact</button>

              <hr className="border-slate-100 my-2" />

              <div className="flex items-center justify-between py-2 px-2">
                <span className="text-sm text-slate-500">Display currency</span>
                <CurrencyToggle />
              </div>

              <Button variant="outline" className="w-full justify-center cursor-pointer" onClick={() => navigate("/portal")} data-testid="button-mobile-check-status">Check Status</Button>
              <Button className="w-full cursor-pointer" onClick={() => navigate("/request")} data-testid="button-mobile-register">Register Now</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
