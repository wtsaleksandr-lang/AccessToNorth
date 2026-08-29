import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function HowToImportIntoCanada() {
  return (
    <ResourceArticlePage
      title="How to Import Into Canada"
      metaTitle="How to Import Into Canada (2026) — Step-by-Step Guide"
      metaDescription="How to import commercial goods into Canada in 2026: importer setup, BN and RM registration, CARM, HS codes, duties, documents, customs release, and RPP security."
      canonical="/resources/how-to-import-into-canada"
      datePublished="2026-03-15"
      lastReviewed="2026-08-28"
      intro="To import commercial goods into Canada, first confirm who will be the importer of record and whether the product is admissible. Then set up the importer account, classify and value the goods, prepare the shipping documents, and arrange customs release. The steps below reflect the current CARM process for Canadian and non-resident importers."
      outlinePoints={[
        "Confirm the importer of record and check whether the product needs permits or special approval",
        "Obtain a 9-digit Business Number (BN9) and enrol in the CBSA import-export RM program",
        "Register the business in CARM and decide whether Release Prior to Payment (RPP) is needed",
        "Determine the Canadian 10-digit tariff classification, origin, value for duty, and estimated taxes",
        "Send complete documents to the carrier and customs broker before the shipment arrives",
      ]}
      sections={[
        {
          heading: "1. Confirm the importer of record and product admissibility",
          body: [
            "The importer of record is responsible for the customs declaration, duties and taxes, recordkeeping, and corrections after release. Under DDP terms, this may be the foreign seller acting as a non-resident importer. Under many other transactions, it is the Canadian buyer. Confirm this before booking freight.",
            "Also check whether the goods are prohibited, controlled, or regulated by another government department. Food, plants, animals, vehicles, medical products, chemicals, firearms, and some steel or textile products may require permits, licences, certificates, or labelling before they ship.",
          ],
        },
        {
          heading: "2. Obtain a Business Number and import-export RM account",
          body: [
            "Commercial importers need a 9-digit Business Number and an import-export program account, commonly shown as BN9 + RM0001. Most new resident businesses that do not already have a BN can obtain one while registering through CARM. A non-resident business must normally obtain its BN9 from the CRA before registering in CARM.",
            "The legal business name and address must match the records connected to the BN. Mismatches are a common reason for CARM registration delays.",
          ],
        },
        {
          heading: "3. Register in CARM and decide whether to enrol in RPP",
          body: [
            "The business account manager must register the importer in the CARM Client Portal. A customs broker cannot register the business on the importer's behalf, although the importer can delegate access after registration.",
            "Release Prior to Payment is optional, but it allows goods to be released before final payment of duties and taxes. RPP requires active financial security. A written security agreement is generally at least 50% of the highest monthly accounts receivable, subject to a CA$5,000 minimum per importer program account. A cash security deposit is generally 100% of the highest monthly amount. Without RPP, payment is required before release.",
          ],
          note: "CARM registration and RPP enrolment are separate steps. Being registered in the portal does not automatically activate release-before-payment privileges.",
        },
        {
          heading: "4. Classify, value, and determine the origin of the goods",
          body: [
            "Every product needs a Canadian 10-digit tariff classification. The code determines the customs duty rate and may also trigger SIMA duties, permits, quotas, or other controls. A broad product name such as “parts” is not enough; use the material, function, model, and intended use.",
            "Calculate the value for duty using the applicable customs valuation method and convert foreign currency using the CBSA exchange rate for the accounting date. Preferential duty under CUSMA, CETA, CPTPP, or another trade agreement depends on the origin rules and supporting certification—not simply the country the shipment departs from.",
          ],
        },
        {
          heading: "5. Estimate duty, GST, and total landed cost",
          body: [
            "A practical landed-cost estimate includes the product value, international freight and insurance, customs duty, import GST, excise or SIMA charges when applicable, brokerage, terminal or courier fees, and inland delivery. For most commercial imports, CBSA collects 5% GST on the value for tax; provincial tax treatment depends on the transaction and importer.",
            "Use the customs duty calculator for an early estimate, but verify the tariff classification and origin documents before quoting a final landed cost to a customer.",
          ],
        },
        {
          heading: "6. Prepare the customs and shipping documents",
          list: [
            "Commercial invoice with buyer, seller, detailed goods description, quantity, currency, unit price, total price, and country of origin",
            "Packing list with package count, dimensions, net weight, and gross weight",
            "Bill of lading, air waybill, or courier waybill",
            "Certificate or certification of origin when claiming preferential duty",
            "Permits, licences, test reports, or product certificates when regulated",
            "Purchase order, payment proof, assists, royalties, or freight invoices when needed to support customs value",
          ],
        },
        {
          heading: "7. Arrange reporting, customs release, and delivery",
          body: [
            "The carrier reports the cargo to CBSA, while the importer or licensed customs broker submits the release and accounting data. Send documents early enough for review before arrival. Missing descriptions, inconsistent values, or an inactive importer account can lead to holds and storage charges.",
            "Eligible courier shipments with a value for duty not exceeding CA$3,300 may use the Courier Low Value Shipment program. This is a simplified release process, not a duty-free exemption, and regulated or excluded goods may still require formal processing.",
          ],
        },
        {
          heading: "8. Keep records and correct errors after release",
          body: "Import responsibility continues after delivery. Keep invoices, origin support, classifications, valuation records, permits, and accounting documents for the required retention period. Review the customs entry after release and correct material errors within the applicable deadline instead of waiting for a CBSA verification.",
        },
        {
          heading: "Frequently asked questions",
          body: [
            "Do I need a customs broker to import into Canada? A broker is not mandatory for every commercial import, but the importer remains responsible even when a broker files. First-time importers and regulated or high-value shipments usually benefit from professional review.",
            "Can a US company import into Canada? Yes. A foreign business can act as a non-resident importer, but it needs the proper BN and RM setup, CARM registration, and a clear plan for tax, customs, and delivery obligations.",
            "How long should setup take? Timing varies by entity type and whether the CRA or CBSA must correct existing records. Complete, matching company information is more important than relying on a fixed processing estimate.",
          ],
        },
      ]}
      sourceLinks={[
        { label: "CBSA — Get started with CARM", href: "https://www.canada.ca/en/border-services-agency/services/carm/register.html" },
        { label: "CBSA — Commercial importing checklist", href: "https://www.cbsa-asfc.gc.ca/import/checklist-controle-eng.html" },
        { label: "CBSA — RPP financial security requirements", href: "https://www.cbsa-asfc.gc.ca/services/carm-gcra/rpp-map/prepare-ready-eng.html" },
        { label: "CBSA — Courier Low Value Shipment threshold", href: "https://www.cbsa-asfc.gc.ca/services/cusma-aceum/lvs-efv-eng.html" },
      ]}
      relatedLinks={[
        { label: "Canadian HS Code Finder", href: "/tools/hs-code-finder" },
        { label: "Customs Duty Calculator", href: "/customs-calculator" },
        { label: "CARM Security Calculator", href: "/carm-security-calculator" },
        { label: "Customs Clearance", href: "/services/customs-clearance-canada" },
      ]}
      ctaService="carm_portal"
    />
  );
}
