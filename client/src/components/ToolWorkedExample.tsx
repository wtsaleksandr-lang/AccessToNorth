import { Link } from "wouter";
import { ArrowRight, CheckCircle2, FlaskConical } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { canonicalUrl } from "@shared/seo";

export type ToolExampleKind =
  | "container"
  | "pallet"
  | "truck"
  | "hs"
  | "customs"
  | "carm";

const examples: Record<ToolExampleKind, {
  title: string;
  intro: string;
  input: string;
  result: string;
  checks: string[];
  guide: { label: string; href: string };
}> = {
  container: {
    title: "Worked example: seven 48 × 48 × 61 in pallets",
    intro: "This real planning example shows why dimensions—not volume alone—must drive the recommendation.",
    input: "7 pallets · 48 × 48 × 61 in each · 5,260 kg total gross weight",
    result: "The planner tests floor positions, door clearance, payload and permitted rotation before recommending the smallest feasible container plan. It should not infer two 40 ft high-cube containers from volume alone.",
    checks: ["All seven pallet footprints placed without overlap", "Gross weight checked against payload", "Door height and usable internal dimensions checked"],
    guide: { label: "20 ft vs 40 ft container guide", href: "/blog/20ft-vs-40ft-container" },
  },
  pallet: {
    title: "Worked example: cartons on a standard North American pallet",
    intro: "A practical pattern test using outside carton dimensions and a loaded-height limit.",
    input: "24 cartons · 16 × 12 × 10 in · 18 lb each · 48 × 40 in pallet · 60 in max loaded height",
    result: "The builder compares allowed carton rotations, creates complete layers, centres a partial top layer and reports pallet count, loaded height, gross weight and stability warnings.",
    checks: ["Pallet footprint and deck area enforced", "Carton rotation rules respected", "Pallet tare and gross weight included"],
    guide: { label: "How many pallets fit guide", href: "/blog/how-many-pallets-fit-container-trailer" },
  },
  truck: {
    title: "Worked example: 26 standard pallets in a 53 ft dry van",
    intro: "A common truckload scenario that demonstrates spatial fit and dispatch checks.",
    input: "26 pallets · 48 × 40 × 54 in · 1,500 lb each · non-stackable",
    result: "The planner evaluates a two-across floor pattern, payload, loading sequence and geometric balance. The result remains a planning estimate until the assembled vehicle is scaled and the carrier confirms equipment limits.",
    checks: ["Collision-free floor placement", "Trailer payload checked", "Route and jurisdiction guidance kept separate from fit"],
    guide: { label: "Trailer load planning guide", href: "/blog/trailer-load-planning-guide" },
  },
  hs: {
    title: "Worked example: classify a stainless-steel water bottle",
    intro: "A better product description produces a safer shortlist than a generic word such as “bottle.”",
    input: "Vacuum-insulated reusable drinking bottle · stainless steel · 750 mL · not electric",
    result: "Search the complete description, inspect the suggested Canadian tariff items, then verify material, function and any exclusions in the official tariff. The tool suggests candidates; CBSA determines the final classification.",
    checks: ["Product function stated", "Material and construction stated", "Candidate checked in the official Canadian Customs Tariff"],
    guide: { label: "Canadian HS-code examples", href: "/blog/canadian-hs-code-examples" },
  },
  customs: {
    title: "Worked example: estimate a commercial import into Ontario",
    intro: "A transparent landed-cost estimate keeps customs value, duty and import tax separate.",
    input: "CA$10,000 customs value · 6.5% duty assumption · Ontario destination · commercial shipment",
    result: "Estimated duty is CA$650. GST/HST is then calculated using the tool's displayed assumptions and tariff treatment. Brokerage, freight, SIMA, excise and permit costs remain separate unless explicitly entered.",
    checks: ["Currency and customs value confirmed", "Origin and tariff treatment reviewed", "Estimate assumptions shown before export"],
    guide: { label: "How to import into Canada", href: "/resources/how-to-import-into-canada" },
  },
  carm: {
    title: "Worked example: calculate RPP financial security",
    intro: "Use the highest monthly duty-and-tax exposure rather than an annual average.",
    input: "Highest monthly duty + tax exposure: CA$20,000",
    result: "At a 50% written-security assumption, the planning amount is CA$10,000 before applicable CBSA minimums, maximums and surety underwriting. The calculator shows bond and cash scenarios separately.",
    checks: ["Highest month used", "Written security separated from annual bond premium", "Final amount verified in CARM/with the surety"],
    guide: { label: "CARM security guide", href: "/blog/carm-bond-vs-cash-security" },
  },
};

export function ToolWorkedExample({ kind }: { kind: ToolExampleKind }) {
  const example = examples[kind];
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: example.title,
    description: example.intro,
    step: [
      { "@type": "HowToStep", name: "Enter the example", text: example.input },
      { "@type": "HowToStep", name: "Review the calculated result", text: example.result },
      { "@type": "HowToStep", name: "Verify the plan", text: example.checks.join("; ") },
    ],
  };

  return (
    <section className="border-t border-slate-200 bg-slate-50/80 py-10" aria-labelledby={`worked-example-${kind}`}>
      <JsonLd id={`worked-example-schema-${kind}`} data={schema} />
      <div className="container mx-auto max-w-5xl px-4 md:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <div className="p-5 sm:p-7">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                <FlaskConical className="h-4 w-4" aria-hidden="true" /> Original worked example
              </div>
              <h2 id={`worked-example-${kind}`} className="text-xl font-extrabold text-slate-900 sm:text-2xl">{example.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{example.intro}</p>
              <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Example input</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{example.input}</p>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-7 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">What the result should explain</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{example.result}</p>
              <ul className="mt-4 space-y-2">
                {example.checks.map((check) => (
                  <li key={check} className="flex gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
              <Link href={example.guide.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:underline">
                {example.guide.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
