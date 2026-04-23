import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Globe } from "lucide-react";

export default function NonResidentImporter() {
  return (
    <ServiceDetailPage
      title="Non-Resident Importer (NRI)"
      subtitle="Full registration and compliance setup for non-resident businesses importing into or selling in Canada."
      metaTitle="Non-Resident Importer Services Canada | AccessToNorth.com"
      metaDescription="Complete NRI setup for foreign businesses selling in Canada. GST/HST registration, BN setup, CARM onboarding, and simplified regime compliance."
      canonical="https://www.accesstonorth.com/services/non-resident-importer-canada"
      icon={Globe}
      whatsIncluded={[
        "Non-Resident Business Number (BN) application",
        "GST/HST registration under simplified or normal regime",
        "Import/export program account setup",
        "CARM portal registration and onboarding",
        "Tax treaty applicability review",
        "Digital economy compliance assessment (SaaS, e-commerce)",
        "Ongoing compliance guidance and filing support",
      ]}
      toolLink={{
        label: "CARM Financial Security Calculator",
        href: "/carm-security-calculator",
      }}
      ctaService="non_resident_tax"
      priceCAD={399}
      additionalInfo="Non-resident businesses selling digital products, services, or physical goods into Canada may be required to register for GST/HST and obtain a Business Number. We specialize in guiding international businesses through this process."
      sampleDeliverable={{
        title: "Non-Resident Importer package",
        fields: [
          { label: "Business Number", value: "98765 4321 RC0001" },
          { label: "GST/HST Account", value: "98765 4321 RT0001" },
          { label: "Import Account", value: "98765 4321 RM0001" },
          { label: "Regime", value: "Simplified GST/HST" },
        ],
        footerNote: "Sample deliverable for illustration. All accounts are issued by CRA/CBSA.",
      }}
    />
  );
}
