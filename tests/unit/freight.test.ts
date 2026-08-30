import assert from "node:assert/strict";
import test from "node:test";
import { freightQuoteSchema, normalizeAccessToNorthId, summarizeFreightCargo } from "../../shared/freight";

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
