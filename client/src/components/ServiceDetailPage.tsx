import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface ServiceDetailProps {
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  icon: LucideIcon;
  whatsIncluded: string[];
  toolLink?: { label: string; href: string };
  ctaService: string;
  additionalInfo?: string;
}

export function ServiceDetailPage({
  title,
  subtitle,
  metaTitle,
  metaDescription,
  canonical,
  icon: Icon,
  whatsIncluded,
  toolLink,
  ctaService,
  additionalInfo,
}: ServiceDetailProps) {
  usePageMeta({ title: metaTitle, description: metaDescription, canonical });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Breadcrumbs items={[
            { label: "Services", href: "/services" },
            { label: title },
          ]} />

          <div className="flex items-start gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900" data-testid="text-service-title">
                {title}
              </h1>
              <p className="text-slate-600 mt-1">{subtitle}</p>
            </div>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-bold mb-4 text-slate-900">What's Included</h2>
              <ul className="space-y-3">
                {whatsIncluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {additionalInfo && (
            <div className="mb-8 p-5 rounded-xl bg-blue-50 border border-blue-100 text-sm text-slate-700">
              {additionalInfo}
            </div>
          )}

          {toolLink && (
            <div className="mb-8 p-5 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-sm text-slate-600 mb-3">Related tool:</p>
              <Link href={toolLink.href}>
                <Button variant="outline" className="cursor-pointer" data-testid="button-related-tool">
                  {toolLink.label}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/request?service=${ctaService}`}>
              <Button size="lg" className="cursor-pointer w-full sm:w-auto" data-testid="button-request-service">
                Request This Service
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="cursor-pointer w-full sm:w-auto" data-testid="button-contact-service">
                Ask a Question
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
