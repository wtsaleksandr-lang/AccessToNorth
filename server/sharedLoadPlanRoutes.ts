import type { Express } from "express";
import crypto from "crypto";
import { pool } from "./db";
import { createSharedLoadPlanSchema } from "@shared/loadPlanShare";

const SHARE_LIFETIME_DAYS = 180;
const MAX_CREATES_PER_HOUR = 20;
const createAttempts = new Map<string, number[]>();
let ensureTablePromise: Promise<unknown> | null = null;

function ensureSharedPlansTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS shared_load_plans (
        token text PRIMARY KEY,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_shared_load_plans_expires_at
        ON shared_load_plans (expires_at);
    `).catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }
  return ensureTablePromise;
}

function shareRateAllowed(ip: string) {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1_000;
  const current = (createAttempts.get(ip) || []).filter((stamp) => stamp >= cutoff);
  if (current.length >= MAX_CREATES_PER_HOUR) {
    createAttempts.set(ip, current);
    return false;
  }
  current.push(now);
  createAttempts.set(ip, current);
  return true;
}

export function registerSharedLoadPlanRoutes(app: Express) {
  app.post("/api/shared-load-plans", async (req, res) => {
    if (!shareRateAllowed(req.ip || "unknown")) {
      return res.status(429).json({ message: "Share-link limit reached. Please try again later." });
    }

    const parsed = createSharedLoadPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message || "Invalid loading plan.",
      });
    }

    try {
      await ensureSharedPlansTable();
      const token = crypto.randomBytes(9).toString("base64url");
      const expiresAt = new Date(Date.now() + SHARE_LIFETIME_DAYS * 24 * 60 * 60 * 1_000);
      await pool.query(
        `INSERT INTO shared_load_plans (token, payload, expires_at) VALUES ($1, $2::jsonb, $3)`,
        [token, JSON.stringify(parsed.data), expiresAt],
      );
      return res.status(201).json({
        token,
        url: `${req.protocol}://${req.get("host")}/share/load-plan/${token}`,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("Shared loading plan creation failed:", error);
      return res.status(500).json({ message: "Could not create the share link." });
    }
  });

  app.get("/api/shared-load-plans/:token", async (req, res) => {
    if (!/^[A-Za-z0-9_-]{12}$/.test(req.params.token)) {
      return res.status(404).json({ message: "Shared loading plan not found." });
    }

    try {
      await ensureSharedPlansTable();
      const result = await pool.query(
        `SELECT payload, created_at, expires_at
           FROM shared_load_plans
          WHERE token = $1 AND expires_at > now()
          LIMIT 1`,
        [req.params.token],
      );
      if (!result.rows[0]) {
        return res.status(404).json({ message: "This loading-plan link is invalid or has expired." });
      }
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      return res.json({
        ...result.rows[0].payload,
        token: req.params.token,
        createdAt: result.rows[0].created_at,
        expiresAt: result.rows[0].expires_at,
      });
    } catch (error) {
      console.error("Shared loading plan lookup failed:", error);
      return res.status(500).json({ message: "Could not open the shared loading plan." });
    }
  });
}

