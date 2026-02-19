import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Building2 } from "lucide-react";

export default function BusinessNumberBN() {
  return (
    <ServiceDetailPage
      title="Business Number (BN) Registration"
      subtitle="Get your 9-digit Business Number from the CRA — the foundation for all Canadian tax accounts."
      metaTitle="Business Number (BN) Registration | AccessToNorth.com"
      metaDescription="Register for a CRA Business Number (BN) quickly and correctly. Required for GST/HST, payroll, import/export, and corporate tax accounts. From $99 CAD."
      canonical="https://www.accesstonorth.com/services/business-number-bn"
      icon={Building2}
      whatsIncluded={[
        "CRA Business Number (BN) application and submission",
        "Correct entity type classification",
        "Official CRA acknowledgement documentation",
        "Digital filing — no paper forms required",
        "Follow-up with CRA on your behalf if needed",
      ]}
      ctaService="business-number"
      additionalInfo="A Business Number is required before you can open GST/HST, payroll, import/export, or corporate income tax accounts with the CRA. Processing typically takes 5–10 business days."
    />
  );
}
