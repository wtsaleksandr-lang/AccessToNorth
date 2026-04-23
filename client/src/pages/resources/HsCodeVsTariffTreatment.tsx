import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function HsCodeVsTariffTreatment() {
  return (
    <ResourceArticlePage
      title="HS Code vs. Tariff Treatment"
      metaTitle="HS Code vs. Tariff Treatment — What's the Difference? | AccessToNorth.com"
      metaDescription="Understanding the difference between HS code classification and tariff treatment in Canadian customs. How trade agreements affect your duty rate."
      canonical="https://www.accesstonorth.com/resources/hs-code-vs-tariff-treatment"
      lastReviewed="2026-03-18"
      intro="These two terms get confused all the time, and the mistake costs importers money. Your HS code answers what the product IS. The tariff treatment answers which duty rate applies based on WHERE it came from. You need both to calculate landed cost correctly."
      outlinePoints={[
        "HS code identifies the product — it's the same worldwide at the 6-digit level",
        "Tariff treatment is the duty rate tied to the country of origin under a trade agreement",
        "Canada has two-dozen tariff treatments: MFN, UST, CPTPP, CETA, CCFTA, GPT, LDCT, and more",
        "The same HS code can attract 0% duty under CUSMA and 18% duty at MFN — origin paperwork decides",
        "Missing a preferential-treatment claim is one of the most common forms of duty overpayment",
      ]}
      sections={[
        {
          heading: "HS code — what the product is",
          body: [
            "The Harmonized System is a World Customs Organization framework used by 200+ countries. The first 6 digits are internationally standardized — 6109.10 is a cotton T-shirt in Canada, in the US, in Germany, and in China.",
            "Canada extends the code to 10 digits. Digits 7–8 add Canadian tariff detail; digits 9–10 are statistical breakouts used by Statistics Canada. Your import entry MUST use the full 10-digit code; truncating to 6 or 8 digits is a declaration error.",
          ],
        },
        {
          heading: "Tariff treatment — which duty rate applies",
          body: [
            "Canada's tariff schedule lists multiple duty rates for every HS code, one per tariff treatment. The treatment code is a 2-letter abbreviation that tells CBSA which column to use.",
            "Most Favoured Nation (MFN, code 02) is the default rate that applies to goods from any WTO member country without a preferential agreement. Preferential treatments include UST (US, under CUSMA, code 10), MXT (Mexico, code 11), CPTPP (code 33), UK (code 34), CETA (EU, code 32), CKFTA (Korea, code 30), and the GPT/LDCT for developing countries.",
          ],
          note: "The same ski boot might attract 18% MFN duty from China, 0% under CUSMA from the US, and 0% under CETA from Italy. Origin certification is what unlocks the preferential rate — without a valid certificate, CBSA will charge you MFN even if the goods qualify.",
        },
        {
          heading: "Proving origin",
          body: [
            "Each trade agreement has its own rules of origin and its own certification format. CUSMA requires a certification that can be on the invoice or a separate document, signed by the exporter, producer, or importer. CETA uses an origin declaration on the invoice. CPTPP and CKFTA have similar invoice-based options.",
            "The record-keeping requirement for origin certifications is typically 5 years. CBSA can audit retroactively and claw back duty benefits plus apply AMPS penalties if the certification was unsupported.",
          ],
        },
        {
          heading: "Common mistakes and how to avoid them",
          list: [
            "Using the same tariff treatment code on every entry instead of claiming preferential treatment where it applies",
            "Relying on the shipper to determine origin without seeing the certification",
            "Treating origin of shipment (where it was loaded onto the ship) as origin of manufacture",
            "Assuming Chinese components sold by a US exporter qualify for CUSMA — transformation rules are strict",
            "Missing the 1-year refund window to reclaim duty paid at MFN that should have been zero-rated",
          ],
        },
      ]}
      relatedLinks={[
        { label: "HS Code Classification", href: "/services/hs-code-classification-canada" },
        { label: "Duty Calculator", href: "/customs-calculator" },
      ]}
      ctaService="hs_classification"
    />
  );
}
