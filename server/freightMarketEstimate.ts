import type {
  FreightEstimateRequest,
  FreightMarketEstimate,
  FreightMarketEstimateResponse,
} from "@shared/freight";
import { summarizeFreightCargo } from "@shared/freight";

const FREIGHTOS_ENDPOINT = "https://ship.freightos.com/api/shippingCalculator";
export const FREIGHTOS_ATTRIBUTION_URL = "https://www.freightos.com/freight-resources/freight-rate-calculator-free-tool/";

const SERVICE_OPTIONS: Record<FreightEstimateRequest["service"], { loadType: string; mode: string }> = {
  lcl: { loadType: "pallets", mode: "LCL" },
  fcl20: { loadType: "container20", mode: "FCL" },
  fcl40: { loadType: "container40", mode: "FCL" },
  fcl40hc: { loadType: "container40HC", mode: "FCL" },
  fcl45hc: { loadType: "container45HC", mode: "FCL" },
  air: { loadType: "pallets", mode: "air" },
  ltl: { loadType: "pallets", mode: "LTL" },
  ftl: { loadType: "pallets", mode: "FTL" },
  express: { loadType: "boxes", mode: "express" },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

function nested(record: Record<string, unknown> | null, ...keys: string[]): unknown {
  let value: unknown = record;
  for (const key of keys) {
    const current = asRecord(value);
    if (!current) return undefined;
    value = current[key];
  }
  return value;
}

export function buildFreightosEstimateUrl(input: FreightEstimateRequest) {
  const cargo = summarizeFreightCargo(input.cargoLines);
  const option = SERVICE_OPTIONS[input.service];
  const isContainer = input.service.startsWith("fcl");
  const search = new URLSearchParams({
    estimate: "true",
    format: "json",
    resultSet: "cheapestEachMode",
    rFQType: "NETWORK",
    currency: "USD",
    origin: input.origin,
    destination: input.destination,
    loadtype: option.loadType,
    mode: option.mode,
    quantity: String(isContainer ? input.equipmentQuantity : 1),
    weight: `${cargo.weightKg.toFixed(2)}kg`,
    volume: `${cargo.volumeCbm.toFixed(3)}cbm`,
  });
  return `${FREIGHTOS_ENDPOINT}?${search.toString()}`;
}

export function parseFreightosEstimate(payload: unknown): FreightMarketEstimate[] {
  const root = asRecord(payload);
  const estimated = asRecord(nested(root, "response", "estimatedFreightRates"));
  const rawModes = estimated?.mode;
  const modes = Array.isArray(rawModes) ? rawModes : rawModes ? [rawModes] : [];

  return modes.flatMap((value) => {
    const mode = asRecord(value);
    const priceMin = finiteNumber(nested(mode, "price", "min", "moneyAmount", "amount"));
    const priceMax = finiteNumber(nested(mode, "price", "max", "moneyAmount", "amount"));
    const currency = nested(mode, "price", "min", "moneyAmount", "currency");
    if (priceMin === null || priceMax === null || typeof currency !== "string") return [];
    const transitMin = finiteNumber(nested(mode, "transitTimes", "min"));
    const transitMax = finiteNumber(nested(mode, "transitTimes", "max"));
    return [{
      mode: typeof mode?.mode === "string" ? mode.mode : "Freight",
      priceMin,
      priceMax,
      currency,
      transitMinDays: transitMin,
      transitMaxDays: transitMax,
    }];
  });
}

export async function fetchFreightMarketEstimate(
  input: FreightEstimateRequest,
  fetchImplementation: typeof fetch = fetch,
): Promise<FreightMarketEstimateResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetchImplementation(buildFreightosEstimateUrl(input), {
      headers: { Accept: "application/json", "User-Agent": "AccessToNorth-rate-estimator/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Freightos returned ${response.status}`);
    const estimates = parseFreightosEstimate(await response.json());
    if (!estimates.length) throw new Error("No market estimate was available for this route and service");
    return {
      source: "Freightos",
      estimates,
      retrievedAt: new Date().toISOString(),
      cached: false,
      attributionUrl: FREIGHTOS_ATTRIBUTION_URL,
      disclaimer: "Indicative market range only. Carrier availability, pickup/delivery, duties, taxes, insurance, accessorials, and special handling may change the final price.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
