import type { Request, Response, NextFunction } from "express";

/**
 * Baseline security headers — a minimal in-house equivalent of `helmet`,
 * tuned for this app's third-party surface:
 *   - Stripe.js  (checkout redirect)
 *   - Tawk.to    (live chat embed)
 *   - Google Fonts (Inter / Poppins / Playfair)
 *
 * Adjust the CSP carefully if you add new third-party scripts.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Only set HSTS in production — local dev is plain http.
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self 'https://checkout.stripe.com')"
  );
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // A permissive CSP that still blocks inline evaluation (`unsafe-eval`).
  // We must allow `unsafe-inline` for style because Tailwind + shadcn emit
  // runtime inline styles, and Tawk.to injects inline script tags.
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://embed.tawk.to",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://embed.tawk.to",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://embed.tawk.to https://*.tawk.to",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://*.tawk.to wss://*.tawk.to",
    "frame-src https://js.stripe.com https://checkout.stripe.com https://*.tawk.to",
    "form-action 'self' https://checkout.stripe.com",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  next();
}
