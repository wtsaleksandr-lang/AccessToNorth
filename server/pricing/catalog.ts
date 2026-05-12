/**
 * Server-side source of truth for cart prices, in CAD dollars.
 * The cart endpoint MUST look prices up here — never trust a price
 * supplied by the client. Keys match the `serviceKey` submitted by
 * the cart UI (client/src/pages/Pricing.tsx).
 */
export interface CatalogEntry {
  name: string;
  priceCAD: number;
}

export const SERVICE_CATALOG: Record<string, CatalogEntry> = {
  // Business Setup
  bn: { name: "Business Number (BN)", priceCAD: 99 },
  gst_hst: { name: "GST/HST Registration", priceCAD: 249 },
  non_resident_tax: { name: "Non-Resident Setup", priceCAD: 399 },
  bundle_business_starter: { name: "Business Starter Bundle", priceCAD: 299 },

  // Importer Setup
  carm_portal: { name: "CARM Portal Setup", priceCAD: 499 },
  rpp_bond: { name: "RPP / Security Coordination", priceCAD: 395 },
  bundle_complete_importer: { name: "Importer Launch Kit", priceCAD: 1500 },

  // Customs Clearance Coordination
  // (AccessToNorth coordinates clearance and prepares paperwork; the licensed
  // broker files the declaration with CBSA. See Terms section 2.)
  "clearance-lvs": { name: "Low-Value Import Clearance Coordination", priceCAD: 145 },
  "clearance-commercial": { name: "Commercial Import Clearance Coordination", priceCAD: 295 },
  "clearance-compliance": { name: "Clearance Coordination + Compliance Review", priceCAD: 395 },

  // Export
  b13_export: { name: "B13 Export Declaration Preparation", priceCAD: 125 },

  // Generic HS classification (per-line)
  hs_classification: { name: "HS Code Classification", priceCAD: 95 },
};

export const ADDON_CATALOG: Record<string, CatalogEntry> = {
  hs1: { name: "HS Code Classification (1 line)", priceCAD: 95 },
  hs_extra: { name: "Additional HS Line", priceCAD: 25 },
  import_permit: { name: "Import Permit Submission", priceCAD: 125 },
  cfia: { name: "CFIA Coordination", priceCAD: 150 },
  b2_correction: { name: "B2 Correction (prepared for your broker)", priceCAD: 250 },
  after_hours: { name: "After-Hours Clearance Coordination", priceCAD: 175 },
  importer_account: { name: "Importer Account Setup", priceCAD: 95 },
  cbsa_id: { name: "CBSA ID Assistance", priceCAD: 95 },
};

/**
 * Resolve a price for a cart item by its `serviceKey` (+ optional category).
 * Returns null when the key is not in either catalog — callers MUST reject
 * the request in that case.
 */
export function lookupCartPrice(
  serviceKey: string,
  category?: string,
): CatalogEntry | null {
  if (category === "addon") {
    return ADDON_CATALOG[serviceKey] ?? null;
  }
  return SERVICE_CATALOG[serviceKey] ?? ADDON_CATALOG[serviceKey] ?? null;
}
