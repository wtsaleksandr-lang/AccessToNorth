import { Check, FileCheck2, Landmark, LockKeyhole } from "lucide-react";

const filingSteps = [
  { title: "Details reviewed", detail: "Company information and documents checked" },
  { title: "Authorization signed", detail: "You approve us to prepare and submit" },
  { title: "Filed with CRA", detail: "Application submitted under your authorization" },
  { title: "Confirmation delivered", detail: "Account details added to your secure portal" },
];

const deliverables = ["Business Number confirmation", "GST/HST account details", "Secure portal record"];

export function HeroFilingWorkflow() {
  return (
    <div className="relative mx-auto w-full max-w-[590px]" data-testid="hero-filing-workflow">
      <div className="absolute inset-x-6 -bottom-4 top-8 rounded-[28px] bg-slate-200/60 blur-xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.5)]">
        <div className="bg-slate-950 px-5 py-5 text-white sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                Example service file
              </div>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">Business Number + GST/HST</h2>
              <p className="mt-1 text-xs text-slate-400">A clear view of the filing journey and final records</p>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              Complete
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">How your filing progresses</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Four visible milestones—no guessing what happens next.</p>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-slate-500">4 of 4</span>
          </div>

          <div className="relative">
            <div className="absolute left-[12.5%] right-[12.5%] top-4 hidden h-px bg-slate-200 sm:block" aria-hidden="true" />
            <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {filingSteps.map((step, index) => (
                <div key={step.title} className="flex flex-col items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:items-center sm:bg-transparent sm:px-1 sm:py-0 sm:text-center">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white bg-primary text-[10px] font-bold text-white shadow-sm">
                    {index + 1}
                    <span className="sr-only">Step {index + 1} complete</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold leading-tight text-slate-800">{step.title}</span>
                    <span className="mt-1 block text-[10px] leading-snug text-slate-500">{step.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <p className="text-xs font-bold text-slate-900">What the client receives</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {deliverables.map((item) => (
                <div key={item} className="flex flex-col items-start gap-1.5 rounded-lg bg-white px-2.5 py-2.5 text-[10px] font-medium leading-snug text-slate-700 ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:gap-2 sm:px-3 sm:py-2 sm:text-[11px]">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-[10px] leading-relaxed text-slate-400">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <p>Illustrative workflow—not real client data. Government processing times and final decisions remain with the CRA.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
