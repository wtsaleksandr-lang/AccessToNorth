import assert from "node:assert/strict";
import test from "node:test";
import { evaluateOpenDeckEnvelope, getTruckJurisdictionGuidance } from "../../shared/truckCompliance";

test("loaded open-deck height includes deck height", () => {
  const result = evaluateOpenDeckEnvelope({
    trailerCategory: "Flatbed",
    trailerWidthIn: 102,
    deckHeightIn: 60,
    cargoWidthIn: 96,
    cargoHeightIn: 110,
  });
  assert.equal(result.loadedHeightIn, 170);
  assert.equal(result.screeningWarnings.length, 1);
  assert.match(result.screeningWarnings[0], /including the deck/);
});

test("enclosed trailers do not infer road height from internal cargo height", () => {
  const result = evaluateOpenDeckEnvelope({
    trailerCategory: "Dry Van",
    trailerWidthIn: 100.5,
    cargoWidthIn: 96,
    cargoHeightIn: 108,
  });
  assert.equal(result.isOpenDeck, false);
  assert.deepEqual(result.screeningWarnings, []);
});

test("overwidth open-deck cargo triggers permit screening", () => {
  const result = evaluateOpenDeckEnvelope({
    trailerCategory: "Step Deck",
    trailerWidthIn: 102,
    deckHeightIn: 48,
    cargoWidthIn: 120,
    cargoHeightIn: 80,
  });
  assert.ok(result.screeningWarnings.some((warning) => warning.includes("Loaded width")));
});

test("jurisdiction guidance links to official Canadian and US sources", () => {
  const ontario = getTruckJurisdictionGuidance({ code: "ON", country: "Canada" });
  const newYork = getTruckJurisdictionGuidance({ code: "NY", country: "United States" });
  assert.match(ontario.permitUrl, /ontario\.ca/);
  assert.match(ontario.summary, /2\.6 m/);
  assert.match(newYork.rulesUrl, /fhwa\.dot\.gov/);
  assert.match(newYork.summary, /80,000 lb/);
});
