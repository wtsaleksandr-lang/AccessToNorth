import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PricingCard } from "@/components/PricingCard";
import { RegistrationModal } from "@/components/RegistrationModal";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Award } from "lucide-react";

const packages = [
  {
    type: "business-number",
    title: "Business Number",
    price: "99",
    description: "Essential Business Number (BN) registration for small businesses.",
    features: [
      { text: "Business Number (BN) Setup", included: true },
      { text: "Official CRA Documentation", included: true },
      { text: "Digital Filing", included: true },
      { text: "GST/HST Registration", included: false },
      { text: "Import/Export Account", included: false },
    ],
  },
  {
    type: "gst-hst",
    title: "GST/HST Registration",
    price: "249",
    description: "Complete GST/HST registration including provincial requirements.",
    features: [
      { text: "Business Number Included", included: true },
      { text: "GST/HST Registration", included: true },
      { text: "Filing Guidance", included: true },
      { text: "Compliance Review", included: true },
      { text: "Import/Export Account", included: false },
    ],
    isPopular: true,
  },
  {
    type: "non-resident",
    title: "Non-Resident Tax",
    price: "399",
    description: "Specialized registration for non-residents doing business in Canada.",
    features: [
      { text: "Non-Resident BN", included: true },
      { text: "GST/HST Registration", included: true },
      { text: "Tax Treaty Guidance", included: true },
      { text: "Compliance Support", included: true },
      { text: "Digital Services Compliance", included: true },
    ],
  },
  {
    type: "carm",
    title: "CARM Portal",
    price: "499",
    description: "Register for the CBSA Assessment and Revenue Management portal.",
    features: [
      { text: "CARM Registration", included: true },
      { text: "Portal Access Setup", included: true },
      { text: "Import Account", included: true },
      { text: "CBSA Compliance", included: true },
      { text: "Ongoing Support", included: true },
    ],
  },
  {
    type: "complete-bundle",
    title: "Complete Importer Bundle",
    price: "1,500",
    description: "All-inclusive: BN, GST/HST, Import/Export, and CARM portal registration.",
    features: [
      { text: "Everything in CARM Package", included: true },
      { text: "Business Number Registration", included: true },
      { text: "GST/HST Registration", included: true },
      { text: "Import/Export Account", included: true },
      { text: "Priority Support", included: true },
    ],
    isFeatured: true,
  },
];

export default function Pricing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("business-number");

  usePageMeta({
    title: "Pricing | AccessToNorth.com",
    description: "Transparent, one-time pricing for Canadian business registration services. From $99 Business Number to $1,500 Complete Importer Bundle. No hidden fees.",
    canonical: "https://www.accesstonorth.com/pricing",
  });

  const handleOpenModal = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-pricing-page-title">
              Transparent Pricing
            </h1>
            <p className="text-lg text-slate-600">
              Choose the package that fits your business needs. One-time fees, no hidden costs.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-6xl mx-auto">
            {packages.map((pkg) => (
              <div key={pkg.type} className="w-full md:w-[calc(50%-12px)] xl:w-[calc(33.333%-16px)]">
                <PricingCard
                  {...pkg}
                  onSelect={() => handleOpenModal(pkg.type)}
                />
              </div>
            ))}
          </div>

          <div className="mt-12 py-8 bg-blue-50/50 border border-blue-100/50 rounded-2xl max-w-2xl mx-auto text-center">
            <Award className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display mb-2">Satisfaction Guarantee</h3>
            <p className="text-slate-600 px-6">
              If we fall short on our registration process due to our error, you receive a full refund. We stand behind every filing.
            </p>
          </div>

          <div className="text-center mt-10">
            <p className="text-slate-500 mb-2">Looking for customs clearance services?</p>
            <Link href="/canadian-customs-clearance">
              <span className="text-primary font-medium hover:underline cursor-pointer" data-testid="link-clearance-pricing">
                View Customs Clearance Pricing
              </span>
            </Link>
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
