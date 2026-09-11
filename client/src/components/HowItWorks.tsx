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

interface HowItWorksSectionProps {
  /** Card-on-canvas shell classes, supplied by the host page. */
  shellClassName?: string;
  /** Asymmetric vertical padding for this slot in the page rhythm. */
  padClassName?: string;
  /** Inner content rail. */
  railClassName?: string;
}

export function HowItWorksSection({
  shellClassName = "w-[98%] max-w-container-outer mx-auto rounded-lg overflow-hidden",
  padClassName = "pt-12 pb-10 md:pt-[72px] md:pb-14",
  railClassName = "mx-auto max-w-container px-5 md:px-10",
}: HowItWorksSectionProps = {}) {
  return (
    <section
      className={`${shellClassName} bg-surface-recessed ${padClassName}`}
      aria-labelledby="how-it-works-heading"
    >
      <div className={railClassName}>
        <div className="max-w-2xl">
          <p className="text-eyebrow uppercase text-text-muted">The process</p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-h2 text-text-primary"
            data-testid="text-how-it-works-title"
          >
            How an engagement works
          </h2>
          <p className="mt-4 text-lead text-text-muted">
            Every engagement follows the same four steps. You stay in the loop at each one — no
            black-box filings, no unexpected CRA correspondence.
          </p>
        </div>

        {/*
          The divider between steps is GAP, not a border: a 4px grid gap over
          the #F2F4F7 canvas shell, so the shell itself reads as the rule.
          Concentric radii — 12px shell, 4px padding, 8px children.
        */}
        <div className="mt-10 rounded-lg bg-surface-canvas p-1">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="flex flex-col rounded-md bg-white p-5"
                data-testid={`how-it-works-step-${step.title.slice(0, 1)}`}
              >
                <step.icon className="h-5 w-5 text-text-muted" aria-hidden="true" />
                <h3 className="mt-4 text-h3 text-text-primary">{step.title}</h3>
                <p className="mt-2 flex-1 text-body text-text-muted">{step.body}</p>
                <p className="mt-4 text-eyebrow uppercase text-text-deemphasis">{step.timing}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-body text-text-deemphasis">
          Agency processing times — including CRA Business Number issuance and CARM account
          activation — are set by the CRA and CBSA. We file promptly and monitor every file, but
          we cannot guarantee a specific issuance date.
        </p>
      </div>
    </section>
  );
}
