import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileLock2,
  Server,
  Users,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function Security() {
  usePageMeta({
    title: "Security Overview | AccessToNorth.com",
    description:
      "How AccessToNorth protects client documents and personal information. Encryption, access controls, sub-processor list, and breach-notification commitments.",
    canonical: "https://www.accesstonorth.com/security",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
            Security overview
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display text-slate-900 mb-3">
            How we protect your information
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-8">
            AccessToNorth handles tax and customs documents, authorization forms, and identity
            information. The practices below aren&apos;t a compliance certification — they&apos;re
            a plain-English description of what we actually do.
          </p>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5" />
                  <h2 className="text-lg font-bold text-slate-900">Encryption</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>
                    <strong>In transit.</strong> Every page and every API request uses TLS 1.2 or
                    newer. HSTS is enabled in production to prevent protocol downgrade.
                  </li>
                  <li>
                    <strong>At rest.</strong> Database storage and uploaded files are encrypted
                    using the cloud provider&apos;s default AES-256 encryption. Database backups
                    inherit the same encryption.
                  </li>
                  <li>
                    <strong>Payment data.</strong> Handled exclusively by Stripe (PCI-DSS Level 1).
                    We never see or store full card numbers.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <KeyRound className="w-5 h-5 text-primary mt-0.5" />
                  <h2 className="text-lg font-bold text-slate-900">Access control</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>Admin accounts use per-user bcrypt-hashed passwords. No shared credentials.</li>
                  <li>
                    Admin sessions use HttpOnly, SameSite-strict cookies and expire after 12 hours
                    of inactivity.
                  </li>
                  <li>
                    The admin login endpoint is rate-limited (10 attempts / 15 min / IP). All login
                    attempts are logged.
                  </li>
                  <li>
                    Team member access to client records is scoped to active engagements and audited
                    via our activity log.
                  </li>
                  <li>
                    Client portal access is tokenized per order (email + order-ID credentials) with
                    a 24-hour session TTL.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <FileLock2 className="w-5 h-5 text-primary mt-0.5" />
                  <h2 className="text-lg font-bold text-slate-900">Document handling</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>
                    Uploaded documents (authorization forms, invoices, packing lists, supporting
                    filings) are stored in access-controlled object storage.
                  </li>
                  <li>
                    Report downloads use single-use signed URLs with{" "}
                    <code className="text-xs">Referrer-Policy: no-referrer</code> and{" "}
                    <code className="text-xs">Cache-Control: private, no-store</code> so links
                    don&apos;t leak through browser history or proxy logs.
                  </li>
                  <li>
                    Authorization forms (e.g., CRA RC59-B) are stored separately from filing
                    documents; access is logged independently.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Server className="w-5 h-5 text-primary mt-0.5" />
                  <h2 className="text-lg font-bold text-slate-900">Sub-processors</h2>
                </div>
                <p className="text-sm text-slate-700 mb-3">
                  These are the only third parties that can technically see client data:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-200">
                        <th className="py-2 pr-4">Vendor</th>
                        <th className="py-2 pr-4">Purpose</th>
                        <th className="py-2 pr-4">Region</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 pr-4 font-medium">Stripe</td>
                        <td className="py-2 pr-4 text-slate-600">Payment processing</td>
                        <td className="py-2 pr-4 text-slate-600">CA / US</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">Resend</td>
                        <td className="py-2 pr-4 text-slate-600">Transactional email</td>
                        <td className="py-2 pr-4 text-slate-600">US</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">Anthropic</td>
                        <td className="py-2 pr-4 text-slate-600">AI chat &amp; assistance</td>
                        <td className="py-2 pr-4 text-slate-600">US</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">Vapi</td>
                        <td className="py-2 pr-4 text-slate-600">Voice call AI layer</td>
                        <td className="py-2 pr-4 text-slate-600">US</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">Cloud hosting</td>
                        <td className="py-2 pr-4 text-slate-600">App runtime &amp; database</td>
                        <td className="py-2 pr-4 text-slate-600">CA / US</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Each vendor has a signed Data Processing Addendum with standard security
                  commitments. Anthropic and Vapi contractually do not train on customer content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <h2 className="text-lg font-bold text-slate-900">Breach notification</h2>
                </div>
                <p className="text-sm text-slate-700">
                  Under PIPEDA we must notify affected individuals and the Office of the Privacy
                  Commissioner if a breach creates a real risk of significant harm. We commit to
                  notification within 72 hours of confirming such a breach.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <h2 className="text-lg font-bold text-slate-900">Certification roadmap</h2>
                </div>
                <p className="text-sm text-slate-700 mb-3">
                  We are not currently SOC 2 or ISO 27001 certified. Those audits are on our
                  roadmap for when annual client volume warrants the investment. In the interim,
                  our controls above follow the spirit of SOC 2&apos;s common criteria (CC) set:
                  logical access, change management, system operations, risk mitigation, and data
                  handling.
                </p>
                <p className="text-sm text-slate-600">
                  If your compliance team needs a security questionnaire completed, email{" "}
                  <a href="mailto:security@accesstonorth.com" className="text-primary underline">
                    security@accesstonorth.com
                  </a>{" "}
                  and we&apos;ll turn it around within one business day.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-blue-50/40">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Report a security issue</p>
                    <p className="text-sm text-slate-600 mb-2">
                      Found a vulnerability? Email{" "}
                      <a href="mailto:security@accesstonorth.com" className="text-primary underline">
                        security@accesstonorth.com
                      </a>
                      . We acknowledge reports within one business day.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10 space-y-3">
            <Link href="/privacy" className="text-sm text-primary underline inline-flex items-center gap-1">
              Read our full Privacy Policy <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
