import { Link } from "wouter";
import { CreditCard, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800" data-testid="footer">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2 space-y-4">
            <span className="text-xl font-bold font-display text-white block">AccessToNorth</span>
            <p className="text-sm leading-relaxed">
              Administrative services only. Not a law firm. Not a customs broker. No legal or tax advice. We are not affiliated with any government agency.
            </p>
            <p className="text-sm text-slate-500">
              Digital delivery. Typical completion: 2–7 business days.
            </p>
            <div className="pt-2 space-y-1">
              <p className="text-xs text-slate-500">
                AccessToNorth operates through affiliated business entities in the United States and Canada.
              </p>
              <p className="text-xs text-slate-500">US Entity: MR Commerce LLC</p>
              <p className="text-xs text-slate-500">Registered Business Location: Ontario, Canada</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm tracking-wide uppercase">Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/#pricing" className="hover:text-white transition-colors">GST/HST Registration</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">Business Numbers</a></li>
              <li><a href="/#non-resident" className="hover:text-white transition-colors">Non-Resident Compliance</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">CARM Importer Bundle</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm tracking-wide uppercase">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="hover:text-white transition-colors" data-testid="link-refunds">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors" data-testid="link-contact">Contact</Link></li>
            </ul>
            <p className="text-xs mt-4 text-slate-500">operations@accesstonorth.com</p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure checkout powered by Stripe</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
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
          <p className="text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} AccessToNorth.com
          </p>
        </div>
      </div>
    </footer>
  );
}
