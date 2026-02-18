import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const TARIFF_TREATMENTS: Record<string, string> = {
  MFN: "Most Favoured Nation",
  AUT: "Australia Tariff",
  NZT: "New Zealand Tariff",
  CCCT: "Commonwealth Caribbean Countries Tariff",
  LDCT: "Least Developed Country Tariff",
  GPT: "General Preferential Tariff",
  UST: "United States Tariff (CUSMA)",
  MXT: "Mexico Tariff (CUSMA)",
  CIAT: "Canada-Israel Agreement Tariff",
  CT: "Chile Tariff",
  CRT: "Costa Rica Tariff",
  IT: "Iceland Tariff",
  NT: "Norway Tariff",
  SLT: "Switzerland-Liechtenstein Tariff",
  PT: "Peru Tariff",
  COLT: "Colombia Tariff",
  JT: "Jordan Tariff",
  PAT: "Panama Tariff",
  HNT: "Honduras Tariff",
  KRT: "Korea Tariff",
  CEUT: "Canada-European Union Tariff (CETA)",
  CPTPT: "Comprehensive and Progressive Trans-Pacific Partnership Tariff",
  UKT: "Canada-United Kingdom Tariff (CUKTCA)",
  UAT: "Canada-Ukraine Tariff",
  "General Tariff": "General Tariff",
};

const COUNTRY_TREATMENTS: Record<string, string[]> = {
  "United States": ["MFN", "UST"],
  "Mexico": ["MFN", "MXT"],
  "China": ["MFN", "GPT"],
  "India": ["MFN", "GPT"],
  "Japan": ["MFN", "CPTPT"],
  "Germany": ["MFN", "CEUT"],
  "France": ["MFN", "CEUT"],
  "Italy": ["MFN", "CEUT"],
  "Spain": ["MFN", "CEUT"],
  "Netherlands": ["MFN", "CEUT"],
  "Belgium": ["MFN", "CEUT"],
  "Austria": ["MFN", "CEUT"],
  "Portugal": ["MFN", "CEUT"],
  "Ireland": ["MFN", "CEUT"],
  "Poland": ["MFN", "CEUT"],
  "Czech Republic": ["MFN", "CEUT"],
  "Romania": ["MFN", "CEUT"],
  "Sweden": ["MFN", "CEUT"],
  "Denmark": ["MFN", "CEUT"],
  "Finland": ["MFN", "CEUT"],
  "Greece": ["MFN", "CEUT"],
  "Hungary": ["MFN", "CEUT"],
  "Bulgaria": ["MFN", "CEUT"],
  "Croatia": ["MFN", "CEUT"],
  "Slovakia": ["MFN", "CEUT"],
  "Slovenia": ["MFN", "CEUT"],
  "Lithuania": ["MFN", "CEUT"],
  "Latvia": ["MFN", "CEUT"],
  "Estonia": ["MFN", "CEUT"],
  "Cyprus": ["MFN", "CEUT"],
  "Luxembourg": ["MFN", "CEUT"],
  "Malta": ["MFN", "CEUT"],
  "United Kingdom": ["MFN", "UKT"],
  "Australia": ["MFN", "AUT"],
  "New Zealand": ["MFN", "NZT"],
  "South Korea": ["MFN", "KRT"],
  "Vietnam": ["MFN", "CPTPT"],
  "Malaysia": ["MFN", "CPTPT"],
  "Singapore": ["MFN", "CPTPT"],
  "Brunei": ["MFN", "CPTPT"],
  "Peru": ["MFN", "PT", "CPTPT"],
  "Chile": ["MFN", "CT", "CPTPT"],
  "Israel": ["MFN", "CIAT"],
  "Colombia": ["MFN", "COLT"],
  "Costa Rica": ["MFN", "CRT"],
  "Panama": ["MFN", "PAT"],
  "Honduras": ["MFN", "HNT"],
  "Jordan": ["MFN", "JT"],
  "Iceland": ["MFN", "IT"],
  "Norway": ["MFN", "NT"],
  "Switzerland": ["MFN", "SLT"],
  "Liechtenstein": ["MFN", "SLT"],
  "Ukraine": ["MFN", "UAT"],
  "Taiwan": ["MFN"],
  "Brazil": ["MFN"],
  "Indonesia": ["MFN", "GPT"],
  "Thailand": ["MFN", "GPT"],
  "Philippines": ["MFN", "GPT"],
  "Turkey": ["MFN"],
  "South Africa": ["MFN", "GPT"],
  "Nigeria": ["MFN", "GPT"],
  "Egypt": ["MFN", "GPT"],
  "Pakistan": ["MFN", "GPT", "LDCT"],
  "Bangladesh": ["MFN", "GPT", "LDCT"],
  "Cambodia": ["MFN", "GPT", "LDCT"],
  "Ethiopia": ["MFN", "GPT", "LDCT"],
  "Myanmar": ["MFN", "GPT", "LDCT"],
  "Tanzania": ["MFN", "GPT", "LDCT"],
  "Haiti": ["MFN", "GPT", "LDCT", "CCCT"],
  "Jamaica": ["MFN", "CCCT"],
  "Trinidad and Tobago": ["MFN", "CCCT"],
  "Barbados": ["MFN", "CCCT"],
  "Guyana": ["MFN", "CCCT"],
  "Belize": ["MFN", "CCCT"],
  "Bahamas": ["MFN", "CCCT"],
  "Antigua and Barbuda": ["MFN", "CCCT"],
  "Dominica": ["MFN", "CCCT"],
  "Grenada": ["MFN", "CCCT"],
  "Saint Lucia": ["MFN", "CCCT"],
  "Saint Vincent and the Grenadines": ["MFN", "CCCT"],
  "Saint Kitts and Nevis": ["MFN", "CCCT"],
  "Argentina": ["MFN"],
  "Russia": ["MFN"],
  "Saudi Arabia": ["MFN"],
  "United Arab Emirates": ["MFN"],
  "Morocco": ["MFN", "GPT"],
  "Sri Lanka": ["MFN", "GPT"],
  "Kenya": ["MFN", "GPT"],
  "Ghana": ["MFN", "GPT"],
  "Other / Unknown": ["MFN"],
};

const PROVINCIAL_TAXES: Record<string, { name: string; rate: number; type: string }> = {
  AB: { name: "Alberta", rate: 0, type: "GST" },
  BC: { name: "British Columbia", rate: 0.07, type: "GST+PST" },
  MB: { name: "Manitoba", rate: 0.07, type: "GST+PST" },
  NB: { name: "New Brunswick", rate: 0.10, type: "HST" },
  NL: { name: "Newfoundland and Labrador", rate: 0.10, type: "HST" },
  NS: { name: "Nova Scotia", rate: 0.10, type: "HST" },
  NT: { name: "Northwest Territories", rate: 0, type: "GST" },
  NU: { name: "Nunavut", rate: 0, type: "GST" },
  ON: { name: "Ontario", rate: 0.08, type: "HST" },
  PE: { name: "Prince Edward Island", rate: 0.10, type: "HST" },
  QC: { name: "Quebec", rate: 0.09975, type: "GST+QST" },
  SK: { name: "Saskatchewan", rate: 0.06, type: "GST+PST" },
  YT: { name: "Yukon", rate: 0, type: "GST" },
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function loadTariffData() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("Reading CSV data...");
    const csvPath = path.join(process.cwd(), "tariff_data", "tphs.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");
    const headers = parseCSVLine(lines[0]);

    console.log(`Found ${lines.length - 1} rows`);

    await pool.query("DELETE FROM hs_codes");
    await pool.query("DELETE FROM hs_code_categories");
    await pool.query("DELETE FROM tariff_countries");

    const treatmentCols = [
      "MFN", "AUT", "NZT", "CCCT", "LDCT", "GPT", "UST", "MXT",
      "CIAT", "CT", "CRT", "IT", "NT", "SLT", "PT", "COLT", "JT",
      "PAT", "HNT", "KRT", "CEUT", "CPTPT", "UKT", "UAT", "General Tariff",
    ];

    const chapterDescriptions: Record<string, string> = {};
    const insertedCodes = new Set<string>();
    let insertCount = 0;

    console.log("Parsing and inserting HS codes...");

    const batchValues: any[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCSVLine(line);
      const tariff = fields[0]?.trim() || "";
      const desc1 = fields[4]?.trim() || "";
      const desc2 = fields[5]?.trim() || "";
      const desc3 = fields[6]?.trim() || "";
      const uom = fields[8]?.trim() || "";
      const mfn = fields[9]?.trim() || "";

      if (tariff.length <= 7 && desc1) {
        const chapter = tariff.replace(/\./g, "").substring(0, 2);
        chapterDescriptions[chapter] = desc1;
        continue;
      }

      if (tariff.length !== 10 || !mfn) continue;
      if (insertedCodes.has(tariff)) continue;
      insertedCodes.add(tariff);

      const chapter = tariff.substring(0, 2);
      const fullDesc = [desc1, desc2, desc3].filter(Boolean).join(" - ");

      const dutyRates: Record<string, string> = {};
      for (const col of treatmentCols) {
        const idx = headers.indexOf(col);
        if (idx >= 0 && fields[idx]?.trim()) {
          dutyRates[col] = fields[idx].trim();
        }
      }

      batchValues.push([tariff, desc1, fullDesc || desc1, chapter, uom || null, JSON.stringify(dutyRates)]);
      insertCount++;

      if (batchValues.length >= 500) {
        await insertBatch(pool, batchValues);
        batchValues.length = 0;
        process.stdout.write(`  Inserted ${insertCount} codes...\r`);
      }
    }

    if (batchValues.length > 0) {
      await insertBatch(pool, batchValues);
    }
    console.log(`\nInserted ${insertCount} HS codes`);

    console.log("Inserting chapter categories...");
    for (const [chapter, desc] of Object.entries(chapterDescriptions)) {
      await pool.query(
        `INSERT INTO hs_code_categories (chapter, description) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [chapter, desc]
      );
    }
    console.log(`Inserted ${Object.keys(chapterDescriptions).length} chapter categories`);

    console.log("Inserting country-treatment mappings...");
    for (const [country, treatments] of Object.entries(COUNTRY_TREATMENTS)) {
      await pool.query(
        `INSERT INTO tariff_countries (name, treatments) VALUES ($1, $2)`,
        [country, treatments]
      );
    }
    console.log(`Inserted ${Object.keys(COUNTRY_TREATMENTS).length} countries`);

    const count = await pool.query("SELECT COUNT(*) FROM hs_codes");
    console.log(`\nVerification: ${count.rows[0].count} HS codes in database`);

    console.log("Creating search index...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_hs_codes_code ON hs_codes (code);
      CREATE INDEX IF NOT EXISTS idx_hs_codes_chapter ON hs_codes (chapter);
      CREATE INDEX IF NOT EXISTS idx_hs_codes_description_trgm ON hs_codes USING gin (description gin_trgm_ops);
    `).catch(() => {
      pool.query(`CREATE INDEX IF NOT EXISTS idx_hs_codes_code ON hs_codes (code)`);
      pool.query(`CREATE INDEX IF NOT EXISTS idx_hs_codes_chapter ON hs_codes (chapter)`);
      console.log("Note: trigram index not available, using basic indexes");
    });

    console.log("Done! Tariff data loaded successfully.");
  } catch (err) {
    console.error("Error loading tariff data:", err);
    throw err;
  } finally {
    await pool.end();
  }
}

async function insertBatch(pool: Pool, values: any[][]) {
  const placeholders: string[] = [];
  const flatValues: any[] = [];
  let paramIndex = 1;

  for (const row of values) {
    placeholders.push(
      `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`
    );
    flatValues.push(...row);
    paramIndex += 6;
  }

  await pool.query(
    `INSERT INTO hs_codes (code, description, description_full, chapter, unit_of_measure, duty_rates)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (code) DO NOTHING`,
    flatValues
  );
}

loadTariffData();
