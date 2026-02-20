import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { formatPrice, isUSD } = useCurrency();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const cancelled = new URLSearchParams(window.location.search).get("cancelled");

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto" />
              <h2 className="text-xl font-semibold text-slate-800">Your cart is empty</h2>
              <p className="text-sm text-slate-500">
                Browse our services and add items to your cart before checking out.
              </p>
              <Button onClick={() => setLocation("/pricing")} className="mt-4" data-testid="button-browse-services">
                Browse Services
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/cart-checkout", {
        customerEmail: email,
        customerName: name,
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          serviceKey: i.serviceKey,
          tier: i.tier,
          category: i.category,
          quantity: i.quantity,
        })),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => setLocation("/pricing")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Continue Shopping
          </Button>

          {cancelled && (
            <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Your payment was cancelled. Your cart items are still saved. You can try again when you're ready.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl" data-testid="text-checkout-title">Checkout</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Smith"
                        required
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        data-testid="input-email"
                      />
                      <p className="text-xs text-slate-500">
                        We'll send your order confirmation and intake form link here.
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Lock className="w-4 h-4" />
                      <span>Secure payment powered by Stripe. All services billed in CAD.</span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                      data-testid="button-pay-now"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting to payment...
                        </>
                      ) : (
                        <>Pay {formatPrice(subtotal)}</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-2" data-testid={`summary-item-${item.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                        {item.tier && (
                          <p className="text-xs text-slate-500">{item.tier}</p>
                        )}
                        {item.quantity > 1 && (
                          <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-[10px] mt-1">
                            x{item.quantity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Total</span>
                    <span className="text-lg font-bold text-slate-900" data-testid="text-order-total">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {isUSD && (
                    <p className="text-xs text-amber-600" data-testid="text-checkout-usd-notice">
                      Prices shown in USD are estimates. Payment will be processed in CAD.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
