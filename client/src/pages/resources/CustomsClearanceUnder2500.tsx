import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function CustomsClearanceUnder3300() {
  return (
    <ResourceArticlePage
      title="Courier Low-Value Clearance Up to CA$3,300"
      metaTitle="CLVS Customs Clearance Under CA$3,300 | AccessToNorth.com"
      metaDescription="How eligible courier low-value shipments (CLVS) up to CA$3,300 are released in Canada, including documentation, duty and tax, exclusions, and broker involvement."
      canonical="/resources/customs-clearance-under-3300"
      datePublished="2026-03-10"
      lastReviewed="2026-08-28"
      intro="Eligible courier shipments with a value for duty not exceeding CA$3,300 may be released through the CBSA Courier Low Value Shipment (CLVS) program. It is a simplified courier process—not a duty-free exemption—and some goods are excluded."
      outlinePoints={[
        "What qualifies for the Courier Low Value Shipment (CLVS) program",
        "Simplified documentation: commercial invoice and waybill",
        "When the courier handles clearance vs. when you need a broker",
        "Duty and GST still apply — even on low-value goods",
        "Exceptions: controlled goods, food, and regulated products",
      ]}
      sections={[
        {
          heading: "What qualifies as a courier low-value shipment",
          body: [
            "A qualified shipment can use CLVS when its estimated value for duty does not exceed CA$3,300 and it is transported by an approved courier participant. A shipment above the threshold cannot be divided into smaller shipments to qualify.",
            "CLVS is specifically a courier program. Postal and non-courier commercial shipments follow their applicable CBSA release and accounting processes.",
          ],
        },
        {
          heading: "How LVS clearance works in practice",
          body: [
            "An approved courier submits release information to CBSA through the CLVS process and usually arranges accounting through its brokerage operation. The named importer remains responsible for accurate value, origin, classification, and supporting documents.",
            "The courier may bill duty, GST, brokerage, and disbursement fees to the importer or receiver depending on the shipping terms and account setup.",
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
            "Goods subject to controls, permits, certificates, excise requirements, or another government department's review may be excluded from CLVS or held for formal processing. Examples can include alcohol, tobacco, firearms, certain food or plant products, and regulated health products.",
            "Ask the courier or customs broker to confirm eligibility before shipping regulated goods. Low value by itself does not override import requirements.",
          ],
        },
        {
          heading: "Do you still owe duty and tax on LVS?",
          body: "Yes. CLVS simplifies release and accounting; it does not automatically remove customs duty or GST. The amount depends on tariff classification, origin, value, and whether a specific relief provision applies.",
        },
      ]}
      relatedLinks={[
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
        { label: "Duty Calculator", href: "/customs-calculator" },
      ]}
      sourceLinks={[
        { label: "CBSA — CLVS threshold and accounting", href: "https://www.cbsa-asfc.gc.ca/services/cusma-aceum/lvs-efv-eng.html" },
        { label: "CBSA Memorandum D17-4-0 — Courier Low Value Shipment Program", href: "https://www.cbsa-asfc.gc.ca/publications/dm-md/d17/d17-4-0-eng.html" },
      ]}
      ctaText="Get a clearance quote"
      ctaService="carm_portal"
    />
  );
}
