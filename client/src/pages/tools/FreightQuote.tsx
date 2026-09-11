import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Calculator, CheckCircle2, Clock,
  ExternalLink, FileText, Loader2, Mail, Package, Plane, Plus, Route, Ship,
  ShieldCheck, Thermometer, TrainFront, Trash2, Truck, UploadCloud,
} from "lucide-react";
import type { FreightMarketEstimateResponse } from "@shared/freight";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Callout,
  FieldLabel,
  Input,
  ResultCard,
  SegmentedControl,
  Select,
  SelectItem,
  StepRibbon,
  TOOL_SUCCESS,
  type ResultRow,
} from "@/components/tools";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";

type FreightMode = "ocean" | "air" | "truck" | "rail" | "courier";
type EstimateService = "lcl" | "fcl20" | "fcl40" | "fcl40hc" | "fcl45hc" | "air" | "ltl" | "ftl" | "express";

interface CargoLineForm {
  id: string;
  description: string;
  packaging: string;
  quantity: string;
  length: string;
  width: string;
  height: string;
  dimensionUnit: "in" | "cm";
  totalWeight: string;
  weightUnit: "lb" | "kg";
}

const MODE_OPTIONS: Array<{ id: FreightMode; label: string; detail: string; icon: typeof Ship }> = [
  { id: "ocean", label: "Ocean", detail: "FCL or LCL", icon: Ship },
  { id: "air", label: "Air", detail: "Airport or door", icon: Plane },
  { id: "truck", label: "Truck", detail: "Canada / US", icon: Truck },
  { id: "rail", label: "Rail", detail: "Intermodal", icon: TrainFront },
  { id: "courier", label: "Courier", detail: "Parcel / express", icon: Package },
];

const STEP_LABELS = ["Shipment", "Cargo", "Contact"];

const ESTIMATE_SERVICE_OPTIONS: Partial<Record<FreightMode, Array<{ value: EstimateService; label: string }>>> = {
  ocean: [
    { value: "lcl", label: "LCL / shared container" },
    { value: "fcl20", label: "20′ standard container" },
    { value: "fcl40", label: "40′ standard container" },
    { value: "fcl40hc", label: "40′ high-cube container" },
    { value: "fcl45hc", label: "45′ high-cube container" },
  ],
  air: [{ value: "air", label: "Air freight" }],
  truck: [{ value: "ltl", label: "LTL / shared truck" }, { value: "ftl", label: "Full truckload" }],
  courier: [{ value: "express", label: "Express parcel" }],
};

const PACKAGING_OPTIONS = ["pallets", "cartons", "crates", "drums", "bags", "loose", "other"];

const INCOTERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];

/** Card-on-canvas shell, matching the rest of the tool suite. */
const SHELL = "w-[98%] max-w-container-outer mx-auto rounded-lg border overflow-hidden";
const RAIL = "mx-auto max-w-container px-5 md:px-10";
const FORM_RAIL = "mx-auto max-w-4xl px-5 md:px-10";
const PAD = {
  even: "pt-10 pb-10 md:pt-[76px] md:pb-[76px]",
  topHeavy: "pt-16 pb-10 md:pt-20 md:pb-[60px]",
} as const;

/**
 * Selection is the 2px border swap #EAECF0 -> #3356EE, and the border is 2px
 * in BOTH states so a choice repaints an edge and reflows nothing.
 */
const CHOICE_BASE = "cursor-pointer rounded-lg border-2 p-4 text-left transition-colors duration-state";
const CHOICE_ON = "border-brand bg-white";
const CHOICE_OFF = "border-border-app bg-surface-recessed hover:border-border-control";

function defaultEstimateService(mode: FreightMode): EstimateService {
  return ESTIMATE_SERVICE_OPTIONS[mode]?.[0]?.value || "lcl";
}

function newCargoLine(index = 0): CargoLineForm {
  return {
    id: `cargo_${Date.now()}_${index}`,
    description: "",
    packaging: "pallets",
    quantity: "1",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "in",
    totalWeight: "",
    weightUnit: "lb",
  };
}

export default function FreightQuote() {
  usePageMeta({
    title: "Free Worldwide Freight Rate Estimate & Quote | AccessToNorth.com",
    description: "Estimate worldwide ocean, air, truck, or courier freight costs, then submit the same shipment details for a verified carrier quote.",
    canonical: "/tools/freight-quote",
  });

  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [cargoLines, setCargoLines] = useState<CargoLineForm[]>([newCargoLine()]);
  const [estimateService, setEstimateService] = useState<EstimateService>("lcl");
  const [equipmentQuantity, setEquipmentQuantity] = useState("1");
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [marketEstimate, setMarketEstimate] = useState<FreightMarketEstimateResponse | null>(null);
  const [estimateError, setEstimateError] = useState("");
  const [form, setForm] = useState({
    mode: "ocean" as FreightMode,
    direction: "import",
    serviceLevel: "standard",
    origin: "",
    destination: "",
    readyDate: "",
    incoterm: "unsure",
    commodity: "",
    stackable: false,
    hazardous: false,
    temperatureControlled: false,
    temperatureC: "",
    notes: "",
    contactName: "",
    companyName: "",
    email: "",
    phone: "",
    consent: false,
  });

  const cargoSummary = useMemo(() => cargoLines.reduce((summary, line) => {
    const quantity = Number(line.quantity) || 0;
    const lengthM = (Number(line.length) || 0) * (line.dimensionUnit === "cm" ? 0.01 : 0.0254);
    const widthM = (Number(line.width) || 0) * (line.dimensionUnit === "cm" ? 0.01 : 0.0254);
    const heightM = (Number(line.height) || 0) * (line.dimensionUnit === "cm" ? 0.01 : 0.0254);
    const weightKg = (Number(line.totalWeight) || 0) * (line.weightUnit === "kg" ? 1 : 0.45359237);
    return {
      packages: summary.packages + quantity,
      volumeCbm: summary.volumeCbm + lengthM * widthM * heightM * quantity,
      weightKg: summary.weightKg + weightKg,
    };
  }, { packages: 0, volumeCbm: 0, weightKg: 0 }), [cargoLines]);

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateCargoLine = (id: string, field: keyof CargoLineForm, value: string) => {
    setCargoLines((lines) => lines.map((line) => line.id === id ? { ...line, [field]: value } : line));
  };

  const preparedCargoLines = () => cargoLines.map((line) => ({
    ...line,
    quantity: Number(line.quantity),
    length: Number(line.length),
    width: Number(line.width),
    height: Number(line.height),
    totalWeight: Number(line.totalWeight),
  }));

  const validateStep = (index: number) => {
    if (index === 0 && (!form.origin.trim() || !form.destination.trim() || !form.commodity.trim())) {
      toast({ title: "Complete the route details", description: "Origin, destination, and commodity are required.", variant: "destructive" });
      return false;
    }
    if (index === 1) {
      const invalid = cargoLines.some((line) => !line.description.trim() || [line.quantity, line.length, line.width, line.height, line.totalWeight].some((value) => !(Number(value) > 0)));
      if (invalid) {
        toast({ title: "Complete each cargo line", description: "Description, quantity, dimensions, and total weight must be greater than zero.", variant: "destructive" });
        return false;
      }
      if (form.temperatureControlled && form.temperatureC === "") {
        toast({ title: "Enter the required temperature", variant: "destructive" });
        return false;
      }
    }
    if (index === 2 && (!form.contactName.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.consent)) {
      toast({ title: "Complete the contact details", description: "Name, valid email, and review consent are required.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((current) => Math.min(2, current + 1));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, 5);
    const tooLarge = selected.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      toast({ title: `${tooLarge.name} is too large`, description: "Each document must be 10 MB or smaller.", variant: "destructive" });
      return;
    }
    setDocuments(selected);
  };

  const getMarketEstimate = async () => {
    if (!validateStep(0) || !validateStep(1)) return;
    if (form.mode === "rail") {
      setEstimateError("Public rail pricing is not available. Submit the shipment for a verified intermodal quote.");
      setMarketEstimate(null);
      return;
    }
    setEstimateLoading(true);
    setEstimateError("");
    setMarketEstimate(null);
    try {
      const response = await fetch("/api/freight-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: form.mode,
          origin: form.origin,
          destination: form.destination,
          service: estimateService,
          equipmentQuantity: Number(equipmentQuantity),
          cargoLines: preparedCargoLines(),
          hazardous: form.hazardous,
          temperatureControlled: form.temperatureControlled,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "A market estimate is not available for this shipment.");
      setMarketEstimate(data);
    } catch (error) {
      setEstimateError(error instanceof Error ? error.message : "A market estimate is not available for this shipment.");
    } finally {
      setEstimateLoading(false);
    }
  };

  const submit = async () => {
    if (!validateStep(2)) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("request", JSON.stringify({
        ...form,
        temperatureC: form.temperatureControlled ? Number(form.temperatureC) : null,
        cargoLines: preparedCargoLines(),
      }));
      documents.forEach((file) => body.append("documents", file));
      const response = await fetch("/api/freight-quote", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not save the quote request.");
      setRequestId(data.requestId);
      setConfirmationEmailSent(Boolean(data.confirmationEmailSent));
      toast({ title: "Quote request saved", description: `Reference ${data.requestId}` });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast({ title: "Quote request not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const money = (value: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

  // ── Submitted ──────────────────────────────────────────────────────
  if (requestId) {
    return (
      <div className="min-h-screen bg-surface-canvas font-sans">
        <main className="flex flex-col gap-4 pb-4 pt-[99px]">
          <section className={`${SHELL} bg-white ${PAD.topHeavy}`}>
            <div className={FORM_RAIL}>
              <div className="max-w-2xl">
                <p className="text-eyebrow uppercase text-text-muted">Request received</p>
                <h1 className="mt-3 text-h2 text-text-primary">Your freight RFQ is ready for review</h1>
                <p className="mt-4 text-lead text-text-muted">
                  We saved the complete shipment brief and any attached documents.
                </p>
              </div>

              {/*
                The single most important sentence on this screen, and it is a
                limitation rather than a success message — so it is a 14px
                Callout above the reference, not a grey line beneath it. A saved
                RFQ is not a rate and must never be read as one.
              */}
              <Callout tone="warning" role="status" className="mt-6">
                <p>
                  This confirms the request &mdash; not a booked carrier rate. Nothing is reserved and no price is
                  committed until AccessToNorth returns a verified quote.
                </p>
              </Callout>

              <div className="mt-4 rounded-lg border border-border-hairline bg-surface-recessed p-5">
                <p className="text-eyebrow uppercase text-text-muted">Request ID</p>
                <p
                  className="mt-1 font-mono text-[32px] font-bold leading-[38px] tracking-[-0.02em] text-text-primary tabular-nums"
                  data-testid="freight-request-id"
                >
                  {requestId}
                </p>
                <p className="mt-2 text-[14px] leading-5 text-text-muted">
                  {confirmationEmailSent
                    ? `A confirmation was sent to ${form.email}`
                    : "Save this reference now; email delivery could not be confirmed."}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={`/tools/shipment-tracking?trackingId=${requestId}&email=${encodeURIComponent(form.email)}`}>
                  <Button
                    className="w-full bg-brand text-white transition-colors duration-state hover:bg-brand-hover sm:w-auto"
                    data-testid="button-track-freight-request"
                  >
                    <Route className="mr-2 h-4 w-4" aria-hidden="true" />
                    Check status
                  </Button>
                </Link>
                <Link href="/portal">
                  <Button
                    variant="outline"
                    className="w-full border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand sm:w-auto"
                  >
                    Open client portal
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const estimateRows: ResultRow[] = marketEstimate
    ? marketEstimate.estimates.map((estimate, index) => {
        const hasTransit = estimate.transitMinDays !== null || estimate.transitMaxDays !== null;
        return {
          label: <span className="capitalize">{estimate.mode}</span>,
          meta: hasTransit
            ? `${estimate.transitMinDays ?? estimate.transitMaxDays}–${estimate.transitMaxDays ?? estimate.transitMinDays} days`
            : undefined,
          value: `${money(estimate.priceMin, estimate.currency)}–${money(estimate.priceMax, estimate.currency)}`,
          testId: `freight-estimate-row-${index}`,
        };
      })
    : [];

  return (
    <div className="min-h-screen bg-surface-canvas font-sans">
      {/* 83px fixed Navbar + the 16px inter-card gap. */}
      <main className="flex flex-col gap-4 pb-4 pt-[99px]">

        {/* ── Hero card ───────────────────────────────────────────────── */}
        <section className={`${SHELL} border-white/10 surface-dark ${PAD.even}`}>
          <div className={RAIL}>
            <div className="max-w-2xl">
              <p className="text-eyebrow uppercase text-text-deemphasis">Free market estimate + verified RFQ</p>
              <h1 className="mt-4 text-h1-sm text-white md:text-h1" data-testid="text-freight-title">
                Estimate freight cost worldwide
              </h1>
              <p className="mt-5 text-lead text-text-deemphasis">
                Get an indicative market range for ocean, air, truck, or courier freight, then send the same
                shipment details to AccessToNorth for a verified quote.
              </p>
              <Link
                href="/tools"
                className="mt-6 inline-flex items-center gap-1.5 text-body font-semibold text-text-deemphasis underline underline-offset-4 transition-colors duration-state hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All tools
              </Link>
            </div>
          </div>
        </section>

        {/* ── Request builder ─────────────────────────────────────────── */}
        <section className={`${SHELL} bg-white ${PAD.topHeavy}`}>
          <div className={FORM_RAIL}>
            <StepRibbon
              steps={STEP_LABELS.map((label) => ({ label }))}
              current={step}
              className="mb-6"
              data-testid="step-ribbon-freight"
            />

            {step === 0 && (
              <div className="space-y-7" data-testid="freight-step-shipment">
                <div>
                  <h2 className="text-h2 text-text-primary">Shipment route and service</h2>
                  <p className="mt-2 text-lead text-text-muted">Start with how and where the freight needs to move.</p>
                </div>

                <div>
                  <FieldLabel>Transport mode</FieldLabel>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {MODE_OPTIONS.map(({ id, label, detail, icon: Icon }) => {
                      const active = form.mode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setField("mode", id);
                            setEstimateService(defaultEstimateService(id));
                            setEquipmentQuantity("1");
                            setMarketEstimate(null);
                            setEstimateError("");
                          }}
                          className={`${CHOICE_BASE} ${active ? CHOICE_ON : CHOICE_OFF}`}
                          data-testid={`freight-mode-${id}`}
                        >
                          <Icon className="mb-2 h-5 w-5 text-text-muted" aria-hidden="true" />
                          <span className="block text-[14px] font-semibold leading-5 text-text-primary">{label}</span>
                          <span className="mt-0.5 block text-[13px] leading-[18px] text-text-muted">{detail}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <FieldLabel htmlFor="freight-direction">Movement</FieldLabel>
                    <Select
                      id="freight-direction"
                      value={form.direction}
                      onValueChange={(value) => setField("direction", value)}
                    >
                      <SelectItem value="import">Import to Canada</SelectItem>
                      <SelectItem value="export">Export from Canada</SelectItem>
                      <SelectItem value="cross-border">Canada–US cross-border</SelectItem>
                      <SelectItem value="domestic">Domestic</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="freight-service">Service level</FieldLabel>
                    <Select
                      id="freight-service"
                      value={form.serviceLevel}
                      onValueChange={(value) => setField("serviceLevel", value)}
                    >
                      <SelectItem value="flexible">Flexible / economy</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="expedited">Expedited</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="freight-ready-date">Cargo ready date</FieldLabel>
                    <Input
                      id="freight-ready-date"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={form.readyDate}
                      onChange={(event) => setField("readyDate", event.target.value)}
                      className="tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="freight-origin" required>Origin</FieldLabel>
                    <Input
                      id="freight-origin"
                      value={form.origin}
                      onChange={(event) => setField("origin", event.target.value)}
                      placeholder="City, province/state, country"
                      data-testid="input-freight-origin"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="freight-destination" required>Destination</FieldLabel>
                    <Input
                      id="freight-destination"
                      value={form.destination}
                      onChange={(event) => setField("destination", event.target.value)}
                      placeholder="City, province/state, country"
                      data-testid="input-freight-destination"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
                  <div>
                    <FieldLabel htmlFor="freight-commodity" required>Commodity</FieldLabel>
                    <Input
                      id="freight-commodity"
                      value={form.commodity}
                      onChange={(event) => setField("commodity", event.target.value)}
                      placeholder="What is being shipped?"
                      data-testid="input-freight-commodity"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="freight-incoterm">Incoterm</FieldLabel>
                    <Select
                      id="freight-incoterm"
                      value={form.incoterm}
                      onValueChange={(value) => setField("incoterm", value)}
                    >
                      <SelectItem value="unsure">Help me identify it</SelectItem>
                      {INCOTERMS.map((term) => (
                        <SelectItem key={term} value={term}>{term}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-7" data-testid="freight-step-cargo">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-h2 text-text-primary">Cargo and handling</h2>
                    <p className="mt-2 text-lead text-text-muted">
                      Enter outside dimensions and total gross weight for each line.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-border-control bg-white text-text-primary transition-colors duration-state hover:border-brand hover:text-brand"
                    onClick={() => setCargoLines((lines) => [...lines, newCargoLine(lines.length)])}
                  >
                    <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Add line
                  </Button>
                </div>

                <div className="space-y-4">
                  {cargoLines.map((line, index) => (
                    <div
                      key={line.id}
                      className="rounded-lg border border-border-hairline bg-surface-recessed p-4"
                      data-testid={`freight-cargo-line-${index}`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-[14px] font-semibold leading-5 text-text-primary">
                          Cargo line <span className="tabular-nums">{index + 1}</span>
                        </p>
                        {cargoLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCargoLines((lines) => lines.filter((item) => item.id !== line.id))}
                            className="shrink-0 cursor-pointer rounded-md p-1 text-text-muted transition-colors duration-state hover:text-[#B42318]"
                            aria-label={`Remove cargo line ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr_120px]">
                        <div>
                          <FieldLabel htmlFor={`freight-cargo-description-${index}`} required>Description</FieldLabel>
                          <Input
                            id={`freight-cargo-description-${index}`}
                            value={line.description}
                            onChange={(event) => updateCargoLine(line.id, "description", event.target.value)}
                            placeholder="Export pallets"
                            data-testid={`input-freight-cargo-description-${index}`}
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor={`freight-cargo-packaging-${index}`}>Packaging</FieldLabel>
                          <Select
                            id={`freight-cargo-packaging-${index}`}
                            value={line.packaging}
                            onValueChange={(value) => updateCargoLine(line.id, "packaging", value)}
                          >
                            {PACKAGING_OPTIONS.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value.charAt(0).toUpperCase() + value.slice(1)}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <FieldLabel htmlFor={`freight-cargo-quantity-${index}`} required>Quantity</FieldLabel>
                          <Input
                            id={`freight-cargo-quantity-${index}`}
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(event) => updateCargoLine(line.id, "quantity", event.target.value)}
                            className="tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {(["length", "width", "height"] as const).map((dimension) => (
                          <div key={dimension}>
                            <FieldLabel htmlFor={`freight-cargo-${dimension}-${index}`} required>
                              <span className="capitalize">{dimension}</span>
                            </FieldLabel>
                            <Input
                              id={`freight-cargo-${dimension}-${index}`}
                              type="number"
                              min="0"
                              step="any"
                              value={line[dimension]}
                              onChange={(event) => updateCargoLine(line.id, dimension, event.target.value)}
                              className="tabular-nums"
                            />
                          </div>
                        ))}
                        <div>
                          <FieldLabel>Dimension unit</FieldLabel>
                          <SegmentedControl
                            ariaLabel={`Dimension unit for cargo line ${index + 1}`}
                            value={line.dimensionUnit}
                            onChange={(value) => updateCargoLine(line.id, "dimensionUnit", value)}
                            options={[
                              { value: "in", label: "in" },
                              { value: "cm", label: "cm" },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor={`freight-cargo-weight-${index}`} required>Total gross weight</FieldLabel>
                          <Input
                            id={`freight-cargo-weight-${index}`}
                            type="number"
                            min="0"
                            step="any"
                            value={line.totalWeight}
                            onChange={(event) => updateCargoLine(line.id, "totalWeight", event.target.value)}
                            className="tabular-nums"
                          />
                        </div>
                        <div>
                          <FieldLabel>Weight unit</FieldLabel>
                          <SegmentedControl
                            ariaLabel={`Weight unit for cargo line ${index + 1}`}
                            value={line.weightUnit}
                            onChange={(value) => updateCargoLine(line.id, "weightUnit", value)}
                            options={[
                              { value: "lb", label: "lb" },
                              { value: "kg", label: "kg" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <dl className="grid grid-cols-3 gap-4 rounded-lg border border-border-hairline bg-white p-5">
                  {[
                    { label: "Packages", value: cargoSummary.packages.toLocaleString() },
                    { label: "Approx. kg", value: cargoSummary.weightKg.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
                    { label: "Approx. m³", value: cargoSummary.volumeCbm.toFixed(2) },
                  ].map((tile) => (
                    <div key={tile.label}>
                      <dt className="text-[13px] font-medium leading-[18px] text-text-muted">{tile.label}</dt>
                      <dd className="mt-1 text-[24px] font-bold leading-8 tracking-[-0.01em] text-text-primary tabular-nums">
                        {tile.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <section className="rounded-lg border border-border-hairline bg-white" data-testid="freight-market-estimator">
                  <header className="flex flex-col gap-4 border-b border-border-hairline px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                      <div className="min-w-0">
                        <h3 className="text-h3 text-text-primary">Free worldwide market estimate</h3>
                        <p className="mt-1 text-[14px] leading-5 text-text-muted">
                          Indicative range from a public freight market feed. No contact details required.
                        </p>
                      </div>
                    </div>
                    {form.mode !== "rail" && (
                      <Button
                        type="button"
                        onClick={getMarketEstimate}
                        disabled={estimateLoading}
                        className="shrink-0 bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                        data-testid="button-freight-estimate"
                      >
                        {estimateLoading
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Checking market…</>
                          : <><Calculator className="mr-2 h-4 w-4" aria-hidden="true" />Get market estimate</>}
                      </Button>
                    )}
                  </header>

                  <div className="space-y-4 px-5 py-5">
                    {form.mode === "rail" ? (
                      <Callout tone="info">
                        <p>Public rail pricing is not available. Continue to request a verified intermodal quote.</p>
                      </Callout>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                        <div>
                          <FieldLabel htmlFor="freight-estimate-service">Service / equipment</FieldLabel>
                          <Select
                            id="freight-estimate-service"
                            value={estimateService}
                            onValueChange={(value) => {
                              setEstimateService(value as EstimateService);
                              setMarketEstimate(null);
                              setEstimateError("");
                            }}
                          >
                            {ESTIMATE_SERVICE_OPTIONS[form.mode]?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </Select>
                        </div>
                        {estimateService.startsWith("fcl") ? (
                          <div>
                            <FieldLabel htmlFor="freight-equipment-quantity">Containers</FieldLabel>
                            <Input
                              id="freight-equipment-quantity"
                              type="number"
                              min="1"
                              max="20"
                              value={equipmentQuantity}
                              onChange={(event) => { setEquipmentQuantity(event.target.value); setMarketEstimate(null); }}
                              className="tabular-nums"
                            />
                          </div>
                        ) : (
                          <div className="hidden sm:block" />
                        )}
                      </div>
                    )}

                    {estimateError && (
                      <Callout tone="warning" role="alert" data-testid="freight-estimate-error">
                        <p>{estimateError}</p>
                        <button
                          type="button"
                          onClick={nextStep}
                          className="cursor-pointer font-semibold underline underline-offset-2 transition-colors duration-state hover:text-brand"
                        >
                          Continue to verified quote
                        </button>
                      </Callout>
                    )}

                    {marketEstimate && (
                      <div className="space-y-3" data-testid="freight-estimate-result">
                        {/*
                          The feed's own disclaimer qualifies every figure in the
                          card, so it renders ABOVE that card at 14px rather than
                          as 12px grey text underneath it.
                        */}
                        <Callout tone="info">
                          <p>{marketEstimate.disclaimer}</p>
                        </Callout>
                        <ResultCard
                          title="Indicative market range"
                          figureLabel={`Indicative freight range · ${marketEstimate.estimates[0]?.currency ?? ""}`}
                          figure={
                            marketEstimate.estimates[0]
                              ? `${money(marketEstimate.estimates[0].priceMin, marketEstimate.estimates[0].currency)}–${money(marketEstimate.estimates[0].priceMax, marketEstimate.estimates[0].currency)}`
                              : undefined
                          }
                          figureNote="A market range, not a quote. AccessToNorth has not priced this shipment."
                          rows={estimateRows}
                          action={
                            marketEstimate.cached ? (
                              <span className="rounded-md border border-border-hairline bg-surface-recessed px-2.5 py-1 text-[13px] leading-[18px] text-text-muted">
                                Recent cached result
                              </span>
                            ) : undefined
                          }
                        />
                        <p className="text-[13px] leading-[18px] text-text-muted">
                          Rates supplied by{" "}
                          <a
                            href={marketEstimate.attributionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-text-secondary underline underline-offset-2 transition-colors duration-state hover:text-brand"
                          >
                            Freightos <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                          . Retrieved <span className="tabular-nums">{new Date(marketEstimate.retrievedAt).toLocaleString()}</span>.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <div>
                  <FieldLabel>Handling requirements</FieldLabel>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([
                      { key: "stackable" as const, label: "Stackable", icon: Package, onToggle: (checked: boolean) => setField("stackable", checked) },
                      { key: "hazardous" as const, label: "Hazardous goods", icon: AlertTriangle, onToggle: (checked: boolean) => { setField("hazardous", checked); setMarketEstimate(null); setEstimateError(""); } },
                      { key: "temperatureControlled" as const, label: "Temperature control", icon: Thermometer, onToggle: (checked: boolean) => { setField("temperatureControlled", checked); setMarketEstimate(null); setEstimateError(""); } },
                    ]).map(({ key, label, icon: Icon, onToggle }) => {
                      const active = Boolean(form[key]);
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-3 ${CHOICE_BASE} ${active ? CHOICE_ON : CHOICE_OFF}`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(event) => onToggle(event.target.checked)}
                            className="h-5 w-5 shrink-0 cursor-pointer rounded-[4px] border-2 border-border-control accent-brand"
                          />
                          <Icon className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                          <span className="text-[14px] font-semibold leading-5 text-text-primary">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {form.temperatureControlled && (
                  <div className="max-w-xs">
                    <FieldLabel htmlFor="freight-temp" required>Required temperature (°C)</FieldLabel>
                    <Input
                      id="freight-temp"
                      type="number"
                      min="-100"
                      max="100"
                      value={form.temperatureC}
                      onChange={(event) => setField("temperatureC", event.target.value)}
                      className="tabular-nums"
                    />
                  </div>
                )}

                <div>
                  <FieldLabel htmlFor="freight-documents">Supporting documents (optional)</FieldLabel>
                  <label
                    htmlFor="freight-documents"
                    className="flex cursor-pointer items-center gap-4 rounded-lg border border-border-control bg-white p-4 transition-colors duration-state hover:border-brand"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-canvas">
                      <UploadCloud className="h-5 w-5 text-text-muted" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold leading-5 text-text-primary">
                        Packing list, commercial invoice, or cargo photo
                      </span>
                      <span className="block truncate text-[13px] leading-[18px] text-text-muted">
                        {documents.length
                          ? `${documents.length} file${documents.length === 1 ? "" : "s"} selected`
                          : "PDF, image, CSV, Excel, or Word · up to 5 files · 10 MB each"}
                      </span>
                    </span>
                  </label>
                  <input
                    id="freight-documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xls,.xlsx,.doc,.docx"
                    onChange={(event) => handleFiles(event.target.files)}
                    className="sr-only"
                    data-testid="input-freight-documents"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-7" data-testid="freight-step-contact">
                <div>
                  <h2 className="text-h2 text-text-primary">Contact and final notes</h2>
                  <p className="mt-2 text-lead text-text-muted">
                    We use this information only to review and respond to this request.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="freight-name" required>Contact name</FieldLabel>
                    <Input
                      id="freight-name"
                      value={form.contactName}
                      onChange={(event) => setField("contactName", event.target.value)}
                      data-testid="input-freight-name"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="freight-company">Company</FieldLabel>
                    <Input
                      id="freight-company"
                      value={form.companyName}
                      onChange={(event) => setField("companyName", event.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="freight-email" required>Email</FieldLabel>
                    <Input
                      id="freight-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setField("email", event.target.value)}
                      data-testid="input-freight-email"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="freight-phone">Phone</FieldLabel>
                    <Input
                      id="freight-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setField("phone", event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="freight-notes">Routing or handling notes</FieldLabel>
                  <Textarea
                    id="freight-notes"
                    value={form.notes}
                    onChange={(event) => setField("notes", event.target.value)}
                    placeholder="Pickup hours, appointment requirements, special handling, declared value, or other context"
                    className="min-h-28 rounded-md border-border-control bg-white px-4 py-3 text-[15px] leading-5 text-text-primary placeholder:text-text-deemphasis focus-visible:ring-brand"
                  />
                </div>

                <div className="rounded-lg border border-border-hairline bg-surface-recessed p-5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    <h3 className="text-h3 text-text-primary">Request summary</h3>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Route", value: `${form.origin} → ${form.destination}`, numeric: false },
                      { label: "Mode", value: form.mode, numeric: false, capitalize: true },
                      { label: "Cargo", value: `${cargoSummary.packages} packages · ${cargoSummary.weightKg.toFixed(0)} kg`, numeric: true },
                      { label: "Documents", value: String(documents.length), numeric: true },
                    ].map((row) => (
                      <div key={row.label}>
                        <dt className="text-[13px] leading-[18px] text-text-muted">{row.label}</dt>
                        <dd className={`mt-0.5 text-[14px] font-semibold leading-5 text-text-primary ${row.numeric ? "tabular-nums" : ""} ${row.capitalize ? "capitalize" : ""}`}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                    {marketEstimate?.estimates[0] && (
                      <div className="sm:col-span-2">
                        <dt className="text-[13px] leading-[18px] text-text-muted">Market range (indicative, not a quote)</dt>
                        <dd className="mt-0.5 text-[14px] font-semibold leading-5 text-text-primary tabular-nums">
                          {money(marketEstimate.estimates[0].priceMin, marketEstimate.estimates[0].currency)}–
                          {money(marketEstimate.estimates[0].priceMax, marketEstimate.estimates[0].currency)}{" "}
                          {marketEstimate.estimates[0].currency}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/*
                  LEGALLY LOAD-BEARING CONTROL — do not quieten this. Ticking it
                  is the reader's acknowledgement that a submission is not a
                  booking. It is never pre-checked, the box is 20px, and the
                  block's own border is the 2px selection swap so the confirmed
                  state is unmistakable. 2px in both states, so nothing reflows.
                */}
                <div
                  className={`rounded-lg border-2 p-4 transition-colors duration-state ${
                    form.consent ? "border-brand bg-white" : "border-border-app bg-surface-recessed"
                  }`}
                >
                  <p className="text-[14px] font-semibold leading-5 text-text-primary">Review consent</p>
                  <div className="mt-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="freight-consent"
                      checked={form.consent}
                      onChange={(event) => setField("consent", event.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-[4px] border-2 border-border-control accent-brand"
                    />
                    <label htmlFor="freight-consent" className="cursor-pointer text-[14px] leading-5 text-text-secondary">
                      I confirm these details may be reviewed by AccessToNorth to prepare a freight quote. I understand
                      this submission is not a booking or guaranteed carrier rate.
                    </label>
                  </div>
                </div>

                <p className="flex items-start gap-2 text-[14px] leading-5 text-text-muted">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Your request is stored as an AccessToNorth reference. Use the request ID and email to check
                  milestones or open the client portal.
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border-hairline pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0 || submitting}
                className="text-text-secondary transition-colors duration-state hover:text-text-primary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Back
              </Button>
              {step < 2 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                  data-testid="button-freight-next"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="bg-brand text-white transition-colors duration-state hover:bg-brand-hover"
                  data-testid="button-freight-submit"
                >
                  {submitting ? "Saving request…" : "Submit quote request"}
                  <Mail className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ── What this tool does, stated plainly ─────────────────────── */}
        <section className={`${SHELL} bg-surface-recessed ${PAD.even}`}>
          <div className={FORM_RAIL}>
            <h2 className="text-h2 text-text-primary">What you get, and what you don&rsquo;t</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-lg border border-border-hairline bg-white p-5">
                <CheckCircle2 className="h-5 w-5" style={{ color: TOOL_SUCCESS }} aria-hidden="true" />
                <h3 className="mt-3 text-h3 text-text-primary">What this tool does</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-text-muted">
                  Returns an indicative market range from a public freight feed, and saves your shipment brief
                  as an AccessToNorth RFQ reference you can track.
                </p>
              </div>
              <div className="rounded-lg border border-border-hairline bg-white p-5">
                <AlertTriangle className="h-5 w-5 text-[#B45309]" aria-hidden="true" />
                <h3 className="mt-3 text-h3 text-text-primary">What it does not do</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-text-muted">
                  It does not book space, reserve equipment, or commit a carrier price. Ranges are market data,
                  not an AccessToNorth quote &mdash; a verified quote comes back from our team after review.
                </p>
              </div>
            </div>
            <p className="mt-5 flex items-start gap-2 text-[14px] leading-5 text-text-muted">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Transit times shown with an estimate are the market feed&rsquo;s own figures for the lane, not a
              scheduled service AccessToNorth has confirmed.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
