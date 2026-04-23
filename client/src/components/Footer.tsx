import { Link } from "wouter";
import { CreditCard, Shield, Clock, Star, Lock, Upload, Landmark, Building2, BadgeCheck, Mail } from "lucide-react";

const trustChips = [
  { icon: Lock, label: "Secure Stripe Checkout" },
  { icon: Upload, label: "Encrypted Document Upload" },
  { icon: Clock, label: "Typical Delivery 5–10 Days" },
  { icon: Star, label: "Money-Back Guarantee" },
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
            <p className="text-xs text-slate-400 leading-relaxed mb-3 max-w-md">
              Administrative services firm coordinating Canadian CRA and CBSA filings for resident
              and non-resident businesses. We prepare and submit your filings under a signed
              authorization — we are not a law firm, a customs broker, or an accounting firm.
            </p>
            <ul className="space-y-0.5 text-xs text-slate-500 mb-3">
              <li>No legal, tax, or customs-brokerage advice.</li>
              <li>No approval guarantees — processing decisions are made by the CRA / CBSA.</li>
              <li>Not affiliated with any government agency.</li>
            </ul>
            <div className="space-y-0.5 text-xs text-slate-500">
              <p>Operates via affiliated entities in the US &amp; Canada.</p>
              <p>US entity: MR Commerce LLC</p>
              <p>Registered Canadian business location: Ontario, Canada</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-widest uppercase">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-white transition-colors" data-testid="link-footer-services">All Services</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors" data-testid="link-footer-pricing">Pricing</Link></li>
              <li><Link href="/tools" className="hover:text-white transition-colors" data-testid="link-footer-tools">Trade Tools</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors" data-testid="link-footer-resources">Resources</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors" data-testid="link-footer-blog">Blog</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors" data-testid="link-footer-about">About</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors" data-testid="link-footer-faq">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-widest uppercase">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href="mailto:operations@accesstonorth.com" className="hover:text-white transition-colors break-all" data-testid="link-footer-email">operations@accesstonorth.com</a>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Mon–Fri, 9:00 a.m.–6:00 p.m. ET<br />
                <span className="text-slate-600">Responses typically within one business day.</span></span>
              </li>
            </ul>
            <h4 className="font-semibold text-white mt-5 mb-3 text-xs tracking-widest uppercase">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">Privacy</Link></li>
              <li><Link href="/security" className="hover:text-white transition-colors" data-testid="link-security">Security</Link></li>
              <li><Link href="/refunds" className="hover:text-white transition-colors" data-testid="link-refunds">Refund Policy</Link></li>
            </ul>
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
