/**
 * Blog hero-image generator. Produces 1200×630 SVG per post using the post's
 * category palette + a keyword-selected icon motif. Zero external deps.
 *
 * Replacement strategy for future image tooling (Socialsync-style):
 *   - Replace pickMotif() with a stock-photo API (Pexels/Unsplash) keyed on tags
 *   - Replace renderSvg() with a real image compositor (sharp + satori)
 *   - Output JPG/PNG to same paths — the BlogIndex/BlogPost heroUrl fallback
 *     to `/blog/<slug>.svg` handles both formats via an extension swap.
 */
import { writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { POSTS } from "../client/src/data/blog/posts";
import { CATEGORIES } from "../client/src/data/blog/categories";
import type { BlogPost } from "../client/src/data/blog/types";

const W = 1200;
const H = 630;

// Lightweight SVG icons — paths are in a 48-unit viewBox. Render them at
// whatever size + color you want inside the hero.
const ICONS: Record<string, string> = {
  globe:
    "M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4zm0 2c2 2 4 7 4 18s-2 16-4 18c-2-2-4-7-4-18s2-16 4-18zm-6 2c-1 3-2 9-2 16s1 13 2 16c-6-2-10-9-10-16s4-14 10-16zm12 0c6 2 10 9 10 16s-4 14-10 16c1-3 2-9 2-16s-1-13-2-16zM6 22h36M6 26h36",
  maple:
    "M24 4 21 12l-8-2 3 8-8 3 8 3-3 8 8-2 3 8 3-8 8 2-3-8 8-3-8-3 3-8-8 2z",
  container:
    "M4 14h40v20H4zM8 14v20M16 14v20M24 14v20M32 14v20M40 14v20M4 34h40l2 4H2z",
  ship:
    "M8 30l4 10h24l4-10M12 30V18h24v12M16 18V12h16v6M4 40h40",
  document:
    "M12 4h18l10 10v30H12zM30 4v10h10M16 22h16M16 28h16M16 34h10",
  shield:
    "M24 4 8 10v12c0 10 7 18 16 22 9-4 16-12 16-22V10z",
  chart:
    "M4 40h40M8 36V20M16 36V12M24 36V24M32 36V16M40 36V8",
  box:
    "M24 4 4 14v20l20 10 20-10V14zM4 14l20 10 20-10M24 24v20",
  calculator:
    "M10 4h28v40H10zM14 10h20v8H14zM14 22h4v4h-4zM22 22h4v4h-4zM30 22h4v4h-4zM14 30h4v4h-4zM22 30h4v4h-4zM30 30h4v10h-4zM14 38h12v4H14z",
  calendar:
    "M8 10h32v32H8zM8 18h32M16 4v10M32 4v10M14 24h4v4h-4zM22 24h4v4h-4zM30 24h4v4h-4zM14 32h4v4h-4zM22 32h4v4h-4z",
};

type MotifKey = keyof typeof ICONS;

/** Pick a motif based on the post's tags + category. Order matters. */
function pickMotif(post: BlogPost): MotifKey {
  const all = [...post.tags, post.category, post.title.toLowerCase()].join(" ");
  const tests: Array<[MotifKey, RegExp]> = [
    ["ship", /ship|freight|fcl|lcl|container load/i],
    ["container", /container|fba|warehous|3pl/i],
    ["calculator", /calculator|duty|valuation|tariff rate|landed cost/i],
    ["calendar", /year-end|deadline|checklist|schedule|filing/i],
    ["shield", /sima|amps|audit|penalty|compliance/i],
    ["document", /certificate|origin|permit|cusma|declaration|b13|hs code|classification/i],
    ["globe", /non-resident|international|us seller|cross-border|canada us|ecommerce|shopify|amazon/i],
    ["maple", /registration|gst|hst|business number|carm|cra|cbsa/i],
    ["chart", /threshold|cost|comparison|rpp|bond/i],
    ["box", /import|export/i],
  ];
  for (const [motif, re] of tests) {
    if (re.test(all)) return motif;
  }
  return "maple";
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last.length > maxCharsPerLine - 1) {
      lines[maxLines - 1] = last.slice(0, maxCharsPerLine - 1) + "…";
    }
  }
  return lines;
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSvg(post: BlogPost): string {
  const cat = CATEGORIES[post.category];
  const motif = pickMotif(post);
  const iconPath = ICONS[motif];
  const gradId = `g-${post.slug}`;
  const titleLines = wrapText(post.title, 38, 3);

  // Vertical centering math
  const lineHeight = 60;
  const titleBlockHeight = titleLines.length * lineHeight;
  const titleStartY = 310 - titleBlockHeight / 2 + lineHeight;

  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleStartY + i * lineHeight;
      return `<text x="80" y="${y}" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="54" font-weight="800" letter-spacing="-1.5">${escape(line)}</text>`;
    })
    .join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${cat.accent.from}" />
      <stop offset="100%" stop-color="${cat.accent.to}" />
    </linearGradient>
    <pattern id="p-${post.slug}" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M30 0l-2.5 5 2.5 5 2.5-5-2.5-5zm0 15l-5 10 5 10 5-10-5-10z" fill="#FFFFFF" fill-opacity="0.03" />
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${gradId})" />
  <rect width="${W}" height="${H}" fill="url(#p-${post.slug})" />

  <!-- Motif decoration (large, soft) -->
  <g transform="translate(880 170) scale(9)" fill="none" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="${iconPath}" />
  </g>

  <!-- Category label -->
  <text x="80" y="110" fill="#FFFFFF" fill-opacity="0.85" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="4" text-transform="uppercase">${escape(cat.name.toUpperCase())}</text>

  <!-- Title -->
  ${titleTspans}

  <!-- Footer: branding + date -->
  <line x1="80" y1="520" x2="1120" y2="520" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1" />
  <text x="80" y="565" fill="#FFFFFF" fill-opacity="0.9" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700">AccessToNorth.com</text>
  <text x="1120" y="565" text-anchor="end" fill="#FFFFFF" fill-opacity="0.7" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="500">${escape(new Date(post.publishDate).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }))}</text>
</svg>
`;
}

export async function generateBlogImages(outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });
  for (const post of POSTS) {
    const svg = renderSvg(post);
    await writeFile(resolve(outDir, `${post.slug}.svg`), svg, "utf8");
  }
  console.log(`Generated ${POSTS.length} blog hero SVGs in ${outDir}`);
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
  generateBlogImages(resolve(process.cwd(), "client", "public", "blog")).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
