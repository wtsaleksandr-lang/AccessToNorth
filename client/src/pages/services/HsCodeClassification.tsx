import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { FileCheck } from "lucide-react";

export default function HsCodeClassification() {
  return (
    <ServiceDetailPage
      title="HS Code Classification"
      subtitle="Professional tariff classification for your products. Accurate HS codes to avoid penalties and duty overpayment."
      metaTitle="HS Code Classification Canada | AccessToNorth.com"
      metaDescription="Professional HS tariff classification services for Canadian importers. Accurate codes, duty optimization, and CBSA-compliant classification."
      canonical="https://www.accesstonorth.com/services/hs-code-classification-canada"
      icon={FileCheck}
      whatsIncluded={[
        "Product analysis and technical review",
        "10-digit HS tariff classification determination",
        "Applicable tariff treatment identification (MFN, CUSMA, etc.)",
        "Written classification rationale for your records",
        "CBSA ruling request preparation (if needed)",
        "Ongoing classification support for new products",
      ]}
      toolLink={{
        label: "HS Code Finder (built into Customs Calculator)",
        href: "/customs-calculator",
      }}
      ctaService="hs_classification"
      additionalInfo="Incorrect HS codes are one of the most common reasons for CBSA audits and penalties. Our classifications are based on the Canadian Customs Tariff and CBSA interpretation guidelines."
    />
  );
}
