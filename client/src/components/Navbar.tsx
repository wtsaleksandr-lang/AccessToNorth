import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  darkHero?: boolean;
}

const serviceLinks = [
  { name: "All Services", href: "/services" },
  { name: "Customs Clearance", href: "/services/customs-clearance-canada" },
  { name: "Import Compliance Review", href: "/services/import-compliance-review" },
  { name: "HS Code Classification", href: "/services/hs-code-classification-canada" },
  { name: "CARM Registration", href: "/services/carm-registration-canada" },
  { name: "RPP / Bond Coordination", href: "/services/rpp-bond-coordination" },
  { name: "B13 Export Declaration", href: "/services/b13-export-declaration" },
  { name: "Non-Resident Importer", href: "/services/non-resident-importer-canada" },
];

const toolLinks = [
  { name: "All Tools", href: "/tools" },
  { name: "Customs Duty & Tax Calculator", href: "/customs-calculator" },
  { name: "CARM Security Calculator", href: "/carm-security-calculator" },
  { name: "Customs Clearance Packages", href: "/canadian-customs-clearance" },
  { name: "Freight Quote Tool", href: "/tools/freight-quote", comingSoon: true },
  { name: "Shipment Tracking", href: "/tools/shipment-tracking", comingSoon: true },
];

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
            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter("services")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
                onClick={() => navigate("/services")}
                data-testid="nav-link-services"
              >
                Services
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === "services" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "services" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50"
                    onMouseEnter={() => handleDropdownEnter("services")}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {serviceLinks.map((link, i) => (
                      <button
                        key={link.href}
                        onClick={() => navigate(link.href)}
                        className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                          i === 0
                            ? "font-semibold text-primary hover:bg-primary/5 border-b border-slate-100 mb-1"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        data-testid={`nav-dropdown-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {link.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tools Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter("tools")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
                onClick={() => navigate("/tools")}
                data-testid="nav-link-tools"
              >
                Tools
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === "tools" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "tools" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50"
                    onMouseEnter={() => handleDropdownEnter("tools")}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {toolLinks.map((link, i) => (
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

            {/* Direct Links */}
            <button
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
              onClick={() => navigate("/pricing")}
              data-testid="nav-link-pricing"
            >
              Pricing
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
              onClick={() => navigate("/faq")}
              data-testid="nav-link-faq"
            >
              FAQ
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
              onClick={() => navigate("/contact")}
              data-testid="nav-link-contact"
            >
              Contact
            </button>

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
              {/* Services accordion */}
              <button
                onClick={() => setMobileExpanded(mobileExpanded === "services" ? null : "services")}
                className="flex items-center justify-between py-3 px-2 text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50"
                data-testid="mobile-nav-services"
              >
                Services
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpanded === "services" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {mobileExpanded === "services" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4 space-y-0.5 overflow-hidden"
                  >
                    {serviceLinks.map((link) => (
                      <button
                        key={link.href}
                        onClick={() => navigate(link.href)}
                        className="w-full text-left py-2.5 px-3 text-sm text-slate-600 hover:text-primary cursor-pointer rounded-md hover:bg-slate-50"
                        data-testid={`mobile-nav-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {link.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tools accordion */}
              <button
                onClick={() => setMobileExpanded(mobileExpanded === "tools" ? null : "tools")}
                className="flex items-center justify-between py-3 px-2 text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50"
                data-testid="mobile-nav-tools"
              >
                Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpanded === "tools" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {mobileExpanded === "tools" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4 space-y-0.5 overflow-hidden"
                  >
                    {toolLinks.map((link) => (
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

              {/* Direct links */}
              <button
                onClick={() => navigate("/pricing")}
                className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50"
                data-testid="mobile-nav-pricing"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate("/faq")}
                className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50"
                data-testid="mobile-nav-faq"
              >
                FAQ
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50"
                data-testid="mobile-nav-contact"
              >
                Contact
              </button>

              <hr className="border-slate-100 my-2" />

              <Button
                variant="outline"
                className="w-full justify-center cursor-pointer"
                onClick={() => navigate("/portal")}
                data-testid="button-mobile-check-status"
              >
                Check Status
              </Button>
              <Button
                className="w-full cursor-pointer"
                onClick={() => navigate("/request")}
                data-testid="button-mobile-register"
              >
                Register Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
