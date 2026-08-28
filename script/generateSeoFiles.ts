import { writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { ROUTES, DISALLOW, SITE_URL, canonicalUrl } from "./routeMetadata";

export async function generateSeoFiles(outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });

  const sitemapRoutes = ROUTES.filter((r) => r.sitemap !== false);

  const urls = sitemapRoutes
    .map((r) => {
      const changefreq = r.changefreq ?? "monthly";
      const lastmod = r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : "";
      return `  <url>
    <loc>${canonicalUrl(r.path)}</loc>${lastmod}
    <changefreq>${changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`;
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  const robots = `User-agent: *
${DISALLOW.map((p) => `Disallow: ${p}`).join("\n")}
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  await writeFile(resolve(outDir, "sitemap.xml"), sitemap, "utf8");
  await writeFile(resolve(outDir, "robots.txt"), robots, "utf8");
  console.log(
    `SEO files written to ${outDir}: sitemap.xml (${sitemapRoutes.length} urls), robots.txt`,
  );
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
  generateSeoFiles(resolve(process.cwd(), "client", "public")).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
