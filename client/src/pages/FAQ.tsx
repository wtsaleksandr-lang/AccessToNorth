import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight } from "lucide-react";

const faqs = [
  {
    q: "Do I need to register for GST/HST?",
    a: "You generally must register if your worldwide taxable revenues exceed $30,000 in a single calendar quarter or over four consecutive calendar quarters. Taxi and ride-sharing operators must register regardless of revenue.",
  },
  {
    q: "What is a Business Number (BN)?",
    a: "A Business Number (BN) is a 9-digit number the CRA assigns to businesses for tax matters. It stays the same for your business's lifetime.",
  },
  {
    q: "How long does registration take?",
    a: "Processing times vary depending on your application type and CRA workload. We submit your documents promptly and keep you updated throughout the process.",
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
    a: "CARM (CBSA Assessment and Revenue Management) is the new customs portal. Our Complete Importer Bundle handles end-to-end CARM registration, delegation, and ongoing management so your imports are never delayed.",
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
    a: "Customs clearance is the process of getting imported goods through CBSA. It involves filing the correct declarations, paying duties and taxes, and ensuring your goods comply with Canadian import regulations.",
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
    canonical: "https://www.accesstonorth.com/faq",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
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
