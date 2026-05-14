import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";

const LAST_UPDATED = "2026-04-23";

export default function Privacy() {
  usePageMeta({
    title: "Privacy Policy | AccessToNorth.com",
    description:
      "How AccessToNorth collects, uses, protects, and retains your personal information. PIPEDA-compliant data-handling policy for Canadian and non-resident clients.",
    canonical: "https://www.accesstonorth.com/privacy",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
          <h1
            className="text-3xl md:text-4xl font-extrabold font-display mb-2"
            data-testid="text-privacy-title"
          >
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mb-2">
            Last updated:{" "}
            {new Date(LAST_UPDATED).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-slate-500 mb-10">
            Governed by Canada's Personal Information Protection and Electronic Documents Act
            (PIPEDA) and applicable provincial privacy legislation.
          </p>

          <div className="prose prose-slate max-w-none space-y-10 text-slate-700">
            <section>
              <p className="lead text-base">
                AccessToNorth.com (operated through MR Holdings &amp; Trade LLC and its Canadian affiliate, collectively
                &ldquo;AccessToNorth&rdquo;, &ldquo;we&rdquo;, or &ldquo;us&rdquo;) is committed to protecting the
                personal information of our clients, prospects, and website visitors. This policy explains what we
                collect, why, how long we keep it, and your rights. If anything here is unclear, email{" "}
                <a href="mailto:privacy@accesstonorth.com" className="text-primary underline">
                  privacy@accesstonorth.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                1. Information we collect
              </h2>
              <p>We collect the minimum information necessary to coordinate Canadian tax and customs filings on your behalf:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Identity &amp; contact.</strong> Full legal name, business name, email, phone, address
                  (physical and mailing).
                </li>
                <li>
                  <strong>Engagement information.</strong> Entity type, incorporation jurisdiction, industry, projected revenue, ownership information (where required by the CRA),
                  existing account numbers (BN, GST/HST, RM), broker relationships.
                </li>
                <li>
                  <strong>Filing documents.</strong> Signed authorization forms (e.g., CRA form RC59-B, CBSA
                  delegation forms), commercial invoices, packing lists, certificates of origin, bills of lading,
                  HS-code-related product data, and any supporting records you upload.
                </li>
                <li>
                  <strong>Payment information.</strong> Processed exclusively by Stripe. We receive a transaction
                  identifier and partial card metadata (last 4, brand, expiry) from Stripe; we do <strong>not</strong>{" "}
                  store full card numbers or CVV on our systems.
                </li>
                <li>
                  <strong>Communications.</strong> Messages sent through our client portal, support email, or AI
                  chat assistant, including any files you attach.
                </li>
                <li>
                  <strong>Technical data.</strong> Basic web-server logs (IP address, user-agent, request path, timestamp)
                  used for security and fraud prevention. Retained no longer than 90 days in plain form.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                2. Legal basis and purpose
              </h2>
              <p>
                Under PIPEDA and applicable provincial law, we rely on <strong>consent</strong> as the primary lawful
                basis for processing. By placing an order and signing our authorization forms, you consent to our using
                the above information for the following purposes only:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Preparing and submitting your filings to the CRA, CBSA, and other Canadian agencies.</li>
                <li>Coordinating with customs brokers, sureties, and other specialists on your behalf, where required and with your instruction.</li>
                <li>Sending transactional emails (order confirmations, status updates, authorization requests, deliverables).</li>
                <li>Complying with our record-retention obligations under Canadian tax and anti-money-laundering rules.</li>
                <li>Defending against legal claims or responding to government orders.</li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> use your information for profiling, automated decision-making that affects
                your legal status, targeted advertising, or third-party marketing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                3. Who receives your information
              </h2>
              <p>We share information only where necessary for your engagement:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Government agencies.</strong> The CRA, CBSA, and other Canadian agencies receive the specific
                  forms and supporting documentation needed for your filing.
                </li>
                <li>
                  <strong>Sub-processors.</strong> We use vetted vendors to operate the service:
                  <ul className="list-disc pl-6 mt-1 space-y-0.5">
                    <li>Stripe (payment processing — PCI-DSS Level 1)</li>
                    <li>Resend (transactional email)</li>
                    <li>Anthropic (AI assistant responses — no persistent training use)</li>
                    <li>Cloud infrastructure providers in Canada and the US (for hosting and database)</li>
                  </ul>
                </li>
                <li>
                  <strong>Customs brokers or sureties</strong> you explicitly designate during your engagement.
                </li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> sell, trade, or rent your personal information. We do not share information
                for marketing purposes with any third party.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                4. International transfers
              </h2>
              <p>
                Some of our sub-processors (notably cloud hosting, email, and AI providers) process data in the United
                States. When Canadian personal information is transferred outside Canada, it remains subject to Canadian
                privacy law and may also be subject to the law of the destination country, including lawful-access
                requests. Our vendor contracts include standard data-protection terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                5. How we protect your information
              </h2>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Encryption in transit (TLS 1.2+) for every page and every API request.</li>
                <li>Encryption at rest for database storage and file uploads.</li>
                <li>Access is limited to team members who need the information for your engagement. Access is logged.</li>
                <li>
                  Authorization forms are stored separately from uploaded filing documents and access is audited.
                </li>
                <li>
                  Passwords (for our admin team) are hashed with bcrypt. Client portal access is scoped to the specific
                  order and uses time-limited tokens.
                </li>
                <li>
                  We review our vendor list and security posture at least annually. See{" "}
                  <Link href="/security" className="text-primary underline">
                    our Security Overview
                  </Link>{" "}
                  for more.
                </li>
              </ul>
              <p className="mt-3 text-sm text-slate-600">
                No system is perfectly secure. We notify affected clients and applicable regulators within 72 hours of
                confirming a privacy breach that creates a real risk of significant harm, per PIPEDA requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                6. Retention
              </h2>
              <p>We retain personal information only as long as needed to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Deliver your active engagement.</li>
                <li>
                  Meet Canadian record-retention obligations — generally 6 years from the end of the tax year in which the
                  filing was made, to match CRA and CBSA audit windows.
                </li>
                <li>Defend against legal claims within applicable limitation periods.</li>
              </ul>
              <p className="mt-3">
                After that period, records are securely destroyed. You may request earlier deletion of information that
                we do not have a statutory obligation to retain — see Section 8.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                7. Cookies and tracking
              </h2>
              <p>
                We use essential cookies for session management (client portal login, admin authentication, cart state,
                CSRF protection). We do not use third-party advertising trackers, behavioral profiling, or analytics that
                identify individuals. Aggregate, non-identifying analytics may be used internally to improve the site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                8. Your rights
              </h2>
              <p>Under PIPEDA you have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access the personal information we hold about you.</li>
                <li>Request correction of inaccurate or incomplete information.</li>
                <li>Withdraw consent to future processing, subject to legal/contractual limitations.</li>
                <li>Request deletion of information we do not have a statutory obligation to retain.</li>
                <li>File a complaint with the Office of the Privacy Commissioner of Canada (priv.gc.ca).</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, email{" "}
                <a href="mailto:privacy@accesstonorth.com" className="text-primary underline">
                  privacy@accesstonorth.com
                </a>
                . We respond within 30 days. We may need to verify your identity before disclosing information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                9. AI assistant and voice calls
              </h2>
              <p>
                Our website chat and phone line are powered by AI models (Anthropic Claude, with Vapi for voice). When
                you interact with them:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your messages are sent to the AI provider for response generation.</li>
                <li>
                  We retain conversation history for up to 30 days to maintain context across a session and to train
                  no systems on your data. Our provider contracts prohibit training on customer content.
                </li>
                <li>
                  AI responses are not legal, tax, or accounting advice. For binding guidance, please book a consultation
                  with our team.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                10. Changes to this policy
              </h2>
              <p>
                We update this policy when our practices change. The &ldquo;Last updated&rdquo; date at the top reflects
                the most recent substantive change. Material changes are notified to active clients by email at least 14
                days before they take effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3 text-slate-900">
                11. Contact
              </h2>
              <p>
                Privacy inquiries, access requests, or complaints:<br />
                <a href="mailto:privacy@accesstonorth.com" className="text-primary underline">
                  privacy@accesstonorth.com
                </a>
              </p>
              <p className="text-sm text-slate-500 mt-3">
                AccessToNorth is operated by MR Holdings &amp; Trade LLC (a Wyoming limited liability company,
                registered office 30 N Gould St Ste R, Sheridan, WY 82801, United States) and its affiliated
                Canadian entity in Toronto, Canada. For regulatory complaints: Office of the Privacy Commissioner
                of Canada, 30 Victoria Street, Gatineau, Quebec K1A 1H3.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
