import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface RelatedLink {
  label: string;
  href: string;
}

interface ResourceArticleProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  outlinePoints: string[];
  relatedLinks?: RelatedLink[];
  ctaText?: string;
  ctaService?: string;
}

export function ResourceArticlePage({
  title,
  metaTitle,
  metaDescription,
  canonical,
  outlinePoints,
  relatedLinks,
  ctaText = "Need help? Request a consultation",
  ctaService,
}: ResourceArticleProps) {
  usePageMeta({ title: metaTitle, description: metaDescription, canonical });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Breadcrumbs items={[
            { label: "Resources", href: "/resources" },
            { label: title },
          ]} />

          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 mb-6" data-testid="text-article-title">
            {title}
          </h1>

          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              <p className="text-sm text-slate-500 mb-4">Article outline — full content coming soon.</p>
              <ul className="space-y-3">
                {outlinePoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-slate-700">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {relatedLinks && relatedLinks.length > 0 && (
            <div className="mb-8 p-5 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-3">Related services & tools:</p>
              <div className="flex flex-wrap gap-2">
                {relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button variant="outline" size="sm" className="cursor-pointer" data-testid={`link-related-${link.label.toLowerCase().replace(/\s+/g, "-")}`}>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
