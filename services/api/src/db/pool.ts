import { Pool } from "pg";
import { readFileSync } from "fs";

function getDbPassword(): string {
  try {
    return readFileSync("/run/secrets/db_password", "utf8").trim();
  } catch {
    return process.env.DB_PASSWORD || "";
  }
}

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: 5432,
  database: process.env.POSTGRES_DB || "dockervault",
  user: process.env.POSTGRES_USER || "vault_user",
  password: getDbPassword(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("postgres pool error", err.message);
});
