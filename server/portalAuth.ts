import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for portal authentication");
}
const TOKEN_EXPIRY = "24h";
const COOKIE_NAME = "portal_token";

export interface PortalTokenPayload {
  orderId: string;
  email: string;
}

export function signPortalToken(payload: PortalTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyPortalToken(token: string): PortalTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as PortalTokenPayload;
  } catch {
    return null;
  }
}

export function setPortalCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function portalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const payload = verifyPortalToken(token);
  if (!payload) {
    res.status(401).json({ message: "Invalid or expired session" });
    return;
  }

  (req as any).portalUser = payload;
  next();
}
