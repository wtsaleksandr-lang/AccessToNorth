import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import { JsonLd } from "@/components/JsonLd";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { getPublishedPosts } from "@/data/blog/posts";
import { CATEGORIES, CATEGORY_ORDER } from "@/data/blog/categories";
import type { BlogCategory } from "@/data/blog/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const [category, setCategory] = useState<BlogCategory | "all">("all");
  const posts = useMemo(() => {
    const published = getPublishedPosts().sort((a, b) =>
      a.publishDate < b.publishDate ? 1 : -1,
    );
    return category === "all" ? published : published.filter((p) => p.category === category);
  }, [category]);

  usePageMeta({
    title: "Blog — Canadian Trade & Tax Insights | AccessToNorth.com",
    description:
      "Practical, no-fluff guides on Canadian GST/HST registration, CARM, customs clearance, HS classification, and non-resident trade compliance. Updated weekly.",
    canonical: "https://www.accesstonorth.com/blog",
  });

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "AccessToNorth Blog",
    url: "https://www.accesstonorth.com/blog",
    description:
      "Weekly guides on Canadian trade, customs, and tax compliance for residents and non-residents.",
    publisher: {
      "@type": "Organization",
      name: "AccessToNorth.com",
      url: "https://www.accesstonorth.com",
    },
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <JsonLd id="blog-index-jsonld" data={blogJsonLd} />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
              Trade & tax insights
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display text-slate-900 mb-3">
              Canadian Trade & Tax Blog
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Practical guides for Canadian and non-resident businesses on GST/HST registration,
              CARM, customs clearance, HS classification, and import compliance. New posts weekly.
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10" data-testid="blog-category-filter">
            <button
              onClick={() => setCategory("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                category === "all"
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-primary/30"
              }`}
              data-testid="blog-filter-all"
            >
              All posts
            </button>
            {CATEGORY_ORDER.map((key) => {
              const cat = CATEGORIES[key];
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key as BlogCategory)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    category === key
                      ? "bg-primary text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-primary/30"
                  }`}
                  data-testid={`blog-filter-${key}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No posts in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => {
                const cat = CATEGORIES[post.category];
                const heroUrl = post.heroImageUrl ?? `/blog/${post.slug}.svg`;
                return (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <Card
                      className="h-full cursor-pointer border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all overflow-hidden"
                      data-testid={`blog-card-${post.slug}`}
                    >
                      <div
                        className="h-40 w-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${cat.accent.from}, ${cat.accent.to})` }}
                      >
                        <img
                          src={heroUrl}
                          alt={post.heroImage?.alt ?? post.title}
                          width={1200}
                          height={630}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                          <span className="uppercase tracking-wide font-semibold" style={{ color: cat.accent.from }}>
                            {cat.name}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {formatDate(post.publishDate)}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {post.readingTime} min
                          </span>
                        </div>
                        <h2 className="text-lg font-bold font-display text-slate-900 mb-2 leading-snug">
                          {post.title}
                        </h2>
                        <p className="text-sm text-slate-600 line-clamp-3 mb-3">{post.intro}</p>
                        <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                          Read more <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-14">
            <p className="text-slate-500 mb-4 text-sm">Looking for a specific service?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/services">
                <Button size="lg" className="cursor-pointer">
                  Browse services <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="cursor-pointer">
                  Talk to our team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
