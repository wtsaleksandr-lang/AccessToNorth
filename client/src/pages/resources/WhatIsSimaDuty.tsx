import { ResourceArticlePage } from "@/components/ResourceArticlePage";

export default function WhatIsSimaDuty() {
  return (
    <ResourceArticlePage
      title="What Is SIMA Duty?"
      metaTitle="What Is SIMA Duty? Anti-Dumping & Countervailing Duties | AccessToNorth.com"
      metaDescription="Understand SIMA duties in Canada — anti-dumping and countervailing measures that protect Canadian industries. Learn when they apply and how to check your products."
      canonical="https://www.accesstonorth.com/resources/what-is-sima-duty"
      outlinePoints={[
        "SIMA: Special Import Measures Act overview",
        "Anti-dumping duties vs. countervailing duties explained",
        "How to check if your product is subject to SIMA measures",
        "Impact on landed cost and customs clearance",
        "How to request a SIMA review or appeal",
      ]}
      relatedLinks={[
        { label: "Import Compliance Review", href: "/services/import-compliance-review" },
        { label: "HS Code Classification", href: "/services/hs-code-classification-canada" },
      ]}
      ctaService="compliance-review"
    />
  );
}
