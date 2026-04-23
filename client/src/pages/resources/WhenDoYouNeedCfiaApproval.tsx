import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function WhenDoYouNeedCfiaApproval() {
  return (
    <ResourceArticlePage
      title="When Do You Need CFIA Approval?"
      metaTitle="CFIA Import Permits — When Do You Need Approval? | AccessToNorth.com"
      metaDescription="Which imports require Canadian Food Inspection Agency (CFIA) permits? Food, plants, animals, and regulated products that need pre-clearance before entering Canada."
      canonical="https://www.accesstonorth.com/resources/when-do-you-need-cfia-approval"
      lastReviewed="2026-03-19"
      intro="The Canadian Food Inspection Agency (CFIA) regulates food, plants, animals, and related products at the border. If your imports fall into any of these categories, you'll need specific permits, certificates, or a Safe Food for Canadians (SFC) licence BEFORE the shipment leaves origin. Missing approvals don't just slow clearance — they can result in rejected shipments, destruction orders, and duty owed on goods you can't actually sell."
      outlinePoints={[
        "CFIA regulates food, plants, animals, feeds, seeds, fertilizers, and some cosmetics",
        "Most food imports require a Safe Food for Canadians (SFC) licence",
        "Plant imports typically need a phytosanitary certificate from origin country",
        "Animal products need a veterinary import permit (CFIA's AIRS tells you which)",
        "Approvals must be in place BEFORE the goods arrive at the border",
      ]}
      sections={[
        {
          heading: "The AIRS tool — start here",
          body: [
            "CFIA runs a public tool called AIRS (Automated Import Reference System) at inspection.canada.ca. You enter your HS code, the country of origin, and the end use, and AIRS tells you exactly which CFIA requirements apply: licences needed, certificates required, inspection or not, and any specific conditions.",
            "Any importer of CFIA-regulated goods should run an AIRS lookup BEFORE placing the purchase order. The requirements are detailed and strict — assuming 'it's just food, how hard can it be' is how shipments end up destroyed at the border.",
          ],
          note: "AIRS is the authoritative source. A supplier saying 'we've shipped to Canada before, it's fine' is not. Country-of-origin rules change and can cascade — a salmonella outbreak in India, for example, can trigger a temporary block on all poultry from that country within days.",
        },
        {
          heading: "Food: Safe Food for Canadians (SFC) Licence",
          body: [
            "If you import food to sell commercially in Canada, you almost certainly need an SFC licence. The licence is issued by CFIA and ties to the type of activity (importing, preparing, exporting) and the commodity category (dairy, meat, fish, produce, etc.).",
            "The licence costs CA$250 and is valid for up to 2 years. You'll also need a Preventive Control Plan (PCP) for most commodities — a written document showing how you manage food safety hazards. PCPs aren't required for certain micro-sized operations, but the threshold changed in recent years and should be re-checked.",
          ],
        },
        {
          heading: "Plants: phytosanitary certificates and permits",
          body: [
            "Fresh plants, seeds, grain, cut flowers, wood packaging, and plant-based materials generally need a phytosanitary certificate issued by the plant protection authority in the origin country. Canada also maintains a Directive 2016-01 list of regulated pests — if your commodity comes from a country on the regulated list for a specific pest, additional treatment or a secondary permit may be needed.",
            "Wood packaging material (WPM) has its own rules: pallets, crates, and dunnage must be ISPM-15 heat-treated or fumigated and stamped accordingly. Non-compliant WPM is one of the most common causes of automatic CFIA holds.",
          ],
        },
        {
          heading: "Animals and animal products",
          body: [
            "Live animals and animal products (meat, dairy, eggs, leather, taxidermy, pet food) require a veterinary health certificate from the origin country and often a CFIA import permit. The permit must be applied for before shipment — lead times are typically 10–30 business days.",
            "Countries that are free of specified diseases (foot-and-mouth, classical swine fever, avian influenza, etc.) have streamlined access. Countries NOT on the approved list face outright prohibition for many animal product categories.",
          ],
        },
        {
          heading: "What happens at the border without the right paperwork",
          body: [
            "CBSA refers all CFIA-regulated shipments to the agency's electronic system. If your declaration doesn't match an active permit or certificate, the shipment is placed on hold. You can't pick up the goods, and storage fees start accumulating at the port or airport (typically CA$50–200/day).",
            "If the missing approval can't be obtained retroactively, CFIA issues a non-compliance order. Your options are: re-export to origin (at your cost), destruction (at your cost), or abandonment. In every scenario, you've paid for the goods and the freight and will get nothing back.",
          ],
        },
      ]}
      relatedLinks={[
        { label: "Import Compliance Review", href: "/services/import-compliance-review" },
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
      ]}
      ctaService="compliance_review"
    />
  );
}
