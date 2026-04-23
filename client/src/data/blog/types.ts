/**
 * Blog data types. The registry in `./posts.ts` is the single source of truth
 * for every post on the site — the blog index, sitemap, RSS feed, and
 * per-post pages all read from it.
 *
 * To add a post:
 *   1. Add a new object to POSTS in ./posts.ts
 *   2. Set publishDate — posts with future dates are hidden automatically
 *   3. Rebuild (npm run build) — sitemap + RSS will auto-include it
 */

export type BlogCategory =
  | "registration-tax"
  | "carm-imports"
  | "hs-classification"
  | "compliance-duties"
  | "ecommerce-non-resident"
  | "advanced"
  | "seasonal";

export interface BlogAuthor {
  name: string;
  role?: string;
}

export interface BlogSection {
  heading: string;
  body?: string | string[];
  list?: string[];
  note?: string;
}

export interface BlogImageBrief {
  /** Short description for a designer / AI image tool. */
  subject: string;
  /** Visual style (photo, illustration, iso, etc.). */
  style: string;
  /** Used as <img alt> — must be descriptive, not keyword-stuffed. */
  alt: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** ISO date string — YYYY-MM-DD. Posts with future dates are hidden. */
  publishDate: string;
  category: BlogCategory;
  /** Primary keyword first, then supporting keywords. Used for tags. */
  tags: string[];
  author: BlogAuthor;
  /** Minutes — round up. */
  readingTime: number;
  /** First paragraph displayed above the key-takeaways card. */
  intro: string;
  /** 3–5 bullet takeaways shown near the top. */
  keyTakeaways: string[];
  /** Full body sections. */
  sections: BlogSection[];
  /** Slugs of 2–4 related posts for cross-linking. */
  relatedPosts?: string[];
  /** Optional custom CTA — defaults to the category's default CTA. */
  cta?: {
    text: string;
    href: string;
  };
  /** Image brief for designers; falls back to a category SVG placeholder. */
  heroImage?: BlogImageBrief;
  /** Override the hero image URL once a real image is uploaded. */
  heroImageUrl?: string;
}

export interface BlogCategoryMeta {
  slug: BlogCategory;
  name: string;
  description: string;
  /** Used by the SVG placeholder — Tailwind gradient classes. */
  accent: { from: string; to: string };
  defaultCta: { text: string; href: string };
}
