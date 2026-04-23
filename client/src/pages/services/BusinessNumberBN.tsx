import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Building2 } from "lucide-react";

export default function BusinessNumberBN() {
  return (
    <ServiceDetailPage
      title="Business Number (BN) Registration"
      subtitle="Get your 9-digit Business Number from the CRA — the foundation for all Canadian tax accounts."
      metaTitle="Business Number (BN) Registration | AccessToNorth.com"
      metaDescription="Register for a CRA Business Number (BN) quickly and correctly. Required for GST/HST, payroll, import/export, and corporate tax accounts. From CA$99."
      canonical="https://www.accesstonorth.com/services/business-number-bn"
      icon={Building2}
      whatsIncluded={[
        "CRA Business Number (BN) application and submission",
        "Correct entity type classification",
        "Official CRA acknowledgement documentation",
        "Digital filing — no paper forms required",
        "Follow-up with CRA on your behalf if needed",
      ]}
      ctaService="bn"
      priceCAD={99}
      additionalInfo="A Business Number is required before you can open GST/HST, payroll, import/export, or corporate income tax accounts with the CRA. Processing typically takes 5–10 business days."
      sampleDeliverable={{
        title: "CRA Business Number confirmation",
        fields: [
          { label: "Business Number", value: "12345 6789 RC0001" },
          { label: "Legal name", value: "Maple Trade Co." },
          { label: "Entity type", value: "Sole Proprietorship" },
          { label: "Effective date", value: "Apr 2026" },
        ],
        footerNote: "Sample deliverable for illustration. Actual BN numbers are issued by the CRA.",
      }}
    />
  );
}
