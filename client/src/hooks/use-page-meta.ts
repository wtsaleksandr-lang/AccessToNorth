import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, SITE_URL, assetUrl, canonicalUrl } from "@shared/seo";

interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  robots?: string;
}

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

export function usePageMeta({
  title,
  description,
  canonical,
  ogImage,
  robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
}: PageMeta) {
  useEffect(() => {
    document.title = title;

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    const normalizedCanonical = canonical
      ? canonicalUrl(canonical)
      : canonicalUrl(window.location.pathname);

    if (normalizedCanonical) {
      setMeta('meta[property="og:url"]', "property", "og:url", normalizedCanonical);
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", normalizedCanonical);
    }

    const normalizedOgImage = ogImage
      ? ogImage.startsWith("http")
        ? ogImage.replace(/^https?:\/\/(?:www\.)?accesstonorth\.com/i, SITE_URL)
        : assetUrl(ogImage)
      : DEFAULT_OG_IMAGE;
    setMeta('meta[property="og:image"]', "property", "og:image", normalizedOgImage);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", normalizedOgImage);
    setMeta('meta[name="robots"]', "name", "robots", robots);

    return () => {
      document.title = "AccessToNorth.com";
    };
  }, [title, description, canonical, ogImage, robots]);
}
