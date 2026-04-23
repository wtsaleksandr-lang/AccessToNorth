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
      <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-medium">
        <Check className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm">
        <X className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">No</span>
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-600 text-sm">
        <Minus className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Partial</span>
      </span>
    );
  }
  return <span className="text-sm text-slate-700">{value}</span>;
}

export function DiyVsUsComparison() {
  return (
    <section
      className="py-12 md:py-16 bg-white"
      aria-labelledby="diy-vs-us-heading"
      data-testid="diy-vs-us"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">Is this worth paying for?</p>
          <h2 id="diy-vs-us-heading" className="text-2xl md:text-3xl font-bold font-display mb-3">
            DIY on CRA.ca vs. an accountant vs. AccessToNorth
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            You can file yourself for free — if you have the time. You can hire an accountant — if you have the budget.
            Or you can pay a flat fee and have it handled in days.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  &nbsp;
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                  DIY on CRA.ca
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                  Accountant
                </th>
                <th scope="col" className="py-3 px-4 text-xs font-semibold text-primary uppercase tracking-wide text-center bg-primary/5">
                  AccessToNorth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="py-3 px-4 text-sm font-medium text-slate-700">
                    {row.label}
                  </th>
                  <td className="py-3 px-4 text-center">
                    <Cell value={row.diy} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Cell value={row.accountant} />
                  </td>
                  <td className="py-3 px-4 text-center bg-primary/5">
                    <Cell value={row.us} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          Accountant fees based on typical Canadian hourly rates; pricing varies by firm.
        </p>
      </div>
    </section>
  );
}
