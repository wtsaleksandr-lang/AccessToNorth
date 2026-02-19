import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function WhenDoYouNeedCfiaApproval() {
  return (
    <ResourceArticlePage
      title="When Do You Need CFIA Approval?"
      metaTitle="CFIA Import Permits — When Do You Need Approval? | AccessToNorth.com"
      metaDescription="Which imports require Canadian Food Inspection Agency (CFIA) permits? Food, plants, animals, and regulated products that need pre-clearance before entering Canada."
      canonical="https://www.accesstonorth.com/resources/when-do-you-need-cfia-approval"
      outlinePoints={[
        "Overview of CFIA's role in Canadian imports",
        "Food products: when you need an SFC licence",
        "Plants and plant products: phytosanitary certificates",
        "Animal products and veterinary import permits",
        "How CFIA holds affect your customs clearance timeline",
      ]}
      relatedLinks={[
        { label: "Import Compliance Review", href: "/services/import-compliance-review" },
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
      ]}
      ctaService="compliance_review"
    />
  );
}
