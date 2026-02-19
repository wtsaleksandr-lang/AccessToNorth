import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Calculator, Shield, Search, Truck, Package } from "lucide-react";

const tools = [
  {
    title: "Customs Duty & Tax Calculator",
    description: "Calculate duties, GST, and provincial taxes on imports to Canada. Supports all tariff treatments and provinces.",
    icon: Calculator,
    href: "/customs-calculator",
    available: true,
  },
  {
    title: "CARM Financial Security Calculator",
    description: "Estimate your CARM security deposit requirements based on import volume, frequency, and compliance history.",
    icon: Shield,
    href: "/carm-security-calculator",
    available: true,
  },
  {
    title: "HS Code Finder",
    description: "Search over 7,000 HS codes by product name or description. Find the correct tariff classification for your goods.",
    icon: Search,
    href: "/customs-calculator",
    available: true,
    note: "Built into our Customs Calculator",
  },
  {
    title: "Freight Quote Tool",
    description: "Get instant freight quotes for shipments to and from Canada. Compare rates from multiple carriers.",
    icon: Truck,
    href: "/tools/freight-quote",
    available: false,
  },
  {
    title: "Shipment Tracking",
    description: "Track your customs clearance status and shipment progress in real time.",
    icon: Package,
    href: "/tools/shipment-tracking",
    available: false,
  },
];

export default function Tools() {
  usePageMeta({
    title: "Tools | AccessToNorth.com",
    description: "Free Canadian trade tools: Customs Duty & Tax Calculator, CARM Security Calculator, HS Code Finder. Estimate costs before you import.",
    canonical: "https://www.accesstonorth.com/tools",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-tools-title">
              Trade Tools
            </h1>
            <p className="text-lg text-slate-600">
              Free calculators and tools to help you navigate Canadian import requirements and estimate costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tools.map((tool) => (
              <Card
                key={tool.title}
                className={`flex flex-col border transition-all duration-300 ${
                  tool.available
                    ? "border-slate-200 hover:shadow-lg hover:border-primary/20"
                    : "border-slate-200 bg-slate-50/50"
                }`}
                data-testid={`card-tool-${tool.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardContent className="flex flex-col flex-1 p-6">
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <tool.icon className="w-6 h-6 text-primary" />
                    </div>
                    {!tool.available && (
                      <Badge variant="secondary" className="text-xs shrink-0">Coming Soon</Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-bold mb-2 text-slate-900">{tool.title}</h2>
                  <p className="text-sm text-slate-600 mb-4 flex-1">{tool.description}</p>
                  {tool.note && (
                    <p className="text-xs text-slate-400 mb-3">{tool.note}</p>
                  )}
                  <Link href={tool.href}>
                    <Button
                      className="w-full cursor-pointer"
                      variant={tool.available ? "default" : "outline"}
                      data-testid={`button-tool-${tool.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {tool.available ? "Open Tool" : "Learn More"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
