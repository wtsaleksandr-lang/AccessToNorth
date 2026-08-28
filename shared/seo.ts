export const SITE_URL = "https://accesstonorth.com";
export const SITE_NAME = "AccessToNorth.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const BRAND_ICON = `${SITE_URL}/favicon.png`;

/**
 * The production host serves directory-style pages with a trailing slash.
 * Keeping canonicals, sitemaps, structured data, and social metadata on the
 * same URL prevents search engines from splitting signals between variants.
 */
export function canonicalUrl(path = "/"): string {
  const pathname = path
    .replace(/^https?:\/\/[^/]+/i, "")
    .split(/[?#]/, 1)[0]
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  return pathname ? `${SITE_URL}/${pathname}/` : `${SITE_URL}/`;
}

export function assetUrl(path: string): string {
  return `${SITE_URL}/${path.replace(/^\/+/, "")}`;
}
