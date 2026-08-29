import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Package } from "lucide-react";

export default function CustomsClearanceCanada() {
  return (
    <ServiceDetailPage
      title="Canadian Customs Clearance Coordination"
      subtitle="End-to-end customs clearance coordination for commercial imports into Canada — we prepare your declaration paperwork, your licensed customs broker files it with CBSA. Flat-rate pricing, transparent process."
      metaTitle="Canadian Customs Clearance Coordination | AccessToNorth.com"
      metaDescription="Professional customs clearance coordination for Canadian imports — we prepare declaration paperwork for filing by your licensed broker. Flat-rate pricing from CA$145. LVS, commercial, and compliance review packages available."
      canonical="https://www.accesstonorth.com/services/customs-clearance-canada"
      icon={Package}
      whatsIncluded={[
        "Pre-arrival document review and compliance check",
        "CBSA customs declaration paperwork prepared (B3 or B3-3) for filing by your licensed broker",
        "Duty and tax calculation with correct tariff classification",
        "Release coordination with your broker and carrier for cargo pickup",
        "Post-clearance documentation package",
        "Dedicated clearance coordinator for your shipment",
      ]}
      toolLink={{
        label: "Customs Duty & Tax Calculator",
        href: "/customs-calculator",
      }}
      ctaService="customs_clearance"
      additionalInfo="We offer three flat-rate clearance coordination packages: CLVS Coordination (CA$145 for eligible courier shipments up to CA$3,300), Commercial Import Coordination (CA$295 for shipments over CA$3,300 or requiring formal entry), and Clearance Coordination + Compliance Review (CA$395 for full audit). AccessToNorth is not a licensed customs broker; we coordinate with your broker (or introduce you to a vetted partner if you don't have one) who files the declaration with CBSA. Visit our Customs Clearance page for details."
    />
  );
}
