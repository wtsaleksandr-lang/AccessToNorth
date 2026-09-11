import { Check, X, Minus } from "lucide-react";

interface Row {
  label: string;
  diy: "yes" | "no" | "partial" | string;
  accountant: "yes" | "no" | "partial" | string;
  us: "yes" | "no" | "partial" | string;
}

const rows: Row[] = [
  { label: "Price (all-in)", diy: "Free (your time)", accountant: "CA$500–1,500+ / hr billed", us: "From CA$99 flat" },
  { label: "CRA filings handled for you", diy: "no", accountant: "yes", us: "yes" },
  { label: "GST/HST + Business Number in one order", diy: "partial", accountant: "partial", us: "yes" },
  { label: "CARM portal onboarding", diy: "no", accountant: "partial", us: "yes" },
  { label: "Non-resident / NRI specialty", diy: "no", accountant: "partial", us: "yes" },
  { label: "Document portal + digital delivery", diy: "no", accountant: "partial", us: "yes" },
  { label: "Typical turnaround", diy: "Weeks of figuring out forms", accountant: "2–4 weeks", us: "5–10 business days" },
  { label: "Money-back guarantee", diy: "no", accountant: "no", us: "yes" },
];

function Cell({ value }: { value: Row["diy"] }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-body font-medium text-green-700">
        <Check className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center gap-1.5 text-body text-text-deemphasis">
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">No</span>
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 text-body text-amber-600">
        <Minus className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Partial</span>
      </span>
    );
  }
  return <span className="text-body text-text-secondary">{value}</span>;
}

interface DiyVsUsComparisonProps {
  /** Card-on-canvas shell classes, supplied by the host page. */
  shellClassName?: string;
  /** Asymmetric vertical padding for this slot in the page rhythm. */
  padClassName?: string;
  /** Inner content rail. */
  railClassName?: string;
}

export function DiyVsUsComparison({
  shellClassName = "w-[98%] max-w-container-outer mx-auto rounded-lg overflow-hidden",
  padClassName = "pt-16 pb-10 md:pt-20 md:pb-[60px]",
  railClassName = "mx-auto max-w-container px-5 md:px-10",
}: DiyVsUsComparisonProps = {}) {
  return (
    <section
      className={`${shellClassName} bg-white ${padClassName}`}
      aria-labelledby="diy-vs-us-heading"
      data-testid="diy-vs-us"
    >
      <div className={railClassName}>
        <div className="max-w-2xl">
          <p className="text-eyebrow uppercase text-text-muted">Is this worth paying for?</p>
          <h2 id="diy-vs-us-heading" className="mt-3 text-h2 text-text-primary">
            DIY on CRA.ca vs. an accountant vs. AccessToNorth
          </h2>
          <p className="mt-4 text-lead text-text-muted">
            You can file yourself for free — if you have the time. You can hire an accountant — if you have the budget.
            Or you can pay a flat fee and have it handled in days.
          </p>
        </div>

        {/*
          `contain: paint` is load-bearing, not decoration.

          An auto-layout table's MIN-CONTENT width is a hard floor, and on its
          own `overflow-x: auto` does not stop that floor propagating to the
          viewport — the whole document picks up a real horizontal scroll at
          375px (origin/main scrolls 19px here for exactly this reason).
          `contain: paint` makes this box a true containment root, so the table
          scrolls inside it and the page does not move sideways.
        */}
        <div className="mt-10 overflow-x-auto rounded-lg border border-border-hairline bg-white [contain:paint]">
          {/*
            Auto layout, so the header cells size to their content and the
            comparison scrolls horizontally on a phone rather than crushing
            four columns into 324px (fixed layout at 375px overlapped
            "ACCOUNTANT" and "ACCESSTONORTH" on top of each other). The
            percentage hints below only bite once there is room for them.
          */}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-hairline bg-surface-recessed">
                <th scope="col" className="w-[34%] px-3 py-3 text-eyebrow uppercase text-text-muted md:px-4">
                  &nbsp;
                </th>
                <th scope="col" className="w-[22%] px-3 py-3 text-center text-eyebrow uppercase text-text-muted md:px-4">
                  DIY on CRA.ca
                </th>
                <th scope="col" className="w-[22%] px-3 py-3 text-center text-eyebrow uppercase text-text-muted md:px-4">
                  Accountant
                </th>
                <th scope="col" className="w-[22%] px-3 py-3 text-center text-eyebrow uppercase text-brand md:px-4">
                  AccessToNorth
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border-app last:border-b-0">
                  <th scope="row" className="px-3 py-3 text-body font-medium text-text-secondary md:px-4">
                    {row.label}
                  </th>
                  <td className="px-3 py-3 text-center md:px-4">
                    <Cell value={row.diy} />
                  </td>
                  <td className="px-3 py-3 text-center md:px-4">
                    <Cell value={row.accountant} />
                  </td>
                  <td className="bg-surface-recessed px-3 py-3 text-center md:px-4">
                    <Cell value={row.us} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-body text-text-deemphasis">
          Accountant fees based on typical Canadian hourly rates; pricing varies by firm.
        </p>
      </div>
    </section>
  );
}
