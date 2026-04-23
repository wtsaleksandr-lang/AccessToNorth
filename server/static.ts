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
