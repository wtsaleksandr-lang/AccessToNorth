import { useState, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RegistrationModal } from "@/components/RegistrationModal";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, X, MessageSquare } from "lucide-react";

const serviceToPackage: Record<string, string> = {
  "business-number": "business-number",
  "gst-hst": "gst-hst",
  "non-resident": "non-resident",
  "carm": "carm",
  "complete-bundle": "complete-bundle",
  "business-starter": "business-starter",
  "b13-export": "b13-export",
  "rpp-bond": "rpp-bond",
  "hs-classification": "hs-classification",
};

const packageLabels: Record<string, string> = {
  "business-number": "Business Number ($99)",
  "gst-hst": "GST/HST Registration ($249)",
  "business-starter": "Business Starter Bundle ($299)",
  "non-resident": "Non-Resident Tax ($399)",
  "carm": "CARM Portal ($499)",
  "rpp-bond": "RPP / Bond Coordination ($395)",
  "b13-export": "B13 Export Declaration ($125)",
  "hs-classification": "HS Code Classification ($95)",
  "complete-bundle": "Complete Importer Bundle ($1,500)",
};

const CONTACT_SERVICES = ["compliance-review"];

const contactServiceLabels: Record<string, string> = {
  "compliance-review": "Import Compliance Review",
};

export default function Request() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const serviceParam = params.get("service") || "";
  const isContactService = CONTACT_SERVICES.includes(serviceParam);
  const defaultPkg = serviceToPackage[serviceParam] || "";
  const ctaRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(defaultPkg);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  usePageMeta({
    title: "Start Your Registration | AccessToNorth.com",
    description: "Begin your Canadian business registration, GST/HST filing, CARM onboarding, or customs compliance request. Secure online application with Stripe checkout.",
    canonical: "https://www.accesstonorth.com/request",
  });

  useEffect(() => {
    const pkg = serviceToPackage[serviceParam] || "";
    setSelectedPackage(pkg);
    setBannerDismissed(false);

    if (pkg && ctaRef.current) {
      setTimeout(() => {
        ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [serviceParam]);

  const handleStart = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const showBanner = serviceParam && defaultPkg && !bannerDismissed && !isContactService;
  const bannerLabel = packageLabels[defaultPkg];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-request-title">
              Start Your Registration
            </h1>
            <p className="text-lg text-slate-600">
              Select a package below to begin your application. You'll be guided through a short form and secure payment.
            </p>
          </div>

          {isContactService && (
            <div className="mb-8 p-5 rounded-xl bg-blue-50 border border-blue-200 text-center" data-testid="contact-service-banner">
              <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {contactServiceLabels[serviceParam] || "Custom Service"}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                This service requires a custom quote based on your specific needs. Contact us for a free consultation.
              </p>
              <Link href="/contact">
                <Button size="lg" className="cursor-pointer" data-testid="button-contact-quote">
                  Get a Free Quote <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {showBanner && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-3" data-testid="selection-banner">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-green-800" data-testid="text-banner-selection">
                  Selected: {bannerLabel}
                </span>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-green-600 hover:text-green-800 shrink-0 cursor-pointer"
                data-testid="button-dismiss-banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!isContactService && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {Object.entries(packageLabels).map(([type, label]) => (
                  <Card
                    key={type}
                    className={`cursor-pointer border transition-all duration-200 ${
                      selectedPackage === type
                        ? "border-primary shadow-md ring-1 ring-primary/20"
                        : "border-slate-200 hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedPackage(type)}
                    data-testid={`card-request-${type}`}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedPackage === type ? "border-primary bg-primary" : "border-slate-300"
                      }`}>
                        {selectedPackage === type && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-slate-800">{label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center" ref={ctaRef}>
                <Button
                  size="lg"
                  className="px-10 cursor-pointer"
                  onClick={() => handleStart(selectedPackage || "gst-hst")}
                  data-testid="button-begin-application"
                >
                  Begin Application
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-slate-400 mt-3">
                  You'll be redirected to secure checkout after completing the form.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPackage={selectedPackage || "gst-hst"}
      />
    </div>
  );
}
