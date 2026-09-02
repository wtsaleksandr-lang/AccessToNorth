import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-terms-title">Terms of Service</h1>
          <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold font-display mb-3">1. Scope of Services</h2>
              <p className="text-slate-600 leading-relaxed">
                AccessToNorth.com provides fixed-scope administrative preparation and submission services for Canadian tax registrations, including GST/HST numbers, Business Numbers (BN), payroll accounts, import/export accounts, and CARM portal registrations. All services are delivered digitally. We prepare and submit applications on your behalf to the Canada Revenue Agency (CRA) and related government portals based on the information you provide. Where our services touch customs clearance, our role is strictly to <strong>coordinate and prepare paperwork</strong> for filing by your licensed customs broker — we do not file declarations with the CBSA on your behalf.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">2. What We Are Not</h2>
              <p className="text-slate-600 leading-relaxed">
                AccessToNorth.com is an administrative services provider. We are <strong>not</strong> a law firm, accounting firm, licensed customs broker, or government agency. We do <strong>not</strong> provide legal advice, tax advice, or financial planning services, and we do <strong>not</strong> perform customs brokerage — meaning we do not file B3 declarations, release entries, or any other regulated filings with the Canada Border Services Agency. Where a regulated brokerage action is required, you must engage a CBSA-licensed customs broker; we will assist by preparing classification, valuation, and supporting documentation for that broker to use. Our services are limited to the administrative preparation and submission of registration applications and broker-handoff documentation as fixed-scope deliverables.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">3. Client Responsibilities</h2>
              <p className="text-slate-600 leading-relaxed">
                You are responsible for providing accurate, complete, and truthful information and documentation required for your registration. The approval or rejection of any application is determined solely by the relevant government agency. We cannot influence or guarantee the outcome of any submission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">4. No Guarantees</h2>
              <p className="text-slate-600 leading-relaxed">
                We do not guarantee approval of any registration or application. We do not guarantee specific processing times, banking approvals, or tax outcomes. Government agencies operate on their own timelines and criteria, which are outside our control. Typical completion is 2–7 business days depending on the service, but actual processing by government agencies may vary.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">5. Fees and Pricing</h2>
              <p className="text-slate-600 leading-relaxed">
                Fees are displayed in the currency shown at checkout. Fixed-scope administrative services are one-time purchases. Container Loading Embed and API plans are recurring subscriptions billed monthly or annually as selected. The exact price, currency, renewal interval, and any discount are displayed before payment details are submitted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">6. Tool Trials and Subscriptions</h2>
              <p className="text-slate-600 leading-relaxed">
                Eligible customers receive one 14-day trial of a paid Container Loading plan. A payment method is required, but it is not charged until the trial ends. Unless cancelled before the date shown in Stripe Checkout, the plan automatically renews at the displayed monthly or annual price. You may cancel or update payment details through the Stripe billing portal. Cancellation stops future renewals and does not retroactively refund a completed billing period. Usage limits and overage terms shown for the selected plan apply.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">7. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                Our total liability for any claim arising from or related to our services is limited to the amount you paid for the specific service in question. We are not liable for any indirect, incidental, consequential, or special damages, including but not limited to lost profits, business interruptions, or penalties resulting from government decisions or delays.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">8. Chargebacks and Disputes</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have a concern about a charge, we encourage you to contact our support team at <a href="mailto:operations@accesstonorth.com" className="text-primary hover:underline">operations@accesstonorth.com</a> before initiating a chargeback with your payment provider. We are committed to resolving billing concerns promptly and fairly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">9. Governing Law and Disputes</h2>
              <p className="text-slate-600 leading-relaxed">
                These terms are governed by the laws of the Province of Ontario, Canada. Any disputes arising from these terms or our services shall be resolved in the courts located in Ontario, Canada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">10. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                For questions about these terms, please contact us at <a href="mailto:operations@accesstonorth.com" className="text-primary hover:underline">operations@accesstonorth.com</a> or through our <a href="/contact" className="text-primary hover:underline">contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
