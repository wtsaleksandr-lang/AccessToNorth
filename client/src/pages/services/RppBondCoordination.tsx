import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Scale } from "lucide-react";

export default function RppBondCoordination() {
  return (
    <ServiceDetailPage
      title="RPP / Bond Coordination"
      subtitle="Release Prior to Payment program setup and surety bond coordination for Canadian importers."
      metaTitle="RPP & Bond Coordination | AccessToNorth.com"
      metaDescription="Release Prior to Payment (RPP) program setup and surety bond coordination for Canadian importers. Reduce delays and manage cash flow."
      canonical="https://www.accesstonorth.com/services/rpp-bond-coordination"
      icon={Scale}
      whatsIncluded={[
        "RPP program eligibility assessment",
        "Surety bond application coordination",
        "Bond amount calculation and optimization",
        "CBSA security deposit management",
        "Ongoing bond renewal monitoring",
        "Cash flow optimization through RPP participation",
      ]}
      toolLink={{
        label: "CARM Financial Security Calculator",
        href: "/carm-security-calculator",
      }}
      ctaService="rpp-bond"
      additionalInfo="The Release Prior to Payment (RPP) program allows importers to receive their goods before paying duties and taxes, improving cash flow. A surety bond is typically required to participate."
    />
  );
}
