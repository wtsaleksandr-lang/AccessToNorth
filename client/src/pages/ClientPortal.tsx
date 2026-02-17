import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegistrations } from "@/hooks/use-registrations";
import { Loader2, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientPortal() {
  const [email, setEmail] = useState("");
  const { checkStatus } = useRegistrations();
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      const data = await checkStatus.mutateAsync(email);
      setResults(data);
    } catch (error) {
      setResults([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      default: return 'text-amber-600 bg-amber-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      case 'processing': return <Loader2 className="w-5 h-5 animate-spin" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-4">
              Client Portal
            </h1>
            <p className="text-slate-600">
              Track the status of your business registration application in real-time.
            </p>
          </div>

          <Card className="shadow-xl border-0 ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle>Check Application Status</CardTitle>
              <CardDescription>Enter the email address used during registration</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="name@company.com" 
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button disabled={checkStatus.isPending}>
                  {checkStatus.isPending ? "Searching..." : "Track"}
                </Button>
              </form>

              {results && (
                <div className="space-y-4">
                  {results.length > 0 ? (
                    results.map((reg) => (
                      <motion.div 
                        key={reg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-900">{reg.businessName}</h3>
                          <p className="text-sm text-slate-500 capitalize">{reg.packageType.replace('-', ' ')} Package</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium ${getStatusColor(reg.status)}`}>
                          {getStatusIcon(reg.status)}
                          <span className="capitalize">{reg.status}</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p>No applications found for this email.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Need help? <a href="mailto:support@gst-hst.com" className="text-primary hover:underline">Contact Support</a>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
