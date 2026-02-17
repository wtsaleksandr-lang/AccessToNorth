import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}

const TOKEN_EXPIRY = "12h";
const COOKIE_NAME = "admin_token";

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function signAdminToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET!, { expiresIn: TOKEN_EXPIRY });
}

export function setAdminCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
    const payload = jwt.verify(token, JWT_SECRET!) as { role: string };
    if (payload.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
