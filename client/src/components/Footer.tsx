import { Link } from "wouter";
import { CreditCard, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800" data-testid="footer">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <span className="text-xl font-bold font-display text-white mb-4 block">AccessToNorth</span>
            <p className="text-sm leading-relaxed mb-3">
              Administrative services only. Not a law firm. Not a customs broker. No legal or tax advice. No outcome or approval guarantees.
            </p>
            <p className="text-sm text-slate-500">
              Digital delivery. Typical completion: 2–7 business days depending on service.
            </p>
            <p className="text-xs mt-3 text-slate-500">AccessToNorth.com is a division of MR Holdings & Trade LLC</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#pricing" className="hover:text-primary">GST/HST Registration</a></li>
              <li><a href="/#pricing" className="hover:text-primary">Business Numbers</a></li>
              <li><a href="/#non-resident" className="hover:text-primary">Non-Resident Compliance</a></li>
              <li><a href="/#pricing" className="hover:text-primary">CARM Importer Bundle</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-primary" data-testid="link-terms">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary" data-testid="link-privacy">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="hover:text-primary" data-testid="link-refunds">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-primary" data-testid="link-contact">Contact</Link></li>
            </ul>
            <p className="text-xs mt-4 text-slate-500">Email: operations@accesstonorth.com</p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure checkout powered by Stripe</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <CreditCard className="w-4 h-4" />
              <span>Visa</span>
              <span>/</span>
              <span>Mastercard</span>
              <span>/</span>
              <span>Amex</span>
              <span>/</span>
              <span>Apple Pay</span>
              <span>/</span>
              <span>Google Pay</span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} AccessToNorth.com &mdash; Administrative Filing Services for Canada & International Businesses. Division of MR Holdings & Trade LLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
