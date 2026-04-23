import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function FclVsLclCostComparison() {
  return (
    <ResourceArticlePage
      title="FCL vs. LCL Cost Comparison"
      metaTitle="FCL vs. LCL Shipping — Cost Comparison for Canadian Importers | AccessToNorth.com"
      metaDescription="Full container load vs. less-than-container load shipping to Canada. Compare costs, transit times, and when each option makes sense for your imports."
      canonical="https://www.accesstonorth.com/resources/fcl-vs-lcl-cost-comparison"
      lastReviewed="2026-03-16"
      intro="Most Canadian importers picking between a full container (FCL) and a shared consolidation (LCL) make the choice on gut feel and end up overspending. The math is actually simple: FCL pricing is flat per container, LCL is priced per cubic meter. The break-even sits around 12–15 CBM depending on origin, freight rates, and how much extra you'll pay for LCL deconsolidation fees in Canada."
      outlinePoints={[
        "FCL is a flat rate for the whole container (20', 40', 40' HC)",
        "LCL is priced per CBM (cubic meter), with a minimum charge of 1 CBM",
        "Break-even is roughly 12–15 CBM from Asia to Canadian west coast ports",
        "LCL adds deconsolidation, sorting, and warehouse fees in Canada (CA$200–500 per shipment)",
        "Transit time for LCL is often 1–2 weeks LONGER than FCL on the same route",
      ]}
      sections={[
        {
          heading: "FCL — how pricing really works",
          body: [
            "A 20-foot container holds about 28 CBM of usable cargo; a 40-foot holds about 58 CBM; a 40-foot high-cube holds about 68 CBM. You pay one all-in ocean-freight rate plus origin/destination charges, regardless of whether you fill the container.",
            "On the Shanghai–Vancouver lane, 40' HC spot rates in 2026 are typically CA$2,500–5,000 all-in. At 50 CBM of cargo, that's roughly CA$50–100 per CBM — and the container is exclusively yours.",
          ],
        },
        {
          heading: "LCL — per-CBM pricing plus hidden costs",
          body: [
            "LCL (less-than-container load) ocean rates run CA$80–180 per CBM from major Asian origins to Canadian ports, with a 1 CBM minimum. Sounds cheap at low volume — it is, below about 10 CBM.",
            "The catch: at the destination port, LCL consolidations go through a CFS (container freight station) where your pallet gets separated from the other shippers' cargo. That adds CA$100–300 in deconsolidation, CA$50–150 in handling, and often CA$50+ per day in warehouse storage if you don't pick up within 3 days.",
          ],
          note: "When comparing FCL and LCL quotes, ask for the ALL-IN number delivered to your Canadian warehouse, not just ocean freight. LCL deconsolidation fees are where quotes tend to balloon.",
        },
        {
          heading: "Break-even math",
          body: [
            "Rough rule: if your shipment is under 12 CBM, LCL almost always wins. 12–18 CBM is the grey zone where it depends on origin lane, rate volatility, and whether you can wait. Over 18 CBM, FCL is usually cheaper AND faster.",
            "Worked example: 15 CBM from Shanghai. LCL at CA$120/CBM = CA$1,800 ocean + CA$400 deconsolidation + CA$200 handling = CA$2,400. 20' FCL at CA$2,200 all-in. Close to a wash — but FCL is a week faster and you avoid the CFS risk.",
          ],
        },
        {
          heading: "Transit time and damage risk",
          body: [
            "FCL: loaded at origin, stays sealed until it arrives at your deconsolidation point or warehouse. Transit is the ocean journey plus 3–5 days for clearance and drayage.",
            "LCL: your pallet sits at an origin consolidation warehouse (up to a week), travels with 20+ other shippers' cargo, and waits again at destination CFS. Damage claims are harder to resolve because the chain of custody is shared, and it's rarely clear whose pallet crushed yours.",
          ],
        },
        {
          heading: "When LCL is unambiguously the right call",
          list: [
            "Occasional small-volume imports (under 5 CBM) with flexible timelines",
            "Sample shipments or first orders when you're still validating the supplier",
            "Seasonal top-up inventory where FCL would sit in a warehouse for months",
            "Air freight is too expensive and you don't care about 1–2 extra weeks of transit",
          ],
        },
      ]}
      relatedLinks={[
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
        { label: "Freight Quote", href: "/tools/freight-quote" },
      ]}
      ctaService="carm_portal"
    />
  );
}
