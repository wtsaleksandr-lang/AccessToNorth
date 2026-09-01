import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Landmark } from "lucide-react";

export default function CarmRegistration() {
  return (
    <ServiceDetailPage
      title="CARM Registration"
      subtitle="Complete CARM portal registration and onboarding for importers. Business Number, import account, and delegation setup."
      metaTitle="CARM Registration Canada for Importers | AccessToNorth.com"
      metaDescription="CARM registration support for Canadian and non-resident importers: BN and RM review, business onboarding, broker delegation, RPP screening, and security guidance."
      canonical="https://accesstonorth.com/services/carm-registration-canada"
      icon={Landmark}
      whatsIncluded={[
        "CRA Business Number (BN) registration or verification",
        "RM import/export program account setup",
        "CARM Client Portal onboarding and activation",
        "Delegate access configuration for your customs broker",
        "Financial security assessment and guidance",
        "CARM portal training and walkthrough",
      ]}
      toolLink={{
        label: "CARM Financial Security Calculator",
        href: "/carm-security-calculator",
      }}
      ctaService="carm_portal"
      priceCAD={499}
      additionalInfo="CARM is CBSA's system of record for commercial import accounting and payment. Importers must register their own business before delegating access; RPP enrolment and financial security are separate decisions."
      sampleDeliverable={{
        title: "CARM Client Portal activation",
        fields: [
          { label: "Business Number", value: "12345 6789 RM0001" },
          { label: "Import Account", value: "RM — Active" },
          { label: "Portal status", value: "Onboarded & Delegated" },
          { label: "Broker delegate", value: "Linked" },
        ],
        footerNote: "Sample deliverable for illustration. Actual import accounts are issued by CBSA.",
      }}
    />
  );
}
