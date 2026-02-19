import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function IncotermsForCanadianImporters() {
  return (
    <ResourceArticlePage
      title="Incoterms for Canadian Importers"
      metaTitle="Incoterms for Canadian Importers — FOB, CIF, DDP Explained | AccessToNorth.com"
      metaDescription="How Incoterms like FOB, CIF, EXW, and DDP affect Canadian importers. Learn which shipping terms determine your duty, insurance, and delivery responsibilities."
      canonical="https://www.accesstonorth.com/resources/incoterms-for-canadian-importers"
      outlinePoints={[
        "What are Incoterms and why they matter for importers",
        "FOB vs. CIF vs. DDP — key differences",
        "How your Incoterm affects customs valuation and duty calculation",
        "EXW, FCA, and other common terms explained",
        "Choosing the right Incoterm for your supply chain",
      ]}
      relatedLinks={[
        { label: "Customs Duty Calculator", href: "/customs-calculator" },
        { label: "Import Compliance Review", href: "/services/import-compliance-review" },
      ]}
      ctaService="compliance_review"
    />
  );
}
