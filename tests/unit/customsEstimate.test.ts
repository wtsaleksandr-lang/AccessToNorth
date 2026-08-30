import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBorderTaxes,
  calculateCarmSecurity,
  calculateDutyAmount,
} from "../../shared/customsEstimate";

test("commercial imports include federal tax but not provincial HST at the border", () => {
  const result = calculateBorderTaxes({
    valueCAD: 10_000,
    dutyAmount: 1_000,
    province: "ON",
    shipmentType: "commercial",
  });
  assert.equal(result.gstAmount, 550);
  assert.equal(result.provincialTaxAmount, 0);
  assert.equal(result.gstRate, 0.05);
  assert.match(result.warnings[0], /Provincial tax is not included/i);
});

test("personal imports apply current Ontario and Nova Scotia HST rates", () => {
  const ontario = calculateBorderTaxes({ valueCAD: 1_000, dutyAmount: 0, province: "ON", shipmentType: "personal" });
  const novaScotia = calculateBorderTaxes({ valueCAD: 1_000, dutyAmount: 0, province: "NS", shipmentType: "personal" });
  assert.equal(ontario.gstAmount, 130);
  assert.equal(novaScotia.gstAmount, 140);
});

test("Quebec QST uses the pre-GST base and warns that collection depends on the import stream", () => {
  const quebec = calculateBorderTaxes({ valueCAD: 1_000, dutyAmount: 100, province: "QC", shipmentType: "personal" });
  assert.equal(quebec.gstAmount, 55);
  assert.ok(Math.abs(quebec.provincialTaxAmount - 109.725) < 0.000_001);
  assert.match(quebec.warnings[0], /planning/i);
});

test("CARM written security has the BN15 minimum but cash remains exactly 100 percent", () => {
  const small = calculateCarmSecurity(1_000);
  assert.equal(small.writtenSecurity, 5_000);
  assert.equal(small.cashSecurity, 1_000);
  assert.equal(small.minimumApplied, true);

  const large = calculateCarmSecurity(20_050);
  assert.equal(large.writtenSecurity, 10_100);
  assert.equal(large.cashSecurity, 20_050);

  const capped = calculateCarmSecurity(25_000_000);
  assert.equal(capped.writtenSecurity, 10_000_000);
  assert.equal(capped.cashSecurity, 25_000_000);
  assert.equal(capped.maximumApplied, true);
});

test("duty calculator handles percentage, specific and simple compound rates", () => {
  assert.equal(calculateDutyAmount("18 %", 2_000, 0).duty, 360);
  assert.equal(calculateDutyAmount("$1.52/kg", 2_000, 100, "KGM").duty, 152);
  assert.equal(calculateDutyAmount("$15.90/tonne plus 7 %", 2_000, 1_000, "KGM").duty, 155.9);
  assert.equal(calculateDutyAmount("5 % but not less than $1.25/kg", 1_000, 100, "KGM").duty, 125);
});

test("specific rates require a compatible quantity", () => {
  const result = calculateDutyAmount("$1.52/kg", 2_000, 0, "KGM");
  assert.equal(result.requiresManualReview, true);
  assert.match(result.warnings[0], /Quantity is required/i);
});
