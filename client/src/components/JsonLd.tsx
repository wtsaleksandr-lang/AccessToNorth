import { useEffect } from "react";
import { BRAND_ICON, SITE_URL } from "@shared/seo";

type JsonLdData = Record<string, unknown>;

/**
 * Injects a <script type="application/ld+json"> into <head>.
 * Each instance MUST have a unique `id` so re-mounts replace rather than duplicate.
 *
 * Important: because meta tags set by React only apply *after* hydration,
 * Googlebot may crawl the page before this script exists. Combine with the
 * static JSON-LD in index.html for the Organization entry, and rely on
 * Google's two-pass rendering for page-level schema. For full SSR coverage,
 * add a prerender build step (tracked as a follow-up).
 */
export function JsonLd({ id, data }: { id: string; data: JsonLdData | JsonLdData[] }) {
  useEffect(() => {
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => {
      const stale = document.getElementById(id);
      if (stale) stale.remove();
    };
  }, [id, data]);

  return null;
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AccessToNorth.com",
  url: `${SITE_URL}/`,
  logo: BRAND_ICON,
  description:
    "Canadian business registration and customs setup for residents and non-residents. GST/HST, Business Number, CARM, customs clearance coordination, and HS classification.",
  email: "operations@accesstonorth.com",
  address: {
    "@type": "PostalAddress",
    addressRegion: "ON",
    addressCountry: "CA",
  },
  areaServed: ["CA", "US"],
  sameAs: [],
} as const;
