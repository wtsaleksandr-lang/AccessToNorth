declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
    };
  }
}

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingCard } from "@/components/PricingCard";
import { RegistrationModal } from "@/components/RegistrationModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, ShieldCheck, Award, Lock } from "lucide-react";
import { useContact } from "@/hooks/use-registrations";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("basic");
  
  const handleOpenModal = (pkg: string) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const packages = [
    {
      type: 'basic',
      title: "Basic Registration",
      price: "99",
      description: "Essential Business Number (BN) registration for small businesses.",
      features: [
        { text: "Business Number (BN) Setup", included: true },
        { text: "Official CRA Documentation", included: true },
        { text: "GST/HST Registration", included: false },
        { text: "Payroll Account", included: false },
        { text: "Import/Export Account", included: false },
      ]
    },
    {
      type: 'standard',
      title: "Standard GST/HST",
      price: "249",
      description: "Complete GST/HST registration including provincial requirements.",
      features: [
        { text: "Business Number (BN) Setup", included: true },
        { text: "Official CRA Documentation", included: true },
        { text: "GST/HST Registration", included: true },
        { text: "Payroll Account", included: false },
        { text: "Import/Export Account", included: false },
      ],
      isPopular: true
    },
    {
      type: 'premium',
      title: "Premium Bundle",
      price: "399",
      description: "All-in-one compliance package for growing businesses.",
      features: [
        { text: "Business Number (BN) Setup", included: true },
        { text: "Official CRA Documentation", included: true },
        { text: "GST/HST Registration", included: true },
        { text: "Payroll Account", included: true },
        { text: "Import/Export Account", included: true },
      ]
    },
    {
      type: 'non-resident',
      title: "Non-Resident",
      price: "499",
      description: "Specialized service for foreign entities selling in Canada.",
      features: [
        { text: "Simplified Regime Setup", included: true },
        { text: "Non-Resident NR Accounts", included: true },
        { text: "GST/HST Registration", included: true },
        { text: "CRA Audit Support", included: true },
        { text: "Digital Services Compliance", included: true },
      ]
    },
    {
      type: 'importer-bundle',
      title: "Complete Importer Bundle",
      price: "1,500",
      description: "End-to-end BN + GST/HST + CARM registration and management for importers.",
      features: [
        { text: "Business Number (BN) Setup", included: true },
        { text: "GST/HST Registration", included: true },
        { text: "Full CARM Portal Registration", included: true },
        { text: "CARM Delegation & Management", included: true },
        { text: "Import/Export Account", included: true },
        { text: "Ongoing Compliance Support", included: true },
      ],
      isFeatured: true
    }
  ];

  return (
    <div className="min-h-screen font-sans bg-slate-50 selection:bg-primary/20 selection:text-primary">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 maple-bg">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Official CRA Authorized Representatives
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-slate-900 leading-[1.1]" data-testid="text-hero-title">
                Expert GST/HST & <br />
                <span className="text-primary">Business Registration</span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Register your business with the CRA correctly and efficiently. From Business Numbers to Non-Resident GST/HST, we handle the paperwork so you can focus on business.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button 
                  size="lg" 
                  className="bg-primary text-lg px-8 h-12 shadow-lg shadow-primary/25"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-start-registration"
                >
                  Start Registration
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <div className="flex items-center gap-4 px-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    <span className="text-slate-600 font-medium">Trusted by 10k+ businesses</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
              
              <div className="relative glass-card rounded-2xl p-6 md:p-8 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="h-2 w-20 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-32 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-primary w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full bg-slate-200 rounded mb-1.5"></div>
                        <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm text-slate-500">Registration Status</span>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">Completed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 text-slate-600" data-testid="trust-badge-cra">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">CRA Authorized Rep</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600" data-testid="trust-badge-guarantee">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Satisfaction Guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600" data-testid="trust-badge-secure">
              <Lock className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Secure & Confidential</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services/Features */}
      <FeaturesSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-display mb-4" data-testid="text-pricing-title">Transparent Pricing</h2>
            <p className="text-lg text-slate-600">
              Choose the package that fits your business needs. One-time fees, no hidden costs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {packages.filter(p => !p.isFeatured).map((pkg) => (
              <PricingCard 
                key={pkg.type}
                {...pkg}
                onSelect={() => handleOpenModal(pkg.type)}
              />
            ))}
          </div>

          {/* Featured Importer Bundle */}
          {packages.filter(p => p.isFeatured).map((pkg) => (
            <div key={pkg.type} className="max-w-lg mx-auto mt-4">
              <PricingCard 
                {...pkg}
                onSelect={() => handleOpenModal(pkg.type)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-12 bg-blue-50/50 border-y border-blue-100/50">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <Award className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold font-display mb-2">Satisfaction Guarantee</h3>
          <p className="text-slate-600">
            If we fall short on our registration process due to our error, you receive a full refund. We stand behind every filing.
          </p>
        </div>
      </section>

      {/* Non-Resident Section */}
      <section id="non-resident" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1632&h=1224" 
                alt="International Business Team" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold font-display" data-testid="text-nonresident-title">Are You a Non-Resident Selling in Canada?</h2>
              <p className="text-lg text-slate-600">
                New rules require many non-resident businesses to register for GST/HST under the simplified regime. If you sell digital products, services, or goods through fulfillment warehouses, you likely need to register.
              </p>
              <ul className="space-y-4">
                {[
                  "Digital Economy Compliance",
                  "Simplified GST/HST Regime Registration",
                  "Annual Information Return Filing",
                  "Election for Agents"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium text-slate-800">{item}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                size="lg" 
                className="mt-4"
                onClick={() => handleOpenModal('non-resident')}
                data-testid="button-nonresident-learn-more"
              >
                Learn More About Non-Resident Rules
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold font-display text-center mb-16">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "The process was incredibly smooth. I tried doing it myself but got confused by the CRA forms. AccessToNorth handled it seamlessly.",
                author: "Sarah J.",
                role: "E-commerce Founder"
              },
              {
                text: "As a US company selling software to Canadians, I had no idea about the new tax laws. AccessToNorth sorted out our compliance perfectly.",
                author: "Michael R.",
                role: "SaaS CEO"
              },
              {
                text: "Worth every penny. The premium package set up our payroll and import accounts along with the GST number. Huge time saver.",
                author: "David C.",
                role: "Import/Export Director"
              },
              {
                text: "Registered my non-resident GST/HST quickly and without any hassle. The team was knowledgeable and responsive throughout.",
                author: "John D.",
                role: "US E-commerce Seller"
              },
              {
                text: "The Complete Importer Bundle was exactly what we needed. CARM setup was smooth and now we are fully compliant for importing.",
                author: "Priya M.",
                role: "Logistics Manager"
              }
            ].map((t, i) => (
              <div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700" data-testid={`testimonial-card-${i}`}>
                <div className="flex text-yellow-400 mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-300 mb-6 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold">{t.author}</p>
                  <p className="text-sm text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h2 className="text-3xl font-bold font-display text-center mb-12" data-testid="text-faq-title">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                q: "Do I need to register for GST/HST?",
                a: "You generally must register if your worldwide taxable revenues exceed $30,000 in a single calendar quarter or over four consecutive calendar quarters. Taxi and ride-sharing operators must register regardless of revenue."
              },
              {
                q: "What is a Business Number (BN)?",
                a: "A Business Number (BN) is a 9-digit number the CRA assigns to businesses for tax matters. It stays the same for your business's lifetime."
              },
              {
                q: "How long does registration take?",
                a: "Processing times vary depending on your application type and CRA workload. We submit your documents promptly and keep you updated throughout the process."
              },
              {
                q: "Can non-residents register?",
                a: "Yes. Non-resident businesses that make taxable supplies in Canada may be required to register. We specialize in non-resident simplified regime registrations."
              },
              {
                q: "Do non-residents need GST/HST?",
                a: "If you are a non-resident selling digital products or services to Canadian consumers, you are likely required to register under the simplified GST/HST regime. This applies to digital sellers, SaaS providers, and marketplace facilitators."
              },
              {
                q: "How do I register for CARM as an importer?",
                a: "CARM (CBSA Assessment and Revenue Management) is the new customs portal. Our Complete Importer Bundle handles end-to-end CARM registration, delegation, and ongoing management so your imports are never delayed."
              },
              {
                q: "What is the simplified registration regime?",
                a: "The simplified registration regime allows non-resident businesses to register for GST/HST without needing a full Canadian business presence. It streamlines the process for foreign digital sellers."
              },
              {
                q: "Why register voluntarily if I'm under the $30k threshold?",
                a: "Voluntary registration lets you claim Input Tax Credits (ITCs) on business expenses in Canada, which can offset your tax liability. It also adds credibility when dealing with Canadian business clients."
              }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-white px-6 rounded-xl border border-slate-200 shadow-sm" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="text-left font-medium text-slate-900 py-6">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact Form */}
      <ContactSection />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800" data-testid="footer">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="text-xl font-bold font-display text-white mb-4 block">AccessToNorth.com</span>
              <p className="text-sm">Simplifying Canadian tax registration for businesses worldwide.</p>
              <p className="text-xs mt-3 text-slate-500">AccessToNorth.com is a division of MR Holdings & Trade LLC</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#pricing" className="hover:text-primary">GST/HST Registration</a></li>
                <li><a href="#pricing" className="hover:text-primary">Business Numbers</a></li>
                <li><a href="#non-resident" className="hover:text-primary">Non-Resident Compliance</a></li>
                <li><a href="#pricing" className="hover:text-primary">CARM Importer Bundle</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#services" className="hover:text-primary">About Us</a></li>
                <li><a href="#contact" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
              <p className="text-xs mt-4 text-slate-500">Email: operations@accesstonorth.com</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Client Portal</h4>
              <Button variant="outline" className="w-full text-white border-slate-700 bg-transparent hover:bg-slate-800" onClick={() => window.location.href = '/portal'} data-testid="button-footer-portal">
                Check Status
              </Button>
            </div>
          </div>
          <div className="text-center text-xs pt-8 border-t border-slate-800">
            &copy; {new Date().getFullYear()} AccessToNorth.com &mdash; Authorized CRA Filing Assistance for Canada & International Businesses. Division of MR Holdings & Trade LLC.
          </div>
        </div>
      </footer>

      <RegistrationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        defaultPackage={selectedPackage}
      />
    </div>
  );
}

function ContactSection() {
  const { submitContact } = useContact();
  const contactFormSchema = api.contact.submit.input;
  
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  });

  const onSubmit = async (data: z.infer<typeof contactFormSchema>) => {
    try {
      await submitContact.mutateAsync(data);
      form.reset();
    } catch (error) {
      // Handled by hook
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold font-display mb-6" data-testid="text-contact-title">Get In Touch</h2>
            <p className="text-slate-600 mb-8">
              Have questions about your eligibility or the registration process? 
              Our team of specialists is ready to help.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                  <span className="font-bold">E</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Email Us</p>
                  <p className="text-slate-500">operations@accesstonorth.com</p>
                </div>
              </div>
              <button
                type="button"
                data-testid="button-open-tawk-chat"
                onClick={() => {
                  if (window.Tawk_API && window.Tawk_API.maximize) {
                    window.Tawk_API.maximize();
                  }
                }}
                className="flex items-center gap-4 w-full rounded-md border border-primary/20 bg-primary/5 p-4 cursor-pointer text-left transition-all duration-200 hover:bg-primary/10 hover:border-primary/40 hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="font-bold text-sm">AI</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary">Live AI Support</p>
                  <p className="text-slate-500 text-sm">Click to chat with us instantly</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50 flex-shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          </div>
        </div>
      </div>
    </section>
  );
}
