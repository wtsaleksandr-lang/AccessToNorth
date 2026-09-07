import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function HowToImportIntoCanada() {
  return (
    <ResourceArticlePage
      title="How to Import Into Canada"
      metaTitle="How to Import Into Canada (2026) — Step-by-Step Guide"
      metaDescription="Learn how to import commercial goods into Canada in 2026: BN and RM setup, CARM, HS codes, duties, documents, customs release, RPP, and worked examples."
      canonical="/resources/how-to-import-into-canada"
      datePublished="2026-03-15"
      lastReviewed="2026-09-07"
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
            "Write the decision into the purchase order or shipping instructions: identify the importer, customs broker, consignee, party paying duties and taxes, and party responsible for permits and post-entry corrections. Incoterms allocate commercial responsibilities between buyer and seller, but an Incoterm alone does not create a Canadian importer account or satisfy a regulatory requirement.",
          ],
        },
        {
          heading: "2. Obtain a Business Number and import-export RM account",
          body: [
            "Commercial importers need a 9-digit Business Number and an import-export program account, commonly shown as BN9 + RM0001. Most new resident businesses that do not already have a BN can obtain one while registering through CARM. A non-resident business must normally obtain its BN9 from the CRA before registering in CARM.",
            "The legal business name and address must match the records connected to the BN. Mismatches are a common reason for CARM registration delays.",
            "Before applying for another BN, check incorporation records, prior CRA correspondence, tax returns, and previous import activity. Creating a duplicate account can separate program accounts and payments from the legal entity that actually owns them.",
          ],
        },
        {
          heading: "3. Register in CARM and decide whether to enrol in RPP",
          body: [
            "The business account manager must register the importer in the CARM Client Portal. A customs broker cannot register the business on the importer's behalf, although the importer can delegate access after registration.",
            "Release Prior to Payment is optional, but it allows goods to be released before final payment of duties and taxes. RPP requires active financial security. A written security agreement is generally at least 50% of the highest monthly accounts receivable, subject to a CA$5,000 minimum per importer program account. A cash security deposit is generally 100% of the highest monthly amount. Without RPP, payment is required before release.",
            "After onboarding, confirm that the correct employees have business-account-manager access, the broker delegation is active, statements can be viewed, and the selected payment method works. Do not wait until cargo reaches the border to test the account.",
          ],
          note: "CARM registration and RPP enrolment are separate steps. Being registered in the portal does not automatically activate release-before-payment privileges.",
        },
        {
          heading: "4. Classify, value, and determine the origin of the goods",
          body: [
            "Every product needs a Canadian 10-digit tariff classification. The code determines the customs duty rate and may also trigger SIMA duties, permits, quotas, or other controls. A broad product name such as “parts” is not enough; use the material, function, model, and intended use.",
            "Calculate the value for duty using the applicable customs valuation method and convert foreign currency using the CBSA exchange rate for the accounting date. Preferential duty under CUSMA, CETA, CPTPP, or another trade agreement depends on the origin rules and supporting certification—not simply the country the shipment departs from.",
            "Classification, origin, and value are three separate decisions. A correct HS code does not prove preferential origin, and an invoice price is not automatically the final value for duty when assists, royalties, proceeds, discounts, related-party pricing, or other adjustments apply.",
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
          heading: "Worked example: a CA$10,000 commercial import",
          body: [
            "Assume CBSA accepts a value for duty of CA$10,000, the verified tariff rate is 6.5%, no preferential treatment is claimed, and no SIMA or excise charge applies. Customs duty is CA$650. In this simplified example, 5% import GST on the CA$10,650 value for tax is CA$532.50, producing CA$1,182.50 in duty and GST.",
            "That is not the complete landed cost. The importer should separately add international freight and insurance where relevant to its costing model, brokerage, disbursement, terminal or courier charges, storage risk, permits, inspection, delivery, and any non-recoverable tax. If valid origin evidence changes the duty rate to free, the duty portion becomes zero and the tax calculation changes accordingly.",
          ],
          note: "This example demonstrates the calculation sequence only. The tariff classification, origin treatment, value for duty, tax treatment, and special measures must be verified for the actual goods.",
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
            "Broker instructions stating the importer number, transaction type, requested tariff treatment, and delivery contact",
            "Product specifications, composition sheets, photos, model information, or catalogues needed to support classification",
          ],
        },
        {
          heading: "7. Arrange reporting, customs release, and delivery",
          body: [
            "The carrier reports the cargo to CBSA, while the importer or licensed customs broker submits the release and accounting data. Send documents early enough for review before arrival. Missing descriptions, inconsistent values, or an inactive importer account can lead to holds and storage charges.",
            "Eligible courier shipments with a value for duty not exceeding CA$3,300 may use the Courier Low Value Shipment program. This is a simplified release process, not a duty-free exemption, and regulated or excluded goods may still require formal processing.",
            "For ocean and air freight, align document cutoffs with the carrier, terminal, warehouse, and broker. Pre-arrival review creates time to correct a vague description or missing permit before the shipment begins accumulating avoidable storage or demurrage.",
          ],
        },
        {
          heading: "8. Keep records and correct errors after release",
          body: [
            "Import responsibility continues after delivery. Keep invoices, origin support, classifications, valuation records, permits, and accounting documents for the required retention period. Build the shipment file so another reviewer can understand how the code, origin, value, and duty treatment were selected.",
            "Review the customs accounting document after release. If the importer has reason to believe a declaration of origin, tariff classification, or value for duty is incorrect, the Customs Act correction rules can require a correction within 90 days. Do not wait for a CBSA verification letter to investigate a known discrepancy.",
          ],
        },
        {
          heading: "A practical pre-shipment checklist",
          list: [
            "Importer of record confirmed in writing and matched to an active BN/RM account",
            "CARM access, broker delegation, payment method, and RPP status tested",
            "Product admissibility and other-government-department requirements checked",
            "Canadian tariff classification, origin treatment, and value-for-duty method documented",
            "Commercial invoice and packing list reconciled to the booking and purchase order",
            "Carrier reporting, broker release, terminal, warehouse, and final-delivery responsibilities assigned",
            "Estimated duty, tax, freight, clearance, terminal, and delivery costs reviewed",
            "Post-entry document retention and correction owner assigned",
          ],
        },
      ]}
      faqItems={[
        {
          question: "Do I need a customs broker to import into Canada?",
          answer: "A customs broker is not mandatory for every commercial import, but the importer remains legally responsible even when a broker files. First-time importers and regulated, complex, or high-value shipments usually benefit from professional review.",
        },
        {
          question: "Can a US or other foreign company import into Canada?",
          answer: "Yes. A foreign business can act as a non-resident importer when it completes the appropriate BN and RM setup, CARM registration, customs procedures, tax analysis, and delivery arrangements.",
        },
        {
          question: "Is CARM registration the same as Release Prior to Payment?",
          answer: "No. CARM portal registration establishes access to the importer account. RPP is a separate privilege that requires active financial security and allows eligible goods to be released before final payment.",
        },
        {
          question: "Does shipping from the United States automatically qualify goods for CUSMA duty?",
          answer: "No. The goods must satisfy the agreement's product-specific origin rules and the importer must hold the required origin support. Country of shipment is not the same as country of origin.",
        },
        {
          question: "How long does importer setup take?",
          answer: "Timing varies by entity type, the accuracy of the submitted records, and whether CRA or CBSA must correct an existing account. Complete and matching legal information is more reliable than any fixed processing estimate.",
        },
      ]}
      sourceLinks={[
        { label: "CBSA — Get started with CARM", href: "https://www.canada.ca/en/border-services-agency/services/carm/register.html" },
        { label: "CBSA — Commercial importing checklist", href: "https://www.cbsa-asfc.gc.ca/import/checklist-controle-eng.html" },
        { label: "CBSA — RPP financial security requirements", href: "https://www.cbsa-asfc.gc.ca/services/carm-gcra/rpp-map/prepare-ready-eng.html" },
        { label: "CBSA — Courier Low Value Shipment threshold", href: "https://www.cbsa-asfc.gc.ca/services/cusma-aceum/lvs-efv-eng.html" },
        { label: "Justice Laws — Customs Act correction obligations", href: "https://laws-lois.justice.gc.ca/eng/acts/c-52.6/section-32.2.html" },
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
