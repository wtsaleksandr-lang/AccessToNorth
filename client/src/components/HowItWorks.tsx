import { FileSignature, Send, Inbox, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: FileSignature,
    title: "1. Sign the authorization",
    body:
      "After your order, we send the CRA Business Consent form (RC59-B) or the equivalent customs authorization for your signature. This limits our access to the specific accounts in scope.",
    timing: "Same day",
  },
  {
    icon: Send,
    title: "2. We prepare and file",
    body:
      "We compile the filing package, confirm the key decisions with you, and submit directly to the CRA, CBSA, or the relevant agency portal. You receive a confirmation with the submission reference.",
    timing: "1 business day after authorization",
  },
  {
    icon: Inbox,
    title: "3. Agency processes your application",
    body:
      "The CRA typically issues Business Numbers in 5–10 business days. GST/HST and CARM timelines vary by account type. We monitor the file and flag anything that needs additional input.",
    timing: "Depends on agency workload",
  },
  {
    icon: CheckCircle2,
    title: "4. Delivery & next steps",
    body:
      "You receive your account numbers, a summary of what was done, and a written record of every submission. We also note any upcoming filing deadlines so nothing lapses.",
    timing: "On issuance",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-12 md:py-20 bg-slate-50" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
            The process
          </p>
          <h2
            id="how-it-works-heading"
            className="text-2xl md:text-3xl font-bold font-display mb-3"
            data-testid="text-how-it-works-title"
          >
            How an engagement works
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            Every engagement follows the same four steps. You stay in the loop at each one — no
            black-box filings, no unexpected CRA correspondence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="relative bg-white border border-slate-200 rounded-xl p-5"
              data-testid={`how-it-works-step-${step.title.slice(0, 1)}`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <step.icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{step.body}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                {step.timing}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center mt-8 max-w-2xl mx-auto">
          Agency processing times — including CRA Business Number issuance and CARM account
          activation — are set by the CRA and CBSA. We file promptly and monitor every file, but
          we cannot guarantee a specific issuance date.
        </p>
      </div>
    </section>
  );
}
