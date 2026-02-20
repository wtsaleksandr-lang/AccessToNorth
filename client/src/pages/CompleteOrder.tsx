import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Loader2,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OrderItemData {
  id: number;
  serviceKey: string;
  serviceName: string;
  tier: string | null;
  priceCAD: number;
  quantity: number;
  status: string;
  intakeData: Record<string, any> | null;
}

interface OrderData {
  id: string;
  customerEmail: string;
  customerName: string;
  status: string;
  items: OrderItemData[];
  createdAt: string;
}

const SERVICE_INTAKE_FIELDS: Record<string, Array<{
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}>> = {
  bn: [
    { name: "legalName", label: "Legal Business Name", type: "text", required: true },
    { name: "tradeName", label: "Operating / Trade Name (if different)", type: "text" },
    { name: "businessType", label: "Type of Business", type: "select", required: true, options: ["Sole Proprietorship", "Partnership", "Corporation", "Non-Profit"] },
    { name: "incorporationProvince", label: "Province/Territory of Incorporation", type: "text", required: true },
    { name: "businessAddress", label: "Business Address", type: "text", required: true },
    { name: "ownerName", label: "Owner / Director Full Name", type: "text", required: true },
    { name: "ownerSIN", label: "Owner SIN (last 3 digits for verification)", type: "text" },
    { name: "phone", label: "Phone Number", type: "tel", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
  gst_hst: [
    { name: "businessNumber", label: "Business Number (BN9) - if you have one", type: "text" },
    { name: "legalName", label: "Legal Business Name", type: "text", required: true },
    { name: "businessAddress", label: "Business Address", type: "text", required: true },
    { name: "fiscalYearEnd", label: "Fiscal Year End (MM-DD)", type: "text", required: true, placeholder: "12-31" },
    { name: "estimatedRevenue", label: "Estimated Annual Revenue (CAD)", type: "text", required: true },
    { name: "effectiveDate", label: "Desired Effective Date (YYYY-MM-DD)", type: "text", placeholder: "2025-01-01" },
    { name: "phone", label: "Phone Number", type: "tel", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
  non_resident_tax: [
    { name: "legalName", label: "Legal Business Name", type: "text", required: true },
    { name: "foreignAddress", label: "Foreign Business Address", type: "text", required: true },
    { name: "countryOfResidence", label: "Country of Residence", type: "text", required: true },
    { name: "canadianAgent", label: "Canadian Agent or Representative (if any)", type: "text" },
    { name: "businessDescription", label: "Description of Canadian Business Activities", type: "textarea", required: true },
    { name: "estimatedCanadianRevenue", label: "Estimated Canadian Revenue (CAD)", type: "text" },
    { name: "phone", label: "Phone Number", type: "tel", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
  carm_portal: [
    { name: "businessNumber", label: "Business Number (BN15)", type: "text", required: true },
    { name: "legalName", label: "Legal Business Name", type: "text", required: true },
    { name: "importerType", label: "Importer Type", type: "select", required: true, options: ["Direct Importer", "Customs Broker Client", "Non-Resident Importer", "Other"] },
    { name: "primaryContact", label: "Primary Contact Name", type: "text", required: true },
    { name: "contactEmail", label: "Contact Email", type: "email", required: true },
    { name: "phone", label: "Phone Number", type: "tel", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
  rpp_bond: [
    { name: "businessNumber", label: "Business Number (BN15)", type: "text", required: true },
    { name: "legalName", label: "Legal Business Name", type: "text", required: true },
    { name: "estimatedDuties", label: "Estimated Monthly Duties (CAD)", type: "text", required: true },
    { name: "bondType", label: "Bond Type Needed", type: "select", required: true, options: ["Continuous Bond", "Single Entry Bond", "Not Sure"] },
    { name: "currentBroker", label: "Current Customs Broker (if any)", type: "text" },
    { name: "phone", label: "Phone Number", type: "tel", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
  b13_export: [
    { name: "businessNumber", label: "Business Number (BN15)", type: "text", required: true },
    { name: "legalName", label: "Legal Business Name", type: "text", required: true },
    { name: "exportDescription", label: "Description of Goods Being Exported", type: "textarea", required: true },
    { name: "destinationCountry", label: "Destination Country", type: "text", required: true },
    { name: "estimatedValue", label: "Estimated Value of Shipment (CAD)", type: "text", required: true },
    { name: "phone", label: "Phone Number", type: "tel", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
  hs_classification: [
    { name: "productName", label: "Product Name", type: "text", required: true },
    { name: "productDescription", label: "Detailed Product Description", type: "textarea", required: true },
    { name: "material", label: "Primary Material / Composition", type: "text", required: true },
    { name: "intendedUse", label: "Intended Use", type: "text", required: true },
    { name: "countryOfOrigin", label: "Country of Origin", type: "text", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
  default: [
    { name: "businessName", label: "Business Name", type: "text", required: true },
    { name: "businessNumber", label: "Business Number (if applicable)", type: "text" },
    { name: "description", label: "Description of What You Need", type: "textarea", required: true },
    { name: "phone", label: "Phone Number", type: "tel", required: true },
    { name: "notes", label: "Additional Notes", type: "textarea" },
  ],
};

function getIntakeFields(serviceKey: string) {
  return SERVICE_INTAKE_FIELDS[serviceKey] || SERVICE_INTAKE_FIELDS.default;
}

function IntakeForm({ item, token, onComplete }: {
  item: OrderItemData;
  token: string;
  onComplete: () => void;
}) {
  const { toast } = useToast();
  const fields = getIntakeFields(item.serviceKey);
  const [formData, setFormData] = useState<Record<string, string>>(
    item.intakeData ? Object.fromEntries(
      Object.entries(item.intakeData).map(([k, v]) => [k, String(v || "")])
    ) : {}
  );
  const [expanded, setExpanded] = useState(item.status === "Pending Details");

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("PATCH", `/api/order-items/${item.id}/intake`, {
        token,
        intakeData: data,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Details submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/by-token", token] });
      onComplete();
    },
    onError: (err: any) => {
      toast({
        title: "Failed to submit details",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.filter(f => f.required && !formData[f.name]?.trim());
    if (missing.length > 0) {
      toast({
        title: "Please fill in all required fields",
        description: `Missing: ${missing.map(f => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  const isComplete = item.status !== "Pending Details";

  return (
    <Card className={isComplete ? "border-green-200 bg-green-50/30" : ""}>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          )}
          <CardTitle className="text-base" data-testid={`text-item-name-${item.id}`}>
            {item.serviceName}
          </CardTitle>
          <Badge
            variant={isComplete ? "default" : "secondary"}
            className="no-default-hover-elevate no-default-active-elevate"
            data-testid={`badge-status-${item.id}`}
          >
            {item.status}
          </Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
      </CardHeader>
      {expanded && (
        <CardContent>
          {isComplete ? (
            <div className="text-sm text-green-700">
              <p>Details have been submitted. Our team is reviewing your information.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={`${item.id}-${field.name}`}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={`${item.id}-${field.name}`}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      data-testid={`input-${item.id}-${field.name}`}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={formData[field.name] || ""}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, [field.name]: val }))}
                    >
                      <SelectTrigger data-testid={`select-${item.id}-${field.name}`}>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`${item.id}-${field.name}`}
                      type={field.type}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      data-testid={`input-${item.id}-${field.name}`}
                    />
                  )}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={mutation.isPending}
                data-testid={`button-submit-${item.id}`}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Details"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function CompleteOrder() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token");

  const { data: order, isLoading, error } = useQuery<OrderData>({
    queryKey: ["/api/orders/by-token", token],
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
              <h2 className="text-xl font-semibold text-slate-800">Invalid Link</h2>
              <p className="text-sm text-slate-500">
                This link appears to be invalid or missing the required token. Please use the link from your confirmation email.
              </p>
              <Button onClick={() => setLocation("/")} data-testid="button-go-home">Go to Home</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-slate-800">Order Not Found</h2>
              <p className="text-sm text-slate-500">
                This link may have expired or the order could not be found. Please contact us if you need help.
              </p>
              <Button onClick={() => setLocation("/contact")} data-testid="button-contact-us">Contact Us</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingCount = order.items.filter(i => i.status === "Pending Details").length;
  const completedCount = order.items.length - pendingCount;
  const allComplete = pendingCount === 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-complete-order-title">
              {allComplete ? "All Details Submitted" : "Complete Your Order Details"}
            </h1>
            <p className="text-slate-500">
              Order <span className="font-mono font-semibold text-primary">{order.id}</span>
            </p>
          </div>

          {allComplete ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <h2 className="text-lg font-semibold text-green-800">All service details have been submitted!</h2>
              <p className="text-sm text-green-700">
                Our team is now reviewing your information and will begin processing your order. You'll receive an email once we start working on it.
              </p>
              <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-back-home">
                Back to Home
              </Button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  {completedCount} of {order.items.length} service details completed
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Please fill out the form for each service below so we can begin processing your order.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {order.items.map((item) => (
              <IntakeForm
                key={item.id}
                item={item}
                token={token}
                onComplete={() => {}}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
