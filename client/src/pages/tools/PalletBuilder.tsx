import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Boxes,
  CheckCircle2,
  Download,
  FileDown,
  FileSpreadsheet,
  FileUp,
  LayoutDashboard,
  Layers3,
  ListChecks,
  Loader2,
  PackagePlus,
  Plus,
  RotateCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";
import {
  PALLET_PRESETS,
  buildPalletPlan,
  type BuiltPallet,
  type PalletCarton,
  type PalletPresetId,
  type PalletSpec,
} from "@/lib/palletPacking";
import { savePalletPlanTransfer } from "@/lib/palletTransfer";
import { buildPalletPlacementCsv } from "@/lib/loadingPlanExports";
import { PalletPreview3D } from "./pallet-builder/PalletPreview3D";

type UnitSystem = "imperial" | "metric";
type BuilderMode = "quick" | "pro";
type ResultTab = "plan" | "overview" | "details";

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;
const CARTON_COLORS = ["#0f766e", "#2563eb", "#b45309", "#7c3aed", "#be123c", "#0e7490", "#475569", "#c2410c"];

function generateId() {
  return `pallet-carton-${Math.random().toString(36).slice(2, 10)}`;
}

function createCarton(index = 0, overrides: Partial<PalletCarton> = {}): PalletCarton {
  return {
    id: generateId(),
    name: "",
    lengthIn: 0,
    widthIn: 0,
    heightIn: 0,
    weightLbs: 0,
    quantity: 1,
    color: CARTON_COLORS[index % CARTON_COLORS.length],
    allowRotation: true,
    stackable: true,
    included: true,
    ...overrides,
  };
}

function MetricCard({ icon: Icon, label, value, detail, tone = "sky" }: { icon: typeof Box; label: string; value: string; detail: string; tone?: "sky" | "teal" | "violet" | "amber" }) {
  const tones = {
    sky: "bg-sky-50 text-sky-600",
    teal: "bg-teal-50 text-teal-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" data-testid={`pallet-metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900">{value}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function PalletLineIcon({ active = false, className = "h-10 w-16" }: { active?: boolean; className?: string }) {
  const stroke = active ? "#0284c7" : "#64748b";
  return (
    <svg viewBox="0 0 84 52" className={className} aria-hidden="true" fill="none">
      <path d="m11 28 31 9 31-9-31-9-31 9Z" fill={active ? "#e0f2fe" : "#f1f5f9"} stroke={stroke} strokeWidth="1.7" />
      <path d="M11 28v7l31 9 31-9v-7M42 37v7" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M18 37v5M66 37v5M27 40v5M57 40v5" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <path d="m21 25 21 6 21-6" stroke={stroke} strokeWidth="1.2" opacity=".65" />
    </svg>
  );
}

export default function PalletBuilder() {
  usePageMeta({
    title: "Free 3D Pallet Builder & Carton Calculator | AccessToNorth.com",
    description: "Build optimized pallet loading plans from carton dimensions. Calculate layers, pallet count, height, weight, utilization, and export a visual PDF plan.",
    canonical: "/tools/pallet-builder",
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<BuilderMode>("quick");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [cartons, setCartons] = useState<PalletCarton[]>([createCarton(0)]);
  const [palletPresetId, setPalletPresetId] = useState<PalletPresetId>("gma48x40");
  const [customPallet, setCustomPallet] = useState<PalletSpec>({
    id: "custom",
    name: "Custom pallet",
    lengthIn: 48,
    widthIn: 40,
    heightIn: 5.5,
    tareWeightLbs: 45,
  });
  const [maxLoadedHeightIn, setMaxLoadedHeightIn] = useState(72);
  const [maxGrossWeightLbs, setMaxGrossWeightLbs] = useState(2500);
  const [overhangIn, setOverhangIn] = useState(0);
  const [interlockLayers, setInterlockLayers] = useState(true);
  const [selectedPalletIndex, setSelectedPalletIndex] = useState(0);
  const [visibleLayer, setVisibleLayer] = useState<number | "all">("all");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("plan");

  const isMetric = unitSystem === "metric";
  const dimUnit = isMetric ? "cm" : "in";
  const weightUnit = isMetric ? "kg" : "lb";
  const activeCartons = mode === "quick" ? cartons.slice(0, 1) : cartons;
  const selectedPallet = useMemo(() => (
    palletPresetId === "custom"
      ? customPallet
      : PALLET_PRESETS.find((pallet) => pallet.id === palletPresetId) || PALLET_PRESETS[0]
  ), [customPallet, palletPresetId]);
  const plan = useMemo(() => buildPalletPlan(activeCartons, selectedPallet, {
    maxLoadedHeightIn,
    maxGrossWeightLbs,
    overhangIn,
    interlockLayers,
  }), [activeCartons, interlockLayers, maxGrossWeightLbs, maxLoadedHeightIn, overhangIn, selectedPallet]);
  const currentPallet: BuiltPallet | null = plan.pallets[selectedPalletIndex] || plan.pallets[0] || null;

  useEffect(() => {
    if (selectedPalletIndex >= plan.pallets.length) setSelectedPalletIndex(Math.max(0, plan.pallets.length - 1));
    setVisibleLayer("all");
  }, [plan.pallets.length, selectedPalletIndex]);

  const displayDimension = useCallback((inches: number) => {
    if (!inches) return "";
    return Number((isMetric ? inches * IN_TO_CM : inches).toFixed(2)).toString();
  }, [isMetric]);
  const displayWeight = useCallback((lbs: number) => {
    if (!lbs) return "";
    return Number((isMetric ? lbs * LB_TO_KG : lbs).toFixed(2)).toString();
  }, [isMetric]);
  const fromDimension = useCallback((value: string) => (Number.parseFloat(value) || 0) / (isMetric ? IN_TO_CM : 1), [isMetric]);
  const fromWeight = useCallback((value: string) => (Number.parseFloat(value) || 0) / (isMetric ? LB_TO_KG : 1), [isMetric]);
  const formattedDimension = useCallback((inches: number) => isMetric ? `${(inches * IN_TO_CM).toFixed(1)} cm` : `${inches.toFixed(1)} in`, [isMetric]);
  const formattedWeight = useCallback((lbs: number) => isMetric ? `${(lbs * LB_TO_KG).toFixed(1)} kg` : `${lbs.toFixed(0)} lb`, [isMetric]);

  const updateCarton = useCallback((id: string, field: keyof PalletCarton, value: PalletCarton[keyof PalletCarton]) => {
    setCartons((previous) => previous.map((carton) => carton.id === id ? { ...carton, [field]: value } : carton));
  }, []);

  const applyImportedItems = useCallback((items: Array<{ name?: string; length: number; width: number; height: number; weight: number; quantity: number; stackable?: boolean; rotationMode?: string }>, importedUnits: UnitSystem, weightIsTotal: boolean) => {
    const dimDivisor = importedUnits === "metric" ? IN_TO_CM : 1;
    const weightDivisor = importedUnits === "metric" ? LB_TO_KG : 1;
    const imported = items
      .filter((item) => item.length > 0 && item.width > 0 && item.height > 0 && item.quantity > 0)
      .map((item, index) => createCarton(index, {
        name: item.name || `Carton ${index + 1}`,
        lengthIn: item.length / dimDivisor,
        widthIn: item.width / dimDivisor,
        heightIn: item.height / dimDivisor,
        weightLbs: (weightIsTotal ? item.weight / Math.max(1, item.quantity) : item.weight) / weightDivisor,
        quantity: Math.max(1, Math.round(item.quantity)),
        stackable: item.stackable !== false,
        allowRotation: item.rotationMode !== "fixed",
      }));
    if (imported.length === 0) throw new Error("No complete carton dimensions were found in the file.");
    setCartons(imported);
    setMode(imported.length > 1 ? "pro" : "quick");
    setUnitSystem(importedUnits);
    setImportError(null);
    toast({
      title: `${imported.length} carton row${imported.length > 1 ? "s" : ""} filled in`,
      description: "Review the extracted fields and pallet limits before using the plan.",
    });
  }, [toast]);

  const findColumn = (headers: string[], keywords: string[]) => headers.find((header) => keywords.some((keyword) => header.toLowerCase().replace(/[_-]+/g, " ").includes(keyword))) || "";

  const parseSpreadsheetRows = useCallback((rows: Record<string, unknown>[]) => {
    if (rows.length === 0) throw new Error("The file does not contain any data rows.");
    const headers = Object.keys(rows[0]);
    const nameKey = findColumn(headers, ["name", "description", "item", "product"]);
    const lengthKey = findColumn(headers, ["length", " len"]);
    const widthKey = findColumn(headers, ["width", " wid"]);
    const heightKey = findColumn(headers, ["height", " hgt", " ht"]);
    const weightKey = findColumn(headers, ["weight", " wgt", " wt", "mass"]);
    const quantityKey = findColumn(headers, ["quantity", "qty", "count", "pieces", "pcs"]);
    if (!lengthKey || !widthKey || !heightKey) throw new Error("Could not identify Length, Width, and Height columns.");
    const headerText = headers.join(" ").toLowerCase();
    const importedUnits: UnitSystem = /\b(mm|cm|kg|kilogram)/.test(headerText)
      ? "metric"
      : /\b(in|inch|inches|lb|lbs|pound)/.test(headerText)
        ? "imperial"
        : unitSystem;
    const weightIsTotal = /total|gross|row weight/.test(weightKey.toLowerCase());
    applyImportedItems(rows.map((row) => ({
      name: nameKey ? String(row[nameKey] || "") : "",
      length: Number.parseFloat(String(row[lengthKey] || "0")) || 0,
      width: Number.parseFloat(String(row[widthKey] || "0")) || 0,
      height: Number.parseFloat(String(row[heightKey] || "0")) || 0,
      weight: weightKey ? Number.parseFloat(String(row[weightKey] || "0")) || 0 : 0,
      quantity: quantityKey ? Number.parseFloat(String(row[quantityKey] || "1")) || 1 : 1,
    })), importedUnits, weightIsTotal);
  }, [applyImportedItems, unitSystem]);

  const handleImportFile = useCallback(async (file: File) => {
    setImportLoading(true);
    setImportError(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (extension === "csv" || extension === "tsv" || file.type === "text/csv") {
        const parsed = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, skipEmptyLines: true });
        if (parsed.errors.length && parsed.data.length === 0) throw new Error("The CSV file could not be read.");
        parseSpreadsheetRows(parsed.data);
      } else if (["xls", "xlsx"].includes(extension) || file.type.includes("spreadsheet") || file.type.includes("excel")) {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) throw new Error("The workbook does not contain a readable sheet.");
        parseSpreadsheetRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" }));
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/cargo/extract", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The document could not be processed.");
        applyImportedItems(data.items || [], data.units === "metric" ? "metric" : "imperial", true);
        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          toast({ title: "File imported with notes", description: data.warnings.join(" ") });
        }
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "The file could not be imported.");
    } finally {
      setImportLoading(false);
    }
  }, [applyImportedItems, parseSpreadsheetRows, toast]);

  const downloadSample = useCallback(() => {
    const csv = "Name,Length (in),Width (in),Height (in),Weight Each (lb),Quantity\nExport Carton A,24,18,12,20,20\nExport Carton B,16,12,10,11,12";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "AccessToNorth_PalletBuilder_Template.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, []);

  const exportPdf = useCallback(async () => {
    if (plan.totalPallets === 0) return;
    setPdfLoading(true);
    try {
      const { generatePalletReportBlob } = await import("@/lib/palletPdf");
      const { loadAccessToNorthLogoDataUrl } = await import("@/lib/loadingReportPdfBrand");
      const logoDataUrl = await loadAccessToNorthLogoDataUrl();
      const blob = await generatePalletReportBlob({ plan, cartons: activeCartons, unitSystem, logoDataUrl });
      if (blob.size < 1000) throw new Error("Generated report was empty.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `AccessToNorth_PalletPlan_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast({ title: "PDF ready", description: "The pallet building report download has started." });
    } catch (error) {
      console.error("Pallet PDF export failed", error);
      toast({ title: "PDF export failed", description: "The pallet report could not be generated.", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  }, [activeCartons, plan, toast, unitSystem]);

  const exportCsv = useCallback(() => {
    if (plan.totalPallets === 0) return;
    const url = URL.createObjectURL(new Blob([buildPalletPlacementCsv(plan, unitSystem)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `AccessToNorth_PalletPlacements_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ title: "Placement CSV ready", description: "Every carton position, layer, rotation, and color is included." });
  }, [plan, toast, unitSystem]);

  const continueToPlanner = useCallback((target: "container" | "truck") => {
    if (plan.totalPallets === 0) return;
    savePalletPlanTransfer(plan);
    setLocation(target === "container" ? "/tools/container-calculator?from=pallet-builder" : "/tools/truck-load-planner?from=pallet-builder");
  }, [plan, setLocation]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="pb-20 pt-24">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <Breadcrumbs items={[{ label: "Tools", href: "/tools" }, { label: "Pallet Builder" }]} />

          <section className="relative mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.26),transparent_34%),radial-gradient(circle_at_14%_90%,rgba(20,184,166,0.18),transparent_36%)]" />
            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge className="border-white/10 bg-white/10 text-sky-100 hover:bg-white/10"><Sparkles className="mr-1 h-3 w-3" /> Smart pallet optimization</Badge>
                  <Badge className="border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">Free · No account</Badge>
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" data-testid="text-pallet-builder-title">Pallet Builder & Carton Loading Plan</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Turn carton dimensions into an optimized, layer-by-layer pallet plan. Check height, weight, balance, utilization, then send the finished pallets straight into a container or truck plan.</p>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur" data-testid="unit-toggle">
                {(["imperial", "metric"] as UnitSystem[]).map((unit) => (
                  <button key={unit} onClick={() => setUnitSystem(unit)} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${unitSystem === unit ? "bg-white text-slate-900 shadow" : "text-slate-300 hover:text-white"}`}>
                    {unit === "imperial" ? "IN / LB" : "CM / KG"}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="space-y-6">
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="border-b border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Step 1</p>
                        <h2 className="mt-1 text-xl font-bold">Add your cartons</h2>
                      </div>
                      <div className="flex rounded-xl bg-slate-100 p-1">
                        <button onClick={() => setMode("quick")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "quick" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`} data-testid="mode-quick">Quick · one type</button>
                        <button onClick={() => setMode("pro")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "pro" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`} data-testid="mode-pro">Pro · mixed SKUs</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-50/60 p-5 sm:p-6">
                    <div
                      onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(event) => { event.preventDefault(); setDragOver(false); const file = event.dataTransfer.files?.[0]; if (file) handleImportFile(file); }}
                      className={`rounded-2xl border border-dashed p-4 transition ${dragOver ? "border-sky-400 bg-sky-50" : "border-slate-300 bg-white"}`}
                      data-testid="pallet-file-drop"
                    >
                      <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.tsv,.xls,.xlsx,.pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.eml,.jpg,.jpeg,.png,.webp,.gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleImportFile(file); event.target.value = ""; }} />
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">{importLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}</div>
                          <div>
                            <p className="text-sm font-bold">Drop a packing list to prefill everything</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">Excel and CSV are instant. AI reads PDFs, documents, emails, and images.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={downloadSample}><FileDown className="h-3.5 w-3.5" /> Template</Button>
                          <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={importLoading} onClick={() => fileInputRef.current?.click()}><FileSpreadsheet className="h-3.5 w-3.5" /> Choose file</Button>
                        </div>
                      </div>
                      {importError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{importError}</p>}
                    </div>

                    {activeCartons.map((carton, index) => (
                      <div key={carton.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" data-testid={`pallet-carton-row-${index}`}>
                        <div className="mb-3 flex items-center gap-2">
                          <input type="color" value={carton.color} onChange={(event) => updateCarton(carton.id, "color", event.target.value)} className="h-8 w-8 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5" aria-label={`Color for carton ${index + 1}`} />
                          <Input value={carton.name} onChange={(event) => updateCarton(carton.id, "name", event.target.value)} placeholder={`Carton ${index + 1} name`} className="h-9 flex-1 font-semibold" data-testid={`pallet-carton-name-${index}`} />
                          {mode === "pro" && cartons.length > 1 && <button onClick={() => setCartons((previous) => previous.filter((item) => item.id !== carton.id))} className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500" aria-label={`Remove carton ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {([
                            ["Length", "lengthIn"],
                            ["Width", "widthIn"],
                            ["Height", "heightIn"],
                          ] as const).map(([label, field]) => (
                            <div key={field}>
                              <Label className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label} ({dimUnit})</Label>
                              <Input type="number" min="0" step="0.1" value={displayDimension(carton[field])} onChange={(event) => updateCarton(carton.id, field, fromDimension(event.target.value))} className="mt-1 h-8 text-center text-xs" data-testid={`pallet-carton-${field}-${index}`} />
                            </div>
                          ))}
                          <div>
                            <Label className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Each ({weightUnit})</Label>
                            <Input type="number" min="0" step="0.1" value={displayWeight(carton.weightLbs)} onChange={(event) => updateCarton(carton.id, "weightLbs", fromWeight(event.target.value))} className="mt-1 h-8 text-center text-xs" data-testid={`pallet-carton-weight-${index}`} />
                          </div>
                          <div>
                            <Label className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Quantity</Label>
                            <Input type="number" min="1" step="1" value={carton.quantity || ""} onChange={(event) => updateCarton(carton.id, "quantity", Math.max(0, Number.parseInt(event.target.value) || 0))} className="mt-1 h-8 text-center text-xs" data-testid={`pallet-carton-quantity-${index}`} />
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                          <button onClick={() => updateCarton(carton.id, "allowRotation", !carton.allowRotation)} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${carton.allowRotation ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500"}`}><RotateCw className="h-3.5 w-3.5" /> {carton.allowRotation ? "Rotate to optimize" : "Fixed orientation"}</button>
                          <button onClick={() => updateCarton(carton.id, "stackable", !carton.stackable)} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${carton.stackable ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}><Layers3 className="h-3.5 w-3.5" /> {carton.stackable ? "Can stack" : "Nothing above"}</button>
                        </div>
                      </div>
                    ))}
                    {mode === "pro" && <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => setCartons((previous) => [...previous, createCarton(previous.length)])}><Plus className="h-4 w-4" /> Add another carton type</Button>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Step 2</p>
                  <h2 className="mt-1 text-xl font-bold">Pallet and limits</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {PALLET_PRESETS.map((preset) => (
                      <button key={preset.id} onClick={() => setPalletPresetId(preset.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${palletPresetId === preset.id ? "border-sky-400 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <PalletLineIcon active={palletPresetId === preset.id} className="h-9 w-14 shrink-0" />
                        <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{preset.name}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{formattedDimension(preset.lengthIn)} × {formattedDimension(preset.widthIn)}</p></div>
                      </button>
                    ))}
                    <button onClick={() => setPalletPresetId("custom")} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${palletPresetId === "custom" ? "border-sky-400 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <PalletLineIcon active={palletPresetId === "custom"} className="h-9 w-14 shrink-0" />
                      <div><p className="text-xs font-bold text-slate-800">Custom pallet</p>
                      <p className="mt-1 text-[10px] text-slate-500">Enter your exact base and tare</p></div>
                    </button>
                  </div>

                  {palletPresetId === "custom" && (
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4 sm:grid-cols-4">
                      {([
                        ["Length", "lengthIn"],
                        ["Width", "widthIn"],
                        ["Base height", "heightIn"],
                      ] as const).map(([label, field]) => (
                        <div key={field}><Label className="text-[9px] uppercase text-slate-500">{label} ({dimUnit})</Label><Input type="number" min="0" value={displayDimension(customPallet[field])} onChange={(event) => setCustomPallet((previous) => ({ ...previous, [field]: fromDimension(event.target.value) }))} className="mt-1 h-8 text-xs" /></div>
                      ))}
                      <div><Label className="text-[9px] uppercase text-slate-500">Tare ({weightUnit})</Label><Input type="number" min="0" value={displayWeight(customPallet.tareWeightLbs)} onChange={(event) => setCustomPallet((previous) => ({ ...previous, tareWeightLbs: fromWeight(event.target.value) }))} className="mt-1 h-8 text-xs" /></div>
                    </div>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div><Label className="text-[10px] font-semibold text-slate-500">MAX LOADED HEIGHT ({dimUnit})</Label><Input type="number" min="0" value={displayDimension(maxLoadedHeightIn)} onChange={(event) => setMaxLoadedHeightIn(fromDimension(event.target.value))} className="mt-1.5" data-testid="pallet-max-height" /></div>
                    <div><Label className="text-[10px] font-semibold text-slate-500">MAX GROSS WEIGHT ({weightUnit})</Label><Input type="number" min="0" value={displayWeight(maxGrossWeightLbs)} onChange={(event) => setMaxGrossWeightLbs(fromWeight(event.target.value))} className="mt-1.5" data-testid="pallet-max-weight" /></div>
                    <div><Label className="text-[10px] font-semibold text-slate-500">OVERHANG / EDGE ({dimUnit})</Label><Input type="number" min="0" value={displayDimension(overhangIn)} onChange={(event) => setOverhangIn(fromDimension(event.target.value))} className="mt-1.5" data-testid="pallet-overhang" /></div>
                  </div>
                  <button onClick={() => setInterlockLayers((value) => !value)} className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${interlockLayers ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white"}`}>
                    <div><p className="text-xs font-bold text-slate-800">Alternate compatible layer patterns</p><p className="mt-0.5 text-[10px] text-slate-500">Changes row direction between layers when it keeps the same capacity.</p></div>
                    <div className={`relative h-6 w-11 rounded-full transition ${interlockLayers ? "bg-teal-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${interlockLayers ? "left-6" : "left-1"}`} /></div>
                  </button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start" data-testid="pallet-results">
              {currentPallet ? (
                <>
                  <Card className="overflow-hidden border-slate-200 shadow-lg" data-testid="pallet-results-workspace">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-3 sm:p-4">
                        <div className="grid w-full grid-cols-3 gap-1" role="tablist" aria-label="Pallet result views">
                          {([
                            { id: "plan" as const, label: "Build Plan", icon: Box },
                            { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
                            { id: "details" as const, label: "Carton Details", icon: ListChecks },
                          ]).map((tab) => {
                            const Icon = tab.icon;
                            const selected = activeResultTab === tab.id;
                            return <button key={tab.id} type="button" role="tab" aria-selected={selected} onClick={() => setActiveResultTab(tab.id)} className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-semibold whitespace-nowrap transition sm:gap-2 sm:px-3 sm:text-sm ${selected ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`} data-testid={`pallet-result-tab-${tab.id}`}><Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /><span className="truncate">{tab.label}</span></button>;
                          })}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="gap-1.5 px-2 text-xs sm:text-sm" onClick={exportCsv}><FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Placement CSV</Button>
                          <Button variant="outline" size="sm" className="gap-1.5 px-2 text-xs sm:text-sm" disabled={pdfLoading} onClick={exportPdf}>{pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Complete PDF</Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                        <div className="rounded-xl bg-white p-2 text-sky-700 shadow-sm ring-1 ring-slate-200"><PalletLineIcon active className="h-9 w-16" /></div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Pallet {selectedPalletIndex + 1} of {plan.totalPallets}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{selectedPallet.name} · {currentPallet.cartonCount} cartons · {currentPallet.layers.length} layers</p></div>
                        {plan.totalPallets > 1 && <select value={selectedPalletIndex} onChange={(event) => setSelectedPalletIndex(Number(event.target.value))} className="h-9 max-w-28 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold" aria-label="Selected pallet">{plan.pallets.map((_, index) => <option key={index} value={index}>Pallet {index + 1}</option>)}</select>}
                      </div>

                      {activeResultTab === "plan" && <div className="p-4 sm:p-5">
                        <div className="mb-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-600">Calculated placement</p><h2 className="mt-1 text-lg font-bold">3D pallet building preview</h2></div>
                        <PalletPreview3D builtPallet={currentPallet} pallet={selectedPallet} visibleLayer={visibleLayer} />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button onClick={() => setVisibleLayer("all")} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${visibleLayer === "all" ? "border-slate-800 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>Full pallet</button>
                          {currentPallet.layers.map((layer) => <button key={layer.index} onClick={() => setVisibleLayer(layer.index)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${visibleLayer === layer.index ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>Layer {layer.index}</button>)}
                        </div>
                      </div>}

                      {activeResultTab === "overview" && <div className="space-y-4 p-4 sm:p-5">
                        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${currentPallet.stability === "good" && plan.warnings.length === 0 ? "border-emerald-200 bg-emerald-50" : currentPallet.stability === "risk" || plan.warnings.length > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                          {currentPallet.stability === "good" && plan.warnings.length === 0 ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${currentPallet.stability === "risk" || plan.warnings.length > 0 ? "text-red-600" : "text-amber-600"}`} />}
                          <div><p className="text-sm font-bold text-slate-900">{currentPallet.stability === "good" && plan.warnings.length === 0 ? "Plan ready for warehouse review" : "Review this pallet before building"}</p><p className="mt-1 text-xs leading-5 text-slate-600">The geometric plan respects the entered footprint, height, weight, rotation, and stacking rules. Confirm carton strength, pallet rating, wrap, and handling conditions.</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard icon={PackagePlus} label="Pallets required" value={String(plan.totalPallets)} detail={`${plan.averageCartonsPerPallet} cartons average`} tone="sky" />
                          <MetricCard icon={Boxes} label="Cartons planned" value={`${plan.totalCartons}`} detail={`${currentPallet.layers.length} layers on selected pallet`} tone="teal" />
                          <MetricCard icon={Scale} label="Selected gross" value={formattedWeight(currentPallet.grossWeightLbs)} detail={`Limit ${formattedWeight(maxGrossWeightLbs)}`} tone="violet" />
                          <MetricCard icon={Layers3} label="Loaded height" value={formattedDimension(currentPallet.loadedHeightIn)} detail={`${currentPallet.averageLayerUtilizationPct}% average layer use`} tone="amber" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase text-slate-400">Loaded size</p><p className="mt-1 font-bold">{formattedDimension(currentPallet.loadedLengthIn)} × {formattedDimension(currentPallet.loadedWidthIn)}</p></div>
                          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase text-slate-400">Length balance</p><p className="mt-1 font-bold">{currentPallet.centerOfGravity.xPct}%</p></div>
                          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase text-slate-400">Width balance</p><p className="mt-1 font-bold">{currentPallet.centerOfGravity.yPct}%</p></div>
                          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase text-slate-400">Stability check</p><p className={`mt-1 font-bold ${currentPallet.stability === "good" ? "text-teal-600" : currentPallet.stability === "review" ? "text-amber-600" : "text-red-600"}`}>{currentPallet.stability === "good" ? "Good" : currentPallet.stability === "review" ? "Review" : "Risk"}</p></div>
                        </div>
                        {(plan.warnings.length > 0 || plan.recommendations.length > 0) && <div className="space-y-2">{plan.warnings.map((warning) => <div key={warning} className="flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{warning}</div>)}{plan.recommendations.map((recommendation) => <div key={recommendation} className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{recommendation}</div>)}</div>}
                      </div>}

                      {activeResultTab === "details" && <div className="space-y-5 p-4 sm:p-5">
                        <div><h3 className="text-sm font-bold text-slate-900">Carton manifest</h3><p className="mt-1 text-[11px] text-slate-500">Source rows used to calculate every pallet.</p></div>
                        <div className="space-y-2">{activeCartons.filter((carton) => carton.included !== false && carton.quantity > 0).map((carton) => <div key={carton.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs"><span className="h-4 w-4 rounded-md shadow-sm ring-1 ring-black/5" style={{ backgroundColor: carton.color }} /><div className="min-w-0"><p className="truncate font-bold text-slate-800">{carton.name || "Carton"}</p><p className="mt-0.5 text-[10px] text-slate-500">{formattedDimension(carton.lengthIn)} × {formattedDimension(carton.widthIn)} × {formattedDimension(carton.heightIn)} · {formattedWeight(carton.weightLbs)} each</p></div><span className="font-bold text-slate-700">× {carton.quantity}</span></div>)}</div>
                        <div><h3 className="text-sm font-bold text-slate-900">Selected pallet build sequence</h3><div className="mt-3 space-y-2">{currentPallet.layers.map((layer) => <div key={layer.index} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-sky-700 shadow-sm">{layer.index}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{layer.cartonName}</p><p className="mt-0.5 text-[10px] text-slate-500">{layer.placements.length} cartons · {layer.pattern === "rows-lengthwise" ? "Lengthwise rows" : "Crosswise rows"}</p></div><span className="text-[11px] font-bold text-slate-600">{layer.utilizationPct}%</span></div>)}</div></div>
                      </div>}
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-0 bg-slate-950 text-white shadow-xl">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-teal-400" /><h3 className="font-bold">Continue with the finished pallets</h3></div>
                      <p className="mt-2 text-xs leading-5 text-slate-400">Dimensions, gross weight, quantity, and colors will be filled into the next planner automatically.</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Button className="gap-2 bg-sky-500 text-white hover:bg-sky-400" onClick={() => continueToPlanner("container")} data-testid="pallet-to-container"><Box className="h-4 w-4" /> Load into container <ArrowRight className="h-4 w-4" /></Button>
                        <Button variant="outline" className="gap-2 border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" onClick={() => continueToPlanner("truck")} data-testid="pallet-to-truck"><Truck className="h-4 w-4" /> Load into truck <ArrowRight className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-slate-200 shadow-sm"><CardContent className="flex min-h-[430px] flex-col items-center justify-center p-8 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><PackagePlus className="h-8 w-8" /></div><h2 className="mt-5 text-xl font-bold">Enter carton dimensions</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">The optimized pallet count, layers, 3D preview, balance checks, and report will appear automatically.</p></CardContent></Card>
              )}
            </div>
          </div>

          <section className="mx-auto mt-16 max-w-5xl border-t border-slate-200 pt-8">
            <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-slate-900 sm:p-6"><span>How the pallet builder works</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500 transition group-open:rotate-45">+</span></summary>
              <div className="grid gap-8 border-t border-slate-100 p-5 sm:p-6 md:grid-cols-2">
                <p className="text-sm leading-6 text-slate-600">The calculator tests compatible carton rotations and row patterns against the selected pallet footprint. It then creates layers while enforcing the loaded-height and gross-weight limits, keeping non-stackable cargo clear, and centering partial layers where possible.</p>
                <div className="space-y-3">{["Use outside carton dimensions and gross weight per carton.", "Confirm the actual pallet rating and receiving-warehouse limits.", "Treat balance and stability results as planning checks—not a substitute for compression, wrapping, or engineering approval."].map((item) => <div key={item} className="flex gap-2 text-sm text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />{item}</div>)}</div>
              </div>
            </details>
            <div className="mt-9 flex flex-wrap gap-3 text-sm"><Link href="/tools/container-calculator" className="font-semibold text-sky-700 hover:underline">Container Loading Calculator</Link><span className="text-slate-300">·</span><Link href="/tools/truck-load-planner" className="font-semibold text-sky-700 hover:underline">Truck Load Planner</Link><span className="text-slate-300">·</span><Link href="/tools" className="font-semibold text-sky-700 hover:underline">All free tools</Link></div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
