import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/**
 * Routes that deliberately render NO site chrome.
 *
 * Before the Layout extraction each page imported <Navbar/> and <Footer/>
 * itself, so "no chrome" was expressed by simply not importing them. That
 * intent has to be preserved explicitly now that the shell is hoisted:
 *
 *  - /admin, /admin/crm, /admin/view-as-client — operator consoles with their
 *    own headers; they never rendered the marketing nav or footer.
 *  - /portal — ClientPortal renders its own nav inside the logged-out gate and
 *    a bespoke app shell once authenticated. It never rendered the Footer.
 *  - /payment-cancel — a bare centred card, no chrome by design.
 *  - /embed/* — embeddable widget surface. ContainerCalculator used to gate its
 *    own chrome on `isEmbedMode`; that gate now lives here.
 */
const CHROMELESS_PREFIXES = ["/admin", "/portal", "/payment-cancel", "/embed/"];

/**
 * Routes whose first section is a dark hero, so the transparent header must
 * paint its contents in light ink. These are exactly the three pages that
 * previously passed `<Navbar darkHero />`.
 *
 * Matched exactly, not by prefix: /canadian-customs-clearance is a dark hero
 * but its /checkout child is not, and used a plain <Navbar />.
 */
const DARK_HERO_ROUTES = new Set([
  "/carm-security-calculator",
  "/customs-calculator",
  "/canadian-customs-clearance",
]);

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const chromeless = CHROMELESS_PREFIXES.some(
    (prefix) => location === prefix || location.startsWith(`${prefix}/`) || location.startsWith(prefix),
  );

  if (chromeless) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar darkHero={DARK_HERO_ROUTES.has(location)} />
      {children}
      <Footer />
    </>
  );
}
