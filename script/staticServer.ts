/**
 * Minimal static file server used for running Playwright tests against
 * the built client without standing up the full Express + DB + Stripe
 * stack. Serves `dist/public` with SPA fallthrough:
 *
 *   /foo/bar        → dist/public/foo/bar/index.html   (if prerendered)
 *                   → dist/public/index.html           (fallthrough)
 *
 * API calls under /api/* are rejected with 503 so tests can distinguish
 * "backend not wired" from "client crashed".
 */
import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { resolve, extname } from "path";

const ROOT = resolve(process.cwd(), "dist", "public");
const PORT = Number(process.env.PORT || 5000);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function tryServe(filePath: string): Promise<Buffer | null> {
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return null;
  } catch {
    return null;
  }
  return readFile(filePath);
}

const server = createServer(async (req, res) => {
  const url = req.url || "/";
  const path = url.split("?")[0];

  // Reject API calls explicitly so tests know the backend is absent.
  if (path.startsWith("/api/")) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Backend not available in static-serve mode" }));
    return;
  }

  // 1. Exact file hit (assets, favicon, robots.txt, sitemap.xml, /index.html).
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "");
  const directPath = resolve(ROOT, clean);
  if (directPath.startsWith(ROOT) && extname(directPath)) {
    const buf = await tryServe(directPath);
    if (buf) {
      const mime = MIME[extname(directPath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mime });
      res.end(buf);
      return;
    }
  }

  // 2. Prerendered per-route HTML — dist/public/<route>/index.html
  if (clean) {
    const routeIndex = resolve(ROOT, clean, "index.html");
    if (routeIndex.startsWith(ROOT)) {
      const buf = await tryServe(routeIndex);
      if (buf) {
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(buf);
        return;
      }
    }
  }

  // 3. SPA fallthrough
  const buf = await tryServe(resolve(ROOT, "index.html"));
  if (!buf) {
    res.writeHead(500);
    res.end("dist/public/index.html not found. Did you run vite build?");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[".html"] });
  res.end(buf);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Static server ready: http://127.0.0.1:${PORT} (root=${ROOT})`);
});
