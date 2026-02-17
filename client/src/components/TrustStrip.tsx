import { ShieldCheck, CheckCircle2, Lock, Clock, Landmark, Building2, Shield, BadgeCheck, Star } from "lucide-react";

const experienceItems = [
  { icon: Clock, label: "20+ Years Trade & Logistics Experience" },
  { icon: Star, label: "4.9/5 Client Satisfaction" },
  { icon: Lock, label: "Secure Digital Document Delivery" },
  { icon: ShieldCheck, label: "End-to-End Administrative Coordination" },
];

const agencies = [
  { icon: Landmark, label: "CRA" },
  { icon: Shield, label: "IRS" },
  { icon: Building2, label: "CBSA" },
  { icon: BadgeCheck, label: "USPTO" },
  { icon: Building2, label: "SBA" },
];

export function TrustStrip() {
  return (
    <section className="py-16 bg-white border-t border-slate-100" data-testid="trust-strip-section">
      <div className="container mx-auto px-4 md:px-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-10">
          Trusted Infrastructure for Cross-Border Business
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 mb-12">
          {experienceItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-200"
              data-testid={`trust-exp-${item.label.substring(0, 10).toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <p className="text-xs text-slate-400 uppercase tracking-widest text-center mb-5">Regulatory Bodies We Work With</p>
          <div className="flex justify-center gap-5 sm:gap-8">
            {agencies.map((agency) => (
              <div
                key={agency.label}
                className="flex items-center gap-1.5 opacity-40 grayscale transition-all duration-200 hover:opacity-70"
                data-testid={`trust-agency-${agency.label.toLowerCase()}`}
              >
                <agency.icon className="w-5 h-5 text-slate-600" />
                <span className="text-xs font-semibold text-slate-600 tracking-wide">{agency.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Not affiliated with or endorsed by any government authority.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex gap-0.5 mb-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-sm font-semibold text-slate-800" data-testid="trust-rating">4.9/5 average client rating</p>
          <p className="text-xs text-slate-400 mt-1">Based on verified service feedback</p>
        </div>
      </div>
    </section>
  );
}
