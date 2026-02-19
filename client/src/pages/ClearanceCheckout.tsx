import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  Upload,
  FileText,
  AlertCircle,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";

interface DocumentRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  triggeredBy: string[];
}

const ALL_DOCUMENTS: DocumentRequirement[] = [
  {
    id: "commercial-invoice",
    label: "Commercial Invoice",
    description: "Invoice showing seller, buyer, description of goods, value, and terms of sale.",
    required: true,
    triggeredBy: ["lvs-clearance", "commercial-clearance", "compliance-clearance"],
  },
  {
    id: "packing-list",
    label: "Packing List",
    description: "Detailed list of items, quantities, weights, and packaging details.",
    required: true,
    triggeredBy: ["lvs-clearance", "commercial-clearance", "compliance-clearance"],
  },
  {
    id: "bill-of-lading",
    label: "Bill of Lading / Airway Bill",
    description: "Transport document (BOL for ocean, AWB for air freight).",
    required: true,
    triggeredBy: ["lvs-clearance", "commercial-clearance", "compliance-clearance"],
  },
  {
    id: "product-description",
    label: "Product Description & Composition",
    description: "Detailed product specs, materials, composition, and intended use for HS classification.",
    required: true,
    triggeredBy: ["addon-hs-classification", "addon-hs-additional", "compliance-clearance"],
  },
  {
    id: "technical-specs",
    label: "Technical Specifications",
    description: "Technical data sheets, certifications, or test reports relevant to classification.",
    required: false,
    triggeredBy: ["addon-hs-classification", "addon-hs-additional", "compliance-clearance"],
  },
  {
    id: "certificate-of-origin",
    label: "Certificate of Origin",
    description: "Required for preferential tariff treatment claims (CUSMA, CPTPP, CETA, etc.).",
    required: false,
    triggeredBy: ["compliance-clearance"],
  },
  {
    id: "import-permit-details",
    label: "Product Details for Permit",
    description: "Product category, regulatory classification, and intended use for permit application.",
    required: true,
    triggeredBy: ["addon-import-permit"],
  },
  {
    id: "cfia-product-info",
    label: "CFIA Product Information",
    description: "Product type, origin, ingredient list, and any existing CFIA registration numbers.",
    required: true,
    triggeredBy: ["addon-cfia"],
  },
  {
    id: "b3-copy",
    label: "Original B3 Declaration Copy",
    description: "The original customs accounting document that needs correction.",
    required: true,
    triggeredBy: ["addon-b2-correction"],
  },
  {
    id: "correction-explanation",
    label: "Correction Explanation",
    description: "Describe what needs to be corrected and why (e.g., incorrect HS code, value, origin).",
    required: true,
    triggeredBy: ["addon-b2-correction"],
  },
];

export default function ClearanceCheckout() {
  const { items, removeItem, updateQuantity, subtotal, clearCart, itemCount } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
  });
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Checkout - Customs Clearance | AccessToNorth";
    return () => {
      document.title = "AccessToNorth.com - Expert GST/HST & Business Number Registration in Canada";
    };
  }, []);

  const cartItemIds = items.map((i) => i.id);
  const requiredDocs = ALL_DOCUMENTS.filter((doc) =>
    doc.triggeredBy.some((trigger) => cartItemIds.includes(trigger))
  );

  const handleSubmit = () => {
    if (!contactInfo.fullName || !contactInfo.email) {
      toast({
        title: "Missing information",
        description: "Please provide your full name and email address.",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add at least one service before checking out.",
        variant: "destructive",
      });
      return;
    }
    setSubmitted(true);
    clearCart();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 font-display" data-testid="text-checkout-success">
              Order Submitted Successfully
            </h1>
            <p className="text-slate-500 mb-6">
              We have received your clearance request. Our team will review your submission and reach out within one business day to confirm scope and request any outstanding documents.
            </p>
            <p className="text-sm text-slate-400 mb-8">A confirmation will be sent to <span className="font-medium text-slate-600">{contactInfo.email}</span></p>
            <Button
              className="cursor-pointer"
              onClick={() => {
                setLocation("/canadian-customs-clearance");
                window.scrollTo({ top: 0 });
              }}
              data-testid="button-back-to-clearance"
            >
              Back to Customs Clearance
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <Button
            variant="ghost"
            className="mb-6 cursor-pointer text-slate-500"
            onClick={() => {
              setLocation("/canadian-customs-clearance");
              window.scrollTo({ top: 0 });
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Clearance Packages
          </Button>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 font-display" data-testid="text-checkout-heading">
            Checkout
          </h1>
          <p className="text-slate-500 mb-8">Review your selections, provide your details, and submit.</p>

          {items.length === 0 ? (
            <Card className="p-10 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4" data-testid="text-checkout-empty">Your cart is empty. Add services from the clearance page.</p>
              <Button
                className="cursor-pointer"
                onClick={() => {
                  setLocation("/canadian-customs-clearance");
                  window.scrollTo({ top: 0 });
                }}
                data-testid="button-browse-packages"
              >
                Browse Packages
              </Button>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left column: Form */}
              <div className="lg:col-span-3 space-y-6">
                {/* Cart Items */}
                <Card className="p-6" data-testid="card-checkout-items">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Services ({itemCount})
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                        data-testid={`checkout-item-${item.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-800">{item.name}</span>
                            <Badge
                              variant="secondary"
                              className="no-default-hover-elevate no-default-active-elevate text-[10px] px-1.5 py-0"
                            >
                              {item.category === "package" ? "Package" : "Add-on"}
                            </Badge>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                            {item.priceLabel} CAD
                            {item.quantity > 1 && ` x${item.quantity}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.category === "addon" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                data-testid={`checkout-decrease-${item.id}`}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                data-testid={`checkout-increase-${item.id}`}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-400"
                            onClick={() => removeItem(item.id)}
                            data-testid={`checkout-remove-${item.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Contact Information */}
                <Card className="p-6" data-testid="card-contact-info">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="text-sm text-slate-600 mb-1.5 block">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Your full name"
                        value={contactInfo.fullName}
                        onChange={(e) => setContactInfo({ ...contactInfo, fullName: e.target.value })}
                        data-testid="input-full-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm text-slate-600 mb-1.5 block">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm text-slate-600 mb-1.5 block">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (XXX) XXX-XXXX"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-sm text-slate-600 mb-1.5 block">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="Your company"
                        value={contactInfo.companyName}
                        onChange={(e) => setContactInfo({ ...contactInfo, companyName: e.target.value })}
                        data-testid="input-company"
                      />
                    </div>
                  </div>
                </Card>

                {/* Required Documents */}
                {requiredDocs.length > 0 && (
                  <Card className="p-6" data-testid="card-required-docs">
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Required Documents
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">Based on your selected services, you will need to provide the following documents. You can upload them now or email them after submission.</p>
                    <div className="space-y-3">
                      {requiredDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                          data-testid={`doc-${doc.id}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {doc.required ? (
                              <AlertCircle className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Upload className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-800">{doc.label}</span>
                              {doc.required ? (
                                <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-100">Required</Badge>
                              ) : (
                                <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-[10px] px-1.5 py-0">Optional</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{doc.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Additional Notes */}
                <Card className="p-6" data-testid="card-notes">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Additional Notes</h2>
                  <Textarea
                    placeholder="Any additional details about your shipment, special requirements, or questions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    rows={4}
                    data-testid="textarea-notes"
                  />
                </Card>
              </div>

              {/* Right column: Summary */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-28">
                  <Card className="p-6" data-testid="card-order-summary">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
                    <div className="space-y-2.5 mb-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm gap-2">
                          <span className="text-slate-600 truncate">
                            {item.name}
                            {item.quantity > 1 && ` x${item.quantity}`}
                          </span>
                          <span className="font-medium text-slate-900 whitespace-nowrap">
                            ${(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Subtotal</span>
                        <span className="text-xl font-bold text-slate-900" data-testid="text-checkout-subtotal">
                          ${subtotal.toLocaleString()} CAD
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Final total confirmed after scope review.</p>
                    </div>
                    <Button
                      className="w-full cursor-pointer"
                      onClick={handleSubmit}
                      data-testid="button-submit-order"
                    >
                      Submit Order Request
                    </Button>
                    <p className="text-xs text-slate-400 mt-3 text-center">
                      You will not be charged until scope is confirmed.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
