import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { JsonLd } from "@/components/JsonLd";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";

interface RelatedLink {
  label: string;
  href: string;
}

export interface ArticleSection {
  heading: string;
  /**
   * Body of the section — rendered as one or more paragraphs. Pass either
   * a single string (one paragraph) or an array of strings (multi-paragraph).
   * HTML is NOT parsed — use `list` for bullet content instead.
   */
  body?: string | string[];
  list?: string[];
  /** Optional callout shown after the body. */
  note?: string;
}

interface ResourceArticleProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  /** 3-5 key-takeaway bullets shown at the top of the article. */
  outlinePoints: string[];
  /** Intro paragraph shown above the takeaways. */
  intro?: string;
  /** Full article sections — written content. */
  sections?: ArticleSection[];
  relatedLinks?: RelatedLink[];
  ctaText?: string;
  ctaService?: string;
  /** ISO date when this article was last reviewed — emitted in JSON-LD. */
  lastReviewed?: string;
}

export function ResourceArticlePage({
  title,
  metaTitle,
  metaDescription,
  canonical,
  outlinePoints,
  intro,
  sections,
  relatedLinks,
  ctaText = "Need help? Request a consultation",
  ctaService,
  lastReviewed,
}: ResourceArticleProps) {
  usePageMeta({ title: metaTitle, description: metaDescription, canonical });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: metaDescription,
    author: {
      "@type": "Organization",
      name: "AccessToNorth.com",
      url: "https://www.accesstonorth.com",
    },
    publisher: {
      "@type": "Organization",
      name: "AccessToNorth.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.accesstonorth.com/favicon.png",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    datePublished: lastReviewed ?? "2026-04-01",
    dateModified: lastReviewed ?? "2026-04-01",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.accesstonorth.com/" },
      { "@type": "ListItem", position: 2, name: "Resources", item: "https://www.accesstonorth.com/resources" },
      { "@type": "ListItem", position: 3, name: title, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <JsonLd id={`article-jsonld-${canonical}`} data={articleJsonLd} />
      <JsonLd id={`article-breadcrumb-${canonical}`} data={breadcrumbJsonLd} />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <article className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Breadcrumbs items={[
            { label: "Resources", href: "/resources" },
            { label: title },
          ]} />

          <h1
            className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 mb-4"
            data-testid="text-article-title"
          >
            {title}
          </h1>

          {lastReviewed && (
            <p className="text-xs text-slate-500 mb-6">
              Last reviewed{" "}
              {new Date(lastReviewed).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {intro && (
            <p className="text-base md:text-lg text-slate-700 leading-relaxed mb-6">
              {intro}
            </p>
          )}

          <Card className="mb-8 border-primary/20 bg-blue-50/40">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">
                Key takeaways
              </p>
              <ul className="space-y-2.5">
                {outlinePoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="text-slate-800 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {sections && sections.length > 0 && (
            <div className="prose prose-slate max-w-none text-slate-700 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed">
              {sections.map((section, i) => (
                <section key={i}>
                  <h2>{section.heading}</h2>
                  {Array.isArray(section.body)
                    ? section.body.map((para, j) => <p key={j}>{para}</p>)
                    : section.body && <p>{section.body}</p>}
                  {section.list && (
                    <ul className="space-y-2 my-4">
                      {section.list.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold mt-0.5" aria-hidden="true">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.note && (
                    <div className="my-5 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
                      <p className="text-sm text-amber-900 m-0">{section.note}</p>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}

          {relatedLinks && relatedLinks.length > 0 && (
            <div className="my-10 p-5 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-3">Related services &amp; tools:</p>
              <div className="flex flex-wrap gap-2">
                {relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      data-testid={`link-related-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={ctaService ? `/request?service=${ctaService}` : "/request"}>
              <Button size="lg" className="cursor-pointer w-full sm:w-auto" data-testid="button-article-cta">
                {ctaText} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/resources">
              <Button size="lg" variant="outline" className="cursor-pointer w-full sm:w-auto" data-testid="button-back-resources">
                All Resources
              </Button>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
