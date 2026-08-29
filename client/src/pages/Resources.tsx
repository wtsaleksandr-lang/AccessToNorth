import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, BookOpen } from "lucide-react";

const articles = [
  { title: "How to Import Into Canada", href: "/resources/how-to-import-into-canada", desc: "Step-by-step guide covering business setup, CARM, customs clearance, and compliance." },
  { title: "Courier Low-Value Clearance Up to CA$3,300", href: "/resources/customs-clearance-under-3300", desc: "CLVS shipments explained — eligibility, documents, duties, and exclusions." },
  { title: "What Is SIMA Duty?", href: "/resources/what-is-sima-duty", desc: "Anti-dumping and countervailing duties under the Special Import Measures Act." },
  { title: "What Is CARM?", href: "/resources/what-is-carm", desc: "The CBSA Assessment and Revenue Management system and what importers need to know." },
  { title: "HS Code vs. Tariff Treatment", href: "/resources/hs-code-vs-tariff-treatment", desc: "Understanding the difference between product classification and preferential tariff rates." },
  { title: "Incoterms for Canadian Importers", href: "/resources/incoterms-for-canadian-importers", desc: "How shipping terms like FOB, CIF, and DDP affect your duties and responsibilities." },
  { title: "FCL vs. LCL Cost Comparison", href: "/resources/fcl-vs-lcl-cost-comparison", desc: "Full container vs. less-than-container load — when each makes financial sense." },
  { title: "B13 Export Declaration Explained", href: "/resources/b13-export-declaration-explained", desc: "When and how to file a Canadian Export Declaration for goods leaving Canada." },
  { title: "When Do You Need CFIA Approval?", href: "/resources/when-do-you-need-cfia-approval", desc: "Food, plant, and animal imports that require Canadian Food Inspection Agency permits." },
];

export default function Resources() {
  usePageMeta({
    title: "Resources | AccessToNorth.com",
    description: "Guides and articles on Canadian importing, customs clearance, CARM, HS codes, tariff treatments, export declarations, and trade compliance.",
    canonical: "https://www.accesstonorth.com/resources",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-resources-title">
              Resources
            </h1>
            <p className="text-lg text-slate-600">
              Guides and articles to help you navigate Canadian trade, customs, and compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {articles.map((article) => (
              <Link key={article.href} href={article.href}>
                <Card className="h-full cursor-pointer border border-slate-200 hover:shadow-lg hover:border-primary/20 transition-all duration-300" data-testid={`card-resource-${article.href.split("/").pop()}`}>
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-2">{article.title}</h2>
                    <p className="text-sm text-slate-600 flex-1 mb-3">{article.desc}</p>
                    <span className="text-sm text-primary font-medium flex items-center gap-1">
                      Read more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-500 mb-4">Have questions about importing?</p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="cursor-pointer" data-testid="button-resources-contact">
                Contact Us <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
