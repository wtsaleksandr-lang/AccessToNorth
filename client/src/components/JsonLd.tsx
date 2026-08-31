import { useEffect } from "react";
import { BRAND_ICON, SITE_URL } from "@shared/seo";

type JsonLdData = Record<string, unknown>;

/**
 * Injects a <script type="application/ld+json"> into <head>.
 * Each instance MUST have a unique `id` so re-mounts replace rather than duplicate.
 *
 * Production pages already contain their primary route schema from the build
 * prerender. When the client asks for the same schema type, keep that static
 * entry instead of adding a duplicate. Development mode still receives the
 * client entry because no prerendered primary script exists there.
 */
export function JsonLd({ id, data }: { id: string; data: JsonLdData | JsonLdData[] }) {
  useEffect(() => {
    const requestedType = Array.isArray(data) ? undefined : data["@type"];
    const primary = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-prerender="primary"]');
    if (primary && requestedType) {
      try {
        const primaryData = JSON.parse(primary.textContent || "{}") as JsonLdData;
        if (primaryData["@type"] === requestedType) return;
      } catch {
        // A malformed static block should not prevent the valid client block.
      }
    }

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
