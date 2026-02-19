import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RegistrationModal } from "@/components/RegistrationModal";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const serviceToPackage: Record<string, string> = {
  "customs-clearance": "complete-bundle",
  "compliance-review": "complete-bundle",
  "hs-classification": "complete-bundle",
  "carm": "carm",
  "rpp-bond": "carm",
  "b13-export": "gst-hst",
  "non-resident": "non-resident",
  "business-number": "business-number",
  "gst-hst": "gst-hst",
  "complete-bundle": "complete-bundle",
};

const packageLabels: Record<string, string> = {
  "business-number": "Business Number ($99)",
  "gst-hst": "GST/HST Registration ($249)",
  "non-resident": "Non-Resident Tax ($399)",
  "carm": "CARM Portal ($499)",
  "complete-bundle": "Complete Importer Bundle ($1,500)",
};

export default function Request() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const serviceParam = params.get("service") || "";
  const defaultPkg = serviceToPackage[serviceParam] || "gst-hst";

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(defaultPkg);

  usePageMeta({
    title: "Start Your Registration | AccessToNorth.com",
    description: "Begin your Canadian business registration, GST/HST filing, CARM onboarding, or customs compliance request. Secure online application with Stripe checkout.",
    canonical: "https://www.accesstonorth.com/request",
  });

  useEffect(() => {
    setSelectedPackage(serviceToPackage[serviceParam] || "gst-hst");
  }, [serviceParam]);

  const handleStart = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

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

          <div className="text-center">
            <Button
              size="lg"
              className="px-10 cursor-pointer"
              onClick={() => handleStart(selectedPackage)}
              data-testid="button-begin-application"
            >
              Begin Application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-slate-400 mt-3">
              You'll be redirected to secure checkout after completing the form.
            </p>
          </div>
        </div>
      </main>
      <Footer />

      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPackage={selectedPackage}
      />
    </div>
  );
}
