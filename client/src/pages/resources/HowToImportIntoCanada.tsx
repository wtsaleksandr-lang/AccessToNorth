import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function HowToImportIntoCanada() {
  return (
    <ResourceArticlePage
      title="How to Import Into Canada"
      metaTitle="How to Import Into Canada — Step-by-Step Guide | AccessToNorth.com"
      metaDescription="Complete guide to importing goods into Canada. Business Number, CARM registration, customs clearance, HS codes, duties, and compliance requirements explained."
      canonical="https://www.accesstonorth.com/resources/how-to-import-into-canada"
      outlinePoints={[
        "Get a Business Number (BN) and import/export account from the CRA",
        "Register on the CARM Client Portal with the CBSA",
        "Classify your goods with the correct HS code",
        "Understand duty rates, GST, and provincial taxes",
        "Work with a customs broker or clearance service for release",
      ]}
      relatedLinks={[
        { label: "CARM Registration", href: "/services/carm-registration-canada" },
        { label: "Customs Duty Calculator", href: "/customs-calculator" },
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
      ]}
      ctaService="carm"
    />
  );
}
