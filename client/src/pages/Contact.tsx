declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
    };
  }
}

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
import { Mail, Clock, MessageCircle } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  service: z.string().optional(),
  message: z.string().min(10, "Please provide more detail"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();

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
      toast({ title: "Message Sent", description: "We'll get back to you within 1–2 business days." });
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const onSubmit = (data: ContactFormData) => submitContact.mutate(data);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-display mb-3" data-testid="text-contact-title">Get in Touch</h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Have a question about our services? We're here to help. Send us a message and we'll respond within 1–2 business days.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-sm text-slate-500">operations@accesstonorth.com</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Response Time</h3>
                <p className="text-sm text-slate-500">1–2 business days</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer"
              onClick={() => {
                if (window.Tawk_API && window.Tawk_API.maximize) {
                  window.Tawk_API.maximize();
                }
              }}
            >
              <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-slate-500">Click to start a chat</p>
              </CardContent>
            </Card>
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
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} data-testid="input-contact-name" />
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
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} data-testid="input-contact-email" />
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
                          <FormLabel>Service of Interest</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contact-service">
                                <SelectValue placeholder="Select a service (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="business-number">Business Number ($99)</SelectItem>
                              <SelectItem value="gst-hst">GST/HST Registration ($249)</SelectItem>
                              <SelectItem value="non-resident">Non-Resident Tax ($399)</SelectItem>
                              <SelectItem value="carm">CARM Portal ($499)</SelectItem>
                              <SelectItem value="complete-bundle">Complete Importer Bundle ($1,500)</SelectItem>
                              <SelectItem value="general">General Inquiry</SelectItem>
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
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="How can we help you?" rows={4} {...field} data-testid="input-contact-message" />
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
                      {submitContact.isPending ? "Sending..." : "Send Message"}
                    </Button>
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
