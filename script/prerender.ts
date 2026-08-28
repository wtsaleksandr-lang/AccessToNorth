import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  BRAND_ICON,
  ROUTES,
  SITE_URL,
  canonicalUrl,
  type RouteMeta,
} from "./routeMetadata";

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

function buildPrimaryJsonLd(route: RouteMeta): string {
  const url = canonicalUrl(route.path);
  const base = {
    "@context": "https://schema.org",
    "@id": `${url}#primary`,
    url,
    name: route.title,
    description: route.description,
    inLanguage: "en-CA",
  };

  const data = route.schemaType === "WebApplication"
    ? {
        ...base,
        "@type": "WebApplication",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CAD",
        },
        provider: {
          "@type": "Organization",
          name: "AccessToNorth.com",
          url: `${SITE_URL}/`,
        },
      }
    : route.schemaType === "Article" || route.schemaType === "BlogPosting"
      ? {
          ...base,
          "@type": route.schemaType,
          headline: route.title,
          image: [route.ogImage ?? `${SITE_URL}/og-image.png`],
          datePublished: route.datePublished,
          dateModified: route.dateModified ?? route.datePublished,
          author: {
            "@type": "Organization",
            name: "AccessToNorth Trade Compliance Team",
            url: `${SITE_URL}/about/`,
          },
          publisher: {
            "@type": "Organization",
            name: "AccessToNorth.com",
            logo: { "@type": "ImageObject", url: BRAND_ICON },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        }
      : {
          ...base,
          "@type": "WebPage",
          isPartOf: {
            "@type": "WebSite",
            name: "AccessToNorth.com",
            url: `${SITE_URL}/`,
          },
        };

  return `<script type="application/ld+json" data-prerender="primary">${escapeJsonForScriptTag(data)}</script>`;
}

function injectMetaForRoute(html: string, route: RouteMeta): string {
  const canonical = canonicalUrl(route.path);
  const og = route.ogImage ?? `${SITE_URL}/og-image.png`;
  const ogType = route.schemaType === "Article" || route.schemaType === "BlogPosting"
    ? "article"
    : "website";

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
      pattern: /<meta property="og:type"[^>]*>/i,
      replacement: `<meta property="og:type" content="${ogType}">`,
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

  // 5. Remove invalid same-URL multilingual alternates. The site currently
  // changes language client-side and does not have distinct French URLs.
  out = out.replace(/\s*<link rel="alternate" hreflang="[^"]+"[^>]*>/gi, "");

  // 6. Explicit public-page crawl directives and route-specific JSON-LD.
  const robotsTag = '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">';
  if (/<meta name="robots"[^>]*>/i.test(out)) {
    out = out.replace(/<meta name="robots"[^>]*>/i, robotsTag);
  } else {
    extraTags.push(robotsTag);
  }
  extraTags.push(buildPrimaryJsonLd(route));

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
