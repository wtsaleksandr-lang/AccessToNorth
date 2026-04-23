import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { resolve } from "path";
import { generateSeoFiles } from "./generateSeoFiles";
import { prerender } from "./prerender";
import { generateRss } from "./generateRss";
import { generateBlogImages } from "./generateBlogImages";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  // Generate blog hero images (SVG) before the build so Vite picks them up.
  console.log("generating blog hero images...");
  await generateBlogImages(resolve(process.cwd(), "client", "public", "blog"));

  // Generate sitemap.xml + robots.txt + rss.xml into client/public so Vite
  // includes them in the production bundle. Keep in sync with the wouter route table.
  console.log("generating SEO files...");
  await generateSeoFiles(resolve(process.cwd(), "client", "public"));
  await generateRss(resolve(process.cwd(), "client", "public"));

  console.log("building client...");
  await viteBuild();

  // Prerender per-route HTML shells with baked-in meta tags, canonical
  // URLs, OG/Twitter cards, and WebPage JSON-LD. Crawlers see route-specific
  // metadata on first paint; hydration works exactly as before.
  console.log("prerendering route HTML shells...");
  await prerender(resolve(process.cwd(), "dist", "public"));

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
