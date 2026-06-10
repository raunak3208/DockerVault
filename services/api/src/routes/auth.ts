import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool";
import { JWT_SECRET } from "../index";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id",
      [username, hash]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "username taken" });
    }
    res.status(500).json({ error: "internal error" });
  }
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  try {
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "invalid credentials" });
    }
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  } catch {
    res.status(500).json({ error: "internal error" });
  }
});
