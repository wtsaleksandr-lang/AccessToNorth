import assert from "node:assert/strict";
import test from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { buildTariffImportRecords } from "../../server/tariffDataLoader";

test("official tariff CSV produces complete searchable classifications", () => {
  const csv = fs.readFileSync(path.join(process.cwd(), "tariff_data", "tphs.csv"), "utf8");
  const records = buildTariffImportRecords(csv);
  assert.ok(records.length > 18_000);

  const cottonPullover = records.find((record) => record.code === "6110.20.00.11");
  assert.ok(cottonPullover);
  assert.match(cottonPullover.descriptionFull, /Jerseys, pullovers, cardigans/i);
  assert.match(cottonPullover.descriptionFull, /Of cotton/i);
  assert.equal(cottonPullover.dutyRates.MFN, "18 %");
  assert.equal(cottonPullover.unitOfMeasure, "NMB");
});
