import express from "express";
import { readFileSync } from "fs";
import { pool } from "./db/pool";
import { redis } from "./redis/client";
import { rateLimiter } from "./middleware/rateLimiter";
import { authRouter } from "./routes/auth";
import { secretsRouter } from "./routes/secrets";

function readSecret(name: string): string {
  try {
    return readFileSync(`/run/secrets/${name}`, "utf8").trim();
  } catch {
    const envVal = process.env[name.toUpperCase()];
    if (!envVal) throw new Error(`Secret ${name} not found`);
    return envVal;
  }
}

export const JWT_SECRET = readSecret("jwt_secret");

const app = express();
const PORT = parseInt(process.env.API_PORT || "3000", 10);

app.use(express.json());
app.use(rateLimiter);

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    await redis.ping();
    res.json({ status: "ok", uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: "degraded", error: String(err) });
  }
});

app.use("/auth", authRouter);
app.use("/secrets", secretsRouter);

app.listen(PORT, () => {
  console.log(`api listening on port ${PORT}`);
});
