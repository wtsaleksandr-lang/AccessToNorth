import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";
import { Truck, ArrowLeft, Bell } from "lucide-react";

export default function FreightQuote() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  usePageMeta({
    title: "Freight Quote Tool (Coming Soon) | AccessToNorth.com",
    description: "A structured freight quote request workflow for shipments to and from Canada is coming soon to AccessToNorth.com.",
    canonical: "https://www.accesstonorth.com/tools/freight-quote",
    robots: "noindex,follow",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/leads/tool-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tool: "freight-quote" }),
      });
      if (!response.ok) throw new Error("Could not save email");
      setSubmitted(true);
      toast({ title: "You're on the list!", description: "We'll notify you when the Freight Quote workflow launches." });
    } catch {
      toast({ title: "Could not save your email", description: "Please try again shortly.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <Link href="/tools" className="text-sm text-primary hover:underline mb-6 inline-flex items-center gap-1" data-testid="link-back-tools">
            <ArrowLeft className="w-3 h-3" /> All Tools
          </Link>

          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-freight-title">
              Freight Quote Tool
            </h1>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">Coming Soon</span>
            <p className="text-lg text-slate-600">
              Submit complete shipment details once and receive a structured quote without long email chains. Carrier-rate comparison will only be added where live contracted data is available.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6 md:p-8 text-center">
              {submitted ? (
                <div className="py-4">
                  <Bell className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 mb-1">You're on the list!</p>
                  <p className="text-sm text-slate-500">We'll email you when the Freight Quote Tool is ready.</p>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 mb-4">Be the first to know when we launch. Enter your email to get notified.</p>
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-freight-email"
                    />
                    <Button type="submit" disabled={submitting} className="cursor-pointer shrink-0" data-testid="button-freight-notify">
                      {submitting ? "Saving…" : "Notify Me"}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
