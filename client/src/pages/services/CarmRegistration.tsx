import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Landmark } from "lucide-react";

export default function CarmRegistration() {
  return (
    <ServiceDetailPage
      title="CARM Registration"
      subtitle="Complete CARM portal registration and onboarding for importers. Business Number, import account, and delegation setup."
      metaTitle="CARM Portal Registration | AccessToNorth.com"
      metaDescription="End-to-end CARM registration for Canadian importers. BN setup, RM import account, portal onboarding, and delegate management."
      canonical="https://www.accesstonorth.com/services/carm-registration-canada"
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
      additionalInfo="CARM is mandatory for all commercial importers in Canada. If you import goods, you need to be registered and compliant with the new system."
    />
  );
}
