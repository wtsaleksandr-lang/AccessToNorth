import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function IncotermsForCanadianImporters() {
  return (
    <ResourceArticlePage
      title="Incoterms for Canadian Importers"
      metaTitle="Incoterms for Canadian Importers — FOB, CIF, DDP Explained | AccessToNorth.com"
      metaDescription="How Incoterms like FOB, CIF, EXW, and DDP affect Canadian importers. Learn which shipping terms determine your duty, insurance, and delivery responsibilities."
      canonical="https://www.accesstonorth.com/resources/incoterms-for-canadian-importers"
      lastReviewed="2026-03-14"
      intro="Incoterms — International Commercial Terms published by the ICC — define who pays for freight, who carries risk, and who handles customs at each leg of an international shipment. For Canadian importers, picking the wrong Incoterm can add 5–15% to your landed cost without changing anything on the invoice. Here's what each term actually means in practice."
      outlinePoints={[
        "Incoterms define the BUYER/SELLER split on freight, insurance, duty, and risk transfer",
        "EXW and FCA put maximum control (and responsibility) on the Canadian importer",
        "CIF includes freight and insurance to the destination port — but NOT duty or delivery",
        "DDP is the only term where the seller handles Canadian duty, tax, and delivery",
        "Your Incoterm drives the value-for-duty CBSA uses to calculate what you owe",
      ]}
      sections={[
        {
          heading: "EXW — Ex Works (seller's factory)",
          body: [
            "Under EXW, the seller makes the goods available at their own premises. The buyer pays for everything from there: inland freight to the origin port, export clearance, ocean freight, insurance, Canadian customs, duty, GST, and delivery to the warehouse.",
            "EXW gives the importer maximum visibility and often the lowest total cost if you have a strong freight forwarder — you're not marking up the seller's freight margin. But it also means you own every problem from the factory floor onward.",
          ],
        },
        {
          heading: "FOB and FCA — port-loaded terms",
          body: [
            "FOB (Free On Board) is the classic ocean-freight term: the seller delivers goods to the origin port and loads them on the vessel. Risk transfers at the ship's rail. Buyer pays ocean freight, insurance, Canadian clearance, and delivery.",
            "FCA (Free Carrier) is the modern equivalent and works for any mode of transport including air and container freight. Seller hands off to the buyer's nominated carrier — usually at the origin port, airport, or terminal.",
          ],
          note: "If you see FOB used for containerized or air freight, the underlying contract is often more like FCA. Ask your forwarder to clarify who holds risk during terminal handling — insurance claims depend on it.",
        },
        {
          heading: "CIF and CIP — seller pays freight and insurance to destination",
          body: [
            "CIF (Cost, Insurance, Freight) and CIP (Carriage and Insurance Paid) both include ocean freight and a minimum insurance policy to the named destination. CIF is for sea freight only; CIP works for any mode.",
            "Important nuance: risk STILL transfers at origin under CIF/CIP, even though the seller pays the freight. If the container is lost at sea, the CANADIAN importer makes the insurance claim, not the seller.",
          ],
        },
        {
          heading: "DAP, DPU, and DDP — delivered terms",
          list: [
            "DAP (Delivered At Place) — seller delivers to the buyer's location but the buyer still handles import clearance, duty, and tax",
            "DPU (Delivered at Place Unloaded) — same as DAP but the seller also unloads",
            "DDP (Delivered Duty Paid) — seller handles EVERYTHING including Canadian duty, GST, and delivery to your door",
          ],
          note: "DDP to Canada is legally fine but operationally tricky: the seller needs a Canadian Business Number and CARM registration to act as importer of record. Many US/overseas sellers who quote DDP are actually shipping DAP and padding the price — verify before accepting.",
        },
        {
          heading: "How Incoterms affect your CBSA valuation",
          body: [
            "CBSA uses the Transaction Value method for most imports — the price actually paid or payable for the goods when sold for export to Canada. Freight and insurance to the border are added (if they're not already in the price) to get value for duty.",
            "Under FOB, the invoice price doesn't include ocean freight, so the broker adds freight to value for duty. Under CIF, it's already included. Duty is calculated on the same landed base either way — but the paperwork trail is different, and mistakes are common.",
          ],
        },
      ]}
      relatedLinks={[
        { label: "Customs Duty Calculator", href: "/customs-calculator" },
        { label: "Import Compliance Review", href: "/services/import-compliance-review" },
      ]}
      ctaService="compliance_review"
    />
  );
}
