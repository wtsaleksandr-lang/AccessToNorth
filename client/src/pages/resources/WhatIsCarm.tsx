import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function WhatIsCarm() {
  return (
    <ResourceArticlePage
      title="What Is CARM?"
      metaTitle="What Is CARM? CBSA Assessment and Revenue Management | AccessToNorth.com"
      metaDescription="Everything importers need to know about CARM — the CBSA's new portal for duties, taxes, and trade compliance. Registration requirements and deadlines explained."
      canonical="https://www.accesstonorth.com/resources/what-is-carm"
      outlinePoints={[
        "CARM overview: what changed for importers in Canada",
        "Who needs to register and key deadlines",
        "The CARM Client Portal and how to use it",
        "Financial security requirements (RPP, bonds, cash deposits)",
        "How CARM affects your customs clearance process",
      ]}
      relatedLinks={[
        { label: "CARM Registration", href: "/services/carm-registration-canada" },
        { label: "CARM Security Calculator", href: "/carm-security-calculator" },
        { label: "RPP / Bond Coordination", href: "/services/rpp-bond-coordination" },
      ]}
    />
  );
}
