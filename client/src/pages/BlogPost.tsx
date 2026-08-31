import { Link, useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { JsonLd } from "@/components/JsonLd";
import { ArrowRight, CheckCircle2, Info, Calendar, Clock, Tag } from "lucide-react";
import { getPostBySlug, POSTS } from "@/data/blog/posts";
import { CATEGORIES } from "@/data/blog/categories";
import NotFound from "@/pages/not-found";
import { BRAND_ICON, SITE_URL, assetUrl, canonicalUrl } from "@shared/seo";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = getPostBySlug(params.slug);

  if (!post) return <NotFound />;

  // Hide future-dated posts from direct URL visits? No — keep them accessible
  // for preview; just skip them from the index, sitemap, and RSS.
  const cat = CATEGORIES[post.category];
  const canonical = canonicalUrl(`/blog/${post.slug}`);
  const heroUrl = post.heroImageUrl ?? `/blog/${post.slug}.svg`;

  usePageMeta({
    title: post.metaTitle,
    description: post.metaDescription,
    canonical,
    ogImage: assetUrl(heroUrl),
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    image: [assetUrl(heroUrl)],
    author: {
      "@type": "Organization",
      name: post.author.name,
      url: `${SITE_URL}/about#editorial-standards`,
    },
    reviewedBy: {
      "@type": "Organization",
      name: "AccessToNorth Editorial Team",
      url: `${SITE_URL}/about#editorial-standards`,
    },
    publisher: {
      "@type": "Organization",
      name: "AccessToNorth.com",
      logo: {
        "@type": "ImageObject",
        url: BRAND_ICON,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    datePublished: post.publishDate,
    dateModified: post.updatedDate ?? post.publishDate,
    keywords: post.tags.join(", "),
    articleSection: cat.name,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: canonicalUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical },
    ],
  };

  const related = (post.relatedPosts ?? [])
    .map((slug) => POSTS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 3);

  const cta = post.cta ?? cat.defaultCta;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <JsonLd id={`blog-jsonld-${post.slug}`} data={articleJsonLd} />
      <JsonLd id={`blog-breadcrumb-${post.slug}`} data={breadcrumbJsonLd} />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <article className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Breadcrumbs
            items={[
              { label: "Blog", href: "/blog" },
              { label: post.title },
            ]}
          />

          <div className="mb-3 flex items-center gap-3 flex-wrap text-xs text-slate-500">
            <Link
              href="/blog"
              className="uppercase tracking-wide font-semibold hover:underline"
              style={{ color: cat.accent.from }}
            >
              {cat.name}
            </Link>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {formatDate(post.publishDate)}
            </span>
            {post.updatedDate && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>Updated {formatDate(post.updatedDate)}</span>
              </>
            )}
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {post.readingTime} min read
            </span>
          </div>

          <p className="mb-5 text-xs leading-5 text-slate-500">
            Written and reviewed by the{" "}
            <Link href="/about#editorial-standards" className="font-semibold text-slate-700 hover:text-primary hover:underline">
              AccessToNorth Editorial Team
            </Link>
            . Regulatory statements are checked against the primary sources cited or linked in the guide.
          </p>

          <h1
            className="text-2xl md:text-4xl font-extrabold font-display text-slate-900 mb-4 leading-tight"
            data-testid="blog-post-title"
          >
            {post.title}
          </h1>

          <div
            className="w-full h-44 md:h-64 rounded-2xl overflow-hidden mb-8"
            style={{ background: `linear-gradient(135deg, ${cat.accent.from}, ${cat.accent.to})` }}
          >
            <img
              src={heroUrl}
              alt={post.heroImage?.alt ?? post.title}
              width={1200}
              height={630}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <p className="text-base md:text-lg text-slate-700 leading-relaxed mb-8">{post.intro}</p>

          <Card className="mb-8 border-primary/20 bg-blue-50/40">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">
                Key takeaways
              </p>
              <ul className="space-y-2.5">
                {post.keyTakeaways.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="text-slate-800 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="prose prose-slate max-w-none text-slate-700 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed">
            {post.sections.map((section, i) => (
              <section key={i}>
                <h2>{section.heading}</h2>
                {Array.isArray(section.body)
                  ? section.body.map((p, j) => <p key={j}>{p}</p>)
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

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-8 mb-10">
            <Tag className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="my-10 p-6 rounded-xl bg-blue-50 border border-blue-100 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">Ready when you are</p>
              <p className="text-lg font-bold text-slate-900">{cta.text}</p>
            </div>
            <Link href={cta.href}>
              <Button size="lg" className="cursor-pointer shrink-0">
                Get started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mt-12">
              <h3 className="text-xl font-bold font-display text-slate-900 mb-4">Related articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((r) => {
                  const rCat = CATEGORIES[r.category];
                  return (
                    <Link key={r.slug} href={`/blog/${r.slug}`}>
                      <Card className="h-full cursor-pointer border border-slate-200 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <p
                            className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                            style={{ color: rCat.accent.from }}
                          >
                            {rCat.name}
                          </p>
                          <p className="text-sm font-semibold text-slate-800 leading-snug">
                            {r.title}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <div className="text-center mt-14">
            <Link href="/blog">
              <Button variant="outline" className="cursor-pointer">
                ← All blog posts
              </Button>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
