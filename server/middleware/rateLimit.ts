import type { Request, Response, NextFunction } from "express";

interface Bucket {
  hits: number;
  resetAt: number;
}

interface LimiterOptions {
  /** Max successful hits per window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Message returned when the limit is exceeded. */
  message?: string;
}

/**
 * Simple in-memory IP-based rate limiter for authentication endpoints.
 * Resets a bucket once the window elapses. Good enough for throttling
 * brute-force login attempts on a single-instance deployment.
 *
 * For horizontally-scaled deployments replace the Map with a shared
 * store (Redis, Postgres row per IP, etc.).
 */
export function createRateLimiter(options: LimiterOptions) {
  const buckets = new Map<string, Bucket>();
  const { max, windowMs } = options;
  const message = options.message ?? "Too many requests. Please try again later.";

  // Opportunistically prune expired buckets to keep memory bounded.
  const prune = (now: number) => {
    if (buckets.size < 1024) return;
    buckets.forEach((bucket, ip) => {
      if (bucket.resetAt <= now) buckets.delete(ip);
    });
  };

  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const bucket = buckets.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(ip, { hits: 1, resetAt: now + windowMs });
      prune(now);
      return next();
    }

    if (bucket.hits >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({ message });
      return;
    }

    bucket.hits += 1;
    next();
  };
}

/** Strict limiter for login endpoints — 10 attempts / 15 min / IP. */
export const loginRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts. Please try again in 15 minutes.",
});
