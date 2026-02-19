import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function FclVsLclCostComparison() {
  return (
    <ResourceArticlePage
      title="FCL vs. LCL Cost Comparison"
      metaTitle="FCL vs. LCL Shipping — Cost Comparison for Canadian Importers | AccessToNorth.com"
      metaDescription="Full container load vs. less-than-container load shipping to Canada. Compare costs, transit times, and when each option makes sense for your imports."
      canonical="https://www.accesstonorth.com/resources/fcl-vs-lcl-cost-comparison"
      outlinePoints={[
        "FCL: full container load — pricing, transit times, and benefits",
        "LCL: less-than-container load — when it saves money",
        "Break-even analysis: volume thresholds for FCL vs. LCL",
        "Additional costs: drayage, deconsolidation, storage",
        "How to optimize your shipping strategy",
      ]}
      relatedLinks={[
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
        { label: "Freight Quote", href: "/tools/freight-quote" },
      ]}
      ctaService="carm_portal"
    />
  );
}
