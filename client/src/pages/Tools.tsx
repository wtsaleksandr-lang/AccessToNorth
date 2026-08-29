import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Calculator, Shield, Truck, Package, FileSearch, Ship } from "lucide-react";

const tools = [
  {
    title: "HS Code Finder",
    description: "Search Canadian HS codes by product name or code number. Find suggested tariff classifications, then calculate duty in one click.",
    icon: FileSearch,
    href: "/tools/hs-code-finder",
    available: true,
  },
  {
    title: "Customs Duty & Tax Calculator",
    description: "Calculate duties, GST, and provincial taxes on imports to Canada. Includes HS code search by product name or description.",
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
    title: "Container Loading Calculator",
    description: "Plan optimal cargo placement with interactive 3D visualization. See exactly how your goods fit in 20', 40', 40' HC, and 45' HC shipping containers.",
    icon: Ship,
    href: "/tools/container-calculator",
    available: true,
  },
  {
    title: "Truck Load Planner",
    description: "Plan truck loads with smart trailer matching. Calculate volume and weight utilization, get oversize/overweight warnings for dry vans, reefers, flatbeds, and more.",
    icon: Truck,
    href: "/tools/truck-load-planner",
    available: true,
  },
  {
    title: "Freight Quote",
    description: "Get instant freight quotes for shipments to and from Canada. Compare rates from multiple carriers.",
    icon: Truck,
    href: "/tools/freight-quote",
    available: false,
  },
  {
    title: "Tracking",
    description: "Track your customs clearance status and shipment progress in real time.",
    icon: Package,
    href: "/tools/shipment-tracking",
    available: false,
  },
];

export default function Tools() {
  usePageMeta({
    title: "Free Trade Tools | AccessToNorth.com",
    description: "Free tools for Canadian importers and exporters: HS code finder, duty calculator, CARM security calculator, 3D container planner, and truck load planner.",
    canonical: "/tools",
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
              Free calculators to help you navigate Canadian import requirements and estimate costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <tool.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">{tool.title}</h2>
                    </div>
                    {!tool.available && (
                      <Badge variant="secondary" className="text-xs shrink-0">Coming Soon</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-5 flex-1">{tool.description}</p>
                  {tool.available ? (
                    <Link href={tool.href}>
                      <Button className="w-full cursor-pointer" data-testid={`button-tool-${tool.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        Open Tool
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" disabled className="w-full" data-testid={`button-tool-${tool.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      Coming Soon
                    </Button>
                  )}
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
