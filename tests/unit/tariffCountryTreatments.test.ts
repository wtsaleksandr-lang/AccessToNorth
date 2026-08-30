import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_TREATMENTS } from "../../server/tariffCountryTreatments";

test("2026 tariff treatment defaults avoid withdrawn or ineligible preferences", () => {
  assert.deepEqual(COUNTRY_TREATMENTS.China, ["MFN"]);
  assert.deepEqual(COUNTRY_TREATMENTS.India, ["MFN"]);
  assert.deepEqual(COUNTRY_TREATMENTS.Pakistan, ["MFN", "GPT"]);
  assert.deepEqual(COUNTRY_TREATMENTS.Haiti, ["MFN", "GPT", "LDCT"]);
  assert.deepEqual(COUNTRY_TREATMENTS.Russia, ["General Tariff"]);
  assert.ok(Object.keys(COUNTRY_TREATMENTS).length > 90);
});
