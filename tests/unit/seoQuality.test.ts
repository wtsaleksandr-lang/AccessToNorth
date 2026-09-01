import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { ROUTES, SITE_URL } from "../../script/routeMetadata";
import { getPublishedPosts, POSTS } from "../../client/src/data/blog/posts";

const root = process.cwd();
const sourceRoot = join(root, "client", "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".tsx", ".ts"].includes(extname(path)) ? [path] : [];
  });
}

function appRoutePatterns(): string[] {
  const app = readFileSync(join(sourceRoot, "App.tsx"), "utf8");
  return [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
}

function matchesRoute(path: string, pattern: string): boolean {
  const pathParts = path.replace(/\/+$/, "").split("/").filter(Boolean);
  const patternParts = pattern.replace(/\/+$/, "").split("/").filter(Boolean);
  return pathParts.length === patternParts.length && patternParts.every((part, index) =>
    part.startsWith(":") || part === pathParts[index],
  );
}

test("all literal internal links resolve to an application route", () => {
  const patterns = appRoutePatterns();
  const broken: string[] = [];

  for (const file of sourceFiles(sourceRoot)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:href|to)="(\/[^"]*)"/g)) {
      const path = match[1].split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
      if (path.startsWith("//") || path.includes("${")) continue;
      if (!patterns.some((pattern) => matchesRoute(path, pattern))) {
        broken.push(`${relative(root, file)} -> ${match[1]}`);
      }
    }
  }

  assert.deepEqual(broken, [], `Broken internal links:\n${broken.join("\n")}`);
});

test("every JSX image has alternative text", () => {
  const missing: string[] = [];
  for (const file of sourceFiles(sourceRoot).filter((path) => extname(path) === ".tsx")) {
    const source = readFileSync(file, "utf8");
    for (const image of source.matchAll(/<img\b[\s\S]*?>/g)) {
      if (!/\balt\s*=/.test(image[0])) missing.push(relative(root, file));
    }
  }
  assert.deepEqual([...new Set(missing)], [], `Images missing alt text: ${missing.join(", ")}`);
});

test("indexable routes have unique canonical metadata and sitemap coverage", () => {
  const indexable = ROUTES.filter((route) => route.sitemap !== false);
  assert.equal(new Set(indexable.map((route) => route.path)).size, indexable.length, "duplicate sitemap path");
  assert.equal(new Set(indexable.map((route) => route.title)).size, indexable.length, "duplicate page title");
  for (const route of indexable) {
    assert(route.path.startsWith("/"), `invalid route path: ${route.path}`);
    assert(route.title.trim().length >= 20, `title is too thin: ${route.path}`);
    assert(route.description.trim().length >= 70, `description is too thin: ${route.path}`);
    assert(!route.title.includes("www.accesstonorth.com"), `conflicting www title: ${route.path}`);
  }
  assert.equal(SITE_URL, "https://accesstonorth.com");
});

test("published posts are discoverable and related-post references are valid", () => {
  const allSlugs = new Set(POSTS.map((post) => post.slug));
  const publishedPaths = new Set(getPublishedPosts().map((post) => `/blog/${post.slug}`));
  const routePaths = new Set(ROUTES.map((route) => route.path));
  for (const path of publishedPaths) assert(routePaths.has(path), `published post missing from routes: ${path}`);

  const invalidRelated = POSTS.flatMap((post) =>
    (post.relatedPosts ?? [])
      .filter((slug) => !allSlugs.has(slug))
      .map((slug) => `${post.slug} -> ${slug}`),
  );
  assert.deepEqual(invalidRelated, [], `Invalid related posts:\n${invalidRelated.join("\n")}`);
});

test("priority regulatory articles expose current primary sources", () => {
  const prioritySlugs = [
    "voluntary-vs-mandatory-gst-hst",
    "customs-valuation-methods",
    "sima-duty-2026-cases",
    "amps-penalties-canada",
  ];

  for (const slug of prioritySlugs) {
    const post = POSTS.find((candidate) => candidate.slug === slug);
    assert(post, `missing priority article: ${slug}`);
    assert(post.updatedDate, `missing review date: ${slug}`);
    assert((post.sources?.length ?? 0) >= 2, `missing primary sources: ${slug}`);
    for (const source of post.sources ?? []) {
      assert(source.href.startsWith("https://"), `insecure source URL: ${slug}`);
      assert(
        ["canada.ca", "cbsa-asfc.gc.ca"].some((domain) => new URL(source.href).hostname.endsWith(domain)),
        `non-primary source domain: ${slug} -> ${source.href}`,
      );
    }
  }
});

test("major public calculators expose WebApplication schema", () => {
  const calculators = [
    "/tools/hs-code-finder",
    "/customs-calculator",
    "/carm-security-calculator",
    "/tools/pallet-builder",
    "/tools/container-calculator",
    "/tools/truck-load-planner",
  ];
  for (const path of calculators) {
    assert.equal(ROUTES.find((route) => route.path === path)?.schemaType, "WebApplication", path);
  }
});
