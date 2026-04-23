/**
 * English strings. The keys here are the canonical list — every other locale
 * must export the same keys. Run TypeScript's check to catch drift.
 */
export const en = {
  // Navigation
  "nav.services": "Services",
  "nav.tools": "Tools",
  "nav.pricing": "Pricing",
  "nav.resources": "Resources",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "nav.about": "About",
  "nav.clientLogin": "Client Login",
  "nav.registerNow": "Register Now",
  "nav.clientLoginMobile": "Already a client? Log in →",

  // Footer
  "footer.servicesHeading": "Services",
  "footer.contactHeading": "Contact",
  "footer.legalHeading": "Legal",
  "footer.terms": "Terms",
  "footer.privacy": "Privacy",
  "footer.refunds": "Refund Policy",
  "footer.hours": "Mon–Fri, 9:00 a.m.–6:00 p.m. ET",
  "footer.secureCheckout": "Secure checkout powered by Stripe",

  // Hero
  "hero.badge": "Coordinating Canadian tax & customs filings",
  "hero.title_before": "Canadian",
  "hero.title_emphasis": "Business Number & GST/HST",
  "hero.title_after": " filings, coordinated for you.",
  "hero.subtitle":
    "Flat fee from CA$99. We prepare and submit your CRA filings under signed authorization. CRA typically issues accounts within 5–10 business days of filing. For Canadian and non-resident businesses.",
  "hero.cta": "Start Registration",

  // Common
  "common.learnMore": "Learn more",
  "common.getStarted": "Get Started",
  "common.contactUs": "Contact Us",
  "common.viewPricing": "View Pricing",
  "common.satisfactionGuarantee": "Refund on unfiled work",
  "common.guaranteeBody":
    "Full refund if you cancel before we submit your filing. If an application is rejected due to our error, we re-file or refund the service fee.",

  // Currency toggle
  "currency.cad": "CAD",
  "currency.usd": "USD",

  // Locale toggle
  "locale.toggle": "Language",
  "locale.en": "English",
  "locale.fr": "Français",
};

export type EnKey = keyof typeof en;
