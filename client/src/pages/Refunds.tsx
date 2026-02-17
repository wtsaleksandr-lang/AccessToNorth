import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Refunds() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-refunds-title">Refund Policy</h1>
          <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold font-display mb-3">Before Submission</h2>
              <p className="text-slate-600 leading-relaxed">
                If you request a refund <strong>before</strong> we have submitted your application to any government portal or agency, you are entitled to a <strong>full refund</strong> of the service fee. Simply contact us and we will process your refund promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">After Submission</h2>
              <p className="text-slate-600 leading-relaxed">
                Once your application has been submitted to the relevant government agency, the service fee becomes <strong>non-refundable</strong>. This is because the administrative work has been performed and any associated government or processing fees may be irreversible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">Rejected Applications</h2>
              <div className="space-y-3">
                <p className="text-slate-600 leading-relaxed">
                  <strong>Due to our error:</strong> If your submission is rejected as a result of an error on our part, we will re-file your application once at no additional service charge.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Due to client-provided information or eligibility:</strong> If a submission is rejected because of incorrect or incomplete information you provided, or because you do not meet the eligibility requirements of the government agency, no refund will be issued after submission.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">Refund Processing</h2>
              <p className="text-slate-600 leading-relaxed">
                Approved refunds are processed within <strong>5–10 business days</strong> and returned to your original payment method. You will receive an email confirmation once the refund has been initiated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-3">How to Request a Refund</h2>
              <p className="text-slate-600 leading-relaxed">
                To request a refund, please contact us at <a href="mailto:operations@accesstonorth.com" className="text-primary hover:underline">operations@accesstonorth.com</a> with your name, email address, and order details. We encourage you to reach out to us directly before initiating a dispute with your payment provider so we can resolve your concern quickly.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
