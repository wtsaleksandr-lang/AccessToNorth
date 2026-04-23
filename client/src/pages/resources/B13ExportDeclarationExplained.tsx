import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function B13ExportDeclarationExplained() {
  return (
    <ResourceArticlePage
      title="B13 Export Declaration Explained"
      metaTitle="B13 Export Declaration — When and How to File | AccessToNorth.com"
      metaDescription="Canadian Export Declaration (B13) explained. When it's required, how to file through CERS, and penalties for non-compliance on goods leaving Canada."
      canonical="https://www.accesstonorth.com/resources/b13-export-declaration-explained"
      lastReviewed="2026-03-08"
      intro="Most Canadian exporters don't realize they need to file an export declaration until they get a penalty notice. If you ship commercial goods out of Canada worth CA$2,000 or more (and they're not going to the US), you're legally required to file through CERS — the Canadian Export Reporting System — before the goods leave the country. Here's what's required, what's exempt, and what it costs to get wrong."
      outlinePoints={[
        "Commercial goods CA$2,000+ bound for anywhere except the US must be reported",
        "Filing is done electronically through CERS — paper B13A was phased out in 2020",
        "Reporting timeframes vary by mode: 2 hours before air, 48 hours before vessel",
        "US-bound shipments are generally exempt (NAFTA/CUSMA carve-out)",
        "AMPS penalties for non-compliance start at CA$250 and escalate quickly",
      ]}
      sections={[
        {
          heading: "When a declaration is required",
          body: [
            "The threshold is CA$2,000 per commercial shipment. Goods below that value are exempt from reporting regardless of destination. Above it, you must file unless the shipment qualifies for a specific exemption (most commonly, US-bound goods under CUSMA).",
            "The declaration is required BEFORE export. Filing after the goods leave is a late report and generates an automatic penalty notice.",
          ],
        },
        {
          heading: "US-bound exports — the big carve-out",
          body: [
            "Canada and the US share trade data under CUSMA, so commercial goods exported to the US generally don't need a B13 declaration. The US side captures the movement through the Automated Export System (AES). Most exporters selling into the US never interact with CERS.",
            "Exceptions: controlled goods (firearms, munitions, some dual-use technology) still require an export permit and a declaration even if destined for the US. Goods transiting through the US to a third country also need a Canadian declaration — the US is a transit point, not the final destination.",
          ],
          note: "If you're exporting from Canada to the US and then onward (e.g., Canada → US port → Europe), you need a B13 declaration. CBSA treats transit-through-US shipments as exports to the final third-country destination.",
        },
        {
          heading: "What you file in CERS",
          list: [
            "Canadian exporter identifier (Business Number + RM account)",
            "Consignee name and address in the destination country",
            "Full HS code (10-digit)",
            "Description of goods, quantity, and unit of measure",
            "Value in Canadian dollars and currency of sale",
            "Mode of transport and departure port / airport / border crossing",
            "Proposed date of export",
          ],
        },
        {
          heading: "Reporting timeframes",
          body: [
            "Marine: declaration must be submitted to CBSA at least 48 hours before the vessel loads. Air: 2 hours before departure. Rail: 2 hours before the train arrives at the border. Highway: immediately before export.",
            "Shipments of controlled goods have stricter advance-notice requirements — often several days — to allow CBSA and Global Affairs Canada to review the export permit.",
          ],
        },
        {
          heading: "Penalties for missing or late declarations",
          body: [
            "CBSA enforces B13 compliance through the Administrative Monetary Penalty System (AMPS). First-level penalties start at CA$250 for a missed declaration. Repeat offenders escalate to CA$400, then CA$750 per incident, and high-value or controlled-goods violations can hit CA$25,000.",
            "Beyond AMPS, non-compliance puts your exporter record at risk. CBSA may flag your shipments for targeted inspection, which means longer clearance times and more demurrage charges on everything you ship.",
          ],
        },
      ]}
      relatedLinks={[
        { label: "B13 Export Declaration Service", href: "/services/b13-export-declaration" },
      ]}
      ctaService="b13_export"
    />
  );
}
