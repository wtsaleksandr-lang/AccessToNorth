import { Pool } from "pg";
import { loadTariffData } from "../server/tariffDataLoader";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log("Loading the current Canadian tariff dataset transactionally...");
    const count = await loadTariffData(client);
    console.log(`Tariff data ready: ${count.toLocaleString()} searchable classifications.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Tariff data import failed; the previous dataset was preserved.", error);
  process.exitCode = 1;
});
