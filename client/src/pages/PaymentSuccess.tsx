import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface SessionData {
  status: string;
  packageType: string;
  amountTotal: number;
  currency: string;
}

const packageNames: Record<string, string> = {
  "business-number": "Business Number Registration",
  "gst-hst": "GST/HST Registration",
  "non-resident": "Non-Resident Tax Registration",
  "carm": "CARM Portal Registration",
  "complete-bundle": "Complete Importer Bundle",
};

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      fetch(`/api/checkout/session/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setSession(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          {loading ? (
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          ) : (
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          )}
          <CardTitle className="text-2xl" data-testid="text-payment-success-title">
            {loading ? "Verifying Payment..." : "Payment Successful"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {!loading && session && (
            <>
              <p className="text-muted-foreground" data-testid="text-payment-confirmation">
                Thank you for your payment. Your registration for{" "}
                <span className="font-semibold text-foreground">
                  {packageNames[session.packageType] || session.packageType}
                </span>{" "}
                is now being processed.
              </p>
              {session.amountTotal && (
                <p className="text-lg font-semibold" data-testid="text-amount-paid">
                  ${(session.amountTotal / 100).toFixed(2)} {session.currency?.toUpperCase()}
                </p>
              )}
            </>
          )}
          {!loading && !session && (
            <p className="text-muted-foreground">
              Your payment has been received. We will begin processing your registration shortly.
            </p>
          )}
          <div className="pt-4 space-y-2">
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
              data-testid="button-back-home"
            >
              Back to Home
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/portal")}
              className="w-full"
              data-testid="button-check-status"
            >
              Check Application Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
