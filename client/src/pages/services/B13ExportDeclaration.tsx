import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { FileText } from "lucide-react";

export default function B13ExportDeclaration() {
  return (
    <ServiceDetailPage
      title="B13 Export Declaration"
      subtitle="Canadian Export Declaration (B13) filing for goods leaving Canada. Required for shipments over CA$2,000."
      metaTitle="B13 Export Declaration Filing | AccessToNorth.com"
      metaDescription="Professional B13 Canadian Export Declaration filing. Required for exports over CA$2,000. Accurate, timely submissions to CBSA."
      canonical="https://www.accesstonorth.com/services/b13-export-declaration"
      icon={FileText}
      whatsIncluded={[
        "B13 Export Declaration preparation and filing",
        "Export permit verification (where applicable)",
        "HS code classification for export goods",
        "CAED (Canadian Automated Export Declaration) submission",
        "Export compliance documentation review",
        "Post-filing confirmation and records retention",
      ]}
      ctaService="b13_export"
      priceCAD={125}
      additionalInfo="Canadian law requires an export declaration for most goods valued over CA$2,000 leaving Canada. Controlled goods, technology, and certain commodities may require export permits regardless of value."
    />
  );
}
