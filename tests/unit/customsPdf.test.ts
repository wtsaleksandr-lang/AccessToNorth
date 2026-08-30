import assert from "node:assert/strict";
import test from "node:test";
import { generateCustomsEstimatePdfBlob } from "../../client/src/lib/customsPdf";

test("customs estimate report renders a branded valid PDF", async () => {
  const blob = await generateCustomsEstimatePdfBlob({
    title: "Canadian Customs Estimate",
    items: [{
      hsCode: "6110.20.00.11",
      description: "Cotton pullovers — men's or boys'",
      countryOfOrigin: "China",
      valueCAD: 10_000,
      quantity: 100,
      dutyRate: "18 %",
      dutyAmount: 1_800,
      gstAmount: 590,
      provincialTaxAmount: 0,
      totalForItem: 12_390,
    }],
    summary: {
      totalValue: 10_000,
      totalDuty: 1_800,
      totalGST: 590,
      totalProvincialTax: 0,
      totalDutiesAndTaxes: 2_390,
      totalLandedCost: 12_390,
      provinceName: "Ontario",
      shipmentType: "commercial",
    },
    tariffTreatment: "Most Favoured Nation (MFN)",
  });
  const signature = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
  assert.equal(signature, "%PDF-");
  assert.ok(blob.size > 1_500);
});
