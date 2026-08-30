import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu, X, ShieldCheck, ChevronDown, ShoppingCart,
  Briefcase, Receipt, Globe, FileLock, PackageCheck,
  FileUp, ScanSearch, ClipboardCheck, LayoutGrid,
  Search, Calculator, Lock, Truck, MapPin, Wrench, Ship,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useLocale } from "@/contexts/LocaleContext";
import { LocaleToggle } from "@/components/LocaleToggle";
import type { LucideIcon } from "lucide-react";

interface NavbarProps {
  darkHero?: boolean;
}

interface MegaLink {
  name: string;
  href: string;
  icon?: LucideIcon;
  desc?: string;
  comingSoon?: boolean;
}

const serviceLinks: MegaLink[] = [
  { name: "All Services", href: "/services", icon: LayoutGrid, desc: "Browse our full service catalogue" },
  { name: "Business Number (BN)", href: "/services/business-number-bn", icon: Briefcase, desc: "Register a CRA business number" },
  { name: "GST/HST Registration", href: "/services/gst-hst-registration", icon: Receipt, desc: "Get your GST/HST account set up" },
  { name: "Non-Resident Importer", href: "/services/non-resident-importer-canada", icon: Globe, desc: "Import as a non-resident of Canada" },
  { name: "CARM Registration", href: "/services/carm-registration-canada", icon: ShieldCheck, desc: "Register on the CARM Client Portal" },
  { name: "RPP / Bond Coordination", href: "/services/rpp-bond-coordination", icon: FileLock, desc: "Release Prior to Payment setup" },
  { name: "Customs Clearance Coordination", href: "/services/customs-clearance-canada", icon: PackageCheck, desc: "We prepare your declaration; your broker files it with CBSA" },
  { name: "B13 Export Declaration", href: "/services/b13-export-declaration", icon: FileUp, desc: "We prepare your export declaration for filing by your broker" },
  { name: "HS Code Classification", href: "/services/hs-code-classification-canada", icon: ScanSearch, desc: "Get accurate tariff classification" },
  { name: "Import Compliance Review", href: "/services/import-compliance-review", icon: ClipboardCheck, desc: "Audit your import compliance" },
];

const toolLinks: MegaLink[] = [
  { name: "All Tools", href: "/tools", icon: Wrench, desc: "Free tools for importers & exporters" },
  { name: "HS Code Finder", href: "/tools/hs-code-finder", icon: Search, desc: "Search tariff codes by keyword" },
  { name: "Customs Duty & Tax Calculator", href: "/customs-calculator", icon: Calculator, desc: "Estimate duties & taxes on imports" },
  { name: "CARM Security Calculator", href: "/carm-security-calculator", icon: Lock, desc: "Calculate your RPP security amount" },
  { name: "Pallet Builder", href: "/tools/pallet-builder", icon: PackageCheck, desc: "Build carton-by-carton pallet plans" },
  { name: "Container Loading Calculator", href: "/tools/container-calculator", icon: Ship, desc: "Build a 3D container loading plan" },
  { name: "Truck Load Planner", href: "/tools/truck-load-planner", icon: Truck, desc: "Build a spatial trailer load plan" },
  { name: "Freight Quote", href: "/tools/freight-quote", icon: Truck, desc: "Build a carrier-ready quote request" },
  { name: "Tracking", href: "/tools/shipment-tracking", icon: MapPin, desc: "Check AccessToNorth request milestones" },
];

function CurrencyToggle({ light }: { light?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const base = "text-xs font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer";
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
  const { itemCount, setIsOpen: setCartOpen } = useCart();
  const { t } = useLocale();

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

  const renderMegaDropdown = (name: string, links: MegaLink[]) => {
    const allLink = links[0];
    const items = links.slice(1);
    return (
      <div
        className="static"
        onMouseEnter={() => handleDropdownEnter(name)}
        onMouseLeave={handleDropdownLeave}
      >
        <button
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
          onClick={() => navigate(allLink.href)}
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
              className="absolute left-0 right-0 top-full mt-0 z-50"
              onMouseEnter={() => handleDropdownEnter(name)}
              onMouseLeave={handleDropdownLeave}
            >
              <div className="container mx-auto px-4 md:px-6">
                <div className="bg-white rounded-b-xl shadow-xl border border-t-0 border-slate-100 p-5">
                  <button
                    onClick={() => navigate(allLink.href)}
                    className="w-full text-left px-4 py-3 text-sm cursor-pointer transition-all rounded-lg flex items-center gap-3 font-semibold text-primary bg-primary/5 hover:bg-primary/10 hover:shadow-sm mb-3"
                    data-testid={`nav-dropdown-${allLink.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {allLink.icon && <allLink.icon className="w-4 h-4 text-primary shrink-0" />}
                    <span>{allLink.name}</span>
                    {allLink.desc && <span className="ml-auto text-xs font-normal text-slate-400">{allLink.desc}</span>}
                  </button>
                  <div className="grid grid-cols-3 gap-1.5">
                    {items.map((link) => {
                      const Icon = link.icon;
                      return (
                        <button
                          key={link.href}
                          onClick={() => navigate(link.href)}
                          className="text-left px-4 py-3 text-sm cursor-pointer transition-all rounded-lg flex items-start gap-3 border border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm group"
                          data-testid={`nav-dropdown-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {Icon && (
                            <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                              <Icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-medium text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                              {link.name}
                              {link.comingSoon && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium leading-none">Soon</span>
                              )}
                            </span>
                            {link.desc && (
                              <span className="text-xs text-slate-400 group-hover:text-slate-500 mt-0.5 block leading-snug">{link.desc}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderMobileAccordion = (name: string, links: MegaLink[]) => (
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
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className="w-full text-left py-2.5 px-3 text-sm text-slate-600 hover:text-primary cursor-pointer rounded-md hover:bg-slate-50 flex items-center gap-2"
                  data-testid={`mobile-nav-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className="flex-1">{link.name}</span>
                  {link.comingSoon && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">Soon</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-3"
          : darkHero
            ? "bg-transparent py-5"
            : "bg-white/70 backdrop-blur-sm border-b border-slate-200/40 py-4"
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

          <div className="hidden lg:flex items-center gap-1">
            {renderMegaDropdown("services", serviceLinks)}
            {renderMegaDropdown("tools", toolLinks)}

            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/pricing")} data-testid="nav-link-pricing">{t("nav.pricing")}</button>
            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/resources")} data-testid="nav-link-resources">{t("nav.resources")}</button>
            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/faq")} data-testid="nav-link-faq">{t("nav.faq")}</button>
            <button className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`} onClick={() => navigate("/contact")} data-testid="nav-link-contact">{t("nav.contact")}</button>

            <button
              className={`px-2 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${textClass}`}
              onClick={() => navigate("/portal")}
              data-testid="button-check-status"
            >
              {t("nav.clientLogin")}
            </button>

            <CurrencyToggle light={useLight} />
            <LocaleToggle light={useLight} />

            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={() => setCartOpen(true)}
                className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                  useLight
                    ? "text-white hover:bg-white/10"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart — empty"}
                data-testid="button-navbar-cart"
              >
                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                    {itemCount}
                  </span>
                )}
              </button>
              <Button
                className={`shadow-lg cursor-pointer ${useLight ? "bg-white text-slate-900 shadow-black/10" : "bg-primary shadow-primary/20"}`}
                onClick={() => navigate("/request")}
                data-testid="button-register-now"
              >
                {t("nav.registerNow")}
              </Button>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => setCartOpen(true)}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                useLight ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
              }`}
              aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart — empty"}
              data-testid="button-mobile-cart"
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              className={`cursor-pointer p-2 ${useLight ? "text-white" : "text-slate-700"}`}
              onClick={() => setIsOpen(!isOpen)}
              data-testid="button-mobile-menu"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

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

              <button onClick={() => navigate("/pricing")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-pricing">{t("nav.pricing")}</button>
              <button onClick={() => navigate("/resources")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-resources">{t("nav.resources")}</button>
              <button onClick={() => navigate("/faq")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-faq">{t("nav.faq")}</button>
              <button onClick={() => navigate("/contact")} className="py-3 px-2 text-left text-base font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-50" data-testid="mobile-nav-contact">{t("nav.contact")}</button>

              <hr className="border-slate-100 my-2" />

              <div className="flex items-center justify-between py-2 px-2">
                <span className="text-sm text-slate-500">{t("currency.cad")} / {t("currency.usd")}</span>
                <CurrencyToggle />
              </div>
              <div className="flex items-center justify-between py-2 px-2">
                <span className="text-sm text-slate-500">{t("locale.toggle")}</span>
                <LocaleToggle />
              </div>

              <Button className="w-full cursor-pointer" onClick={() => navigate("/request")} data-testid="button-mobile-register">{t("nav.registerNow")}</Button>
              <button onClick={() => navigate("/portal")} className="py-2 px-2 text-center text-sm font-medium text-slate-500 hover:text-primary cursor-pointer" data-testid="button-mobile-check-status">{t("nav.clientLoginMobile")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
