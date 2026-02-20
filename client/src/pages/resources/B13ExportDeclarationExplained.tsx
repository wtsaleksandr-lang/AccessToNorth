import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function B13ExportDeclarationExplained() {
  return (
    <ResourceArticlePage
      title="B13 Export Declaration Explained"
      metaTitle="B13 Export Declaration — When and How to File | AccessToNorth.com"
      metaDescription="Canadian Export Declaration (B13) explained. When it's required, how to file through CERS, and penalties for non-compliance on goods leaving Canada."
      canonical="https://www.accesstonorth.com/resources/b13-export-declaration-explained"
      outlinePoints={[
        "When a B13 export declaration is required (over CA$2,000)",
        "Filing through the Canadian Export Reporting System (CERS)",
        "Exemptions: US-bound goods and specific commodities",
        "Required information: HS code, value, destination, and consignee",
        "Penalties for late or missing declarations",
      ]}
      relatedLinks={[
        { label: "B13 Export Declaration Service", href: "/services/b13-export-declaration" },
      ]}
      ctaService="b13_export"
    />
  );
}
