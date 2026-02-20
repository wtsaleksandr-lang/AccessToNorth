import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegistrations } from "@/hooks/use-registrations";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackage: string;
}

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  residentStatus: z.string().min(1, "Please select resident status"),
  packageType: z.string().min(1, "Please select a package"),
  businessType: z.string().optional(),
  estimatedRevenue: z.string().optional(),
  notes: z.string().optional(),
  authorizationConsent: z.boolean().refine(val => val === true, {
    message: "You must authorize AccessToNorth.com to act as your representative",
  }),
  isNonResident: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const packageData: Record<string, { label: string; priceCAD: number }> = {
  bn: { label: "Business Number", priceCAD: 99 },
  gst_hst: { label: "GST/HST Registration", priceCAD: 249 },
  bundle_business_starter: { label: "Business Starter Bundle", priceCAD: 299 },
  non_resident_tax: { label: "Non-Resident Tax Registration", priceCAD: 399 },
  carm_portal: { label: "CARM Portal Registration", priceCAD: 499 },
  rpp_bond: { label: "RPP / Bond Coordination", priceCAD: 395 },
  b13_export: { label: "B13 Export Declaration", priceCAD: 125 },
  hs_classification: { label: "HS Code Classification", priceCAD: 95 },
  bundle_complete_importer: { label: "Complete Importer Bundle", priceCAD: 1500 },
};


export function RegistrationModal({ isOpen, onClose, defaultPackage }: RegistrationModalProps) {
  const { createRegistration } = useRegistrations();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      businessName: "",
      residentStatus: defaultPackage === 'non_resident_tax' ? 'non-resident' : 'canadian',
      packageType: defaultPackage,
      businessType: "",
      estimatedRevenue: "",
      notes: "",
      authorizationConsent: false,
      isNonResident: defaultPackage === 'non_resident_tax',
    },
  });

  useEffect(() => {
    form.setValue("packageType", defaultPackage);
    form.setValue("isNonResident", defaultPackage === 'non_resident_tax');
    if (defaultPackage === 'non_resident_tax') {
      form.setValue("residentStatus", "non-resident");
    }
  }, [defaultPackage, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const registration = await createRegistration.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        businessName: data.businessName,
        residentStatus: data.residentStatus,
        packageType: data.packageType,
        businessType: data.businessType || null,
        estimatedRevenue: data.estimatedRevenue || null,
        notes: data.notes || null,
        authorizationConsent: data.authorizationConsent,
        isNonResident: data.isNonResident || false,
      });

      setIsRedirecting(true);

      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType: data.packageType,
          registrationId: registration.id,
          customerEmail: data.email,
          customerName: data.fullName,
        }),
      });

      if (!checkoutRes.ok) throw new Error('Failed to create checkout session');
      const { url } = await checkoutRes.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      setIsRedirecting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isPending = createRegistration.isPending || isRedirecting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle data-testid="text-modal-title">Complete Your Application</DialogTitle>
            <DialogDescription>
              Fill in your details below for the {packageData[defaultPackage] ? `${packageData[defaultPackage].label} (${formatPrice(packageData[defaultPackage].priceCAD)})` : defaultPackage} package.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-full-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="you@company.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} value={field.value || ''} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp Ltd." {...field} data-testid="input-business-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="residentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resident Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-resident-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="canadian">Canadian Resident</SelectItem>
                          <SelectItem value="non-resident">Non-Resident</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selected Package *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-package">
                            <SelectValue placeholder="Select a package" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(packageData).map(([key, pkg]) => (
                            <SelectItem key={key} value={key}>{pkg.label} ({formatPrice(pkg.priceCAD)})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-business-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="non-profit">Non-Profit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Annual Revenue</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-revenue">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under-30k">Under $30,000</SelectItem>
                          <SelectItem value="30k-100k">$30,000 - $100,000</SelectItem>
                          <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                          <SelectItem value="500k-1m">$500,000 - $1,000,000</SelectItem>
                          <SelectItem value="over-1m">Over $1,000,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message / Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about your business or registration needs..." 
                        rows={3} 
                        {...field} 
                        value={field.value || ''}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Upload Supporting Documents (optional)</FormLabel>
                <p className="text-xs text-muted-foreground mb-2">PDF, DOCX, JPG accepted</p>
                <div 
                  className="border-2 border-dashed border-slate-200 rounded-md p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-documents"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">Click to upload files</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple 
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-slate-50 px-3 py-1.5 rounded-md">
                        <span className="text-slate-700 truncate">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 ml-2">
                          <span className="sr-only">Remove</span>x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="authorizationConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50/50">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-authorization"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        I authorize AccessToNorth.com to act as my representative for CRA registrations *
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                disabled={isPending}
                data-testid="button-submit-application"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRedirecting ? "Redirecting to Payment..." : "Processing..."}
                  </>
                ) : (
                  "Submit & Pay Securely"
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                You'll be redirected to our secure payment page powered by Stripe. All information is confidential.
              </p>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
