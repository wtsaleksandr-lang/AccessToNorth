import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function HsCodeVsTariffTreatment() {
  return (
    <ResourceArticlePage
      title="HS Code vs. Tariff Treatment"
      metaTitle="HS Code vs. Tariff Treatment — What's the Difference? | AccessToNorth.com"
      metaDescription="Understanding the difference between HS code classification and tariff treatment in Canadian customs. How trade agreements affect your duty rate."
      canonical="https://www.accesstonorth.com/resources/hs-code-vs-tariff-treatment"
      outlinePoints={[
        "HS code: classifying what the product is (10-digit code)",
        "Tariff treatment: which duty rate applies based on country of origin",
        "MFN, UST, CPTPP, CETA — common Canadian trade agreements",
        "How to prove origin for preferential tariff treatment",
        "When misclassification leads to overpayment or penalties",
      ]}
      relatedLinks={[
        { label: "HS Code Classification", href: "/services/hs-code-classification-canada" },
        { label: "Duty Calculator", href: "/customs-calculator" },
      ]}
      ctaService="hs_classification"
    />
  );
}
