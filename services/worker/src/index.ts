import { Pool } from "pg";
import { readFileSync } from "fs";

function getDbPassword(): string {
  try {
    return readFileSync("/run/secrets/db_password", "utf8").trim();
  } catch {
    return process.env.DB_PASSWORD || "";
  }
}

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: 5432,
  database: process.env.POSTGRES_DB || "dockervault",
  user: process.env.POSTGRES_USER || "vault_user",
  password: getDbPassword(),
});

async function purgeExpiredSecrets(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "DELETE FROM secrets WHERE expires_at < NOW() RETURNING id"
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log(`purged ${result.rowCount} expired secret(s)`);
    }
  } catch (err) {
    console.error("purge failed", err);
  } finally {
    client.release();
  }
}

const INTERVAL_MS = 60 * 1000;

console.log("worker started, purge interval:", INTERVAL_MS / 1000, "seconds");
purgeExpiredSecrets();
setInterval(purgeExpiredSecrets, INTERVAL_MS);
