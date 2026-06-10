import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, AuthRequest } from "../middleware/auth";

export const secretsRouter = Router();
secretsRouter.use(authenticate);

secretsRouter.get("/", async (req: AuthRequest, res) => {
  const result = await pool.query(
    "SELECT id, name, ttl_days, expires_at, created_at FROM secrets WHERE user_id = $1 ORDER BY created_at DESC",
    [req.userId]
  );
  res.json(result.rows);
});

secretsRouter.post("/", async (req: AuthRequest, res) => {
  const { name, value, ttl_days } = req.body;
  if (!name || !value) {
    return res.status(400).json({ error: "name and value required" });
  }
  const ttl = parseInt(ttl_days, 10) || parseInt(process.env.SECRET_DEFAULT_TTL_DAYS || "30", 10);
  try {
    const result = await pool.query(
      `INSERT INTO secrets (user_id, name, value, ttl_days, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + ($4 || ' days')::INTERVAL)
       RETURNING id, name, expires_at`,
      [req.userId, name, value, ttl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "secret name already exists" });
    }
    res.status(500).json({ error: "internal error" });
  }
});

secretsRouter.get("/:id", async (req: AuthRequest, res) => {
  const result = await pool.query(
    "SELECT id, name, value, ttl_days, expires_at FROM secrets WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "not found" });
  res.json(result.rows[0]);
});

secretsRouter.delete("/:id", async (req: AuthRequest, res) => {
  const result = await pool.query(
    "DELETE FROM secrets WHERE id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, req.userId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "not found" });
  res.status(204).send();
});
