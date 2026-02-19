import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function CustomsClearanceUnder2500() {
  return (
    <ResourceArticlePage
      title="Customs Clearance Under $2,500"
      metaTitle="LVS Customs Clearance Under $2,500 CAD | AccessToNorth.com"
      metaDescription="How low-value shipments (LVS) under $2,500 CAD are cleared through Canadian customs. Simplified process, documentation requirements, and when you still need a broker."
      canonical="https://www.accesstonorth.com/resources/customs-clearance-under-2500"
      outlinePoints={[
        "What qualifies as a low-value shipment (LVS) under CBSA rules",
        "Simplified documentation: commercial invoice and waybill",
        "When the courier handles clearance vs. when you need a broker",
        "Duty and GST still apply — even on low-value goods",
        "Exceptions: controlled goods, food, and regulated products",
      ]}
      relatedLinks={[
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
        { label: "Duty Calculator", href: "/customs-calculator" },
      ]}
    />
  );
}
