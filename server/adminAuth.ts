import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const LEGACY_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LEGACY_ADMIN_PASSWORD_HASH = LEGACY_ADMIN_PASSWORD
  ? createHash("sha256").update(LEGACY_ADMIN_PASSWORD).digest()
  : null;

// Require a legacy password OR expect operators to create a user via
// script/createAdminUser. In practice at least one should be set before deploy.
if (!LEGACY_ADMIN_PASSWORD) {
  console.warn(
    "[adminAuth] ADMIN_PASSWORD not set — only per-user logins against the admin_users table will succeed.",
  );
}

const TOKEN_EXPIRY = "12h";
const COOKIE_NAME = "admin_token";

export interface AdminTokenPayload {
  role: "admin";
  userId?: number;
  email?: string;
}

export interface AdminAuthResult {
  userId?: number;
  email?: string;
}

/**
 * Verify credentials against:
 *   1. The admin_users table (bcrypt), if a row matches the email and is active.
 *   2. A legacy ADMIN_PASSWORD env var as a fallback — so existing single-password
 *      deployments keep working until per-user accounts are seeded.
 */
export async function verifyAdminCredentials(
  email: string | undefined,
  password: string,
): Promise<AdminAuthResult | null> {
  const trimmedEmail = email?.trim().toLowerCase();

  if (trimmedEmail) {
    const user = await storage.getAdminUserByEmail(trimmedEmail);
    if (user) {
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      await storage.touchAdminUserLogin(user.id);
      return { userId: user.id, email: user.email };
    }
    // If the email doesn't match a DB user, we still allow the legacy-password
    // fallback below. That preserves single-admin deployments where the
    // operator types any email (or none) and supplies the shared password.
  }

  if (LEGACY_ADMIN_PASSWORD_HASH) {
    const candidate = createHash("sha256").update(password).digest();
    if (timingSafeEqual(candidate, LEGACY_ADMIN_PASSWORD_HASH)) {
      return {}; // legacy shared-password session — no user id
    }
  }

  return null;
}

export function signAdminToken(result: AdminAuthResult): string {
  const payload: AdminTokenPayload = {
    role: "admin",
    userId: result.userId,
    email: result.email,
  };
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: TOKEN_EXPIRY });
}

export function setAdminCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  });
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as AdminTokenPayload;
    if (payload.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    (req as any).adminUser = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
