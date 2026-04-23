import type { BlogCategoryMeta } from "./types";

export const CATEGORIES: Record<string, BlogCategoryMeta> = {
  "registration-tax": {
    slug: "registration-tax",
    name: "Registration & Tax",
    description: "GST/HST, Business Numbers, CRA payroll, and non-resident tax setups.",
    accent: { from: "#007BFF", to: "#0056b3" },
    defaultCta: { text: "Get GST/HST registered from CA$249", href: "/services/gst-hst-registration" },
  },
  "carm-imports": {
    slug: "carm-imports",
    name: "CARM & Import Accounts",
    description: "CARM portal onboarding, RPP, financial security, and broker delegation.",
    accent: { from: "#0A2540", to: "#061B2E" },
    defaultCta: { text: "Get CARM set up from CA$499", href: "/services/carm-registration-canada" },
  },
  "hs-classification": {
    slug: "hs-classification",
    name: "HS Codes & Classification",
    description: "Finding the right HS code, avoiding misclassification, and handling disputes.",
    accent: { from: "#059669", to: "#047857" },
    defaultCta: { text: "Order HS classification from CA$95", href: "/services/hs-code-classification-canada" },
  },
  "compliance-duties": {
    slug: "compliance-duties",
    name: "Compliance & Duties",
    description: "SIMA duty, AMPS penalties, audits, origin certification, and permits.",
    accent: { from: "#B91C1C", to: "#991B1B" },
    defaultCta: { text: "Book a compliance review", href: "/services/import-compliance-review" },
  },
  "ecommerce-non-resident": {
    slug: "ecommerce-non-resident",
    name: "E-commerce & Non-Resident",
    description: "Shopify, Amazon FBA, DDP fulfillment, and non-resident importer setups.",
    accent: { from: "#7C3AED", to: "#5B21B6" },
    defaultCta: { text: "Set up as a Non-Resident Importer", href: "/services/non-resident-importer-canada" },
  },
  advanced: {
    slug: "advanced",
    name: "Advanced Trade Topics",
    description: "Bonded warehouses, transfer pricing, free trade zones, customs audits.",
    accent: { from: "#0F766E", to: "#115E59" },
    defaultCta: { text: "Talk to our trade team", href: "/contact" },
  },
  seasonal: {
    slug: "seasonal",
    name: "Year-End & Regulatory Updates",
    description: "Annual checklists, year-end compliance, and new-year tariff updates.",
    accent: { from: "#D97706", to: "#B45309" },
    defaultCta: { text: "Browse all services", href: "/services" },
  },
};

export const CATEGORY_ORDER: Array<keyof typeof CATEGORIES> = [
  "registration-tax",
  "carm-imports",
  "hs-classification",
  "compliance-duties",
  "ecommerce-non-resident",
  "advanced",
  "seasonal",
];
