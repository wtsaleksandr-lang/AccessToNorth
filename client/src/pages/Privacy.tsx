import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-privacy-title">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold font-display mb-3">1. Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed">
                To deliver our administrative registration services, we collect the following information:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li>Full name and contact details (email address, phone number)</li>
                <li>Business name and business type</li>
                <li>Residency status and estimated revenue</li>
                <li>Uploaded documents required for registration submissions</li>
                <li>Payment information (processed securely by Stripe; we do not store card details)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">2. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed">
                Your information is used solely to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li>Prepare and submit registration applications on your behalf</li>
                <li>Communicate with you about your application status</li>
                <li>Process payments for our services</li>
                <li>Provide customer support</li>
                <li>Comply with applicable legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">3. Data Storage and Security</h2>
              <p className="text-slate-600 leading-relaxed">
                All data is transmitted using encrypted connections (TLS/SSL). Access to your personal information is restricted to authorized personnel who need it to deliver our services. We retain your data for a period of 12 months following service completion. After this period, your data will be deleted upon request where technically and legally feasible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">4. Third-Party Sharing</h2>
              <p className="text-slate-600 leading-relaxed">
                We share your information only with service providers necessary to deliver our services, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li><strong>Stripe</strong> for secure payment processing</li>
                <li><strong>Email service providers</strong> for transactional communications</li>
                <li><strong>Government agencies</strong> (e.g., CRA) as required to complete your registration submissions</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-3">
                We do <strong>not</strong> sell, rent, or trade your personal information to any third parties for marketing or advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">5. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed">
                You have the right to request access to, correction of, or deletion of your personal information. You may also request a copy of the data we hold about you. To exercise any of these rights, please contact us at <a href="mailto:operations@accesstonorth.com" className="text-primary hover:underline">operations@accesstonorth.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">6. Cookies and Analytics</h2>
              <p className="text-slate-600 leading-relaxed">
                Our website may use essential cookies to maintain functionality and improve your experience. We may also use third-party analytics services to understand how visitors use our site. These services collect anonymized usage data and do not identify individual users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">7. Contact for Privacy Requests</h2>
              <p className="text-slate-600 leading-relaxed">
                For any privacy-related questions or requests, please contact us at <a href="mailto:operations@accesstonorth.com" className="text-primary hover:underline">operations@accesstonorth.com</a> or through our <a href="/contact" className="text-primary hover:underline">contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
