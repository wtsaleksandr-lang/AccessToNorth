/**
 * Per-service onboarding form schemas. Each service has a structured set
 * of fields the client fills in post-checkout. Kept as plain data so the
 * client UI can render generically and the AI processor can read it.
 */

export interface OnboardingFieldOption {
  value: string;
  label: string;
}

export type OnboardingFieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "radio"
  | "number"
  | "date";

export interface OnboardingField {
  key: string;
  label: string;
  type: OnboardingFieldType;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: OnboardingFieldOption[];
}

export interface OnboardingSection {
  heading: string;
  body?: string;
  fields: OnboardingField[];
}

export interface OnboardingFormSchema {
  serviceKey: string;
  title: string;
  intro: string;
  sections: OnboardingSection[];
}

// --- Shared field blocks ---------------------------------------------------

const ENTITY_SECTION: OnboardingSection = {
  heading: "Entity details",
  fields: [
    { key: "legalName", label: "Legal business name", type: "text", required: true },
    { key: "tradeName", label: "Operating / trade name", type: "text" },
    {
      key: "entityType",
      label: "Entity type",
      type: "select",
      required: true,
      options: [
        { value: "sole_prop", label: "Sole proprietorship" },
        { value: "partnership", label: "Partnership" },
        { value: "corporation", label: "Corporation (Canadian)" },
        { value: "foreign_corp", label: "Foreign corporation" },
        { value: "llc", label: "LLC (US)" },
        { value: "other", label: "Other" },
      ],
    },
    { key: "incorporationDate", label: "Date of incorporation (if applicable)", type: "date" },
    { key: "incorporationJurisdiction", label: "Jurisdiction of incorporation", type: "text" },
    { key: "businessAddress", label: "Business address", type: "textarea", required: true },
  ],
};

const CONTACT_SECTION: OnboardingSection = {
  heading: "Primary contact",
  fields: [
    { key: "contactName", label: "Full name", type: "text", required: true },
    { key: "contactRole", label: "Role / title", type: "text" },
    { key: "contactEmail", label: "Email", type: "email", required: true },
    { key: "contactPhone", label: "Phone", type: "tel" },
  ],
};

const ACTIVITY_SECTION: OnboardingSection = {
  heading: "Business activity",
  fields: [
    {
      key: "activityDescription",
      label: "What does your business do?",
      type: "textarea",
      required: true,
      placeholder: "Describe products/services, customer base, and where you operate.",
    },
    {
      key: "estimatedAnnualRevenue",
      label: "Estimated annual revenue (CAD)",
      type: "select",
      options: [
        { value: "under_30k", label: "Under CA$30,000" },
        { value: "30k_100k", label: "CA$30,000 – CA$100,000" },
        { value: "100k_500k", label: "CA$100,000 – CA$500,000" },
        { value: "500k_1m", label: "CA$500,000 – CA$1M" },
        { value: "1m_5m", label: "CA$1M – CA$5M" },
        { value: "over_5m", label: "Over CA$5M" },
      ],
    },
  ],
};

// --- Service-specific add-ons ---------------------------------------------

const GST_HST_SPECIFICS: OnboardingSection = {
  heading: "GST/HST specifics",
  fields: [
    {
      key: "regimePreference",
      label: "Simplified or normal regime?",
      type: "radio",
      helper: "Simplified is for non-resident digital sellers. Normal allows ITC recovery.",
      options: [
        { value: "simplified", label: "Simplified regime" },
        { value: "normal", label: "Normal regime" },
        { value: "unsure", label: "Unsure — recommend" },
      ],
    },
    {
      key: "reportingPeriodPreference",
      label: "Preferred reporting period",
      type: "select",
      options: [
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly (default under CA$1.5M)" },
        { value: "annual", label: "Annual" },
        { value: "unsure", label: "Unsure — recommend" },
      ],
    },
    {
      key: "effectiveDate",
      label: "Preferred effective date",
      type: "date",
      helper: "The date from which you want to start collecting GST/HST.",
    },
  ],
};

const NON_RESIDENT_SPECIFICS: OnboardingSection = {
  heading: "Non-resident specifics",
  fields: [
    {
      key: "countryOfResidence",
      label: "Country of tax residence",
      type: "text",
      required: true,
    },
    {
      key: "foreignTaxId",
      label: "Foreign tax identifier (EIN, VAT number, etc.)",
      type: "text",
    },
    {
      key: "canadianSalesChannel",
      label: "How do you sell into Canada?",
      type: "select",
      options: [
        { value: "shopify", label: "Own Shopify / website" },
        { value: "amazon_fba", label: "Amazon FBA Canada" },
        { value: "marketplace_other", label: "Other marketplace (Etsy, eBay, etc.)" },
        { value: "wholesale", label: "Wholesale / B2B" },
        { value: "other", label: "Other" },
      ],
    },
    {
      key: "canadianFulfillment",
      label: "Do you have inventory in Canada?",
      type: "radio",
      options: [
        { value: "yes", label: "Yes — stocked at a Canadian warehouse" },
        { value: "no", label: "No — shipped from outside Canada per order" },
      ],
    },
  ],
};

const CARM_SPECIFICS: OnboardingSection = {
  heading: "Import profile",
  fields: [
    {
      key: "peakMonthlyDuty",
      label: "Highest expected monthly duty + GST (CAD)",
      type: "number",
      helper: "Used to size your CARM financial security requirement.",
      required: true,
    },
    {
      key: "securityPreference",
      label: "Financial security preference",
      type: "radio",
      options: [
        { value: "bond", label: "Customs bond (annual premium)" },
        { value: "cash", label: "Cash deposit" },
        { value: "unsure", label: "Unsure — recommend" },
      ],
    },
    {
      key: "existingBroker",
      label: "Existing customs broker (if any)",
      type: "text",
    },
    {
      key: "typicalOrigin",
      label: "Primary country(ies) of origin for imports",
      type: "text",
    },
    {
      key: "commoditiesSummary",
      label: "What you typically import",
      type: "textarea",
      placeholder: "Brief description of product categories and annual volume.",
    },
  ],
};

const CLEARANCE_SPECIFICS: OnboardingSection = {
  heading: "Shipment details",
  fields: [
    { key: "shipmentReference", label: "Shipment reference / PO", type: "text" },
    { key: "supplierName", label: "Supplier / shipper", type: "text", required: true },
    { key: "countryOfOrigin", label: "Country of origin", type: "text", required: true },
    { key: "valueCAD", label: "Commercial value (CAD)", type: "number", required: true },
    {
      key: "hsCodeKnown",
      label: "HS code (if known)",
      type: "text",
      helper: "10-digit Canadian HS code. If unsure, leave blank — we'll classify.",
    },
    { key: "incoterm", label: "Incoterm (FOB, CIF, DDP, etc.)", type: "text" },
    { key: "portOfEntry", label: "Expected Canadian port of entry", type: "text" },
    { key: "expectedArrival", label: "Expected arrival date", type: "date" },
  ],
};

const B13_SPECIFICS: OnboardingSection = {
  heading: "Export details",
  fields: [
    { key: "consigneeName", label: "Consignee (buyer)", type: "text", required: true },
    { key: "destinationCountry", label: "Destination country", type: "text", required: true },
    { key: "exportValueCAD", label: "Export value (CAD)", type: "number", required: true },
    { key: "hsCode", label: "HS code", type: "text", required: true },
    {
      key: "modeOfTransport",
      label: "Mode of transport",
      type: "select",
      required: true,
      options: [
        { value: "marine", label: "Marine" },
        { value: "air", label: "Air" },
        { value: "rail", label: "Rail" },
        { value: "highway", label: "Highway" },
      ],
    },
    { key: "departurePort", label: "Departure port / airport / border crossing", type: "text" },
    { key: "proposedExportDate", label: "Proposed export date", type: "date", required: true },
    {
      key: "controlledGoods",
      label: "Are the goods controlled or subject to export permits?",
      type: "radio",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes — permit required" },
        { value: "unsure", label: "Unsure" },
      ],
    },
  ],
};

// --- Per-service schemas ---------------------------------------------------

const FORMS: Record<string, OnboardingFormSchema> = {
  bn: {
    serviceKey: "bn",
    title: "Business Number (BN) Intake",
    intro:
      "We use this information to prepare your CRA Form RC1. Fill in what you know — we'll come back for anything missing.",
    sections: [ENTITY_SECTION, CONTACT_SECTION, ACTIVITY_SECTION],
  },
  gst_hst: {
    serviceKey: "gst_hst",
    title: "GST/HST Registration Intake",
    intro:
      "We use this information to file your GST/HST application (and your Business Number if needed).",
    sections: [ENTITY_SECTION, CONTACT_SECTION, ACTIVITY_SECTION, GST_HST_SPECIFICS],
  },
  non_resident_tax: {
    serviceKey: "non_resident_tax",
    title: "Non-Resident Setup Intake",
    intro:
      "We use this information to prepare your non-resident BN and GST/HST application with the CRA.",
    sections: [ENTITY_SECTION, CONTACT_SECTION, NON_RESIDENT_SPECIFICS, GST_HST_SPECIFICS],
  },
  carm_portal: {
    serviceKey: "carm_portal",
    title: "CARM Portal Setup Intake",
    intro:
      "We use this information to onboard you to the CBSA CARM Client Portal and coordinate your financial security.",
    sections: [ENTITY_SECTION, CONTACT_SECTION, CARM_SPECIFICS],
  },
  rpp_bond: {
    serviceKey: "rpp_bond",
    title: "RPP / Security Coordination Intake",
    intro:
      "We use this information to size your CARM security and coordinate your RPP enrollment.",
    sections: [
      CONTACT_SECTION,
      {
        heading: "Security sizing",
        fields: [
          { key: "peakMonthlyDuty", label: "Highest expected monthly duty + GST (CAD)", type: "number", required: true },
          {
            key: "securityPreference",
            label: "Financial security preference",
            type: "radio",
            options: [
              { value: "bond", label: "Customs bond (annual premium)" },
              { value: "cash", label: "Cash deposit" },
              { value: "unsure", label: "Unsure — recommend" },
            ],
          },
        ],
      },
    ],
  },
  "clearance-lvs": {
    serviceKey: "clearance-lvs",
    title: "Low-Value Import Clearance Intake",
    intro:
      "We use this information to file your LVS release. Upload your commercial invoice and waybill on the next step.",
    sections: [CONTACT_SECTION, CLEARANCE_SPECIFICS],
  },
  "clearance-commercial": {
    serviceKey: "clearance-commercial",
    title: "Commercial Import Clearance Intake",
    intro:
      "We use this information to prepare your B3 commercial entry. Upload invoice, packing list, and origin certification on the next step.",
    sections: [CONTACT_SECTION, CLEARANCE_SPECIFICS],
  },
  b13_export: {
    serviceKey: "b13_export",
    title: "B13 Export Declaration Intake",
    intro:
      "We use this information to file your CERS export declaration. For controlled goods, we'll coordinate permits separately.",
    sections: [CONTACT_SECTION, B13_SPECIFICS],
  },
  bundle_business_starter: {
    serviceKey: "bundle_business_starter",
    title: "Business Starter Bundle Intake",
    intro:
      "Combined intake for your Business Number + GST/HST registration in a single engagement.",
    sections: [ENTITY_SECTION, CONTACT_SECTION, ACTIVITY_SECTION, GST_HST_SPECIFICS],
  },
  bundle_complete_importer: {
    serviceKey: "bundle_complete_importer",
    title: "Importer Launch Kit Intake",
    intro:
      "Combined intake for BN + GST/HST + CARM + RPP in a single coordinated engagement.",
    sections: [
      ENTITY_SECTION,
      CONTACT_SECTION,
      ACTIVITY_SECTION,
      GST_HST_SPECIFICS,
      CARM_SPECIFICS,
    ],
  },
};

const GENERIC_FALLBACK: OnboardingFormSchema = {
  serviceKey: "__generic",
  title: "Service Intake",
  intro:
    "We use this information to start your engagement. Fill in what you know — we'll come back for anything missing.",
  sections: [ENTITY_SECTION, CONTACT_SECTION, ACTIVITY_SECTION],
};

export function getOnboardingFormSchema(serviceKey: string): OnboardingFormSchema {
  return FORMS[serviceKey] ?? { ...GENERIC_FALLBACK, serviceKey };
}
