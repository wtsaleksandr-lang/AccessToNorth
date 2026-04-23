import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function HowToImportIntoCanada() {
  return (
    <ResourceArticlePage
      title="How to Import Into Canada"
      metaTitle="How to Import Into Canada — Step-by-Step Guide | AccessToNorth.com"
      metaDescription="Complete guide to importing goods into Canada. Business Number, CARM registration, customs clearance, HS codes, duties, and compliance requirements explained."
      canonical="https://www.accesstonorth.com/resources/how-to-import-into-canada"
      lastReviewed="2026-03-15"
      intro="Importing commercial goods into Canada involves five distinct steps: getting a Business Number, registering on CARM, classifying your goods, understanding what you owe in duties and taxes, and arranging release at the border. This guide walks through each one in plain language, whether you're a Canadian resident or a foreign business selling into Canada."
      outlinePoints={[
        "Get a Business Number (BN) and an RM (import/export) program account from the CRA",
        "Register on the CARM Client Portal with the CBSA and post financial security",
        "Classify every product with the correct 10-digit Canadian HS code",
        "Calculate duty, GST, and any provincial tax owed on landed value",
        "Arrange release with a licensed customs broker or a self-filed clearance",
      ]}
      sections={[
        {
          heading: "1. Get a Business Number and an RM program account",
          body: [
            "The Business Number (BN) is a 9-digit identifier the Canada Revenue Agency assigns to every business operating in Canada. Before you can import commercially, you need a BN with an RM (import/export) program account extension — the full number looks like 12345 6789 RM0001.",
            "If you are a non-resident business without a Canadian physical presence, you can still register for a BN. We handle these applications routinely for US and overseas sellers. Expect 5–10 business days for CRA to issue the account.",
          ],
        },
        {
          heading: "2. Register on the CARM Client Portal",
          body: [
            "Since 2024, every commercial importer must onboard onto the CARM (CBSA Assessment and Revenue Management) portal before their first release. CARM is where you view statements of account, post security, pay duties, and delegate authority to your customs broker.",
            "Onboarding has three parts: claim your RM business account inside the portal, post financial security (see step 4), and delegate access to your broker. Missing any step will delay or block your shipments at the border.",
          ],
          note: "CBSA no longer accepts posting security at the port of entry. If you have not posted security in CARM, your commercial shipment cannot be released — even if the broker is ready.",
        },
        {
          heading: "3. Classify your goods with the correct HS code",
          body: [
            "Every product entering Canada needs a 10-digit classification under the Canadian Customs Tariff, which aligns with the World Customs Organization's Harmonized System. The first 6 digits are international; the last 4 are Canada-specific.",
            "The HS code determines the duty rate, whether the goods are subject to Special Import Measures (SIMA), whether they need CFIA or Health Canada permits, and which statistical unit applies. Getting this wrong is the most common cause of penalties and re-assessments.",
          ],
        },
        {
          heading: "4. Calculate duty, GST, and provincial tax",
          body: [
            "Total landed cost for most imports is: value for duty × duty rate + GST (5%). Some provinces add HST or PST at the border. Goods under trade agreements like CUSMA, CPTPP, or CETA may qualify for preferential or zero-duty treatment — but you must hold a valid certificate of origin to claim it.",
            "Financial security in CARM must be at least 50% of the highest monthly amount you'll owe in duties and taxes (the Release Prior to Payment minimum is CA$5,000 for bond-backed importers, CA$1,000 for cash deposits).",
          ],
        },
        {
          heading: "5. Arrange clearance at the border",
          body: [
            "You have two options: hire a licensed customs broker to file release on your behalf, or self-file if you have the expertise. Most importers use a broker because the documentation, valuation rules, and CBSA portals are unforgiving of mistakes.",
            "For shipments under CA$2,500, the courier usually handles clearance automatically on the Low-Value Shipment (LVS) program. Above that threshold, a commercial entry is filed and your CARM security is drawn down.",
          ],
        },
      ]}
      relatedLinks={[
        { label: "CARM Registration", href: "/services/carm-registration-canada" },
        { label: "Customs Duty Calculator", href: "/customs-calculator" },
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
      ]}
      ctaService="carm_portal"
    />
  );
}
