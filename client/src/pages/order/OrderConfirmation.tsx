import { useEffect, useState } from "react";
import { useSearch, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock,
  Mail,
  FileText,
  AlertCircle,
} from "lucide-react";

interface OrderInfo {
  id: string;
  status: string;
  serviceType: string;
  metadata: {
    productName: string;
    packageTier: string;
    packagePrice: string;
    deliveryTime: string;
    countryOfOrigin: string;
  } | null;
  uploadCount: number;
  createdAt: string;
}

export default function OrderConfirmation() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("order_id") || "";

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Order Confirmed | AccessToNorth.com",
    description: "Your HS code classification order has been confirmed.",
    canonical: "https://www.accesstonorth.com/order-confirmation",
  });

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("No order ID found.");
      return;
    }

    fetch(`/api/classification-orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load order details.");
        setLoading(false);
      });
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Loading your order details...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-16">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-2">{error}</p>
              <Link href="/tools/hs-code-finder">
                <Button variant="outline">
                  Return to HS Code Finder
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {order && !loading && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h1
                  className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 mb-2"
                  data-testid="text-confirmation-title"
                >
                  Order Confirmed
                </h1>
                <p className="text-slate-600">
                  Thank you for your order. Your classification review is being processed.
                </p>
              </div>

              <Card className="p-6 mb-6" data-testid="card-order-details">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Order ID</p>
                      <p className="text-lg font-mono font-bold text-blue-700" data-testid="text-order-id">
                        {order.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Status</p>
                      <p className="text-sm font-semibold text-amber-700" data-testid="text-order-status">
                        {order.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Service</p>
                      <p className="font-medium text-slate-900">{order.serviceType}</p>
                    </div>
                    {order.metadata && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-0.5">Price</p>
                        <p className="font-semibold text-slate-900">{order.metadata.packagePrice}</p>
                      </div>
                    )}
                  </div>

                  {order.metadata && (
                    <>
                      <div className="pb-4 border-b border-slate-200">
                        <p className="text-xs text-slate-500 mb-0.5">Product</p>
                        <p className="font-medium text-slate-900">{order.metadata.productName}</p>
                        <p className="text-sm text-slate-500 mt-0.5">Origin: {order.metadata.countryOfOrigin}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-500">Estimated Delivery</p>
                          <p className="text-sm font-medium text-slate-900">
                            {order.metadata.deliveryTime}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-500">Documents</p>
                      <p className="text-sm font-medium text-slate-900">
                        {order.uploadCount > 0
                          ? `${order.uploadCount} file${order.uploadCount !== 1 ? "s" : ""} uploaded`
                          : "No documents uploaded"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-5 border-blue-100 bg-blue-50/50 mb-6" data-testid="card-next-steps">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">What happens next?</p>
                    <ul className="text-sm text-slate-600 space-y-1.5">
                      <li>You will receive a confirmation email with your order details.</li>
                      <li>Our team will review your submission and begin classification.</li>
                      <li>
                        Your classification report will be delivered to your email within{" "}
                        <span className="font-medium">{order.metadata?.deliveryTime || "the stated timeframe"}</span>.
                      </li>
                      <li>If we need additional information, we will follow up by email.</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/tools/hs-code-finder">
                  <Button variant="outline" data-testid="button-back-to-finder">
                    Back to HS Code Finder
                  </Button>
                </Link>
                <Link href="/customs-calculator">
                  <Button variant="outline" data-testid="button-duty-calculator">
                    Calculate Import Duty
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
