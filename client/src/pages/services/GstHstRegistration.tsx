import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { Landmark } from "lucide-react";

export default function GstHstRegistration() {
  return (
    <ServiceDetailPage
      title="GST/HST Registration"
      subtitle="Register your business for Goods and Services Tax / Harmonized Sales Tax with the CRA."
      metaTitle="GST/HST Registration Canada | AccessToNorth.com"
      metaDescription="Complete GST/HST registration with the CRA. Includes Business Number, filing guidance, and compliance review. Flat fee CA$249. No hidden costs."
      canonical="https://www.accesstonorth.com/services/gst-hst-registration"
      icon={Landmark}
      whatsIncluded={[
        "Business Number (BN) included if you don't have one",
        "GST/HST program account registration",
        "Correct reporting period and filing frequency setup",
        "Provincial HST guidance (Ontario, BC, etc.)",
        "Compliance review and filing reminders",
        "Input Tax Credit (ITC) eligibility guidance",
      ]}
      ctaService="gst_hst"
      priceCAD={249}
      additionalInfo="You must register for GST/HST if your worldwide taxable revenues exceed $30,000 over four consecutive calendar quarters. Voluntary registration is available for businesses below the threshold who want to claim ITCs."
      sampleDeliverable={{
        title: "GST/HST Account confirmation",
        fields: [
          { label: "GST/HST Account", value: "12345 6789 RT0001" },
          { label: "Legal name", value: "Maple Trade Co." },
          { label: "Reporting period", value: "Quarterly" },
          { label: "Effective date", value: "Apr 2026" },
        ],
        footerNote: "Sample deliverable for illustration. Account numbers are issued by the CRA.",
      }}
    />
  );
}
