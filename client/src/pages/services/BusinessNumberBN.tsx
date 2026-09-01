import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Building2 } from "lucide-react";

export default function BusinessNumberBN() {
  return (
    <ServiceDetailPage
      title="Business Number (BN) Registration"
      subtitle="Get your 9-digit Business Number from the CRA — the foundation for all Canadian tax accounts."
      metaTitle="CRA Business Number Registration Canada (BN9) | AccessToNorth.com"
      metaDescription="Register or confirm a Canadian CRA Business Number (BN9) and the program accounts your business actually needs, including GST/HST, payroll, corporate tax, and import-export."
      canonical="https://accesstonorth.com/services/business-number-bn"
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
      additionalInfo="A Business Number identifies the legal entity. GST/HST, payroll, corporate income tax, and import-export activity use separate program accounts connected to that BN. Processing time depends on the entity and registration route."
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
