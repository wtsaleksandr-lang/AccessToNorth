import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CalendarClock, MessageCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  service: z.string().optional(),
  message: z.string().min(10, "Please provide more detail"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactServicePrices: Record<string, number> = {
  "business-number": 99,
  "gst-hst": 249,
  "non-resident": 399,
  "carm": 499,
  "complete-bundle": 1500,
};

export default function Contact() {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", service: "", message: "" },
  });

  const submitContact = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await apiRequest("POST", "/api/contact", {
        name: data.name,
        email: data.email,
        message: data.service ? `[Service: ${data.service}] ${data.message}` : data.message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry received",
        description: "We'll reply within one business day. Check your inbox (and spam folder) for our response.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "We couldn't send your inquiry",
        description: "Please try again, or email operations@accesstonorth.com directly.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => submitContact.mutate(data);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-display mb-3" data-testid="text-contact-title">Contact Us</h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
              For new-client inquiries, scope questions, or a 30-minute consultation.
              Email is the fastest path — we reply within one business day, Mon–Fri.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <a
              href="mailto:operations@accesstonorth.com"
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              data-testid="contact-card-email"
            >
              <Card className="h-full hover:border-primary/30 transition-colors">
                <CardContent className="flex flex-col items-center text-center p-6 gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-sm text-slate-700 font-medium break-all">operations@accesstonorth.com</p>
                  <p className="text-xs text-slate-500">Monitored Mon–Fri, 9 a.m.–6 p.m. ET. Responses within one business day.</p>
                </CardContent>
              </Card>
            </a>
            <a
              href="mailto:operations@accesstonorth.com?subject=Consultation%20request"
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              data-testid="contact-card-consultation"
            >
              <Card className="h-full hover:border-primary/30 transition-colors">
                <CardContent className="flex flex-col items-center text-center p-6 gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Book a consultation</h3>
                  <p className="text-sm text-slate-700 font-medium">30-minute review</p>
                  <p className="text-xs text-slate-500">Email us your situation and we'll send a calendar link within one business day.</p>
                </CardContent>
              </Card>
            </a>
            <button
              type="button"
              className="block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              onClick={() => {
                window.dispatchEvent(new Event("atn:open-chat"));
              }}
              data-testid="contact-card-chat"
            >
              <Card className="h-full cursor-pointer hover:border-primary/30 transition-colors">
                <CardContent className="flex flex-col items-center text-center p-6 gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Live chat</h3>
                  <p className="text-sm text-slate-700 font-medium">Start a chat</p>
                  <p className="text-xs text-slate-500">Available during business hours. Outside hours, we'll reply by email.</p>
                </CardContent>
              </Card>
            </button>
          </div>

          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="p-6 md:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input placeholder="First and last name" autoComplete="name" {...field} data-testid="input-contact-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@company.com" type="email" autoComplete="email" {...field} data-testid="input-contact-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service of interest <span className="text-slate-400 font-normal">(optional)</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contact-service">
                                <SelectValue placeholder="Select a service or leave blank" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="business-number">Business Number (from {formatPrice(99)})</SelectItem>
                              <SelectItem value="gst-hst">GST/HST Registration (from {formatPrice(249)})</SelectItem>
                              <SelectItem value="non-resident">Non-Resident Setup (from {formatPrice(399)})</SelectItem>
                              <SelectItem value="carm">CARM Portal Setup (from {formatPrice(499)})</SelectItem>
                              <SelectItem value="complete-bundle">Importer Launch Kit (from {formatPrice(1500)})</SelectItem>
                              <SelectItem value="general">General inquiry</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your situation</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Briefly: who you are, what you're trying to file, and any timing constraints. We'll respond within one business day."
                              rows={5}
                              {...field}
                              data-testid="input-contact-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitContact.isPending}
                      data-testid="button-send-message"
                    >
                      {submitContact.isPending ? "Sending…" : "Send inquiry"}
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      By submitting, you agree to our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                      We'll only use this information to respond to your inquiry.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
