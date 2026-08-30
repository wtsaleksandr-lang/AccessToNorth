import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Calculator, Check, CheckCircle2, Clock,
  ExternalLink, FileText, Loader2, Mail, Package, Plane, Plus, Route, Ship,
  ShieldCheck, Thermometer, TrainFront, Trash2, Truck, UploadCloud,
} from "lucide-react";
import type { FreightMarketEstimateResponse } from "@shared/freight";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  if (requestId) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="container mx-auto max-w-2xl px-4 md:px-6">
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
              <CardContent className="p-7 text-center sm:p-10">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div>
                <Badge className="mb-3 border-0 bg-blue-50 text-blue-700">Request received</Badge>
                <h1 className="text-3xl font-extrabold text-slate-950">Your freight RFQ is ready for review</h1>
                <p className="mx-auto mt-3 max-w-lg text-slate-600">We saved the complete shipment brief and any attached documents. This confirms the request—not a booked carrier rate.</p>
                <div className="mx-auto my-7 max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Request ID</p>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-slate-950" data-testid="freight-request-id">{requestId}</p>
                  <p className="mt-2 text-xs text-slate-500">{confirmationEmailSent ? `A confirmation was sent to ${form.email}` : "Save this reference now; email delivery could not be confirmed."}</p>
                </div>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href={`/tools/shipment-tracking?trackingId=${requestId}&email=${encodeURIComponent(form.email)}`}><Button className="w-full gap-2 sm:w-auto" data-testid="button-track-freight-request"><Route className="h-4 w-4" /> Check status</Button></Link>
                  <Link href="/portal"><Button variant="outline" className="w-full sm:w-auto">Open client portal</Button></Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <Link href="/tools" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> All tools</Link>
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <Badge className="mb-3 border-0 bg-primary/10 text-primary">Free market estimate + verified RFQ</Badge>
            <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl" data-testid="text-freight-title">Estimate freight cost worldwide</h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">Get an indicative market range for ocean, air, truck, or courier freight, then send the same shipment details to AccessToNorth for a verified quote.</p>
          </div>
          <div className="mx-auto mb-6 grid max-w-2xl grid-cols-3 gap-2" aria-label="Quote request progress">
            {STEP_LABELS.map((label, index) => (
              <button key={label} type="button" onClick={() => index < step && setStep(index)} className={`rounded-xl border px-2 py-3 text-left transition ${index === step ? "border-primary bg-primary/5" : index < step ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                <span className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index < step ? "bg-emerald-500 text-white" : index === step ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>{index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>
                <span className="block text-xs font-semibold text-slate-700 sm:text-sm">{label}</span>
              </button>
            ))}
          </div>
          <Card className="mx-auto max-w-4xl overflow-hidden border-slate-200 shadow-lg shadow-slate-200/40">
            <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
            <CardContent className="p-5 sm:p-7">
              {step === 0 && (
                <div className="space-y-7" data-testid="freight-step-shipment">
                  <div><h2 className="text-xl font-bold text-slate-950">Shipment route and service</h2><p className="mt-1 text-sm text-slate-500">Start with how and where the freight needs to move.</p></div>
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">Transport mode</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {MODE_OPTIONS.map(({ id, label, detail, icon: Icon }) => (
                        <button key={id} type="button" onClick={() => {
                          setField("mode", id);
                          setEstimateService(defaultEstimateService(id));
                          setEquipmentQuantity("1");
                          setMarketEstimate(null);
                          setEstimateError("");
                        }} className={`rounded-xl border p-3 text-left transition ${form.mode === id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-slate-200 bg-white hover:border-slate-300"}`} data-testid={`freight-mode-${id}`}>
                          <Icon className={`mb-2 h-5 w-5 ${form.mode === id ? "text-primary" : "text-slate-400"}`} /><span className="block text-sm font-bold text-slate-900">{label}</span><span className="text-[11px] text-slate-500">{detail}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><Label htmlFor="freight-direction">Movement</Label><select id="freight-direction" value={form.direction} onChange={(event) => setField("direction", event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="import">Import to Canada</option><option value="export">Export from Canada</option><option value="cross-border">Canada–US cross-border</option><option value="domestic">Domestic</option></select></div>
                    <div><Label htmlFor="freight-service">Service level</Label><select id="freight-service" value={form.serviceLevel} onChange={(event) => setField("serviceLevel", event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="flexible">Flexible / economy</option><option value="standard">Standard</option><option value="expedited">Expedited</option></select></div>
                    <div><Label htmlFor="freight-ready-date">Cargo ready date</Label><Input id="freight-ready-date" type="date" min={new Date().toISOString().slice(0, 10)} value={form.readyDate} onChange={(event) => setField("readyDate", event.target.value)} className="mt-1" /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="freight-origin">Origin *</Label><Input id="freight-origin" value={form.origin} onChange={(event) => setField("origin", event.target.value)} placeholder="City, province/state, country" className="mt-1" data-testid="input-freight-origin" /></div>
                    <div><Label htmlFor="freight-destination">Destination *</Label><Input id="freight-destination" value={form.destination} onChange={(event) => setField("destination", event.target.value)} placeholder="City, province/state, country" className="mt-1" data-testid="input-freight-destination" /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                    <div><Label htmlFor="freight-commodity">Commodity *</Label><Input id="freight-commodity" value={form.commodity} onChange={(event) => setField("commodity", event.target.value)} placeholder="What is being shipped?" className="mt-1" data-testid="input-freight-commodity" /></div>
                    <div><Label htmlFor="freight-incoterm">Incoterm</Label><select id="freight-incoterm" value={form.incoterm} onChange={(event) => setField("incoterm", event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="unsure">Help me identify it</option>{["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"].map((term) => <option key={term} value={term}>{term}</option>)}</select></div>
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-6" data-testid="freight-step-cargo">
                  <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-950">Cargo and handling</h2><p className="mt-1 text-sm text-slate-500">Enter outside dimensions and total gross weight for each line.</p></div><Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setCargoLines((lines) => [...lines, newCargoLine(lines.length)])}><Plus className="h-3.5 w-3.5" /> Add line</Button></div>
                  <div className="space-y-3">
                    {cargoLines.map((line, index) => (
                      <div key={line.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4" data-testid={`freight-cargo-line-${index}`}>
                        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold text-slate-900">Cargo line {index + 1}</p>{cargoLines.length > 1 && <button type="button" onClick={() => setCargoLines((lines) => lines.filter((item) => item.id !== line.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove cargo line ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}</div>
                        <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr_90px]">
                          <div><Label className="text-xs">Description *</Label><Input value={line.description} onChange={(event) => updateCargoLine(line.id, "description", event.target.value)} placeholder="Export pallets" className="mt-1 h-9" data-testid={`input-freight-cargo-description-${index}`} /></div>
                          <div><Label className="text-xs">Packaging</Label><select value={line.packaging} onChange={(event) => updateCargoLine(line.id, "packaging", event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm">{["pallets", "cartons", "crates", "drums", "bags", "loose", "other"].map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></div>
                          <div><Label className="text-xs">Quantity *</Label><Input type="number" min="1" value={line.quantity} onChange={(event) => updateCargoLine(line.id, "quantity", event.target.value)} className="mt-1 h-9" /></div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                          {(["length", "width", "height"] as const).map((dimension) => <div key={dimension}><Label className="text-xs capitalize">{dimension}</Label><Input type="number" min="0" step="any" value={line[dimension]} onChange={(event) => updateCargoLine(line.id, dimension, event.target.value)} className="mt-1 h-9" /></div>)}
                          <div><Label className="text-xs">Dimension unit</Label><select value={line.dimensionUnit} onChange={(event) => updateCargoLine(line.id, "dimensionUnit", event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm"><option value="in">inches</option><option value="cm">cm</option></select></div>
                          <div><Label className="text-xs">Total gross weight</Label><div className="mt-1 flex"><Input type="number" min="0" step="any" value={line.totalWeight} onChange={(event) => updateCargoLine(line.id, "totalWeight", event.target.value)} className="h-9 rounded-r-none" /><select value={line.weightUnit} onChange={(event) => updateCargoLine(line.id, "weightUnit", event.target.value)} className="h-9 rounded-r-md border border-l-0 border-input bg-white px-2 text-xs"><option value="lb">lb</option><option value="kg">kg</option></select></div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center"><div><p className="text-lg font-extrabold text-slate-950">{cargoSummary.packages.toLocaleString()}</p><p className="text-[11px] text-slate-500">Packages</p></div><div><p className="text-lg font-extrabold text-slate-950">{cargoSummary.weightKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p className="text-[11px] text-slate-500">Approx. kg</p></div><div><p className="text-lg font-extrabold text-slate-950">{cargoSummary.volumeCbm.toFixed(2)}</p><p className="text-[11px] text-slate-500">Approx. m³</p></div></div>
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid="freight-market-estimator">
                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm"><Calculator className="h-5 w-5" /></span>
                        <div><h3 className="font-bold text-slate-950">Free worldwide market estimate</h3><p className="mt-0.5 text-xs leading-relaxed text-slate-500">Indicative range from a public freight market feed. No contact details required.</p></div>
                      </div>
                      {form.mode !== "rail" && <Button type="button" onClick={getMarketEstimate} disabled={estimateLoading} className="shrink-0 gap-2" data-testid="button-freight-estimate">
                        {estimateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}{estimateLoading ? "Checking market…" : "Get market estimate"}
                      </Button>}
                    </div>
                    <div className="p-4">
                      {form.mode === "rail" ? (
                        <p className="text-sm leading-relaxed text-slate-600">Public rail pricing is not available. Continue to request a verified intermodal quote.</p>
                      ) : (
                        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                          <div><Label htmlFor="freight-estimate-service" className="text-xs">Service / equipment</Label><select id="freight-estimate-service" value={estimateService} onChange={(event) => { setEstimateService(event.target.value as EstimateService); setMarketEstimate(null); setEstimateError(""); }} className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm">{ESTIMATE_SERVICE_OPTIONS[form.mode]?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                          {estimateService.startsWith("fcl") ? <div><Label htmlFor="freight-equipment-quantity" className="text-xs">Containers</Label><Input id="freight-equipment-quantity" type="number" min="1" max="20" value={equipmentQuantity} onChange={(event) => { setEquipmentQuantity(event.target.value); setMarketEstimate(null); }} className="mt-1" /></div> : <div className="hidden sm:block" />}
                        </div>
                      )}
                      {estimateError && <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm leading-relaxed text-amber-900" data-testid="freight-estimate-error">{estimateError} <button type="button" onClick={nextStep} className="font-semibold underline underline-offset-2">Continue to verified quote</button></div>}
                      {marketEstimate && <div className="space-y-3" data-testid="freight-estimate-result">
                        {marketEstimate.estimates.map((estimate, index) => {
                          const money = new Intl.NumberFormat("en-US", { style: "currency", currency: estimate.currency, maximumFractionDigits: 0 });
                          const hasTransit = estimate.transitMinDays !== null || estimate.transitMaxDays !== null;
                          return <div key={`${estimate.mode}-${index}`} className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-emerald-100 text-emerald-800">{estimate.mode}</Badge>{marketEstimate.cached && <span className="text-[11px] text-slate-500">recent cached result</span>}</div><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{money.format(estimate.priceMin)}–{money.format(estimate.priceMax)}</p><p className="mt-1 text-xs font-medium text-slate-500">Indicative freight range · {estimate.currency}</p></div>
                            {hasTransit && <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm text-slate-700"><Clock className="h-4 w-4 text-primary" /><span><strong>{estimate.transitMinDays ?? estimate.transitMaxDays}–{estimate.transitMaxDays ?? estimate.transitMinDays}</strong> days</span></div>}
                          </div>;
                        })}
                        <p className="text-xs leading-relaxed text-slate-500">{marketEstimate.disclaimer} Rates supplied by <a href={marketEstimate.attributionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Freightos <ExternalLink className="h-3 w-3" /></a>. Retrieved {new Date(marketEstimate.retrievedAt).toLocaleString()}.</p>
                      </div>}
                    </div>
                  </section>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${form.stackable ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}><input type="checkbox" checked={form.stackable} onChange={(event) => setField("stackable", event.target.checked)} /><Package className="h-4 w-4 text-emerald-600" /><span className="text-sm font-semibold">Stackable</span></label>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${form.hazardous ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}><input type="checkbox" checked={form.hazardous} onChange={(event) => { setField("hazardous", event.target.checked); setMarketEstimate(null); setEstimateError(""); }} /><AlertTriangle className="h-4 w-4 text-amber-600" /><span className="text-sm font-semibold">Hazardous goods</span></label>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${form.temperatureControlled ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}><input type="checkbox" checked={form.temperatureControlled} onChange={(event) => { setField("temperatureControlled", event.target.checked); setMarketEstimate(null); setEstimateError(""); }} /><Thermometer className="h-4 w-4 text-sky-600" /><span className="text-sm font-semibold">Temperature control</span></label>
                  </div>
                  {form.temperatureControlled && <div className="max-w-xs"><Label htmlFor="freight-temp">Required temperature (°C)</Label><Input id="freight-temp" type="number" min="-100" max="100" value={form.temperatureC} onChange={(event) => setField("temperatureC", event.target.value)} className="mt-1" /></div>}
                  <div><Label htmlFor="freight-documents">Supporting documents <span className="font-normal text-slate-400">(optional)</span></Label><label htmlFor="freight-documents" className="mt-1 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 hover:border-primary/60"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><UploadCloud className="h-5 w-5 text-slate-500" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">Packing list, commercial invoice, or cargo photo</span><span className="block truncate text-xs text-slate-500">{documents.length ? `${documents.length} file${documents.length === 1 ? "" : "s"} selected` : "PDF, image, CSV, Excel, or Word · up to 5 files · 10 MB each"}</span></span></label><input id="freight-documents" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xls,.xlsx,.doc,.docx" onChange={(event) => handleFiles(event.target.files)} className="sr-only" data-testid="input-freight-documents" /></div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6" data-testid="freight-step-contact">
                  <div><h2 className="text-xl font-bold text-slate-950">Contact and final notes</h2><p className="mt-1 text-sm text-slate-500">We use this information only to review and respond to this request.</p></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="freight-name">Contact name *</Label><Input id="freight-name" value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} className="mt-1" data-testid="input-freight-name" /></div>
                    <div><Label htmlFor="freight-company">Company</Label><Input id="freight-company" value={form.companyName} onChange={(event) => setField("companyName", event.target.value)} className="mt-1" /></div>
                    <div><Label htmlFor="freight-email">Email *</Label><Input id="freight-email" type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} className="mt-1" data-testid="input-freight-email" /></div>
                    <div><Label htmlFor="freight-phone">Phone</Label><Input id="freight-phone" type="tel" value={form.phone} onChange={(event) => setField("phone", event.target.value)} className="mt-1" /></div>
                  </div>
                  <div><Label htmlFor="freight-notes">Routing or handling notes</Label><Textarea id="freight-notes" value={form.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Pickup hours, appointment requirements, special handling, declared value, or other context" className="mt-1 min-h-28" /></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><p className="text-sm font-bold text-slate-900">Request summary</p></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Route:</span> <strong>{form.origin} → {form.destination}</strong></p><p><span className="text-slate-500">Mode:</span> <strong className="capitalize">{form.mode}</strong></p><p><span className="text-slate-500">Cargo:</span> <strong>{cargoSummary.packages} packages · {cargoSummary.weightKg.toFixed(0)} kg</strong></p><p><span className="text-slate-500">Documents:</span> <strong>{documents.length}</strong></p>{marketEstimate?.estimates[0] && <p className="sm:col-span-2"><span className="text-slate-500">Market range:</span> <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: marketEstimate.estimates[0].currency, maximumFractionDigits: 0 }).format(marketEstimate.estimates[0].priceMin)}–{new Intl.NumberFormat("en-US", { style: "currency", currency: marketEstimate.estimates[0].currency, maximumFractionDigits: 0 }).format(marketEstimate.estimates[0].priceMax)} {marketEstimate.estimates[0].currency}</strong> <span className="text-xs text-slate-500">(indicative)</span></p>}</div></div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4"><input type="checkbox" checked={form.consent} onChange={(event) => setField("consent", event.target.checked)} className="mt-1" /><span className="text-sm leading-relaxed text-slate-700">I confirm these details may be reviewed by AccessToNorth to prepare a freight quote. I understand this submission is not a booking or guaranteed carrier rate.</span></label>
                  <div className="flex items-start gap-3 text-xs text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><p>Your request is stored as an AccessToNorth reference. Use the request ID and email to check milestones or open the client portal.</p></div>
                </div>
              )}
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || submitting} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                {step < 2 ? <Button type="button" onClick={nextStep} className="gap-2" data-testid="button-freight-next">Continue <ArrowRight className="h-4 w-4" /></Button> : <Button type="button" onClick={submit} disabled={submitting} className="gap-2" data-testid="button-freight-submit">{submitting ? "Saving request…" : "Submit quote request"} <Mail className="h-4 w-4" /></Button>}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
