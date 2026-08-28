import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { SampleDeliverableCard, type SampleDeliverableProps } from "@/components/SampleDeliverableCard";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, canonicalUrl } from "@shared/seo";

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
  priceCAD?: number;
  additionalInfo?: string;
  sampleDeliverable?: SampleDeliverableProps;
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
  priceCAD,
  additionalInfo,
  sampleDeliverable,
}: ServiceDetailProps) {
  const normalizedCanonical = canonicalUrl(canonical);
  usePageMeta({ title: metaTitle, description: metaDescription, canonical: normalizedCanonical });
  const { addItem, setIsOpen } = useCart();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem({
      id: ctaService,
      name: title,
      price: priceCAD || 0,
      serviceKey: ctaService,
      category: "service",
    });
    toast({ title: `${title} added to cart` });
  };

  const isClearance = ctaService === "customs_clearance";

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description: subtitle,
    provider: {
      "@type": "Organization",
      name: "AccessToNorth.com",
      url: `${SITE_URL}/`,
    },
    areaServed: { "@type": "Country", name: "Canada" },
    url: normalizedCanonical,
    ...(priceCAD
      ? {
          offers: {
            "@type": "Offer",
            price: priceCAD,
            priceCurrency: "CAD",
            availability: "https://schema.org/InStock",
            url: normalizedCanonical,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Services", item: canonicalUrl("/services") },
      { "@type": "ListItem", position: 3, name: title, item: normalizedCanonical },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <JsonLd id={`service-jsonld-${ctaService}`} data={serviceJsonLd} />
      <JsonLd id={`breadcrumb-jsonld-${ctaService}`} data={breadcrumbJsonLd} />
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
              {priceCAD && (
                <p className="text-lg font-bold text-primary mt-2" data-testid="text-service-price">
                  {formatPrice(priceCAD)}
                </p>
              )}
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

          {sampleDeliverable && <SampleDeliverableCard {...sampleDeliverable} />}

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
            {isClearance ? (
              <Link href="/canadian-customs-clearance">
                <Button size="lg" className="cursor-pointer w-full sm:w-auto" data-testid="button-request-service">
                  View Clearance Packages
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : priceCAD ? (
              <Button size="lg" className="cursor-pointer w-full sm:w-auto" onClick={handleAddToCart} data-testid="button-add-to-cart">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart &mdash; {formatPrice(priceCAD)}
              </Button>
            ) : (
              <Link href={`/request?service=${ctaService}`}>
                <Button size="lg" className="cursor-pointer w-full sm:w-auto" data-testid="button-request-service">
                  Request This Service
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/contact">
              <Button size="lg" variant="outline" className="cursor-pointer w-full sm:w-auto" data-testid="button-contact-service">
                Ask a Question
              </Button>
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              We submit within one business day of signed authorization. Agency processing (CRA, CBSA)
              typically completes in 5&ndash;10 business days but is outside our control.
              Refund on unfiled work. Secure Stripe checkout.
            </span>
          </p>

          {/* Scope and authorization disclaimer */}
          <div className="mt-6 p-4 rounded-lg bg-slate-100 border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-700">Scope.</strong> AccessToNorth coordinates the
              filing of the above with the CRA or CBSA on your behalf, under the signed authorization
              we send after purchase. We are not a law firm, an accounting firm, or a customs
              broker, and we do not provide legal, tax, or customs-brokerage advice. Agency
              processing times and decisions are made by the CRA / CBSA and are outside our control.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
