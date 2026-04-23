import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function WhatIsSimaDuty() {
  return (
    <ResourceArticlePage
      title="What Is SIMA Duty?"
      metaTitle="What Is SIMA Duty? Anti-Dumping & Countervailing Duties | AccessToNorth.com"
      metaDescription="Understand SIMA duties in Canada — anti-dumping and countervailing measures that protect Canadian industries. Learn when they apply and how to check your products."
      canonical="https://www.accesstonorth.com/resources/what-is-sima-duty"
      lastReviewed="2026-03-12"
      intro="SIMA duties — short for Special Import Measures Act duties — are additional trade-remedy duties that Canada imposes on goods sold into Canada at unfairly low prices or with foreign government subsidies. If your product falls under an active SIMA measure, you could owe an extra 10–200% in duty on top of the normal tariff rate."
      outlinePoints={[
        "SIMA is Canada's anti-dumping and countervailing duty regime, administered by CBSA and the CITT",
        "Measures target specific products from specific countries — always check both",
        "SIMA duty is added on top of regular duty, GST, and any other taxes",
        "The CBSA Measures in Force list is the authoritative source for active cases",
        "Misclassified SIMA goods trigger re-assessments and penalties up to 2 years later",
      ]}
      sections={[
        {
          heading: "The two types of SIMA duty",
          body: [
            "Anti-dumping duty applies when a foreign producer sells a product into Canada at a price below its fair market value (usually the selling price in its home market). The CBSA investigates, and if the Canadian International Trade Tribunal (CITT) finds injury to a Canadian industry, a duty is imposed to bring the import price back to fair value.",
            "Countervailing duty applies when a foreign government subsidizes a product — grants, tax breaks, below-market loans — and that subsidy lets the producer undercut Canadian competitors. The duty equals the amount of the subsidy.",
          ],
        },
        {
          heading: "How to check if your product is covered",
          body: [
            "CBSA publishes a public list called Measures in Force. It lists every active SIMA case by product, HS code, and country of origin. If your HS code and country of origin both appear on an active case, you almost certainly owe SIMA duty.",
            "Common active cases include steel products from China and Vietnam, refined sugar from multiple countries, upholstered furniture from China and Vietnam, and various copper, aluminum, and wire products.",
          ],
          note: "SIMA duties target products AND countries. The same HS code from a different country of origin may be duty-free. Origin certification is critical.",
        },
        {
          heading: "Impact on landed cost",
          body: [
            "SIMA duty is calculated on the value for duty (typically transaction value) and added to the normal most-favoured-nation duty rate. A product with a 6% MFN rate and a 40% anti-dumping duty lands at 46% total duty before GST.",
            "The duty is payable in cash or against your CARM financial security. If you miss or under-declare a SIMA assessment, CBSA can re-assess up to 2 years later and you'll owe the differential plus interest and potentially administrative penalties under AMPS (up to CA$25,000 per violation).",
          ],
        },
        {
          heading: "Reviews, appeals, and normal-value determinations",
          body: [
            "If you believe you've been assessed incorrectly, you can file a request for re-determination within 90 days. For ongoing shipments, exporters can apply for a normal-value determination, which sets a specific per-unit price threshold above which SIMA duty does not apply.",
            "Active SIMA measures expire after 5 years unless renewed by the CITT through an expiry review. Keep an eye on reviews — an expired measure can cut your landed cost immediately.",
          ],
        },
      ]}
      relatedLinks={[
        { label: "Import Compliance Review", href: "/services/import-compliance-review" },
        { label: "HS Code Classification", href: "/services/hs-code-classification-canada" },
      ]}
      ctaService="compliance_review"
    />
  );
}
