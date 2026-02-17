import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { useRegistrations } from "@/hooks/use-registrations";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackage: string;
}

// Client-side validation schema derived from API schema
const formSchema = api.registrations.create.input;
type FormValues = z.infer<typeof formSchema>;

export function RegistrationModal({ isOpen, onClose, defaultPackage }: RegistrationModalProps) {
  const { createRegistration } = useRegistrations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      email: "",
      phone: "",
      packageType: defaultPackage,
      isNonResident: defaultPackage === 'non-resident',
    },
  });

  // Update form when default package changes
  useEffect(() => {
    form.setValue("packageType", defaultPackage);
    form.setValue("isNonResident", defaultPackage === 'non-resident');
  }, [defaultPackage, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      await createRegistration.mutateAsync(data);
      form.reset();
      onClose();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Registration</DialogTitle>
          <DialogDescription>
            Enter your business details below to get started with the {defaultPackage.replace('-', ' ')} package.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp Ltd." {...field} />
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="you@company.com" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 000-0000" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selected Package</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">Basic ($99)</SelectItem>
                      <SelectItem value="standard">Standard ($199)</SelectItem>
                      <SelectItem value="premium">Premium ($299)</SelectItem>
                      <SelectItem value="non-resident">Non-Resident ($349)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full mt-4 bg-primary hover:bg-primary/90"
              disabled={createRegistration.isPending}
            >
              {createRegistration.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              By submitting this form, you agree to our Terms of Service and Privacy Policy.
              A specialist will contact you to verify details.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
