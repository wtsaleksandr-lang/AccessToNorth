import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, Building2, Landmark, Globe, Shield, Package, FileText, FileCheck, Scale } from "lucide-react";

const serviceGroups = [
  {
    category: "Business Setup",
    services: [
      { title: "Business Number (BN)", desc: "9-digit CRA Business Number — the foundation for all tax accounts.", icon: Building2, href: "/services/business-number-bn", cta: "business-number" },
      { title: "GST/HST Registration", desc: "Register for Goods and Services Tax / Harmonized Sales Tax.", icon: Landmark, href: "/services/gst-hst-registration", cta: "gst-hst" },
      { title: "Non-Resident Importer (NRI)", desc: "Full setup for non-resident businesses importing into or selling in Canada.", icon: Globe, href: "/services/non-resident-importer-canada", cta: "non-resident" },
    ],
  },
  {
    category: "Importer Setup",
    services: [
      { title: "CARM Registration", desc: "End-to-end CARM portal onboarding, delegation, and import account setup.", icon: Landmark, href: "/services/carm-registration-canada", cta: "carm" },
      { title: "RPP / Bond Coordination", desc: "Release Prior to Payment program and surety bond coordination.", icon: Scale, href: "/services/rpp-bond-coordination", cta: "rpp-bond" },
    ],
  },
  {
    category: "Customs Clearance",
    services: [
      { title: "Canadian Customs Clearance", desc: "Flat-rate commercial import clearance into Canada. LVS, commercial, and compliance packages.", icon: Package, href: "/services/customs-clearance-canada", cta: "customs-clearance" },
    ],
  },
  {
    category: "Export",
    services: [
      { title: "B13 Export Declaration", desc: "Canadian Export Declaration filing for goods leaving Canada (over $2,000 CAD).", icon: FileText, href: "/services/b13-export-declaration", cta: "b13-export" },
    ],
  },
  {
    category: "Compliance",
    services: [
      { title: "HS Code Classification", desc: "Accurate tariff classification to avoid penalties and overpayment of duties.", icon: FileCheck, href: "/services/hs-code-classification-canada", cta: "hs-classification" },
      { title: "Import Compliance Review", desc: "Comprehensive audit of your import operations — tariff, valuation, and origin.", icon: Shield, href: "/services/import-compliance-review", cta: "compliance-review" },
    ],
  },
];

export default function Services() {
  usePageMeta({
    title: "Services | AccessToNorth.com",
    description: "Canadian business registration, GST/HST, CARM, customs clearance, HS classification, export declarations, and import compliance services. Flat-rate pricing.",
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
              From business registration to customs clearance — we handle the paperwork so you can focus on your business.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-12">
            {serviceGroups.map((group) => (
              <section key={group.category}>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2" data-testid={`text-group-${group.category.toLowerCase().replace(/\s+/g, "-")}`}>
                  {group.category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.services.map((service) => (
                    <Card key={service.cta} className="flex flex-col border border-slate-200 hover:shadow-lg hover:border-primary/20 transition-all duration-300" data-testid={`card-service-${service.cta}`}>
                      <CardContent className="flex flex-col flex-1 p-5">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <service.icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-base font-bold mb-1.5 text-slate-900">{service.title}</h3>
                        <p className="text-sm text-slate-600 mb-5 flex-1">{service.desc}</p>
                        <div className="flex flex-col gap-2">
                          <Link href={service.href}>
                            <Button variant="outline" className="w-full cursor-pointer" data-testid={`button-learn-${service.cta}`}>
                              Learn More <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                          <Link href={service.cta === "customs-clearance" ? "/canadian-customs-clearance" : `/request?service=${service.cta}`}>
                            <Button className="w-full cursor-pointer" data-testid={`button-request-${service.cta}`}>
                              {service.cta === "customs-clearance" ? "View Packages" : "Request Service"}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="text-center mt-14">
            <p className="text-slate-500 mb-4">Not sure which service you need?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/pricing">
                <Button size="lg" className="cursor-pointer" data-testid="button-view-pricing">
                  View Pricing <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="cursor-pointer" data-testid="button-contact-us">
                  Contact Us <ArrowRight className="w-4 h-4 ml-2" />
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
