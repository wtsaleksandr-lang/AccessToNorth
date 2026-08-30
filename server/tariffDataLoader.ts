import type { PoolClient } from "pg";
import * as fs from "node:fs";
import * as path from "node:path";
import Papa from "papaparse";
import { COUNTRY_TREATMENTS, TREATMENT_COLUMNS } from "./tariffCountryTreatments";

type TariffRow = {
  code: string;
  digits: string;
  description: string;
  unitOfMeasure: string | null;
  dutyRates: Record<string, string>;
};

type TariffCsvRecord = Record<string, string | undefined>;

export type TariffImportRecord = {
  code: string;
  description: string;
  descriptionFull: string;
  chapter: string;
  unitOfMeasure: string | null;
  dutyRates: Record<string, string>;
};

function uniqueDescriptions(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase().replace(/[:.]$/, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findAncestorRows(row: TariffRow, byDigits: Map<string, TariffRow>) {
  const ancestors: TariffRow[] = [];
  for (let length = 2; length <= row.digits.length; length += 1) {
    const ancestor = byDigits.get(row.digits.slice(0, length));
    if (ancestor) ancestors.push(ancestor);
  }
  return ancestors;
}

function nearestDutyRates(row: TariffRow, byDigits: Map<string, TariffRow>) {
  if (row.dutyRates.MFN) return row.dutyRates;
  for (let length = row.digits.length - 1; length >= 2; length -= 1) {
    const candidate = byDigits.get(row.digits.slice(0, length));
    if (candidate?.dutyRates.MFN) return candidate.dutyRates;
  }
  return row.dutyRates;
}

/** Parse the official tariff CSV, including descriptions that contain quoted newlines. */
export function buildTariffImportRecords(csvContent: string): TariffImportRecord[] {
  const parsed = Papa.parse<TariffCsvRecord>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    const first = parsed.errors[0];
    throw new Error(`Could not parse tariff CSV at row ${first.row ?? "unknown"}: ${first.message}`);
  }

  const rows: TariffRow[] = [];
  const byDigits = new Map<string, TariffRow>();
  for (const record of parsed.data) {
    const code = record.TARIFF?.trim() || "";
    if (!/^[\d.]+$/.test(code)) continue;
    const digits = code.replace(/\D/g, "");
    const description = [record.DESC1, record.DESC2, record.DESC3]
      .find((value) => value?.trim())?.trim() || "";
    if (!digits || !description) continue;

    const dutyRates: Record<string, string> = {};
    for (const treatment of TREATMENT_COLUMNS) {
      const value = record[treatment]?.trim();
      if (value) dutyRates[treatment] = value;
    }
    const row: TariffRow = {
      code,
      digits,
      description,
      unitOfMeasure: record.UOM?.trim() || null,
      dutyRates,
    };
    rows.push(row);
    byDigits.set(digits, row);
  }

  const records: TariffImportRecord[] = [];
  for (const row of rows) {
    if (row.digits.length !== 8 && row.digits.length !== 10) continue;
    const dutyRates = nearestDutyRates(row, byDigits);
    if (!dutyRates.MFN) continue;
    const ancestors = findAncestorRows(row, byDigits);
    const reversedAncestors = [...ancestors].reverse();
    records.push({
      code: row.code,
      description: row.description,
      descriptionFull: uniqueDescriptions(ancestors.map((ancestor) => ancestor.description)).join(" — ") || row.description,
      chapter: row.digits.slice(0, 2),
      unitOfMeasure: row.unitOfMeasure || reversedAncestors.find((ancestor) => ancestor.unitOfMeasure)?.unitOfMeasure || null,
      dutyRates,
    });
  }
  return records;
}

async function insertBatch(client: PoolClient, values: unknown[][]) {
  const placeholders: string[] = [];
  const flatValues: unknown[] = [];
  let paramIndex = 1;
  for (const row of values) {
    placeholders.push(
      `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`,
    );
    flatValues.push(...row);
    paramIndex += 6;
  }
  await client.query(
    `INSERT INTO hs_codes (code, description, description_full, chapter, unit_of_measure, duty_rates)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (code) DO UPDATE SET
       description = EXCLUDED.description,
       description_full = EXCLUDED.description_full,
       chapter = EXCLUDED.chapter,
       unit_of_measure = EXCLUDED.unit_of_measure,
       duty_rates = EXCLUDED.duty_rates`,
    flatValues,
  );
}

export async function loadTariffData(client: PoolClient, csvPath = path.join(process.cwd(), "tariff_data", "tphs.csv")) {
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const importRows = buildTariffImportRecords(csvContent);
  const chapters = [...new Set(importRows.map((row) => row.chapter))].sort();

  await client.query("BEGIN");
  try {
    await client.query("DELETE FROM hs_codes");
    await client.query("DELETE FROM hs_code_categories");
    await client.query("DELETE FROM tariff_countries");

    const batch: unknown[][] = [];
    for (const row of importRows) {
      batch.push([
        row.code,
        row.description,
        row.descriptionFull,
        row.chapter,
        row.unitOfMeasure,
        JSON.stringify(row.dutyRates),
      ]);
      if (batch.length >= 500) {
        await insertBatch(client, batch);
        batch.length = 0;
      }
    }
    if (batch.length) await insertBatch(client, batch);

    for (const chapter of chapters) {
      await client.query(
        `INSERT INTO hs_code_categories (chapter, description) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [chapter, `Chapter ${chapter}`],
      );
    }
    for (const [country, treatments] of Object.entries(COUNTRY_TREATMENTS)) {
      await client.query(
        `INSERT INTO tariff_countries (name, treatments) VALUES ($1, $2)`,
        [country, treatments],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  const count = await client.query("SELECT COUNT(*)::int AS count FROM hs_codes");
  return Number(count.rows[0]?.count || 0);
}
