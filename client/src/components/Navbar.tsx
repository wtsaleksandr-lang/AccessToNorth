import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu, X, ShieldCheck, ChevronDown, ShoppingCart,
  Briefcase, Receipt, Globe, FileLock, PackageCheck,
  FileUp, ScanSearch, ClipboardCheck, LayoutGrid,
  Search, Calculator, Lock, Truck, MapPin, Wrench, Ship,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useLocale } from "@/contexts/LocaleContext";
import { LocaleToggle } from "@/components/LocaleToggle";
import { BrandLogo } from "@/components/BrandLogo";
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

/** A titled column inside a mega-menu. The three columns are laid out on a 4px
 *  grid gap over the canvas shell, so the shell colour reads as the divider —
 *  the system has no vertical rules. */
interface MegaGroup {
  heading: string;
  items: MegaLink[];
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

/** Lookup so a group can name a link without restating its copy. The link data
 *  above stays the single source of truth for hrefs, icons and captions. */
const byName = (links: MegaLink[], name: string): MegaLink => {
  const found = links.find((l) => l.name === name);
  if (!found) throw new Error(`Unknown nav link: ${name}`);
  return found;
};

/**
 * Mega-menu grouping.
 *
 * The reference groups by jurisdiction (FOR CANADA / FOR USA / BY INDUSTRY).
 * AccessToNorth currently ships no US-jurisdiction service or tool and no
 * industry landing pages, so a literal `FOR USA` column would render empty.
 * The three-column structure, headings and gap dividers are the reference's;
 * the second and third headings name the split the real catalogue actually
 * has. Add the US and industry routes and these become FOR USA / BY INDUSTRY
 * with no structural change.
 */
const serviceGroups: MegaGroup[] = [
  {
    heading: "For Canada",
    items: [
      byName(serviceLinks, "Business Number (BN)"),
      byName(serviceLinks, "GST/HST Registration"),
      byName(serviceLinks, "CARM Registration"),
      byName(serviceLinks, "RPP / Bond Coordination"),
    ],
  },
  {
    heading: "Cross-border",
    items: [
      byName(serviceLinks, "Non-Resident Importer"),
      byName(serviceLinks, "Customs Clearance Coordination"),
      byName(serviceLinks, "B13 Export Declaration"),
    ],
  },
  {
    heading: "Advisory",
    items: [
      byName(serviceLinks, "HS Code Classification"),
      byName(serviceLinks, "Import Compliance Review"),
    ],
  },
];

const toolGroups: MegaGroup[] = [
  {
    heading: "Duty & classification",
    items: [
      byName(toolLinks, "HS Code Finder"),
      byName(toolLinks, "Customs Duty & Tax Calculator"),
      byName(toolLinks, "CARM Security Calculator"),
    ],
  },
  {
    heading: "Load planning",
    items: [
      byName(toolLinks, "Pallet Builder"),
      byName(toolLinks, "Container Loading Calculator"),
      byName(toolLinks, "Truck Load Planner"),
    ],
  },
  {
    heading: "Shipping",
    items: [
      byName(toolLinks, "Freight Quote"),
      byName(toolLinks, "Tracking"),
    ],
  },
];

const testId = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

function CurrencyToggle({ light }: { light?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const base = "text-xs font-semibold px-2 py-1 rounded-sm transition-colors duration-state cursor-pointer";
  const activeLight = light ? "bg-white/20 text-white" : "bg-brand/10 text-brand";
  const inactiveLight = light ? "text-white/60 hover:text-white" : "text-text-deemphasis hover:text-text-secondary";
  return (
    <div
      className={`flex items-center rounded-md p-0.5 ${light ? "bg-white/10" : "bg-surface-canvas"}`}
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { itemCount, setIsOpen: setCartOpen } = useCart();
  const { t } = useLocale();

  // The header no longer changes on scroll — it is transparent at every scroll
  // position, by design. `darkHero` alone decides whether the header paints its
  // contents in light or dark ink.
  const useLight = darkHero;

  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
    setMobileExpanded(null);
  }, [location]);

  // Clear any pending hover-intent timer if the component unmounts mid-hover.
  useEffect(() => () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
  }, []);

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

  const textClass = useLight
    ? "text-white/85 hover:text-white"
    : "text-text-secondary hover:text-brand";

  const renderMegaLink = (link: MegaLink) => {
    const Icon = link.icon;
    return (
      <button
        key={link.href}
        onClick={() => navigate(link.href)}
        className="group w-full text-left flex items-start gap-3 rounded-sm px-2.5 py-2 border-2 border-transparent transition-colors duration-state hover:border-brand cursor-pointer"
        data-testid={`nav-dropdown-${testId(link.name)}`}
      >
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-surface-canvas transition-colors duration-state">
            <Icon className="h-4 w-4 text-text-muted transition-colors duration-state group-hover:text-brand" aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            {link.name}
            {link.comingSoon && (
              <span className="rounded-sm bg-surface-canvas px-1.5 py-0.5 text-[10px] font-medium leading-none text-text-muted">Soon</span>
            )}
          </span>
          {link.desc && (
            <span className="mt-0.5 block text-xs leading-snug text-text-muted">{link.desc}</span>
          )}
        </span>
      </button>
    );
  };

  const renderMegaDropdown = (name: string, links: MegaLink[], groups: MegaGroup[]) => {
    const allLink = links[0];
    const open = activeDropdown === name;
    return (
      <div
        className="static"
        onMouseEnter={() => handleDropdownEnter(name)}
        onMouseLeave={handleDropdownLeave}
      >
        <button
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-state cursor-pointer ${textClass}`}
          onClick={() => navigate(allLink.href)}
          aria-expanded={open}
          data-testid={`nav-link-${name}`}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-state ${open ? "rotate-180" : ""}`} />
        </button>

        {/* No entrance animation beyond a .2s opacity/translate on open. The
            panel stays mounted-on-open only (no exit transition) so there is
            no spring, no keyframe and nothing to interrupt a fast hover. */}
        {open && (
          <div
            className="absolute left-0 right-0 top-full z-50 pt-2"
            onMouseEnter={() => handleDropdownEnter(name)}
            onMouseLeave={handleDropdownLeave}
          >
            <div className="container mx-auto px-4 md:px-6">
              {/* Outer shell: 12px radius, 4px padding, canvas-coloured so the
                  4px grid gaps below read as the dividers. 12 - 4 = 8px on the
                  inner cards. */}
              <div className="rounded-lg bg-surface-canvas p-1 shadow-lifted">
                <button
                  onClick={() => navigate(allLink.href)}
                  className="mb-1 flex w-full cursor-pointer items-center gap-3 rounded-md border-2 border-transparent bg-surface-primary px-4 py-3 text-left transition-colors duration-state hover:border-brand"
                  data-testid={`nav-dropdown-${testId(allLink.name)}`}
                >
                  {allLink.icon && <allLink.icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />}
                  <span className="text-sm font-medium text-text-primary">{allLink.name}</span>
                  {allLink.desc && (
                    <span className="ml-auto hidden text-xs text-text-muted xl:block">{allLink.desc}</span>
                  )}
                </button>

                <div className="grid grid-cols-3 gap-1">
                  {groups.map((group) => (
                    <div key={group.heading} className="rounded-md bg-surface-primary p-3">
                      <p className="mb-1.5 px-2.5 text-eyebrow uppercase text-text-deemphasis">
                        {group.heading}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map(renderMegaLink)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMobileAccordion = (name: string, links: MegaLink[]) => {
    const expanded = mobileExpanded === name;
    return (
      <>
        <button
          onClick={() => setMobileExpanded(expanded ? null : name)}
          className="flex items-center justify-between gap-3 py-3 px-2 text-base font-medium text-text-primary cursor-pointer rounded-sm transition-colors duration-state hover:bg-surface-recessed"
          aria-expanded={expanded}
          data-testid={`mobile-nav-${name}`}
        >
          <span className="min-w-0 text-left">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-state ${expanded ? "rotate-180" : ""}`} />
        </button>
        {/* grid-rows 0fr -> 1fr gives a height transition with no keyframes and
            no measured height, so long FR labels can wrap freely. */}
        <div
          className="grid transition-[grid-template-rows] duration-state ease-[ease]"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="pl-3 space-y-0.5 pb-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className="w-full text-left py-2.5 px-3 text-sm text-text-secondary cursor-pointer rounded-sm transition-colors duration-state hover:bg-surface-recessed hover:text-brand flex items-start gap-2"
                    data-testid={`mobile-nav-${testId(link.name)}`}
                    tabIndex={expanded ? 0 : -1}
                  >
                    {Icon && <Icon className="w-4 h-4 mt-0.5 text-text-deemphasis shrink-0" aria-hidden="true" />}
                    <span className="min-w-0 flex-1 break-words">{link.name}</span>
                    {link.comingSoon && (
                      <span className="shrink-0 rounded-sm bg-surface-canvas px-1.5 py-0.5 text-[10px] font-medium text-text-muted">Soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <nav
      data-testid="navbar"
      /* 83px tall, pinned to the top. Flat opaque fill, no border, no blur and
         no scroll state — the header looks identical at every scroll position.

         The reference's header is transparent, and this is the one deliberate
         deviation from it. The reference can afford transparency because its
         page composition keeps a single light surface under the header; ours
         puts a #0C111D footer and mixed-luminance sections under a FIXED
         header, so a transparent header renders its own links invisible as
         soon as the user scrolls. An unreadable nav is a functional defect,
         not a style choice. An opaque flat fill is the smallest change that
         fixes it while keeping the law intact: still no border, still no
         backdrop-filter, still no scroll theatrics. */
      className={`fixed top-0 w-full z-50 ${darkHero ? "bg-surface-dark" : "bg-surface-primary"}`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-[83px] items-center justify-between">
          <Link href="/" className="group shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <BrandLogo light={useLight} />
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {renderMegaDropdown("services", serviceLinks, serviceGroups)}
            {renderMegaDropdown("tools", toolLinks, toolGroups)}

            <button className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-state cursor-pointer whitespace-nowrap ${textClass}`} onClick={() => navigate("/pricing")} data-testid="nav-link-pricing">{t("nav.pricing")}</button>
            <button className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-state cursor-pointer whitespace-nowrap ${textClass}`} onClick={() => navigate("/resources")} data-testid="nav-link-resources">{t("nav.resources")}</button>
            <button className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-state cursor-pointer whitespace-nowrap ${textClass}`} onClick={() => navigate("/faq")} data-testid="nav-link-faq">{t("nav.faq")}</button>
            <button className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-state cursor-pointer whitespace-nowrap ${textClass}`} onClick={() => navigate("/contact")} data-testid="nav-link-contact">{t("nav.contact")}</button>

            <button
              className={`px-2 py-2 text-sm font-medium rounded-sm transition-colors duration-state cursor-pointer whitespace-nowrap ${textClass}`}
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
                className={`relative p-2 rounded-md transition-colors duration-state cursor-pointer ${
                  useLight ? "text-white hover:bg-white/10" : "text-text-secondary hover:bg-surface-canvas"
                }`}
                aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart — empty"}
                data-testid="button-navbar-cart"
              >
                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                    {itemCount}
                  </span>
                )}
              </button>
              <Button
                className={`cursor-pointer whitespace-nowrap rounded-md ${useLight ? "bg-white text-text-primary hover:bg-white/90" : "bg-brand hover:bg-brand-hover"}`}
                onClick={() => navigate("/request")}
                data-testid="button-register-now"
              >
                {t("nav.registerNow")}
              </Button>
            </div>
          </div>

          <div className="xl:hidden flex items-center gap-1">
            <button
              onClick={() => setCartOpen(true)}
              className={`relative p-2 rounded-md transition-colors duration-state cursor-pointer ${
                useLight ? "text-white hover:bg-white/10" : "text-text-secondary hover:bg-surface-canvas"
              }`}
              aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart — empty"}
              data-testid="button-mobile-cart"
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              className={`cursor-pointer p-2 ${useLight ? "text-white" : "text-text-primary"}`}
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              data-testid="button-mobile-menu"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="xl:hidden max-h-[calc(100vh-83px)] overflow-y-auto bg-surface-primary shadow-lifted">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-1">
            {renderMobileAccordion("services", serviceLinks)}
            {renderMobileAccordion("tools", toolLinks)}

            <button onClick={() => navigate("/pricing")} className="py-3 px-2 text-left text-base font-medium text-text-primary cursor-pointer rounded-sm transition-colors duration-state hover:bg-surface-recessed" data-testid="mobile-nav-pricing">{t("nav.pricing")}</button>
            <button onClick={() => navigate("/resources")} className="py-3 px-2 text-left text-base font-medium text-text-primary cursor-pointer rounded-sm transition-colors duration-state hover:bg-surface-recessed" data-testid="mobile-nav-resources">{t("nav.resources")}</button>
            <button onClick={() => navigate("/faq")} className="py-3 px-2 text-left text-base font-medium text-text-primary cursor-pointer rounded-sm transition-colors duration-state hover:bg-surface-recessed" data-testid="mobile-nav-faq">{t("nav.faq")}</button>
            <button onClick={() => navigate("/contact")} className="py-3 px-2 text-left text-base font-medium text-text-primary cursor-pointer rounded-sm transition-colors duration-state hover:bg-surface-recessed" data-testid="mobile-nav-contact">{t("nav.contact")}</button>

            <hr className="border-border my-2" />

            <div className="flex items-center justify-between gap-3 py-2 px-2">
              <span className="min-w-0 text-sm text-text-muted">{t("currency.cad")} / {t("currency.usd")}</span>
              <span className="shrink-0"><CurrencyToggle /></span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2 px-2">
              <span className="min-w-0 text-sm text-text-muted">{t("locale.toggle")}</span>
              <span className="shrink-0"><LocaleToggle /></span>
            </div>

            <Button className="w-full cursor-pointer rounded-md bg-brand hover:bg-brand-hover" onClick={() => navigate("/request")} data-testid="button-mobile-register">{t("nav.registerNow")}</Button>
            <button onClick={() => navigate("/portal")} className="py-2 px-2 text-center text-sm font-medium text-text-muted hover:text-brand cursor-pointer transition-colors duration-state" data-testid="button-mobile-check-status">{t("nav.clientLoginMobile")}</button>
          </div>
        </div>
      )}
    </nav>
  );
}
