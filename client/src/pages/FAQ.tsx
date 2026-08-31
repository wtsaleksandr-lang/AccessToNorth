import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageMeta } from "@/hooks/use-page-meta";
import { JsonLd } from "@/components/JsonLd";
import { ArrowRight } from "lucide-react";

const faqs = [
  // Operational / trust questions first — these are what serious buyers ask.
  {
    q: "Are you a law firm, accountant, or customs broker?",
    a: "No. AccessToNorth is an administrative services firm. We coordinate Canadian CRA and CBSA filings under a signed authorization from you. We don't provide legal, tax, or accounting advice, and we're not a licensed customs broker. If you need legal, tax, or customs-brokerage advice, we'll refer you to a licensed professional.",
  },
  {
    q: "How does the authorization work?",
    a: "After you place an order, we send you the CRA's Business Consent form (RC59-B) or the equivalent customs authorization for electronic signature. The authorization is scoped to the specific accounts we're working on — we don't get broader access than needed, and you can revoke it at any time through CRA My Business Account.",
  },
  {
    q: "What happens if my application is rejected or delayed?",
    a: "If the CRA or CBSA requests additional information, we work with you to respond. If an application is rejected due to our error (wrong form, missing field, incorrect attachment), we re-file at no cost or refund the service fee. If a rejection is due to factors outside our control (e.g., you're not eligible for the regime you applied under), we refund less the administrative time spent and advise you on next steps.",
  },
  {
    q: "How is my information kept confidential?",
    a: "Documents are submitted over encrypted channels and stored in access-controlled systems. We do not sell, trade, or share client data with third parties outside the scope of your filing. Records are retained only as long as required to meet applicable record-keeping obligations. Full details in our Privacy Policy.",
  },
  {
    q: "Who will be handling my engagement?",
    a: "Each engagement is assigned a dedicated point of contact who stays with you through delivery. Filings are prepared by team members experienced with Canadian CRA and CBSA workflows, and specialty matters (HS classification, SIMA, CARM financial security) are confirmed with the practice lead before submission. Client references are available on request for larger or multi-entity engagements.",
  },
  // Original FAQs below
  {
    q: "Do I need to register for GST/HST?",
    a: "You generally must register if your worldwide taxable revenues exceed CA$30,000 in a single calendar quarter or over four consecutive calendar quarters. Taxi, ride-share, and commercial ride-hailing operators must register regardless of revenue.",
  },
  {
    q: "What is a Business Number (BN)?",
    a: "A Business Number (BN) is a 9-digit number the CRA assigns to businesses for tax matters. It stays the same for your business's lifetime.",
  },
  {
    q: "How long does registration take?",
    a: "We typically submit your filing within one business day of receiving your signed authorization. The CRA then issues Business Numbers in 5–10 business days; GST/HST account activations usually follow within the same timeframe. CARM account activations and financial-security reviews can take longer — expect 2–3 weeks. Agency timelines are set by the CRA and CBSA and can vary with workload; we monitor and flag anything that stalls.",
  },
  {
    q: "Can non-residents register?",
    a: "Yes. Non-resident businesses that make taxable supplies in Canada may be required to register. We specialize in non-resident simplified regime registrations.",
  },
  {
    q: "Do non-residents need GST/HST?",
    a: "If you are a non-resident selling digital products or services to Canadian consumers, you are likely required to register under the simplified GST/HST regime. This applies to digital sellers, SaaS providers, and marketplace facilitators.",
  },
  {
    q: "How do I register for CARM as an importer?",
    a: "CARM (CBSA Assessment and Revenue Management) is the CBSA's commercial-importer portal. Onboarding has five steps: (1) Business Number with an RM extension, (2) GCKey or Sign-In Partner credential, (3) claim your business account inside the CARM Client Portal, (4) post financial security (bond, cash, or RPP), and (5) delegate your customs broker. Our CARM package or Importer Launch Kit coordinates each step end-to-end.",
  },
  {
    q: "What is the simplified registration regime?",
    a: "The simplified registration regime allows non-resident businesses to register for GST/HST without needing a full Canadian business presence. It streamlines the process for foreign digital sellers.",
  },
  {
    q: "Why register voluntarily if I'm under the $30k threshold?",
    a: "Voluntary registration lets you claim Input Tax Credits (ITCs) on business expenses in Canada, which can offset your tax liability. It also adds credibility when dealing with Canadian business clients.",
  },
  {
    q: "What is customs clearance?",
    a: "Customs clearance is the process of getting imported goods through CBSA. It involves filing the correct declarations, paying duties and taxes, and ensuring your goods comply with Canadian import regulations. AccessToNorth does not file declarations with CBSA on your behalf — that requires a CBSA-licensed customs broker. We coordinate the clearance, prepare the declaration paperwork, and hand it off to your licensed broker for filing. If you don't have a broker, we'll introduce you to a vetted partner.",
  },
  {
    q: "What documents do I need to import goods into Canada?",
    a: "At minimum, you'll need a commercial invoice, packing list, and bill of lading or airway bill. Depending on the goods, you may also need import permits, certificates of origin, or CFIA documentation.",
  },
  {
    q: "What is an HS code and why does it matter?",
    a: "The Harmonized System (HS) code is a standardized number used to classify traded goods. Getting the right HS code determines the duty rate you pay, so accurate classification can save you money and avoid penalties.",
  },
];

export default function FAQ() {
  usePageMeta({
    title: "Frequently Asked Questions | AccessToNorth.com",
    description: "Answers to common questions about GST/HST registration, Business Numbers, CARM, non-resident compliance, customs clearance, and HS classification in Canada.",
    canonical: "/faq",
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <JsonLd id="faq-jsonld" data={faqJsonLd} />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-faq-page-title">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-slate-600">
              Find answers to common questions about our services and Canadian trade compliance.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white px-6 rounded-xl border border-slate-200 shadow-sm"
                data-testid={`faq-item-${i}`}
              >
                <AccordionTrigger className="text-left font-medium text-slate-900 py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <p className="text-slate-500 mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button size="lg" className="cursor-pointer" data-testid="button-faq-contact">
                Contact Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
