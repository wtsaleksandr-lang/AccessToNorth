import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ArrowRight, Home, Search, FileQuestion } from "lucide-react";

const popularLinks = [
  { label: "Services", href: "/services", desc: "Browse our full service catalogue" },
  { label: "Pricing", href: "/pricing", desc: "Flat-rate fees from CA$99" },
  { label: "HS Code Finder", href: "/tools/hs-code-finder", desc: "Search tariff codes by keyword" },
  { label: "Customs Calculator", href: "/customs-calculator", desc: "Estimate duties & taxes" },
  { label: "Client Portal", href: "/portal", desc: "Check your order status" },
  { label: "Contact", href: "/contact", desc: "Talk to our team" },
];

export default function NotFound() {
  usePageMeta({
    title: "Page Not Found | AccessToNorth.com",
    description: "The page you're looking for doesn't exist. Browse popular pages or head back home.",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
              <FileQuestion className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">404 — Page not found</p>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display text-slate-900 mb-3">
              We couldn't find that page.
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto">
              The link may be outdated or the page has moved. Try one of the popular destinations below, or head back to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
              <Link href="/">
                <Button size="lg" className="cursor-pointer">
                  <Home className="w-4 h-4 mr-2" /> Back to Home
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="cursor-pointer">
                  Contact Support <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Popular pages</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {popularLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-slate-300 mt-1 group-hover:text-primary transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-primary transition-colors">
                      {link.label}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
