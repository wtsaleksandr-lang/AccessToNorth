import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";
import { Package, ArrowLeft, Bell, Search } from "lucide-react";

export default function ShipmentTracking() {
  const [trackingId, setTrackingId] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  usePageMeta({
    title: "Shipment Tracking (Coming Soon) | AccessToNorth.com",
    description: "Track your customs clearance status and shipment progress in real time. Coming soon to AccessToNorth.com.",
    canonical: "https://www.accesstonorth.com/tools/shipment-tracking",
    robots: "noindex,follow",
  });

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tracking Not Available Yet",
      description: "Shipment tracking is coming soon. Sign up below to be notified.",
    });
  };

  const handleNotify = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ email, tool: "shipment-tracking" }),
      });
      if (!response.ok) throw new Error("Could not save email");
      setSubmitted(true);
      toast({ title: "You're on the list!", description: "We'll notify you when shipment status tracking launches." });
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
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-tracking-title">
              Shipment Tracking
            </h1>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">Coming Soon</span>
            <p className="text-lg text-slate-600">
              Follow AccessToNorth order, document, customs filing, release, and delivery milestones in one clear timeline.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Enter tracking or order number (e.g., ATN-XXXXXX)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="pl-10"
                    data-testid="input-tracking-id"
                  />
                </div>
                <Button type="submit" className="cursor-pointer shrink-0" data-testid="button-track">
                  Track
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 md:p-8 text-center">
              {submitted ? (
                <div className="py-4">
                  <Bell className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 mb-1">You're on the list!</p>
                  <p className="text-sm text-slate-500">We'll email you when shipment tracking is ready.</p>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 mb-4">Real-time tracking is coming soon. Get notified when it launches.</p>
                  <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-tracking-email"
                    />
                    <Button type="submit" disabled={submitting} className="cursor-pointer shrink-0" data-testid="button-tracking-notify">
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
