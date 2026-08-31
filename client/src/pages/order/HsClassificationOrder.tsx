import { useState, useEffect, useRef, useCallback } from "react";
import { useSearch, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Package,
  ClipboardList,
  User,
  CreditCard,
} from "lucide-react";

const DEEP_BLUE = "#0A2540";

interface TierInfo {
  name: string;
  priceCAD: number;
  param: string;
  popular: boolean;
  hsCount: number;
  delivery: string;
  features: string[];
  cta: string;
}

const tiers: TierInfo[] = [
  {
    name: "Basic",
    priceCAD: 29,
    param: "basic",
    popular: false,
    hsCount: 1,
    delivery: "1 business day",
    features: [
      "1 HS code classification",
      "Supporting rationale summary",
      "Special measure awareness flag",
      "Delivered within 1 business day",
      "Email support",
    ],
    cta: "Select Basic",
  },
  {
    name: "Business",
    priceCAD: 99,
    param: "business",
    popular: true,
    hsCount: 10,
    delivery: "1 business day",
    features: [
      "Up to 10 HS codes",
      "Cross-consistency review",
      "Special measure awareness screening",
      "Structured summary report",
      "Delivered within 1 business day",
    ],
    cta: "Select Business",
  },
  {
    name: "Pro",
    priceCAD: 249,
    param: "pro",
    popular: false,
    hsCount: 50,
    delivery: "48 business hours",
    features: [
      "Up to 50 HS codes",
      "Invoice-level consistency check",
      "Special measures screening",
      "Risk summary overview",
      "Delivered within 48 business hours",
    ],
    cta: "Select Pro",
  },
];

const INDUSTRY_CATEGORIES = [
  "Agriculture & Food",
  "Automotive & Transportation",
  "Chemicals & Pharmaceuticals",
  "Consumer Electronics",
  "Cosmetics & Personal Care",
  "Energy & Mining",
  "Fashion & Textiles",
  "Industrial Equipment",
  "Medical Devices",
  "Metals & Materials",
  "Plastics & Rubber",
  "Toys & Sporting Goods",
  "Wood & Paper Products",
  "Other",
];

const STEP_LABELS = [
  { label: "Package", icon: Package },
  { label: "Product Details", icon: ClipboardList },
  { label: "Documents", icon: FileText },
  { label: "Contact", icon: User },
  { label: "Review & Pay", icon: CreditCard },
];

interface FormData {
  productName: string;
  productDescription: string;
  countryOfOrigin: string;
  industryCategory: string;
  additionalNotes: string;
  email: string;
  companyName: string;
  phone: string;
}

export default function HsClassificationOrder() {
  const { formatPrice } = useCurrency();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const packageParam = params.get("package") || "";
  const cancelled = params.get("cancelled") === "true";

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState<string>(
    tiers.find((t) => t.param === packageParam)?.param || ""
  );
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    productDescription: "",
    countryOfOrigin: "",
    industryCategory: "",
    additionalNotes: "",
    email: "",
    companyName: "",
    phone: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  usePageMeta({
    title: "Order HS Code Classification Review | AccessToNorth.com",
    description:
      "Order a professional HS code classification review. Choose from Basic ($29), Business ($99), or Pro ($249) packages. Accurate tariff classification for Canadian imports.",
    canonical: "/order/hs-classification",
  });

  useEffect(() => {
    if (packageParam && tiers.find((t) => t.param === packageParam)) {
      setSelectedTier(packageParam);
      setCurrentStep(1);
    }
  }, []);

  useEffect(() => {
    if (cancelled) {
      toast({
        title: "Payment cancelled",
        description: "Your payment was cancelled. You can try again when ready.",
        variant: "destructive",
      });
    }
  }, [cancelled]);

  const selectedTierData = tiers.find((t) => t.param === selectedTier);

  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!selectedTier) {
        toast({ title: "Please select a package", variant: "destructive" });
        return false;
      }
    }

    if (step === 1) {
      if (!formData.productName.trim()) newErrors.productName = "Product name is required";
      if (!formData.productDescription.trim())
        newErrors.productDescription = "Product description is required";
      if (!formData.countryOfOrigin.trim())
        newErrors.countryOfOrigin = "Country of origin is required";
    }

    if (step === 3) {
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    for (const file of newFiles) {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} must be PDF, JPG, or PNG.`,
          variant: "destructive",
        });
        return;
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(3)) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("packageTier", selectedTier);
      fd.append("productName", formData.productName);
      fd.append("productDescription", formData.productDescription);
      fd.append("countryOfOrigin", formData.countryOfOrigin);
      fd.append("industryCategory", formData.industryCategory);
      fd.append("additionalNotes", formData.additionalNotes);
      fd.append("email", formData.email);
      fd.append("companyName", formData.companyName);
      fd.append("phone", formData.phone);

      for (const file of files) {
        fd.append("documents", file);
      }

      const res = await fetch("/api/classification-orders", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Order failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Breadcrumbs
            items={[
              { label: "Tools", href: "/tools" },
              { label: "HS Code Finder", href: "/tools/hs-code-finder" },
              { label: "Order Classification" },
            ]}
          />

          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-1" data-testid="step-indicator">
              {STEP_LABELS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 transition-colors ${
                        isDone
                          ? "bg-blue-600 text-white"
                          : isActive
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      data-testid={`step-icon-${i}`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-xs font-medium text-center hidden sm:block ${
                        isActive ? "text-blue-700" : isDone ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 mt-2">
              {STEP_LABELS.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i <= currentStep ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ===== STEP 0: PACKAGE SELECTION ===== */}
          {currentStep === 0 && (
            <div data-testid="step-0-package">
              <div className="text-center mb-6">
                <h1
                  className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 mb-2"
                  data-testid="text-order-title"
                >
                  Select Your Package
                </h1>
                <p className="text-sm text-slate-600 max-w-xl mx-auto">
                  Choose the classification package that fits your needs. You can change this at any time before payment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="grid-package-select">
                {tiers.map((tier) => {
                  const isSelected = selectedTier === tier.param;
                  return (
                    <Card
                      key={tier.param}
                      className={`relative border cursor-pointer transition-all duration-200 ${
                        tier.popular
                          ? isSelected
                            ? "border-blue-400 ring-2 ring-blue-200"
                            : "border-blue-300 ring-1 ring-blue-100"
                          : isSelected
                          ? "border-blue-400 ring-2 ring-blue-200"
                          : "border-slate-200"
                      }`}
                      onClick={() => setSelectedTier(tier.param)}
                      data-testid={`card-select-${tier.param}`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-blue-600 text-white border-0">Most Popular</Badge>
                        </div>
                      )}
                      <CardContent className="p-5 pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-slate-900">{tier.name}</h3>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900 mb-3">{formatPrice(tier.priceCAD)}</p>
                        <ul className="space-y-1.5">
                          {tier.features.map((f) => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={goNext}
                  disabled={!selectedTier}
                  data-testid="button-next-step-0"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 1: PRODUCT DETAILS ===== */}
          {currentStep === 1 && (
            <div data-testid="step-1-product">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Product & Shipment Details</h2>
                <p className="text-sm text-slate-500">
                  Provide details about the product(s) you need classified. The more detail you provide, the more accurate your classification.
                </p>
              </div>

              {selectedTierData && (
                <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between gap-2 flex-wrap" data-testid="package-summary-banner">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-sm font-medium text-blue-800">
                      {selectedTierData.name} — {formatPrice(selectedTierData.priceCAD)} (up to {selectedTierData.hsCount} HS code{selectedTierData.hsCount > 1 ? "s" : ""})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(0); }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                    data-testid="button-change-package"
                  >
                    Change
                  </button>
                </div>
              )}

              <Card className="p-6 mb-6">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="productName" className="text-sm font-medium text-slate-700">
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="productName"
                      data-testid="input-product-name"
                      placeholder="e.g. Stainless steel water bottle, 750ml"
                      value={formData.productName}
                      onChange={(e) => updateField("productName", e.target.value)}
                      className={errors.productName ? "border-red-400" : ""}
                    />
                    {errors.productName && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.productName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="productDescription" className="text-sm font-medium text-slate-700">
                      Detailed Description <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-400 mb-1">
                      Include material, composition, function, and intended use
                    </p>
                    <Textarea
                      id="productDescription"
                      data-testid="input-product-description"
                      placeholder="e.g. Double-wall vacuum insulated water bottle made from 18/8 food-grade stainless steel, BPA-free lid with silicone seal, capacity 750ml, intended for retail consumer use..."
                      rows={4}
                      value={formData.productDescription}
                      onChange={(e) => updateField("productDescription", e.target.value)}
                      className={errors.productDescription ? "border-red-400" : ""}
                    />
                    {errors.productDescription && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.productDescription}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="countryOfOrigin" className="text-sm font-medium text-slate-700">
                      Country of Origin <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="countryOfOrigin"
                      data-testid="input-country-origin"
                      placeholder="e.g. China, United States, Germany"
                      value={formData.countryOfOrigin}
                      onChange={(e) => updateField("countryOfOrigin", e.target.value)}
                      className={errors.countryOfOrigin ? "border-red-400" : ""}
                    />
                    {errors.countryOfOrigin && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.countryOfOrigin}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="industryCategory" className="text-sm font-medium text-slate-700">
                      Industry Category
                    </Label>
                    <Select
                      value={formData.industryCategory}
                      onValueChange={(val) => updateField("industryCategory", val)}
                    >
                      <SelectTrigger data-testid="select-industry">
                        <SelectValue placeholder="Select an industry (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="additionalNotes" className="text-sm font-medium text-slate-700">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="additionalNotes"
                      data-testid="input-additional-notes"
                      placeholder="Any additional context, special requirements, or questions..."
                      rows={3}
                      value={formData.additionalNotes}
                      onChange={(e) => updateField("additionalNotes", e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={goBack} data-testid="button-back-step-1">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button onClick={goNext} data-testid="button-next-step-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: DOCUMENT UPLOAD (OPTIONAL) ===== */}
          {currentStep === 2 && (
            <div data-testid="step-2-documents">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Upload Supporting Documents{" "}
                  <span className="text-sm font-normal text-slate-400">(Optional)</span>
                </h2>
                <p className="text-sm text-slate-500">
                  Supporting documents help us provide a more accurate classification.
                </p>
              </div>

              <Card className="p-6 mb-4">
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-upload"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">PDF, JPG, or PNG — Max 10MB per file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={handleFileAdd}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2" data-testid="list-uploaded-files">
                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                        data-testid={`file-item-${i}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          <span className="text-xs text-slate-400 shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="p-1 hover-elevate rounded cursor-pointer"
                          data-testid={`button-remove-file-${i}`}
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-2 font-medium">Recommended documents:</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-slate-400" />
                      Commercial invoice
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-slate-400" />
                      Product specification sheet
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-slate-400" />
                      Product photos
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-slate-400" />
                      Technical drawings
                    </li>
                  </ul>
                </div>
              </Card>

              <p className="text-xs text-slate-500 mb-6" data-testid="text-upload-optional-note">
                No documents available? No problem. You can still place your order using a detailed product description. If needed, we may follow up by email for additional details.
              </p>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={goBack} data-testid="button-back-step-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button onClick={goNext} data-testid="button-next-step-2">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: CONTACT INFORMATION ===== */}
          {currentStep === 3 && (
            <div data-testid="step-3-contact">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Contact Information</h2>
                <p className="text-sm text-slate-500">
                  We'll use this to deliver your classification report and follow up if needed.
                </p>
              </div>

              <Card className="p-6 mb-6">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="input-email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={errors.email ? "border-red-400" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      data-testid="input-company-name"
                      placeholder="Optional"
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      data-testid="input-phone"
                      placeholder="Optional"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={goBack} data-testid="button-back-step-3">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button onClick={goNext} data-testid="button-next-step-3">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 4: REVIEW & PAY ===== */}
          {currentStep === 4 && (
            <div data-testid="step-4-review">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Review & Confirm</h2>
                <p className="text-sm text-slate-500">
                  Please review your order details before proceeding to payment.
                </p>
              </div>

              <Card className="p-6 mb-6" data-testid="card-review-summary">
                <div className="space-y-5">
                  {/* Package */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Package</p>
                      <p className="font-semibold text-slate-900">
                        {selectedTierData?.name} — {selectedTierData ? formatPrice(selectedTierData.priceCAD) : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        Up to {selectedTierData?.hsCount} HS code{(selectedTierData?.hsCount || 0) > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                      data-testid="button-edit-package"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Product */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-xs text-slate-500 mb-0.5">Product</p>
                      <p className="font-medium text-slate-900" data-testid="review-product-name">
                        {formData.productName}
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-3">{formData.productDescription}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-blue-600 hover:underline cursor-pointer font-medium shrink-0"
                      data-testid="button-edit-product"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Country */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Country of Origin</p>
                      <p className="font-medium text-slate-900" data-testid="review-country">
                        {formData.countryOfOrigin}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Documents */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Documents</p>
                      <p className="font-medium text-slate-900">
                        {files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""} attached` : "No documents uploaded"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Contact</p>
                      <p className="font-medium text-slate-900" data-testid="review-email">{formData.email}</p>
                      {formData.companyName && (
                        <p className="text-sm text-slate-500">{formData.companyName}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Delivery */}
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Estimated Delivery</p>
                    <p className="font-medium text-slate-900">{selectedTierData?.delivery}</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={goBack} data-testid="button-back-step-4">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  data-testid="button-proceed-payment"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-1" />
                      Proceed to Secure Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Compliance Disclaimer */}
          <div className="text-center mt-10">
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed" data-testid="text-disclaimer">
              AccessToNorth provides independent tariff classification guidance. Final determination of tariff treatment is made by the Canada Border Services Agency (CBSA).
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
