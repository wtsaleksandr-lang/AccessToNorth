import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ROUTES, SITE_URL, type RouteMeta } from "./routeMetadata";

/**
 * Zero-dep "meta-shell" prerender.
 *
 * For each public route, copy the built index.html and inject per-route
 * <title>, <meta description>, canonical, Open Graph, Twitter card, and
 * a WebPage JSON-LD block. The body stays the same React SPA bundle —
 * content hydrates client-side as before.
 *
 * Why this and not full SSR? Full React SSR requires running the React
 * tree at build time with working route data, which is fragile for a SPA
 * that uses useEffect-driven meta, lazy routes, framer-motion, and
 * third-party scripts. The meta-shell approach gives Googlebot the
 * things it reads on first paint (title, description, canonical, OG,
 * JSON-LD) without touching the client runtime.
 *
 * Upgrade path: replace with vite-react-ssg or react-snap when ready.
 */

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeJsonForScriptTag(obj: unknown): string {
  // JSON-LD inside an inline <script> must not contain a literal "</script>".
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

function buildWebPageJsonLd(route: RouteMeta): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: `${SITE_URL}${route.path}`,
    name: route.title,
    description: route.description,
    inLanguage: "en-CA",
    isPartOf: {
      "@type": "WebSite",
      name: "AccessToNorth.com",
      url: SITE_URL,
    },
  };
  return `<script type="application/ld+json" data-prerender="webpage">${escapeJsonForScriptTag(data)}</script>`;
}

function injectMetaForRoute(html: string, route: RouteMeta): string {
  const canonical = `${SITE_URL}${route.path}`;
  const og = route.ogImage ?? `${SITE_URL}/og-image.png`;

  // 1. Replace the <title>
  let out = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeAttr(route.title)}</title>`,
  );

  // 2. Replace or insert <meta name="description">
  if (/<meta name="description"[^>]*>/i.test(out)) {
    out = out.replace(
      /<meta name="description"[^>]*>/i,
      `<meta name="description" content="${escapeAttr(route.description)}">`,
    );
  }

  // 3. Replace or insert the OG + Twitter + canonical tags that matter per-route.
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    {
      pattern: /<meta property="og:title"[^>]*>/i,
      replacement: `<meta property="og:title" content="${escapeAttr(route.title)}">`,
    },
    {
      pattern: /<meta property="og:description"[^>]*>/i,
      replacement: `<meta property="og:description" content="${escapeAttr(route.description)}">`,
    },
    {
      pattern: /<meta property="og:url"[^>]*>/i,
      replacement: `<meta property="og:url" content="${canonical}">`,
    },
    {
      pattern: /<meta property="og:image"[^>]*>/i,
      replacement: `<meta property="og:image" content="${og}">`,
    },
    {
      pattern: /<meta name="twitter:title"[^>]*>/i,
      replacement: `<meta name="twitter:title" content="${escapeAttr(route.title)}">`,
    },
    {
      pattern: /<meta name="twitter:description"[^>]*>/i,
      replacement: `<meta name="twitter:description" content="${escapeAttr(route.description)}">`,
    },
    {
      pattern: /<meta name="twitter:image"[^>]*>/i,
      replacement: `<meta name="twitter:image" content="${og}">`,
    },
  ];

  const extraTags: string[] = [];
  for (const { pattern, replacement } of replacements) {
    if (pattern.test(out)) {
      out = out.replace(pattern, replacement);
    } else {
      extraTags.push(replacement);
    }
  }

  // 4. Canonical link — replace or inject
  const canonicalTag = `<link rel="canonical" href="${canonical}">`;
  if (/<link rel="canonical"[^>]*>/i.test(out)) {
    out = out.replace(/<link rel="canonical"[^>]*>/i, canonicalTag);
  } else {
    extraTags.push(canonicalTag);
  }

  // 5. WebPage JSON-LD for this URL
  extraTags.push(buildWebPageJsonLd(route));

  // Inject any missing tags right before </head>
  if (extraTags.length > 0) {
    out = out.replace(/<\/head>/i, `${extraTags.join("\n    ")}\n  </head>`);
  }

  return out;
}

export async function prerender(distDir: string): Promise<void> {
  const indexPath = resolve(distDir, "index.html");
  const template = await readFile(indexPath, "utf8");

  let count = 0;
  for (const route of ROUTES) {
    const html = injectMetaForRoute(template, route);
    const outPath =
      route.path === "/"
        ? resolve(distDir, "index.html")
        : resolve(distDir, route.path.replace(/^\//, ""), "index.html");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, "utf8");
    count++;
  }

  console.log(`Prerendered ${count} route HTML shells into ${distDir}`);
}

function isEntryPoint(metaUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return resolve(fileURLToPath(metaUrl)) === resolve(entry);
  } catch {
    return false;
  }
}

if (isEntryPoint(import.meta.url)) {
  const distDir = resolve(process.cwd(), "dist", "public");
  prerender(distDir).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
