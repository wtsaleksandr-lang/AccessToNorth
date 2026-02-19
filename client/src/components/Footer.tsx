import { Link } from "wouter";
import { CreditCard, Shield, Clock, Star, Lock, Upload, Landmark, Building2, BadgeCheck } from "lucide-react";

const trustChips = [
  { icon: Clock, label: "20+ Years Experience" },
  { icon: Star, label: "4.9/5 Client Satisfaction" },
  { icon: Upload, label: "Secure Document Upload" },
  { icon: Lock, label: "Digital Delivery (2–7 days)" },
];

const agencies = [
  { label: "CRA", icon: Landmark },
  { label: "IRS", icon: Shield },
  { label: "CBSA", icon: Building2 },
  { label: "USPTO", icon: BadgeCheck },
  { label: "SBA", icon: Building2 },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 md:py-12" data-testid="footer">
      <div className="container mx-auto px-4 md:px-6">

        {/* A) TRUST STRIP */}
        <div className="mb-8 pb-8 border-b border-slate-800">
          <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2.5 md:gap-3 mb-6">
            {trustChips.map((chip) => (
              <div
                key={chip.label}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700/60 bg-slate-800/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20"
              >
                <chip.icon className={`w-3.5 h-3.5 shrink-0 ${chip.label.includes("4.9") ? "text-amber-400" : "text-blue-400"}`} />
                <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{chip.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-4 sm:gap-5 flex-wrap">
            {agencies.map((a) => (
              <div key={a.label} className="flex items-center gap-1 opacity-50">
                <a.icon className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] font-semibold text-white tracking-wide">{a.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-2">Reference agencies only — not affiliated or endorsed.</p>
        </div>

        {/* B) MIDDLE ROW — 3 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 mb-8">
          <div className="md:col-span-2">
            <span className="text-lg font-bold font-display text-white block mb-3">AccessToNorth</span>
            <ul className="space-y-0.5 text-xs text-slate-500 mb-3">
              <li>Administrative services only (documentation coordination).</li>
              <li>Not a law firm. Not a customs broker.</li>
              <li>No legal or tax advice. No approval guarantees.</li>
              <li>Not affiliated with any government agency.</li>
            </ul>
            <div className="space-y-0.5 text-xs text-slate-500">
              <p>Operates via affiliated entities in the US & Canada.</p>
              <p>US Entity: MR Commerce LLC</p>
              <p>Registered business location: Ontario, Canada</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-widest uppercase">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-white transition-colors" data-testid="link-footer-services">All Services</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors" data-testid="link-footer-pricing">Pricing</Link></li>
              <li><Link href="/services/non-resident-importer-canada" className="hover:text-white transition-colors">Non-Resident Importer</Link></li>
              <li><Link href="/services/carm-registration-canada" className="hover:text-white transition-colors">CARM Registration</Link></li>
              <li><Link href="/tools" className="hover:text-white transition-colors" data-testid="link-footer-tools">Trade Tools</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-widest uppercase">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="hover:text-white transition-colors" data-testid="link-refunds">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors" data-testid="link-contact">Contact</Link></li>
            </ul>
            <p className="text-xs mt-3 text-slate-500">operations@accesstonorth.com</p>
          </div>
        </div>

        {/* C) BOTTOM ROW */}
        <div className="border-t border-slate-800 pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure checkout powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <CreditCard className="w-4 h-4" />
              <span>Visa</span>
              <span className="text-slate-700">/</span>
              <span>Mastercard</span>
              <span className="text-slate-700">/</span>
              <span>Amex</span>
              <span className="text-slate-700">/</span>
              <span>Apple Pay</span>
              <span className="text-slate-700">/</span>
              <span>Google Pay</span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">
            All services subject to our{" "}
            <Link href="/terms" className="underline hover:text-white transition-colors" data-testid="link-footer-terms">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/refunds" className="underline hover:text-white transition-colors" data-testid="link-footer-refunds">Refund Policy</Link>.
          </p>
          <p className="text-center text-xs text-slate-600 pb-4">
            &copy; {new Date().getFullYear()} AccessToNorth.com
          </p>
        </div>
      </div>
    </footer>
  );
}
