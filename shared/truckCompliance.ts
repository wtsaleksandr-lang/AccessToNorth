export interface TruckJurisdictionLike {
  code: string;
  country: string;
}

export interface OpenDeckEnvelopeInput {
  trailerCategory: string;
  trailerWidthIn: number;
  deckHeightIn?: number;
  cargoWidthIn: number;
  cargoHeightIn: number;
}

export interface OpenDeckEnvelopeResult {
  isOpenDeck: boolean;
  loadedWidthIn: number | null;
  loadedHeightIn: number | null;
  screeningWarnings: string[];
}

const CANADA_BASELINE_SOURCE = "https://comt.ca/english/programs/trucking/MOU99.PDF";
const CANADA_2026_SOURCE = "https://comt.ca/Reports/MOU%20on%20Interprovincial%20Trucking%202026.pdf";
const US_FEDERAL_SOURCE = "https://ops.fhwa.dot.gov/freight/sw/overview/index.htm";
const US_PERMIT_SOURCE = "https://ops.fhwa.dot.gov/freight/sw/permit_report/index.htm";

const CANADIAN_PERMIT_PORTALS: Record<string, string> = {
  AB: "https://www.alberta.ca/commercial-vehicle-weight-and-dimension-permits",
  BC: "https://www2.gov.bc.ca/gov/content/transportation/vehicle-safety-enforcement/services/permitting/commercial-transport-permits",
  MB: "https://www.gov.mb.ca/mti/mcd/permits/apply.html",
  NB: "https://www.gnb.ca/en/topic/driving-transportation/commercial-transportation/special-permits.html",
  NL: "https://www.gov.nl.ca/motorregistration/commercial-vehicles-and-drivers/overweight-and-over-dimensional-special-permits/",
  NS: "https://novascotia.ca/sns/paal/rmv/paal280.asp",
  NT: "https://www.idmv.inf.gov.nt.ca/Commercial/Single-Trip-Permits/Overweight-and-Oversized-Permit",
  NU: "https://www.gov.nu.ca/en/transportation",
  ON: "https://www.ontario.ca/page/get-oversizeoverweight-permit",
  PE: "https://www.princeedwardisland.ca/en/legislation/roads-act/overweight-vehicle-permit-regulations",
  QC: "https://www.transports.gouv.qc.ca/en/camionnage/permis-speciaux",
  SK: "https://www.saskatchewan.ca/business/transportation-and-road-construction/information-for-truckers-and-commercial-trucking-companies/commercial-vehicle-overweight-and-overdimensional-permits",
  YT: "https://yukon.ca/en/driving-and-transportation/commercial-vehicles/get-commercial-carrier-permit",
};

const OPEN_DECK_CATEGORIES = ["flatbed", "step deck", "rgn", "lowboy"];

export function evaluateOpenDeckEnvelope(input: OpenDeckEnvelopeInput): OpenDeckEnvelopeResult {
  const isOpenDeck = OPEN_DECK_CATEGORIES.some((category) => input.trailerCategory.toLowerCase().includes(category));
  if (!isOpenDeck) {
    return { isOpenDeck: false, loadedWidthIn: null, loadedHeightIn: null, screeningWarnings: [] };
  }
  const loadedWidthIn = Math.max(input.trailerWidthIn, input.cargoWidthIn);
  const loadedHeightIn = Math.max(0, input.deckHeightIn || 0) + Math.max(0, input.cargoHeightIn);
  const screeningWarnings: string[] = [];
  if (loadedWidthIn > 102.36 + 0.01) {
    screeningWarnings.push(`Loaded width ${loadedWidthIn.toFixed(1)} in exceeds the 2.6 m (102.36 in) North American planning screen`);
  }
  if (loadedHeightIn > 162 + 0.01) {
    screeningWarnings.push(`Loaded height ${loadedHeightIn.toFixed(1)} in, including the deck, exceeds the conservative 13 ft 6 in route screen`);
  }
  return { isOpenDeck, loadedWidthIn, loadedHeightIn, screeningWarnings };
}

export function getTruckJurisdictionGuidance(jurisdiction: TruckJurisdictionLike) {
  const isCanada = jurisdiction.country === "Canada";
  const isUnitedStates = jurisdiction.country === "United States";
  if (isCanada) {
    return {
      summary: "Interprovincial screen: 2.6 m width · 4.15 m height",
      detail: "Axle, gross-weight, seasonal, road, and permit limits still depend on the exact configuration and route.",
      rulesUrl: CANADA_BASELINE_SOURCE,
      rulesLabel: "National dimensions",
      permitUrl: CANADIAN_PERMIT_PORTALS[jurisdiction.code] || CANADA_2026_SOURCE,
      permitLabel: CANADIAN_PERMIT_PORTALS[jurisdiction.code] ? "Permit portal" : "2026 MOU",
    };
  }
  if (isUnitedStates) {
    return {
      summary: "National Network: 102 in width · Interstate: 80,000 lb gross",
      detail: "Federal Interstate axle limits are 20,000 lb single and 34,000 lb tandem; height and off-network rules are state-specific.",
      rulesUrl: US_FEDERAL_SOURCE,
      rulesLabel: "FHWA limits",
      permitUrl: US_PERMIT_SOURCE,
      permitLabel: "State permits",
    };
  }
  return {
    summary: "Verify local size, axle, gross-weight, and permit rules",
    detail: "No maintained rule set is available for this jurisdiction.",
    rulesUrl: "",
    rulesLabel: "",
    permitUrl: "",
    permitLabel: "",
  };
}

export const TRUCK_COMPLIANCE_SOURCES = {
  canadaDimensions: CANADA_BASELINE_SOURCE,
  canada2026: CANADA_2026_SOURCE,
  usFederal: US_FEDERAL_SOURCE,
  usPermits: US_PERMIT_SOURCE,
};
