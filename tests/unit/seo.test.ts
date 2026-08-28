import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { canonicalUrl } from "../../shared/seo";
import { ROUTES } from "../../script/routeMetadata";
import { generateSeoFiles } from "../../script/generateSeoFiles";
import { prerender } from "../../script/prerender";

test("canonical URLs use the live non-www origin and trailing slash", () => {
  assert.equal(canonicalUrl("/"), "https://accesstonorth.com/");
  assert.equal(
    canonicalUrl("https://www.accesstonorth.com/resources/how-to-import-into-canada"),
    "https://accesstonorth.com/resources/how-to-import-into-canada/",
  );
});

test("public SEO route registry is unique and excludes obsolete URLs", () => {
  const paths = ROUTES.map((route) => route.path);
  assert.equal(new Set(paths).size, paths.length);
  assert(paths.includes("/resources/customs-clearance-under-3300"));
  assert(!paths.includes("/resources/customs-clearance-under-2500"));
  assert(paths.includes("/security"));
  assert(paths.includes("/canadian-customs-clearance"));
});

test("generated sitemap uses canonical URLs and omits coming-soon tools", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "atn-seo-"));
  try {
    await generateSeoFiles(outDir);
    const sitemap = await readFile(join(outDir, "sitemap.xml"), "utf8");
    const robots = await readFile(join(outDir, "robots.txt"), "utf8");

    assert(!sitemap.includes("https://www.accesstonorth.com"));
    assert(sitemap.includes("https://accesstonorth.com/resources/how-to-import-into-canada/"));
    assert(sitemap.includes("https://accesstonorth.com/resources/customs-clearance-under-3300/"));
    assert(!sitemap.includes("/tools/freight-quote/"));
    assert(!sitemap.includes("/tools/shipment-tracking/"));
    assert(robots.includes("Sitemap: https://accesstonorth.com/sitemap.xml"));
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("prerender emits crawl-visible article and application metadata", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "atn-prerender-"));
  try {
    await writeFile(
      join(outDir, "index.html"),
      '<!doctype html><html><head><title>Default</title><meta name="description" content="Default"><meta property="og:title" content="Default"><meta property="og:description" content="Default"><meta property="og:type" content="website"><meta property="og:url" content="https://example.com"><meta property="og:image" content="https://example.com/og.png"><meta name="twitter:title" content="Default"><meta name="twitter:description" content="Default"><meta name="twitter:image" content="https://example.com/og.png"><meta name="robots" content="index"><link rel="canonical" href="https://example.com"><link rel="alternate" hreflang="fr-CA" href="https://example.com"></head><body><div id="root"></div></body></html>',
      "utf8",
    );

    await prerender(outDir);
    const article = await readFile(
      join(outDir, "resources", "how-to-import-into-canada", "index.html"),
      "utf8",
    );
    const calculator = await readFile(
      join(outDir, "tools", "container-calculator", "index.html"),
      "utf8",
    );

    assert(article.includes('<link rel="canonical" href="https://accesstonorth.com/resources/how-to-import-into-canada/">'));
    assert(article.includes('<meta property="og:type" content="article">'));
    assert(article.includes('"@type":"Article"'));
    assert(!article.includes("hreflang"));
    assert(calculator.includes('"@type":"WebApplication"'));
    assert(calculator.includes('"price":"0"'));
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("favicon PNG is a 512px square matching the brand asset slot", async () => {
  const png = await readFile("client/public/favicon.png");
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 512);
});
