import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          <XCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl" data-testid="text-payment-cancel-title">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground" data-testid="text-cancel-message">
            Your payment was not completed. Your application has been saved and you can return to complete payment at any time.
          </p>
          <p className="text-sm text-muted-foreground">
            No charges have been made to your card.
          </p>
          <div className="pt-4 space-y-2">
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
              data-testid="button-back-home"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Return to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLocation("/");
                setTimeout(() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="w-full"
              data-testid="button-view-pricing"
            >
              View Pricing Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
