import { writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { getPublishedPosts } from "../client/src/data/blog/posts";
import { CATEGORIES } from "../client/src/data/blog/categories";
import { SITE_URL, canonicalUrl } from "../shared/seo";

const SITE = SITE_URL;

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export async function generateRss(outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });

  const posts = getPublishedPosts().sort((a, b) =>
    a.publishDate < b.publishDate ? 1 : -1,
  );

  const items = posts
    .map((post) => {
      const cat = CATEGORIES[post.category];
      const url = canonicalUrl(`/blog/${post.slug}`);
      const pubDate = new Date(`${post.publishDate}T09:00:00-04:00`).toUTCString();
      const description = `${post.intro}\n\nKey takeaways:\n${post.keyTakeaways.map((k) => `- ${k}`).join("\n")}`;

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@accesstonorth.com (${escapeXml(post.author.name)})</author>
      <category>${escapeXml(cat.name)}</category>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AccessToNorth Blog — Canadian Trade &amp; Tax Insights</title>
    <link>${canonicalUrl("/blog")}</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Weekly guides on Canadian GST/HST, CARM, customs clearance, and import compliance.</description>
    <language>en-CA</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  await writeFile(resolve(outDir, "rss.xml"), rss, "utf8");
  console.log(`RSS feed written to ${outDir}/rss.xml (${posts.length} posts)`);
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
  generateRss(resolve(process.cwd(), "client", "public")).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
