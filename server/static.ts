import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

const INDEXNOW_KEY = "594c4ba0a45b102189a47cff194f3fd7";

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
      "/order",
      "/onboarding",
      "/canadian-customs-clearance/checkout",
    ];
    if (privatePrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }

    next();
  });

  // Serve the verification key explicitly so it remains available even when
  // a hosting platform omits uncommon static file extensions from a deploy.
  app.get(`/${INDEXNOW_KEY}.txt`, (_req: Request, res: Response) => {
    res.type("text/plain").send(INDEXNOW_KEY);
  });

  app.use(express.static(distPath, { index: "index.html" }));

  // SPA fallthrough — prefer a prerendered per-route index.html if one
  // exists (built by script/prerender.ts). Unknown URLs receive a real 404
  // while still rendering the branded client-side NotFound page.
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
    // Tokenized onboarding links are valid dynamic SPA routes and must retain
    // a 200 response. They are already protected with X-Robots-Tag above.
    if (req.path.startsWith("/onboarding/")) {
      return res.sendFile(path.resolve(distPath, "index.html"));
    }

    res.status(404).sendFile(path.resolve(distPath, "index.html"));
  });
}
