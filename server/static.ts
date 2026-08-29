import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use((req: Request, res: Response, next) => {
    const normalizedPath = req.path.replace(/\/+$/, "") || "/";
    if (normalizedPath === "/resources/customs-clearance-under-2500") {
      return res.redirect(301, "https://accesstonorth.com/resources/customs-clearance-under-3300/");
    }

    const host = req.hostname.toLowerCase();
    if (host === "www.accesstonorth.com") {
      return res.redirect(308, `https://accesstonorth.com${req.originalUrl}`);
    }

    const privatePrefixes = [
      "/admin",
      "/portal",
      "/checkout",
      "/complete-order",
      "/payment-success",
      "/payment-cancel",
      "/order-confirmation",
      "/onboarding",
      "/canadian-customs-clearance/checkout",
    ];
    if (privatePrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }

    next();
  });

  app.use(express.static(distPath, { index: "index.html" }));

  // SPA fallthrough — prefer a prerendered per-route index.html if one
  // exists (built by script/prerender.ts); otherwise fall back to the
  // root shell.
  app.use("/{*path}", (req: Request, res: Response) => {
    const urlPath = req.path.replace(/^\/+/, "").replace(/\/+$/, "");
    if (urlPath) {
      const routeIndex = path.resolve(distPath, urlPath, "index.html");
      // Guard against path traversal — the resolved path must stay inside distPath.
      if (
        routeIndex.startsWith(distPath + path.sep) &&
        fs.existsSync(routeIndex)
      ) {
        return res.sendFile(routeIndex);
      }
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
