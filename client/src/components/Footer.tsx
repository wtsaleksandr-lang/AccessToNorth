import { Link } from "wouter";
import { CreditCard, Shield, Clock, Star, Lock, Upload, Landmark, Building2, BadgeCheck, Mail, ChevronDown } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const trustChips = [
  { icon: Lock, label: "Secure Stripe Checkout" },
  { icon: Upload, label: "Encrypted Document Upload" },
  { icon: Clock, label: "Typical Delivery 5–10 Days" },
  { icon: Star, label: "Money-Back Guarantee" },
];

/**
 * Reference agencies only. This row is compliance copy, not a badge wall —
 * it names the authorities our filings are addressed to. The "reference
 * agencies only" caveat immediately below it must stay with it, and both must
 * stay legible (>= WCAG AA) on the dark surface.
 */
const agencies = [
  { label: "CRA", icon: Landmark },
  { label: "IRS", icon: Shield },
  { label: "CBSA", icon: Building2 },
  { label: "USPTO", icon: BadgeCheck },
  { label: "SBA", icon: Building2 },
];

interface FooterLink {
  label: string;
  href: string;
  testId: string;
}

/**
 * The footer link columns mirror the mega-menu's grouping exactly. When the nav
 * headings change, change them here too — the two are meant to read as one
 * information architecture.
 *
 * As in the nav: the reference's FOR USA / BY INDUSTRY columns have no content
 * to fill yet, so these name the split the live catalogue actually has.
 */
const linkGroups: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "For Canada",
    links: [
      { label: "Business Number (BN)", href: "/services/business-number-bn", testId: "link-footer-bn" },
      { label: "GST/HST Registration", href: "/services/gst-hst-registration", testId: "link-footer-gst" },
      { label: "CARM Registration", href: "/services/carm-registration-canada", testId: "link-footer-carm" },
      { label: "RPP / Bond Coordination", href: "/services/rpp-bond-coordination", testId: "link-footer-rpp" },
      { label: "All Services", href: "/services", testId: "link-footer-services" },
    ],
  },
  {
    heading: "Cross-border",
    links: [
      { label: "Non-Resident Importer", href: "/services/non-resident-importer-canada", testId: "link-footer-nri" },
      { label: "Customs Clearance", href: "/services/customs-clearance-canada", testId: "link-footer-clearance" },
      { label: "B13 Export Declaration", href: "/services/b13-export-declaration", testId: "link-footer-b13" },
      { label: "HS Code Classification", href: "/services/hs-code-classification-canada", testId: "link-footer-hs" },
      { label: "Import Compliance Review", href: "/services/import-compliance-review", testId: "link-footer-compliance" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Trade Tools", href: "/tools", testId: "link-footer-tools" },
      { label: "Pricing", href: "/pricing", testId: "link-footer-pricing" },
      { label: "Loading API & Embed", href: "/developers/container-loading-api", testId: "link-footer-loading-api" },
      { label: "Resources", href: "/resources", testId: "link-footer-resources" },
      { label: "Blog", href: "/blog", testId: "link-footer-blog" },
      { label: "About", href: "/about", testId: "link-footer-about" },
      { label: "FAQ", href: "/faq", testId: "link-footer-faq" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Terms", href: "/terms", testId: "link-terms" },
  { label: "Privacy", href: "/privacy", testId: "link-privacy" },
  { label: "Security", href: "/security", testId: "link-security" },
  { label: "Refund Policy", href: "/refunds", testId: "link-refunds" },
];

/* Link ink on #0C111D. #CAD5E2 gives ~11:1 and #90A1B9 ~7:1 — both clear AA
   (and AAA) for body text, which the disclaimer copy needs. */
const linkClass =
  "text-[#CAD5E2] transition-colors duration-state hover:text-white";

export function Footer() {
  return (
    <footer className="bg-surface-dark py-12 md:py-14" data-testid="footer">
      <div className="container mx-auto px-4 md:px-6">

        {/* A) TRUST STRIP */}
        <div className="mb-10 pb-10 border-b border-white/10">
          <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 md:gap-3 mb-6">
            {trustChips.map((chip) => (
              <div
                key={chip.label}
                className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors duration-state hover:border-brand"
              >
                <chip.icon className="w-3.5 h-3.5 shrink-0 text-[#90A1B9]" aria-hidden="true" />
                <span className="text-xs font-medium text-[#CAD5E2] leading-snug">{chip.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-4 sm:gap-6 flex-wrap">
            {agencies.map((a) => (
              <div key={a.label} className="flex items-center gap-1.5">
                <a.icon className="w-3.5 h-3.5 text-[#CAD5E2]" aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-wide text-[#CAD5E2]">{a.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-[#90A1B9]">
            Reference agencies only. AccessToNorth is not affiliated with, endorsed by, or acting on
            behalf of any government agency.
          </p>
        </div>

        {/* B) MIDDLE ROW — brand + jurisdiction columns mirroring the nav */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8 mb-10">
          <div className="md:col-span-4">
            <Link href="/" className="group mb-4 inline-flex" data-testid="link-footer-home">
              <BrandLogo light accentClassName="text-[#90A1B9]" />
            </Link>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-[#90A1B9]" aria-hidden="true" />
                <a href="mailto:operations@accesstonorth.com" className={`${linkClass} break-all`} data-testid="link-footer-email">operations@accesstonorth.com</a>
              </li>
              <li className="flex items-start gap-2 pt-1 text-xs">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#90A1B9]" aria-hidden="true" />
                <span className="text-[#CAD5E2]">
                  Mon–Fri, 9:00 a.m.–6:00 p.m. ET<br />
                  <span className="text-[#90A1B9]">Responses typically within one business day.</span>
                </span>
              </li>
            </ul>

            {/* SERVICE DISCLAIMER — regulatory copy. Do not shorten, reword or
                de-emphasise. It stays collapsed by default (smoke.spec.ts
                asserts the collapse/expand contract); prominence comes from
                contrast and size, not from forcing it open. */}
            <details className="group mt-6 max-w-lg border-t border-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5 text-xs font-medium text-[#CAD5E2] transition-colors duration-state hover:text-white [&::-webkit-details-marker]:hidden">
                <span>Service disclaimer</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#90A1B9] transition-transform duration-state group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="border-t border-white/10 py-3 text-xs leading-relaxed text-[#CAD5E2]">
                <p className="mb-3">
                  AccessToNorth coordinates Canadian CRA and CBSA administrative filings for resident
                  and non-resident businesses under signed authorization. We are not a law firm,
                  accounting firm, or licensed customs broker.
                </p>
                <ul className="space-y-1.5">
                  <li>No legal, tax, accounting, or customs-brokerage advice.</li>
                  <li>No approval guarantees — decisions are made by the CRA, CBSA, and other authorities.</li>
                  <li>AccessToNorth is not affiliated with or endorsed by any government agency.</li>
                </ul>
              </div>
            </details>
          </div>

          {linkGroups.map((group) => (
            <div key={group.heading} className="md:col-span-2">
              <h4 className="mb-3 text-eyebrow uppercase text-[#90A1B9]">{group.heading}</h4>
              <ul className="space-y-2 text-sm">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass} data-testid={l.testId}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <h4 className="mb-3 text-eyebrow uppercase text-[#90A1B9]">Legal</h4>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass} data-testid={l.testId}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* C) BOTTOM SUB-BAR — copyright, status indicator, payment rail */}
        <div className="border-t border-white/10 pt-6 space-y-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-[#CAD5E2]" data-testid="footer-status">
              {/* Static dot — the system has no keyframes, so no pulse. */}
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#3ECF8E]" aria-hidden="true" />
              <span>All systems operational</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-[#90A1B9]">
              <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Visa</span>
              <span aria-hidden="true">/</span>
              <span>Mastercard</span>
              <span aria-hidden="true">/</span>
              <span>Amex</span>
              <span aria-hidden="true">/</span>
              <span>Apple&nbsp;Pay</span>
              <span aria-hidden="true">/</span>
              <span>Google&nbsp;Pay</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-[#CAD5E2]">
            <Shield className="w-4 h-4 shrink-0 text-[#90A1B9]" aria-hidden="true" />
            <span>Secure checkout powered by Stripe</span>
          </div>

          <p className="text-center text-xs leading-relaxed text-[#CAD5E2]">
            All services subject to our{" "}
            <Link href="/terms" className="underline transition-colors duration-state hover:text-white" data-testid="link-footer-terms">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/refunds" className="underline transition-colors duration-state hover:text-white" data-testid="link-footer-refunds">Refund Policy</Link>.
          </p>
          <p className="text-center text-xs text-[#90A1B9]">
            &copy; {new Date().getFullYear()} AccessToNorth.com
          </p>
          <p className="border-t border-white/10 pt-4 pb-2 text-center text-[11px] leading-relaxed tracking-wide text-[#90A1B9]">
            AccessToNorth operates through affiliated entities in the United States and Canada
            <span className="mx-1.5" aria-hidden="true">•</span>US entity: MR Holdings &amp; Trade LLC
            <span className="mx-1.5" aria-hidden="true">•</span>Toronto, Canada
          </p>
        </div>
      </div>
    </footer>
  );
}
