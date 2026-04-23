import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function WhatIsCarm() {
  return (
    <ResourceArticlePage
      title="What Is CARM?"
      metaTitle="What Is CARM? CBSA Assessment and Revenue Management | AccessToNorth.com"
      metaDescription="Everything importers need to know about CARM — the CBSA's new portal for duties, taxes, and trade compliance. Registration requirements and deadlines explained."
      canonical="https://www.accesstonorth.com/resources/what-is-carm"
      lastReviewed="2026-03-20"
      intro="CARM — CBSA Assessment and Revenue Management — is the Canada Border Services Agency's digital system for collecting duties, taxes, and managing importer accounts. Since the final phase launched in October 2024, every commercial importer must self-onboard onto the CARM Client Portal (CCP) to stay compliant. This guide covers what CARM is, who's required to register, and how financial security works."
      outlinePoints={[
        "CARM replaces legacy paper-based accounts for all commercial imports",
        "Every importer must claim their RM business account inside the CARM Client Portal",
        "Financial security (bond, cash deposit, or RPP) must be posted BEFORE your first release",
        "Brokers can only act on your behalf if you delegate authority inside the portal",
        "Missing CARM registration = shipments held at the border, full stop",
      ]}
      sections={[
        {
          heading: "What CARM changed",
          body: [
            "Before CARM, brokers and couriers often acted as the importer of record using their own bond, and you'd settle up with them later. CBSA billed the broker, the broker billed you. It worked, but it hid compliance exposure and made it hard for CBSA to verify who actually owed what.",
            "Under CARM, YOU are the importer of record on every commercial release. Your Business Number, your RM account, your financial security, your statements of account. Brokers still file entries on your behalf, but only with delegated authority inside the portal — and the final liability stays with you.",
          ],
        },
        {
          heading: "Who must register",
          body: [
            "Every person or business that imports commercial goods into Canada — including non-resident importers — must onboard onto the CARM Client Portal. This includes one-off importers, e-commerce sellers, manufacturers, and anyone using the Non-Resident Importer (NRI) model.",
            "Casual/personal imports are exempt. Courier LVS shipments under CA$2,500 where the courier acts as the importer are also handled differently, but most commercial operations still need CARM.",
          ],
        },
        {
          heading: "The three onboarding steps",
          list: [
            "Create a GCKey or Sign-In Partner account and link it to your Business Number inside the CCP",
            "Post financial security — either a CA$25,000+ customs bond from a surety, a cash deposit, or enroll in the Release Prior to Payment (RPP) program",
            "Delegate portal access to your customs broker so they can file entries and see statements of account on your behalf",
          ],
          note: "Onboarding is free but the process is unforgiving. Missing a single step means your first commercial shipment will be held at the border. Non-residents without a Canadian authorized representative get blocked at step 1.",
        },
        {
          heading: "Financial security: RPP, bonds, and cash",
          body: [
            "CARM requires every importer to post financial security sized to cover the highest monthly duty/tax amount they'll owe. The minimum is CA$25,000 on a customs bond, or CA$5,000 cash, whichever applies. For most importers, bonds are cheaper — annual premiums run roughly 1–3% of the face amount.",
            "The Release Prior to Payment program lets you take possession of goods before paying duty, then settle via monthly statement of account (SOA). Without RPP, duty must be paid before release — which is a cash-flow disaster for anyone importing at scale.",
          ],
        },
        {
          heading: "What happens after onboarding",
          body: [
            "Once registered and bonded, your broker files release entries against your CARM account. Each month, CBSA issues a Statement of Account showing every transaction, duty, GST, and any adjustments. You pay the net amount by the 25th of the following month through the CCP (pre-authorized debit, EFT, or credit card).",
            "CBSA sends pre-assessments and corrections through the portal too. Monitoring the CCP weekly is not optional — a missed reassessment notice can turn into interest, penalties, and AMPS exposure.",
          ],
        },
      ]}
      relatedLinks={[
        { label: "CARM Registration", href: "/services/carm-registration-canada" },
        { label: "CARM Security Calculator", href: "/carm-security-calculator" },
        { label: "RPP / Bond Coordination", href: "/services/rpp-bond-coordination" },
      ]}
      ctaService="carm_portal"
    />
  );
}
