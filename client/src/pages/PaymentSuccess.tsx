import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, ArrowRight, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface CartOrderResult {
  kind: "cart";
  orderId: string;
  token: string;
  items: Array<{ id: number; serviceName: string; status: string }>;
}

interface SinglePackageResult {
  kind: "single";
  orderId: string;
  customerEmail: string;
  serviceType: string;
}

type OrderResult = CartOrderResult | SinglePackageResult;

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function resolveOrder(sessionId: string): Promise<OrderResult> {
  // 1. Try cart-checkout completion first — works for multi-item cart flows.
  try {
    const data = await fetchJson("/api/cart-checkout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    return { kind: "cart", ...data };
  } catch (cartErr: any) {
    if (cartErr.status !== 400) throw cartErr;
    // 400 means the session has no cart metadata — fall through to single-package path.
  }

  // 2. Single-package flow — the webhook created the order. Poll briefly in case
  //    the webhook hasn't fired yet (race between success-redirect and webhook).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const data = await fetchJson(`/api/orders/by-session/${sessionId}`);
      return { kind: "single", ...data };
    } catch (lookupErr: any) {
      if (lookupErr.status !== 404 || attempt === 4) throw lookupErr;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error("Order not created yet");
}

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setLoading(false);
      return;
    }

    resolveOrder(sessionId)
      .then((result) => {
        setOrderResult(result);
        clearCart();
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error resolving order:", err);
        setError(
          "We received your payment but had trouble confirming the order record. " +
            "Please contact us at operations@accesstonorth.com with your payment receipt and we'll sort it out.",
        );
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center pb-2">
            {loading ? (
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            )}
            <CardTitle className="text-2xl" data-testid="text-payment-success-title">
              {loading ? "Processing Your Order..." : "Payment Successful!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {loading && (
              <p className="text-muted-foreground">
                Please wait while we finalize your order...
              </p>
            )}

            {!loading && error && (
              <p className="text-amber-700 bg-amber-50 p-4 rounded-lg text-sm">{error}</p>
            )}

            {!loading && orderResult && orderResult.kind === "cart" && (
              <>
                <p className="text-muted-foreground" data-testid="text-payment-confirmation">
                  Your order <span className="font-mono font-semibold text-primary">{orderResult.orderId}</span> has been confirmed.
                  A confirmation email with next steps has been sent to your inbox.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
                    <FileText className="w-4 h-4" />
                    Next Step: Complete Your Service Details
                  </div>
                  <p className="text-sm text-blue-700">
                    To begin processing your order, please complete the intake form for each service. This typically takes 5-10 minutes.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => setLocation(`/complete-order?token=${orderResult.token}`)}
                    className="w-full"
                    data-testid="button-complete-details"
                  >
                    Complete Service Details
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="w-full"
                    data-testid="button-back-home"
                  >
                    I'll Do This Later
                  </Button>
                </div>

                <p className="text-xs text-slate-400">
                  You can complete the details anytime using the link in your confirmation email.
                </p>
              </>
            )}

            {!loading && orderResult && orderResult.kind === "single" && (
              <>
                <p className="text-muted-foreground" data-testid="text-payment-confirmation">
                  Your order <span className="font-mono font-semibold text-primary">{orderResult.orderId}</span> for{" "}
                  <span className="font-medium">{orderResult.serviceType}</span> has been confirmed.
                  A receipt and portal login instructions have been sent to your inbox.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
                    <FileText className="w-4 h-4" />
                    Track your registration in the portal
                  </div>
                  <p className="text-sm text-blue-700">
                    Log in with your email <span className="font-mono">{orderResult.customerEmail}</span> and Order ID{" "}
                    <span className="font-mono">{orderResult.orderId}</span>.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => setLocation("/portal")}
                    className="w-full"
                    data-testid="button-go-to-portal"
                  >
                    Open Client Portal
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="w-full"
                    data-testid="button-back-home"
                  >
                    Back to Home
                  </Button>
                </div>
              </>
            )}

            {!loading && !orderResult && !error && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your payment has been received. We will begin processing your order shortly.
                </p>
                <Button onClick={() => setLocation("/")} className="w-full" data-testid="button-back-home">
                  Back to Home
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
