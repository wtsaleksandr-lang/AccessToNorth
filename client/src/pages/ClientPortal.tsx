import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, FileText, Settings, Shield } from "lucide-react";
import { motion } from "framer-motion";

const mockStages = [
  { label: "Received Documents", status: "complete" },
  { label: "Processing CRA BN", status: "complete" },
  { label: "GST/HST Setup", status: "in-progress" },
  { label: "CARM Delegation", status: "pending" },
  { label: "Complete", status: "pending" },
];

export default function ClientPortal() {
  const completedCount = mockStages.filter(s => s.status === 'complete').length;
  const progressPercent = Math.round((completedCount / mockStages.length) * 100);

  useEffect(() => {
    document.title = "Client Portal - AccessToNorth.com";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Track your GST/HST and Business Number registration progress with AccessToNorth.com's secure client portal.");
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-4" data-testid="text-portal-title">
              Client Portal
            </h1>
            <p className="text-slate-600">
              Your secure client dashboard is coming soon. Here's a preview of how you'll track your registration progress.
            </p>
          </div>

          <Card className="shadow-xl border-0 ring-1 ring-slate-200 mb-8" data-testid="card-portal-preview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Application Tracker Preview
              </CardTitle>
              <CardDescription>Track every step of your registration in real-time once your portal is active.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                  <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                    data-testid="progress-bar"
                  ></div>
                </div>
              </div>

              {/* Status Steps */}
              <div className="space-y-4">
                {mockStages.map((stage, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      stage.status === 'complete' 
                        ? 'bg-green-50 border-green-200' 
                        : stage.status === 'in-progress' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-slate-50 border-slate-200'
                    }`}
                    data-testid={`stage-${i}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      stage.status === 'complete' 
                        ? 'bg-green-100 text-green-600' 
                        : stage.status === 'in-progress' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-slate-200 text-slate-400'
                    }`}>
                      {stage.status === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : stage.status === 'in-progress' ? (
                        <Clock className="w-4 h-4 animate-pulse" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        stage.status === 'complete' ? 'text-green-800' 
                        : stage.status === 'in-progress' ? 'text-blue-800' 
                        : 'text-slate-500'
                      }`}>
                        {stage.label}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stage.status === 'complete' 
                        ? 'bg-green-100 text-green-700' 
                        : stage.status === 'in-progress' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-100 text-slate-500'
                    }`}>
                      {stage.status === 'complete' ? 'Done' : stage.status === 'in-progress' ? 'Working On It' : 'Upcoming'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Portal Features Preview */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Document Management</p>
                  <p className="text-xs text-slate-500 mt-1">Upload and track documents</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Settings className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Account Settings</p>
                  <p className="text-xs text-slate-500 mt-1">Manage your profile</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Secure Access</p>
                  <p className="text-xs text-slate-500 mt-1">Encrypted & confidential</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <p className="text-sm text-slate-500">
              Full portal launching soon. Need help now?{" "}
              <a href="mailto:operations@accesstonorth.com" className="text-primary hover:underline">
                Email Support
              </a>
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/'} data-testid="button-back-home">
              Back to Home
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
