import { FileCheck2, ShieldCheck } from "lucide-react";

export interface SampleDeliverableField {
  label: string;
  value: string;
}

export interface SampleDeliverableProps {
  title: string;
  docLabel?: string;
  fields: SampleDeliverableField[];
  footerNote?: string;
}

export function SampleDeliverableCard({
  title,
  docLabel = "Sample deliverable",
  fields,
  footerNote,
}: SampleDeliverableProps) {
  return (
    <section
      className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 md:p-6"
      aria-label="Sample deliverable preview"
      data-testid="sample-deliverable"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            What you'll receive
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          {docLabel}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Issued to</p>
            <p className="text-sm font-semibold">Maple Trade Co.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Status</p>
            <p className="text-xs font-semibold text-green-400">Completed</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
          <dl className="divide-y divide-slate-100">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2 gap-3">
                <dt className="text-xs text-slate-500 uppercase tracking-wide">{f.label}</dt>
                <dd className="text-sm font-semibold text-slate-800 font-mono text-right">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <p className="text-[11px] text-slate-500">
            Delivered digitally via your client portal — no mail, no paper forms.
          </p>
        </div>
      </div>

      {footerNote && (
        <p className="text-xs text-slate-500 mt-3 italic">
          {footerNote}
        </p>
      )}
    </section>
  );
}
