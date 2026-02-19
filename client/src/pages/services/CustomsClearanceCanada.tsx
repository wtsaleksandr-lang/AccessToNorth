import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Package } from "lucide-react";

export default function CustomsClearanceCanada() {
  return (
    <ServiceDetailPage
      title="Canadian Customs Clearance"
      subtitle="End-to-end customs clearance for commercial imports into Canada. Flat-rate pricing, transparent process."
      metaTitle="Canadian Customs Clearance Services | AccessToNorth.com"
      metaDescription="Professional customs clearance for Canadian imports. Flat-rate pricing from $145 CAD. LVS, commercial, and compliance review packages available."
      canonical="https://www.accesstonorth.com/services/customs-clearance-canada"
      icon={Package}
      whatsIncluded={[
        "Pre-arrival document review and compliance check",
        "CBSA customs declaration filing (B3 or B3-3)",
        "Duty and tax calculation with correct tariff classification",
        "Release authorization and cargo pickup coordination",
        "Post-clearance documentation package",
        "Dedicated clearance specialist for your shipment",
      ]}
      toolLink={{
        label: "Customs Duty & Tax Calculator",
        href: "/customs-calculator",
      }}
      ctaService="customs_clearance"
      additionalInfo="We offer three flat-rate clearance packages: LVS ($145 CAD for shipments under $2,500), Commercial Import ($295 CAD for shipments over $2,500), and Clearance + Compliance Review ($395 CAD for full audit). Visit our Customs Clearance page for details."
    />
  );
}
