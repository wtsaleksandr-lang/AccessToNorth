import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function CustomsClearanceUnder2500() {
  return (
    <ResourceArticlePage
      title="Customs Clearance Under CA$2,500"
      metaTitle="LVS Customs Clearance Under CA$2,500 | AccessToNorth.com"
      metaDescription="How low-value shipments (LVS) under CA$2,500 are cleared through Canadian customs. Simplified process, documentation requirements, and when you still need a broker."
      canonical="https://www.accesstonorth.com/resources/customs-clearance-under-2500"
      lastReviewed="2026-03-10"
      intro="Shipments with a total declared value under CA$2,500 can be cleared through the Low-Value Shipment (LVS) program — a simplified CBSA process that couriers handle automatically in most cases. But LVS doesn't mean duty-free, and it doesn't apply to everything."
      outlinePoints={[
        "What qualifies as a low-value shipment (LVS) under CBSA rules",
        "Simplified documentation: commercial invoice and waybill",
        "When the courier handles clearance vs. when you need a broker",
        "Duty and GST still apply — even on low-value goods",
        "Exceptions: controlled goods, food, and regulated products",
      ]}
      sections={[
        {
          heading: "What counts as a low-value shipment",
          body: [
            "A shipment qualifies for the LVS program when the total value for duty (transaction value + freight + insurance to the border) is under CA$2,500 per consignee, per day. CBSA aggregates multiple shipments from the same sender to the same importer on the same day — you cannot split a CA$3,000 order into two CA$1,500 parcels to duck the threshold.",
            "LVS applies to both courier shipments and postal imports, but the downstream process is slightly different for each.",
          ],
        },
        {
          heading: "How LVS clearance works in practice",
          body: [
            "For courier shipments (UPS, FedEx, DHL, Purolator) the courier acts as the importer of record on the bulk release and bills you duty and GST inside their normal shipping invoice. You don't file anything directly with CBSA.",
            "For postal imports, Canada Post assesses the duty and tax and collects it on delivery. A handling fee of CA$9.95 applies to most Canada Post LVS shipments with assessed charges.",
          ],
        },
        {
          heading: "Documentation you still need to prepare",
          list: [
            "Commercial invoice — buyer, seller, goods description, unit price, total value, country of origin",
            "Waybill or airway bill — shipper, consignee, piece count, weight",
            "HS code on the invoice is strongly recommended even though the courier may reclassify",
            "For CUSMA/CPTPP/CETA preferential treatment, a valid certificate of origin",
          ],
          note: "Courier clearance under LVS is convenient, but the courier's default classification may not be optimal. If you repeat-ship the same product, work with your broker to set a correct HS code and save duty on every shipment.",
        },
        {
          heading: "When LVS does not apply",
          body: [
            "Some goods must be formally entered regardless of value: controlled goods (firearms, munitions, dual-use technology), SIMA-regulated products (subject to anti-dumping or countervailing duties), food and plants requiring CFIA inspection, and certain pharmaceuticals and medical devices.",
            "If your goods fall into any of those categories, you need a licensed customs broker or self-filed commercial entry even for a CA$500 shipment. The courier will reject the package or place it on hold until proper clearance is arranged.",
          ],
        },
        {
          heading: "Do you still owe duty and tax on LVS?",
          body: "Yes. LVS is a process simplification, not a tariff waiver. Most imports under CA$2,500 still attract duty at the applicable Canadian Customs Tariff rate plus 5% GST (and HST/PST depending on the province of import). The only LVS-adjacent exemption is the personal-use CA$20 exemption on casual imports — that does NOT apply to commercial shipments.",
        },
      ]}
      relatedLinks={[
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
        { label: "Duty Calculator", href: "/customs-calculator" },
      ]}
      ctaText="Get a clearance quote"
      ctaService="carm_portal"
    />
  );
}
