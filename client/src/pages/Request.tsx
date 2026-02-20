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
import { useCurrency } from "@/contexts/CurrencyContext";

const SERVICE_MAP: Record<string, { label: string; priceCAD: number; packageType: string }> = {
  bn: { label: "Business Number (BN)", priceCAD: 99, packageType: "bn" },
  gst_hst: { label: "GST/HST Registration", priceCAD: 249, packageType: "gst_hst" },
  bundle_business_starter: { label: "Business Starter Bundle", priceCAD: 299, packageType: "bundle_business_starter" },
  non_resident_tax: { label: "Non-Resident Tax Registration", priceCAD: 399, packageType: "non_resident_tax" },
  carm_portal: { label: "CARM Portal Registration", priceCAD: 499, packageType: "carm_portal" },
  rpp_bond: { label: "RPP / Bond Coordination", priceCAD: 395, packageType: "rpp_bond" },
  b13_export: { label: "B13 Export Declaration", priceCAD: 125, packageType: "b13_export" },
  hs_classification: { label: "HS Code Classification", priceCAD: 95, packageType: "hs_classification" },
  bundle_complete_importer: { label: "Complete Importer Bundle", priceCAD: 1500, packageType: "bundle_complete_importer" },
};

const CONTACT_SERVICES = ["compliance_review"];

const contactServiceLabels: Record<string, string> = {
  compliance_review: "Import Compliance Review",
};

export default function Request() {
  const { formatPrice } = useCurrency();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const serviceParam = params.get("service") || "";
  const isContactService = CONTACT_SERVICES.includes(serviceParam);
  const matched = SERVICE_MAP[serviceParam];
  const ctaRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(matched?.packageType || "");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(!!matched);

  usePageMeta({
    title: "Start Your Registration | AccessToNorth.com",
    description: "Begin your Canadian business registration, GST/HST filing, CARM onboarding, or customs compliance request. Secure online application with Stripe checkout.",
    canonical: "https://www.accesstonorth.com/request",
  });

  useEffect(() => {
    const svc = SERVICE_MAP[serviceParam];
    if (svc) {
      setSelectedPackage(svc.packageType);
      setListCollapsed(true);
    } else {
      setSelectedPackage("");
      setListCollapsed(false);
    }
    setBannerDismissed(false);

    if (svc && ctaRef.current) {
      setTimeout(() => {
        ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [serviceParam]);

  const handleStart = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const showBanner = serviceParam && matched && !bannerDismissed && !isContactService;
  const bannerLabel = matched ? `${matched.label} (${formatPrice(matched.priceCAD)})` : "";
  const selectedEntry = SERVICE_MAP[selectedPackage];

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
              {listCollapsed && selectedEntry ? (
                <div className="mb-10 p-5 rounded-xl border border-primary/20 bg-white flex items-center justify-between gap-3" data-testid="collapsed-selection">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium text-slate-800" data-testid="text-collapsed-label">
                      {selectedEntry.label} — {formatPrice(selectedEntry.priceCAD)}
                    </span>
                  </div>
                  <button
                    onClick={() => setListCollapsed(false)}
                    className="text-sm text-primary hover:underline cursor-pointer font-medium"
                    data-testid="button-change-selection"
                  >
                    Change selection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {Object.entries(SERVICE_MAP).map(([key, svc]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer border transition-all duration-200 ${
                        selectedPackage === key
                          ? "border-primary shadow-md ring-1 ring-primary/20"
                          : "border-slate-200 hover:border-primary/30"
                      }`}
                      onClick={() => { setSelectedPackage(key); setListCollapsed(true); }}
                      data-testid={`card-request-${key}`}
                    >
                      <CardContent className="flex items-center gap-4 p-5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedPackage === key ? "border-primary bg-primary" : "border-slate-300"
                        }`}>
                          {selectedPackage === key && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-slate-800">{svc.label} — {formatPrice(svc.priceCAD)}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="text-center" ref={ctaRef}>
                <Button
                  size="lg"
                  className="px-10 cursor-pointer"
                  disabled={!selectedPackage}
                  onClick={() => handleStart(selectedPackage || "gst_hst")}
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
        defaultPackage={selectedPackage || "gst_hst"}
      />
    </div>
  );
}
