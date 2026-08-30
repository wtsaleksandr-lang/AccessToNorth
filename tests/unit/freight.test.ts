import assert from "node:assert/strict";
import test from "node:test";
import { freightEstimateRequestSchema, freightQuoteSchema, normalizeAccessToNorthId, summarizeFreightCargo } from "../../shared/freight";
import { buildFreightosEstimateUrl, parseFreightosEstimate } from "../../server/freightMarketEstimate";

const validRequest = {
  mode: "ocean",
  direction: "import",
  serviceLevel: "standard",
  origin: "Shanghai, China",
  destination: "Toronto, Ontario, Canada",
  readyDate: "2026-09-15",
  incoterm: "FOB",
  commodity: "Consumer goods",
  cargoLines: [{
    id: "cargo-1",
    description: "Export pallets",
    packaging: "pallets",
    quantity: 7,
    length: 48,
    width: 48,
    height: 61,
    dimensionUnit: "in",
    totalWeight: 5260,
    weightUnit: "kg",
  }],
  stackable: false,
  hazardous: false,
  temperatureControlled: false,
  temperatureC: null,
  notes: "",
  contactName: "Alex Example",
  companyName: "Example Importer",
  email: "alex@example.com",
  phone: "",
  consent: true,
};

test("accepts a complete structured freight quote request", () => {
  const result = freightQuoteSchema.parse(validRequest);
  assert.equal(result.cargoLines[0].quantity, 7);
  assert.equal(result.consent, true);
});

test("rejects empty dimensions and missing review consent", () => {
  assert.equal(freightQuoteSchema.safeParse({ ...validRequest, consent: false }).success, false);
  assert.equal(freightQuoteSchema.safeParse({
    ...validRequest,
    cargoLines: [{ ...validRequest.cargoLines[0], length: 0 }],
  }).success, false);
});

test("summarizes mixed freight units in kilograms and cubic metres", () => {
  const parsed = freightQuoteSchema.parse(validRequest);
  const summary = summarizeFreightCargo(parsed.cargoLines);
  assert.equal(summary.packages, 7);
  assert.equal(summary.weightKg, 5260);
  assert.ok(summary.volumeCbm > 16.1 && summary.volumeCbm < 16.2);
});

test("normalizes AccessToNorth references", () => {
  assert.equal(normalizeAccessToNorthId(" rfq-ab12cd "), "RFQ-AB12CD");
});

test("builds a server-side Freightos LCL request from aggregate cargo", () => {
  const input = freightEstimateRequestSchema.parse({
    mode: "ocean",
    origin: validRequest.origin,
    destination: validRequest.destination,
    service: "lcl",
    equipmentQuantity: 1,
    cargoLines: validRequest.cargoLines,
    hazardous: false,
    temperatureControlled: false,
  });
  const url = new URL(buildFreightosEstimateUrl(input));
  assert.equal(url.hostname, "ship.freightos.com");
  assert.equal(url.searchParams.get("mode"), "LCL");
  assert.equal(url.searchParams.get("loadtype"), "pallets");
  assert.equal(url.searchParams.get("weight"), "5260.00kg");
  assert.match(url.searchParams.get("volume") || "", /^16\.1\d{2}cbm$/);
});

test("parses Freightos price and transit ranges defensively", () => {
  const estimates = parseFreightosEstimate({
    response: {
      estimatedFreightRates: {
        mode: {
          mode: "LCL",
          price: {
            min: { moneyAmount: { amount: "1400", currency: "USD" } },
            max: { moneyAmount: { amount: 1850, currency: "USD" } },
          },
          transitTimes: { min: "23", max: 31, unit: "days" },
        },
      },
    },
  });
  assert.deepEqual(estimates, [{
    mode: "LCL",
    priceMin: 1400,
    priceMax: 1850,
    currency: "USD",
    transitMinDays: 23,
    transitMaxDays: 31,
  }]);
});

test("rejects specialized cargo and mismatched estimate services", () => {
  const baseEstimate = {
    mode: "ocean",
    origin: validRequest.origin,
    destination: validRequest.destination,
    service: "lcl",
    equipmentQuantity: 1,
    cargoLines: validRequest.cargoLines,
    hazardous: false,
    temperatureControlled: false,
  };
  assert.equal(freightEstimateRequestSchema.safeParse({ ...baseEstimate, hazardous: true }).success, false);
  assert.equal(freightEstimateRequestSchema.safeParse({ ...baseEstimate, service: "air" }).success, false);
});
