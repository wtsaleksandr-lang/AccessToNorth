import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, FileCheck, Globe, Shield, Landmark, Package, FileText, Building2, Scale } from "lucide-react";

const services = [
  {
    title: "Canadian Customs Clearance",
    description: "End-to-end customs clearance for commercial imports into Canada. Flat-rate pricing, no hidden fees.",
    icon: Package,
    href: "/services/customs-clearance-canada",
    cta: "customs-clearance",
  },
  {
    title: "Import Compliance Review",
    description: "Full compliance audit of your import operations including tariff classification, valuation, and origin verification.",
    icon: Shield,
    href: "/services/import-compliance-review",
    cta: "compliance-review",
  },
  {
    title: "HS Code Classification",
    description: "Professional tariff classification for your products. Accurate HS codes to avoid penalties and overpayment.",
    icon: FileCheck,
    href: "/services/hs-code-classification-canada",
    cta: "hs-classification",
  },
  {
    title: "CARM Registration",
    description: "Complete CARM portal registration and onboarding. Business Number, import account, and delegation setup.",
    icon: Landmark,
    href: "/services/carm-registration-canada",
    cta: "carm",
  },
  {
    title: "RPP / Bond Coordination",
    description: "Release Prior to Payment program setup and surety bond coordination for importers.",
    icon: Scale,
    href: "/services/rpp-bond-coordination",
    cta: "rpp-bond",
  },
  {
    title: "B13 Export Declaration",
    description: "Canadian Export Declaration (B13) filing for goods leaving Canada. Required for shipments over $2,000 CAD.",
    icon: FileText,
    href: "/services/b13-export-declaration",
    cta: "b13-export",
  },
  {
    title: "Non-Resident Importer (NRI)",
    description: "Full registration and compliance setup for non-resident businesses importing into or selling in Canada.",
    icon: Globe,
    href: "/services/non-resident-importer-canada",
    cta: "non-resident",
  },
];

export default function Services() {
  usePageMeta({
    title: "Services | AccessToNorth.com",
    description: "Canadian customs clearance, import compliance, CARM registration, HS classification, and non-resident importer services. Flat-rate pricing with no hidden fees.",
    canonical: "https://www.accesstonorth.com/services",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-services-title">
              Our Services
            </h1>
            <p className="text-lg text-slate-600">
              From customs clearance to CARM registration, we handle the paperwork so you can focus on your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service) => (
              <Card key={service.cta} className="flex flex-col border border-slate-200 hover:shadow-lg hover:border-primary/20 transition-all duration-300" data-testid={`card-service-${service.cta}`}>
                <CardContent className="flex flex-col flex-1 p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold mb-2 text-slate-900">{service.title}</h2>
                  <p className="text-sm text-slate-600 mb-6 flex-1">{service.description}</p>
                  <div className="flex flex-col gap-2">
                    <Link href={service.href}>
                      <Button variant="outline" className="w-full cursor-pointer" data-testid={`button-learn-${service.cta}`}>
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href={`/request?service=${service.cta}`}>
                      <Button className="w-full cursor-pointer" data-testid={`button-request-${service.cta}`}>
                        Request Service
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-500 mb-4">Not sure which service you need?</p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="cursor-pointer" data-testid="button-contact-us">
                Contact Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
