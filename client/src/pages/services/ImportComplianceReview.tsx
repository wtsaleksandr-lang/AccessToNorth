import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Shield } from "lucide-react";

export default function ImportComplianceReview() {
  return (
    <ServiceDetailPage
      title="Import Compliance Review"
      subtitle="Comprehensive audit of your import operations to identify risks, reduce duties, and ensure CBSA compliance."
      metaTitle="Import Compliance Review | AccessToNorth.com"
      metaDescription="Full compliance audit for Canadian importers. Tariff classification review, valuation analysis, origin verification, and CBSA risk assessment."
      canonical="https://www.accesstonorth.com/services/import-compliance-review"
      icon={Shield}
      whatsIncluded={[
        "Full tariff classification audit across your product catalog",
        "Customs valuation methodology review",
        "Country of origin verification and certificate review",
        "CBSA compliance risk assessment",
        "Trade agreement eligibility analysis (CUSMA, CPTPP, CETA)",
        "Detailed compliance report with actionable recommendations",
        "Follow-up consultation to implement changes",
      ]}
      toolLink={{
        label: "Customs Duty & Tax Calculator",
        href: "/customs-calculator",
      }}
      ctaService="compliance-review"
      additionalInfo="A compliance review can uncover duty savings opportunities and reduce the risk of CBSA audits, penalties, and shipment delays."
    />
  );
}
