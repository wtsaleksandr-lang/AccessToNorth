import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  Plus,
  Trash2,
  Package,
  Weight,
  Ruler,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  Settings2,
  FileUp,
  FileSpreadsheet,
  FileImage,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  Table,
  Truck,
  ArrowRight,
  ArrowLeft,
  Box,
  Layers,
  CircleDot,
  Star,
  MapPin,
  Navigation,
  Clock,
  Route,
  Flag,
  Download,
  Play,
  ExternalLink,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { consumePalletPlanTransfer } from "@/lib/palletTransfer";
import { buildTruckSpatialPlan, createTruckPackingItems, type TruckSpatialPlan } from "@/lib/truckPacking";
import { buildTruckPlacementCsv } from "@/lib/loadingPlanExports";
import { TruckLoadPreview3D } from "./truck-planner/TruckLoadPreview3D";
import { TrailerTypeIcon } from "./truck-planner/TrailerTypeIcon";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { evaluateOpenDeckEnvelope, getTruckJurisdictionGuidance } from "@shared/truckCompliance";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

let googleMapsLoaderPromise: Promise<void> | null = null;
let optionsSet = false;
function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaderPromise) return googleMapsLoaderPromise;
  if (!optionsSet) {
    setOptions({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });
    optionsSet = true;
  }
  googleMapsLoaderPromise = Promise.all([
    importLibrary("maps"),
    importLibrary("places"),
    importLibrary("geometry"),
  ]).then(() => {});
  return googleMapsLoaderPromise;
}

interface Jurisdiction {
  name: string;
  country: string;
  code: string;
}

const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

const CA_PROVINCES: Record<string, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
};

const IN_TO_CM = 2.54;
const CM_TO_IN = 1 / IN_TO_CM;
const LB_TO_KG = 0.453592;
const KG_TO_LB = 1 / LB_TO_KG;
const CUFT_TO_CUM = 0.0283168;
const SQFT_TO_SQM = 0.092903;

const TRUCK_CARGO_COLORS = ["#0f766e", "#2563eb", "#b45309", "#7c3aed", "#be123c", "#0e7490", "#475569", "#c2410c"];

type UnitSystem = "metric" | "imperial";
type CargoMode = "cartons" | "pallets" | "bulk";
type PlannerMode = "pro" | "beginner";
type ResultTab = "plan" | "overview" | "details";
type PackagingType = "loose" | "bags" | "drums" | "other";
type RotationMode = "all" | "horizontal" | "fixed";

interface TrailerSpec {
  id: string;
  name: string;
  category: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  maxPayloadLbs: number;
  hasDeck: boolean;
  deckHeightIn?: number;
}

const TRAILER_PRESETS: TrailerSpec[] = [
  { id: "dryvan53", name: "Dry Van 53'", category: "Dry Van", lengthIn: 636, widthIn: 100.5, heightIn: 110, maxPayloadLbs: 44000, hasDeck: false },
  { id: "dryvan48", name: "Dry Van 48'", category: "Dry Van", lengthIn: 576, widthIn: 100.5, heightIn: 110, maxPayloadLbs: 44000, hasDeck: false },
  { id: "reefer53", name: "Reefer 53'", category: "Reefer", lengthIn: 630, widthIn: 98, heightIn: 106, maxPayloadLbs: 42500, hasDeck: false },
  { id: "reefer48", name: "Reefer 48'", category: "Reefer", lengthIn: 570, widthIn: 98, heightIn: 106, maxPayloadLbs: 42500, hasDeck: false },
  { id: "curtain53", name: "Curtain Side 53'", category: "Curtain Side", lengthIn: 636, widthIn: 100.5, heightIn: 110, maxPayloadLbs: 44000, hasDeck: false },
  { id: "curtain48", name: "Curtain Side 48'", category: "Curtain Side", lengthIn: 576, widthIn: 100.5, heightIn: 110, maxPayloadLbs: 44000, hasDeck: false },
  { id: "flatbed53", name: "Flatbed 53'", category: "Flatbed", lengthIn: 636, widthIn: 102, heightIn: 102, maxPayloadLbs: 48000, hasDeck: true, deckHeightIn: 60 },
  { id: "flatbed48", name: "Flatbed 48'", category: "Flatbed", lengthIn: 576, widthIn: 102, heightIn: 102, maxPayloadLbs: 48000, hasDeck: true, deckHeightIn: 60 },
  { id: "stepdeck53", name: "Step Deck 53'", category: "Step Deck", lengthIn: 636, widthIn: 102, heightIn: 120, maxPayloadLbs: 48000, hasDeck: true, deckHeightIn: 48 },
  { id: "stepdeck48", name: "Step Deck 48'", category: "Step Deck", lengthIn: 576, widthIn: 102, heightIn: 120, maxPayloadLbs: 48000, hasDeck: true, deckHeightIn: 48 },
  { id: "rgn", name: "RGN / Lowboy", category: "RGN / Lowboy", lengthIn: 348, widthIn: 102, heightIn: 144, maxPayloadLbs: 80000, hasDeck: true, deckHeightIn: 24 },
];

const PALLET_TYPES: Record<string, { l: number; w: number; label: string }> = {
  "48x40": { l: 48, w: 40, label: '48" × 40" (Standard US)' },
  "48x48": { l: 48, w: 48, label: '48" × 48" (Square)' },
  euro: { l: 47.24, w: 31.5, label: "Euro (1200 × 800mm)" },
  custom: { l: 0, w: 0, label: "Custom Size" },
};

interface CartonItem {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightLbs: number;
  quantity: number;
  stackable: boolean;
  maxStackHeight: number;
  rotation: RotationMode;
  priority: number;
  palletAssign: string;
  color: string;
}

interface PalletItem {
  id: string;
  name: string;
  palletType: string;
  customL: number;
  customW: number;
  heightIn: number;
  weightLbs: number;
  quantity: number;
  stackable: boolean;
  rotation: RotationMode;
  priority: number;
  color: string;
}

interface BulkCargo {
  totalWeightLbs: number;
  totalVolumeCuFt: number;
  packagingType: PackagingType;
  description: string;
}

let _idCounter = 0;
function genId() {
  return `tlp_${Date.now()}_${++_idCounter}`;
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function UtilBar({ pct, label, color }: { pct: number; label: string; color: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div data-testid={`utilbar-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-600 font-medium">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{clamped.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

interface CalcResult {
  trailer: TrailerSpec;
  totalWeightLbs: number;
  totalVolumeCuFt: number;
  maxPayloadLbs: number;
  trailerVolumeCuFt: number;
  trailerFloorAreaSqFt: number;
  volumeUtil: number;
  weightUtil: number;
  fits: boolean;
  oversizeWarnings: string[];
  overweightWarning: boolean;
  recommendations: string[];
  score: number;
  spatialPlan: TruckSpatialPlan | null;
  trailersRequired: number;
  piecesLoaded: number;
  piecesTotal: number;
}

export default function TruckLoadPlanner() {
  usePageMeta({
    title: "Free Truck Load Planner & Trailer Calculator | AccessToNorth.com",
    description: "Free spatial truck load planner with smart trailer matching, collision-aware cargo placement, 3D loading plans, balance guidance, and PDF reports.",
    canonical: "/tools/truck-load-planner",
  });

  const { toast } = useToast();

  const [mode, setMode] = useState<PlannerMode>("pro");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [cargoMode, setCargoMode] = useState<CargoMode>("cartons");

  const isMetric = unitSystem === "metric";
  const dimUnit = isMetric ? "cm" : "in";
  const weightUnit = isMetric ? "kg" : "lbs";
  const dimFactor = isMetric ? IN_TO_CM : 1;
  const weightFactor = isMetric ? LB_TO_KG : 1;

  const toDisplay = useCallback((inches: number) => {
    const val = isMetric ? inches * IN_TO_CM : inches;
    return val ? parseFloat(val.toFixed(1)).toString() : "";
  }, [isMetric]);

  const fromDisplay = useCallback((val: string) => {
    const v = parseFloat(val) || 0;
    return isMetric ? v * CM_TO_IN : v;
  }, [isMetric]);

  const toDisplayWeight = useCallback((lbs: number) => {
    const val = isMetric ? lbs * LB_TO_KG : lbs;
    return val ? parseFloat(val.toFixed(1)).toString() : "";
  }, [isMetric]);

  const fromDisplayWeight = useCallback((val: string) => {
    const v = parseFloat(val) || 0;
    return isMetric ? v * KG_TO_LB : v;
  }, [isMetric]);

  const toDisplayVolume = useCallback((cuFt: number) => {
    return isMetric ? cuFt * CUFT_TO_CUM : cuFt;
  }, [isMetric]);

  const volUnit = isMetric ? "m³" : "ft³";
  const areaUnit = isMetric ? "m²" : "ft²";

  const [bulkSettingsOpen, setBulkSettingsOpen] = useState(false);
  const [defaultStacking, setDefaultStacking] = useState<boolean>(true);
  const [defaultRotation, setDefaultRotation] = useState<RotationMode>("all");

  const defaultCarton = useCallback((colorIndex = 0): CartonItem => ({
    id: genId(), name: "", lengthIn: 0, widthIn: 0, heightIn: 0, weightLbs: 0, quantity: 1, stackable: defaultStacking, maxStackHeight: 0, rotation: defaultRotation, priority: 0, palletAssign: "none", color: TRUCK_CARGO_COLORS[colorIndex % TRUCK_CARGO_COLORS.length],
  }), [defaultStacking, defaultRotation]);

  const defaultPallet = useCallback((colorIndex = 0): PalletItem => ({
    id: genId(), name: "", palletType: "48x40", customL: 48, customW: 40, heightIn: 0, weightLbs: 0, quantity: 1, stackable: defaultStacking, rotation: defaultRotation, priority: 0, color: TRUCK_CARGO_COLORS[colorIndex % TRUCK_CARGO_COLORS.length],
  }), [defaultStacking, defaultRotation]);

  const [cartons, setCartons] = useState<CartonItem[]>([defaultCarton(0), defaultCarton(1)]);
  const [pallets, setPallets] = useState<PalletItem[]>([defaultPallet(0)]);
  const [bulk, setBulk] = useState<BulkCargo>({ totalWeightLbs: 0, totalVolumeCuFt: 0, packagingType: "loose", description: "" });

  const [selectedTrailerId, setSelectedTrailerId] = useState("dryvan53");
  const [customTrailer, setCustomTrailer] = useState<TrailerSpec>({
    id: "custom", name: "Custom Trailer", category: "Custom", lengthIn: 636, widthIn: 100.5, heightIn: 110, maxPayloadLbs: 44000, hasDeck: false,
  });
  const [useCustomTrailer, setUseCustomTrailer] = useState(false);

  const [results, setResults] = useState<CalcResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importRawHeaders, setImportRawHeaders] = useState<string[]>([]);
  const [importRawRows, setImportRawRows] = useState<Record<string, string>[]>([]);
  const [importColMap, setImportColMap] = useState<Record<string, string>>({ name: "", length: "", width: "", height: "", weight: "", quantity: "" });
  const [importItems, setImportItems] = useState<Array<{ name: string; length: number; width: number; height: number; weight: number; quantity: number; stackable?: boolean; rotationMode?: RotationMode; include: boolean }>>([]);
  const [importUnits, setImportUnits] = useState<UnitSystem>("imperial");
  const [dragOver, setDragOver] = useState(false);
  const [previewResultIndex, setPreviewResultIndex] = useState(0);
  const [previewTrailerIndex, setPreviewTrailerIndex] = useState(0);
  const [visibleLoadingSteps, setVisibleLoadingSteps] = useState<number | "all">("all");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("plan");

  useEffect(() => {
    if (typeof window === "undefined" || new URLSearchParams(window.location.search).get("from") !== "pallet-builder") return;
    const transfer = consumePalletPlanTransfer();
    if (!transfer) return;
    setPallets(transfer.rows.map((row) => ({
      id: genId(),
      name: row.name,
      palletType: "custom",
      customL: row.lengthIn,
      customW: row.widthIn,
      heightIn: row.heightIn,
      weightLbs: row.grossWeightLbs,
      quantity: row.quantity,
      stackable: false,
      rotation: "horizontal",
      priority: 0,
      color: row.color,
    })));
    setCargoMode("pallets");
    setUnitSystem("imperial");
    setResults(null);
    setShowResults(false);
    toast({
      title: `${transfer.rows.reduce((sum, row) => sum + row.quantity, 0)} built pallet${transfer.rows.reduce((sum, row) => sum + row.quantity, 0) === 1 ? "" : "s"} filled in`,
      description: "The pallet dimensions and gross weights are ready for trailer matching.",
    });
  }, [toast]);

  const packingItems = useMemo(() => cargoMode === "bulk" ? [] : createTruckPackingItems({
    cargoMode,
    cartons,
    pallets,
  }), [cargoMode, cartons, pallets]);

  const activeTrailer = useMemo(() => {
    if (mode === "pro") {
      return useCustomTrailer ? customTrailer : TRAILER_PRESETS.find(t => t.id === selectedTrailerId) || TRAILER_PRESETS[0];
    }
    return null;
  }, [mode, useCustomTrailer, customTrailer, selectedTrailerId]);

  const computeCargoTotals = useCallback(() => {
    let totalWeightLbs = 0;
    let totalVolumeCuFt = 0;
    let maxDimIn = { l: 0, w: 0, h: 0 };

    if (cargoMode !== "bulk") {
      packingItems.forEach(item => {
        if (item.length > 0 && item.width > 0 && item.height > 0) {
          totalVolumeCuFt += (item.length * item.width * item.height * item.quantity) / 1728;
          totalWeightLbs += item.weight;
          maxDimIn.l = Math.max(maxDimIn.l, item.length);
          maxDimIn.w = Math.max(maxDimIn.w, item.width);
          maxDimIn.h = Math.max(maxDimIn.h, item.height);
        }
      });
    } else {
      totalWeightLbs = bulk.totalWeightLbs;
      totalVolumeCuFt = bulk.totalVolumeCuFt;
    }

    return { totalWeightLbs, totalVolumeCuFt, maxDimIn };
  }, [cargoMode, packingItems, bulk]);

  const evaluateTrailer = useCallback((trailer: TrailerSpec, cargo: { totalWeightLbs: number; totalVolumeCuFt: number; maxDimIn: { l: number; w: number; h: number } }): CalcResult => {
    const trailerVolCuFt = (trailer.lengthIn * trailer.widthIn * trailer.heightIn) / 1728;
    const trailerFloorSqFt = (trailer.lengthIn * trailer.widthIn) / 144;
    const spatialPlan = cargoMode === "bulk" ? null : buildTruckSpatialPlan(packingItems, trailer);
    const volumeUtil = spatialPlan
      ? spatialPlan.averageVolumeUtilPct
      : trailerVolCuFt > 0 ? (cargo.totalVolumeCuFt / trailerVolCuFt) * 100 : 0;
    const weightUtil = spatialPlan
      ? spatialPlan.averageWeightUtilPct
      : trailer.maxPayloadLbs > 0 ? (cargo.totalWeightLbs / trailer.maxPayloadLbs) * 100 : 0;

    const placedCargoHeightIn = spatialPlan
      ? Math.max(cargo.maxDimIn.h, ...spatialPlan.multi.containers.flatMap((entry) => entry.result.placed.map((box) => box.y + box.h)))
      : cargo.maxDimIn.h;
    const roadEnvelope = evaluateOpenDeckEnvelope({
      trailerCategory: trailer.category,
      trailerWidthIn: trailer.widthIn,
      deckHeightIn: trailer.deckHeightIn,
      cargoWidthIn: cargo.maxDimIn.w,
      cargoHeightIn: placedCargoHeightIn,
    });
    const oversizeWarnings: string[] = [...roadEnvelope.screeningWarnings];
    if (cargo.maxDimIn.l > trailer.lengthIn) oversizeWarnings.push(`Cargo length exceeds trailer length`);
    if (cargo.maxDimIn.w > trailer.widthIn) oversizeWarnings.push(`Cargo width exceeds trailer width`);
    if (cargo.maxDimIn.h > trailer.heightIn) oversizeWarnings.push(`Cargo height exceeds trailer height`);

    const overweightWarning = spatialPlan
      ? !spatialPlan.complete && cargo.totalWeightLbs > trailer.maxPayloadLbs
      : cargo.totalWeightLbs > trailer.maxPayloadLbs;
    const volumeFits = cargo.totalVolumeCuFt <= trailerVolCuFt;
    const fits = spatialPlan
      ? spatialPlan.complete && oversizeWarnings.length === 0
      : volumeFits && !overweightWarning && oversizeWarnings.length === 0;

    const recommendations: string[] = [];
    if (overweightWarning) {
      const excess = cargo.totalWeightLbs - trailer.maxPayloadLbs;
      recommendations.push(`Reduce weight by ${(excess * weightFactor).toFixed(0)} ${weightUnit} or use a higher-capacity trailer`);
    }
    if (!spatialPlan && !volumeFits) {
      recommendations.push("Reduce cargo volume or switch to a larger trailer");
    }
    if (spatialPlan?.complete && spatialPlan.trailersRequired > 1) {
      recommendations.push(`The spatial plan requires ${spatialPlan.trailersRequired} × ${trailer.name} trailers.`);
    }
    if (spatialPlan && !spatialPlan.complete) {
      recommendations.push(`${spatialPlan.piecesLoaded} of ${spatialPlan.piecesTotal} pieces could be placed. Review individual dimensions or select different equipment.`);
    }
    if (oversizeWarnings.length > 0 && !overweightWarning && volumeFits) {
      recommendations.push(roadEnvelope.isOpenDeck
        ? "Confirm the complete vehicle, axle weights, route clearances, and permits before dispatch"
        : "Consider a flatbed or step deck, then verify loaded road dimensions and permits");
    }

    const completionRatio = spatialPlan && spatialPlan.piecesTotal > 0 ? spatialPlan.piecesLoaded / spatialPlan.piecesTotal : fits ? 1 : 0;
    const fitScore = fits ? 100000 : completionRatio * 50000;
    const trailerCountPenalty = (spatialPlan?.trailersRequired || 1) * 1000;
    const utilScore = Math.max(0, 100 - Math.abs(volumeUtil - 85));
    const score = fitScore - trailerCountPenalty + utilScore;

    return {
      trailer,
      totalWeightLbs: cargo.totalWeightLbs,
      totalVolumeCuFt: cargo.totalVolumeCuFt,
      maxPayloadLbs: trailer.maxPayloadLbs,
      trailerVolumeCuFt: trailerVolCuFt,
      trailerFloorAreaSqFt: trailerFloorSqFt,
      volumeUtil,
      weightUtil,
      fits,
      oversizeWarnings,
      overweightWarning,
      recommendations,
      score,
      spatialPlan,
      trailersRequired: spatialPlan?.trailersRequired || 1,
      piecesLoaded: spatialPlan?.piecesLoaded || 0,
      piecesTotal: spatialPlan?.piecesTotal || 0,
    };
  }, [cargoMode, dimFactor, dimUnit, packingItems, weightFactor, weightUnit]);

  const calculate = useCallback(() => {
    const cargo = computeCargoTotals();
    if (cargo.totalVolumeCuFt <= 0 && cargo.totalWeightLbs <= 0) {
      toast({ title: "No cargo entered", description: "Please add cargo dimensions and weight before calculating.", variant: "destructive" });
      return;
    }

    if (mode === "pro" && activeTrailer) {
      const result = evaluateTrailer(activeTrailer, cargo);
      setResults([result]);
    } else {
      const allResults = TRAILER_PRESETS.map(t => evaluateTrailer(t, cargo));
      allResults.sort((a, b) => b.score - a.score);
      setResults(allResults.slice(0, 3));
    }
    setShowResults(true);
    setPreviewResultIndex(0);
    setPreviewTrailerIndex(0);
    setVisibleLoadingSteps("all");
  }, [mode, activeTrailer, computeCargoTotals, evaluateTrailer, toast]);

  const updateCarton = useCallback((id: string, field: keyof CartonItem, value: any) => {
    setCartons(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const updatePallet = useCallback((id: string, field: keyof PalletItem, value: any) => {
    setPallets(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const autoDetectColumns = useCallback((headers: string[]): Record<string, string> => {
    const lc = headers.map(h => h.toLowerCase().trim());
    const find = (keywords: string[]) => {
      const idx = lc.findIndex(h => keywords.some(k => h.includes(k)));
      return idx >= 0 ? headers[idx] : "";
    };
    return {
      name: find(["name", "item", "description", "product", "desc"]),
      length: find(["length", "len"]),
      width: find(["width", "wid"]),
      height: find(["height", "hgt", "ht"]),
      weight: find(["weight", "wt", "wgt", "mass"]),
      quantity: find(["quantity", "qty", "count", "units", "pcs"]),
    };
  }, []);

  const parseSpreadsheetToRows = useCallback((headers: string[], rows: Record<string, string>[]) => {
    setImportRawHeaders(headers);
    setImportRawRows(rows);
    setImportColMap(autoDetectColumns(headers));
    setImportStep("mapping");
    setImportLoading(false);
  }, [autoDetectColumns]);

  const handleImportFile = useCallback(async (file: File) => {
    setImportError(null);
    setImportLoading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (!result.data.length || !result.meta.fields?.length) {
            setImportError("No data found in CSV file.");
            setImportLoading(false);
            return;
          }
          parseSpreadsheetToRows(result.meta.fields, result.data as Record<string, string>[]);
        },
        error: () => { setImportError("Failed to parse CSV file."); setImportLoading(false); },
      });
    } else if (["xlsx", "xls"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
          if (!json.length) { setImportError("No data found in Excel file."); setImportLoading(false); return; }
          const headers = Object.keys(json[0]);
          parseSpreadsheetToRows(headers, json.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)]))));
        } catch { setImportError("Failed to parse Excel file."); setImportLoading(false); }
      };
      reader.readAsArrayBuffer(file);
    } else if (["pdf", "doc", "docx", "rtf", "odt", "ppt", "pptx", "txt", "text", "md", "json", "xml", "html", "htm", "eml", "jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const resp = await fetch("/api/cargo/extract", { method: "POST", body: formData });
        if (!resp.ok) throw new Error("Extraction failed");
        const data = await resp.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          setImportUnits(data.units === "metric" ? "metric" : "imperial");
          setImportItems(data.items.map((item: any) => {
            const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
            return {
              name: String(item.name || "").substring(0, 100),
              length: Math.max(0, Number(item.length) || 0),
              width: Math.max(0, Number(item.width) || 0),
              height: Math.max(0, Number(item.height) || 0),
              weight: Math.max(0, Number(item.weight) || 0) / quantity,
              quantity,
              stackable: item.stackable === true,
              rotationMode: ["all", "horizontal", "fixed"].includes(item.rotationMode) ? item.rotationMode : "horizontal",
              include: true,
            };
          }));
          setImportStep("preview");
          setImportLoading(false);
        } else { setImportError("Could not extract cargo data from this file."); setImportLoading(false); }
      } catch { setImportError("AI extraction failed. Try a CSV or Excel file instead."); setImportLoading(false); }
    } else {
      setImportError("Unsupported file type. Use a common spreadsheet, PDF, office document, email, text, or image file.");
      setImportLoading(false);
    }
  }, [parseSpreadsheetToRows]);

  const applyColumnMapping = useCallback(() => {
    const { name: nKey, length: lKey, width: wKey, height: hKey, weight: wtKey, quantity: qKey } = importColMap;
    if (!lKey && !wKey && !hKey) {
      setImportError("Please map at least one dimension column.");
      return;
    }
    const weightHeader = wtKey.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const weightIsTotal = /(^| )(total|gross|row weight)( |$)/.test(weightHeader);
    const items = importRawRows
      .map(r => {
        const quantity = Math.max(1, Math.round(parseFloat(qKey ? r[qKey] : "") || 1));
        const rawWeight = Math.max(0, parseFloat(wtKey ? r[wtKey] : "") || 0);
        return {
          name: nKey ? String(r[nKey] || "").substring(0, 100) : "",
          length: Math.max(0, parseFloat(lKey ? r[lKey] : "") || 0),
          width: Math.max(0, parseFloat(wKey ? r[wKey] : "") || 0),
          height: Math.max(0, parseFloat(hKey ? r[hKey] : "") || 0),
          weight: weightIsTotal ? rawWeight / quantity : rawWeight,
          quantity,
          stackable: defaultStacking,
          rotationMode: defaultRotation,
          include: true,
        };
      })
      .filter(i => i.length > 0 || i.width > 0 || i.height > 0);
    if (!items.length) {
      setImportError("No valid data found with the selected mapping.");
      return;
    }
    setImportError(null);
    setImportItems(items);
    setImportStep("preview");
  }, [defaultRotation, defaultStacking, importColMap, importRawRows]);

  const confirmImport = useCallback(() => {
    const toAdd = importItems.filter(i => i.include && (i.length > 0 || i.width > 0 || i.height > 0));
    if (!toAdd.length) return;
    const isImportMetric = importUnits === "metric";

    if (cargoMode === "cartons") {
      const newItems: CartonItem[] = toAdd.map((item, index) => ({
        id: genId(),
        name: item.name,
        lengthIn: isImportMetric ? item.length * CM_TO_IN : item.length,
        widthIn: isImportMetric ? item.width * CM_TO_IN : item.width,
        heightIn: isImportMetric ? item.height * CM_TO_IN : item.height,
        weightLbs: isImportMetric ? item.weight * KG_TO_LB : item.weight,
        quantity: item.quantity,
        stackable: item.stackable ?? defaultStacking,
        maxStackHeight: 0,
        rotation: item.rotationMode || defaultRotation,
        priority: 0,
        palletAssign: "none",
        color: TRUCK_CARGO_COLORS[(cartons.length + index) % TRUCK_CARGO_COLORS.length],
      }));
      setCartons(prev => prev.some(item => item.lengthIn > 0 || item.widthIn > 0 || item.heightIn > 0 || item.weightLbs > 0 || item.name.trim()) ? [...prev, ...newItems] : newItems);
    } else if (cargoMode === "pallets") {
      const newItems: PalletItem[] = toAdd.map((item, index) => ({
        id: genId(),
        name: item.name,
        palletType: "custom",
        customL: isImportMetric ? item.length * CM_TO_IN : item.length,
        customW: isImportMetric ? item.width * CM_TO_IN : item.width,
        heightIn: isImportMetric ? item.height * CM_TO_IN : item.height,
        weightLbs: isImportMetric ? item.weight * KG_TO_LB : item.weight,
        quantity: item.quantity,
        stackable: item.stackable ?? defaultStacking,
        rotation: item.rotationMode || defaultRotation,
        priority: 0,
        color: TRUCK_CARGO_COLORS[(pallets.length + index) % TRUCK_CARGO_COLORS.length],
      }));
      setPallets(prev => prev.some(item => item.heightIn > 0 || item.weightLbs > 0 || item.name.trim()) ? [...prev, ...newItems] : newItems);
    }

    setShowImportModal(false);
    toast({ title: `${toAdd.length} item${toAdd.length > 1 ? "s" : ""} imported`, description: "The extracted dimensions, weight, quantity, and names are filled into your cargo rows." });
  }, [importItems, importUnits, cargoMode, toast, cartons.length, pallets.length, defaultRotation, defaultStacking]);

  const openImportModal = useCallback(() => {
    setImportStep("upload");
    setImportError(null);
    setImportLoading(false);
    setImportItems([]);
    setImportUnits(unitSystem);
    setDragOver(false);
    setImportRawHeaders([]);
    setImportRawRows([]);
    setImportColMap({ name: "", length: "", width: "", height: "", weight: "", quantity: "" });
    setShowImportModal(true);
  }, [unitSystem]);

  const downloadSampleCSV = useCallback(() => {
    const csvContent = `Name,Length,Width,Height,Weight Each,Quantity\nCardboard Box A,24,18,12,15,10\nPallet Load B,48,40,36,250,4\nSmall Carton C,12,10,8,5,25`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "truck-cargo-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleReset = useCallback(() => {
    setResults(null);
    setShowResults(false);
    setCartons([defaultCarton(0), defaultCarton(1)]);
    setPallets([defaultPallet(0)]);
    setBulk({ totalWeightLbs: 0, totalVolumeCuFt: 0, packagingType: "loose", description: "" });
  }, [defaultCarton, defaultPallet]);

  // ─── Route Planner State ────────────────────────────────────────────
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originPlace, setOriginPlace] = useState<{ lat: number; lng: number; formatted: string } | null>(null);
  const [destPlace, setDestPlace] = useState<{ lat: number; lng: number; formatted: string } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceText: string; durationText: string; distanceMeters: number; durationSeconds: number } | null>(null);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [gmapsReady, setGmapsReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const originAutocompleteRef = useRef<any>(null);
  const destAutocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    loadGoogleMaps().then(() => {
      setGmapsReady(true);
    }).catch(() => {
      setRouteError("Failed to load Google Maps. Please check API key.");
    });
  }, []);

  useEffect(() => {
    if (!gmapsReady || !originInputRef.current || originAutocompleteRef.current) return;
    const g = (window as any).google;
    if (!g?.maps?.places) return;

    originAutocompleteRef.current = new g.maps.places.Autocomplete(originInputRef.current, {
      types: ["geocode"],
      fields: ["geometry", "formatted_address"],
    });
    originAutocompleteRef.current.addListener("place_changed", () => {
      const place = originAutocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const loc = place.geometry.location;
        setOriginPlace({ lat: loc.lat(), lng: loc.lng(), formatted: place.formatted_address || "" });
        setOriginText(place.formatted_address || "");
      }
    });
  }, [gmapsReady]);

  useEffect(() => {
    if (!gmapsReady || !destInputRef.current || destAutocompleteRef.current) return;
    const g = (window as any).google;
    if (!g?.maps?.places) return;

    destAutocompleteRef.current = new g.maps.places.Autocomplete(destInputRef.current, {
      types: ["geocode"],
      fields: ["geometry", "formatted_address"],
    });
    destAutocompleteRef.current.addListener("place_changed", () => {
      const place = destAutocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const loc = place.geometry.location;
        setDestPlace({ lat: loc.lat(), lng: loc.lng(), formatted: place.formatted_address || "" });
        setDestText(place.formatted_address || "");
      }
    });
  }, [gmapsReady]);

  const extractJurisdictionsFromRoute = useCallback(async (route: any) => {
    const g = (window as any).google;
    if (!g?.maps?.Geocoder) return [];

    const geocoder = new g.maps.Geocoder();
    const path = g.maps.geometry.encoding.decodePath(route.overview_polyline);

    const sampleCount = Math.min(path.length, 30);
    const step = Math.max(1, Math.floor(path.length / sampleCount));
    const sampled: { lat: number; lng: number }[] = [];
    for (let i = 0; i < path.length; i += step) {
      sampled.push({ lat: path[i].lat(), lng: path[i].lng() });
    }
    if (sampled.length > 0 && path.length > 1) {
      const last = path[path.length - 1];
      sampled.push({ lat: last.lat(), lng: last.lng() });
    }

    const orderedJurisdictions: Jurisdiction[] = [];
    const seen = new Set<string>();

    const batchSize = 5;
    for (let b = 0; b < sampled.length; b += batchSize) {
      const batch = sampled.slice(b, b + batchSize);
      const promises = batch.map(pt =>
        new Promise<Jurisdiction | null>((resolve) => {
          geocoder.geocode({ location: pt }, (results: any[], status: string) => {
            if (status === "OK" && results?.[0]) {
              const components = results[0].address_components || [];
              let stateCode = "";
              let stateName = "";
              let countryCode = "";
              for (const comp of components) {
                if (comp.types.includes("administrative_area_level_1")) {
                  stateCode = comp.short_name;
                  stateName = comp.long_name;
                }
                if (comp.types.includes("country")) {
                  countryCode = comp.short_name;
                }
              }
              if (stateCode && countryCode) {
                resolve({
                  name: stateName,
                  country: countryCode === "US" ? "United States" : countryCode === "CA" ? "Canada" : countryCode,
                  code: stateCode,
                });
              } else {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        })
      );
      const batchResults = await Promise.all(promises);
      for (const jr of batchResults) {
        if (jr && !seen.has(jr.code)) {
          seen.add(jr.code);
          orderedJurisdictions.push(jr);
        }
      }
    }

    return orderedJurisdictions;
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!originPlace || !destPlace) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    setRouteLoading(true);
    setRouteError(null);
    setJurisdictions([]);
    setRouteInfo(null);

    try {
      if (!mapInstanceRef.current && mapContainerRef.current) {
        mapInstanceRef.current = new g.maps.Map(mapContainerRef.current, {
          center: { lat: 43, lng: -90 },
          zoom: 4,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new g.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: { strokeColor: "#3b82f6", strokeWeight: 5 },
        });
        directionsRendererRef.current.setMap(mapInstanceRef.current);
      }

      const directionsService = new g.maps.DirectionsService();
      const result = await directionsService.route({
        origin: { lat: originPlace.lat, lng: originPlace.lng },
        destination: { lat: destPlace.lat, lng: destPlace.lng },
        travelMode: g.maps.TravelMode.DRIVING,
      });

      directionsRendererRef.current.setDirections(result);

      const leg = result.routes[0].legs[0];
      setRouteInfo({
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        distanceMeters: leg.distance.value,
        durationSeconds: leg.duration.value,
      });

      const jurs = await extractJurisdictionsFromRoute(result.routes[0]);
      setJurisdictions(jurs);
    } catch (err: any) {
      setRouteError(err?.message || "Failed to calculate route. Please check your addresses.");
    } finally {
      setRouteLoading(false);
    }
  }, [originPlace, destPlace, extractJurisdictionsFromRoute]);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number; formatted: string } | null> => {
    const g = (window as any).google;
    if (!g?.maps?.Geocoder || !address.trim()) return null;
    const geocoder = new g.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === "OK" && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng(), formatted: results[0].formatted_address || address });
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  const handleCalculateRoute = useCallback(async () => {
    let origin = originPlace;
    let dest = destPlace;

    if (!origin && originText.trim()) {
      origin = await geocodeAddress(originText);
      if (origin) setOriginPlace(origin);
    }
    if (!dest && destText.trim()) {
      dest = await geocodeAddress(destText);
      if (dest) setDestPlace(dest);
    }

    if (!origin || !dest) {
      setRouteError("Please enter valid origin and destination addresses.");
      return;
    }

    const g = (window as any).google;
    if (!g?.maps) return;

    setRouteLoading(true);
    setRouteError(null);
    setJurisdictions([]);
    setRouteInfo(null);

    try {
      if (!mapInstanceRef.current && mapContainerRef.current) {
        mapInstanceRef.current = new g.maps.Map(mapContainerRef.current, {
          center: { lat: 43, lng: -90 },
          zoom: 4,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new g.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: { strokeColor: "#3b82f6", strokeWeight: 5 },
        });
        directionsRendererRef.current.setMap(mapInstanceRef.current);
      }

      const directionsService = new g.maps.DirectionsService();
      const result = await directionsService.route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        travelMode: g.maps.TravelMode.DRIVING,
      });

      directionsRendererRef.current.setDirections(result);

      const leg = result.routes[0].legs[0];
      setRouteInfo({
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        distanceMeters: leg.distance.value,
        durationSeconds: leg.duration.value,
      });

      const jurs = await extractJurisdictionsFromRoute(result.routes[0]);
      setJurisdictions(jurs);
    } catch (err: any) {
      setRouteError(err?.message || "Failed to calculate route. Please check your addresses.");
    } finally {
      setRouteLoading(false);
    }
  }, [originPlace, destPlace, originText, destText, geocodeAddress, extractJurisdictionsFromRoute]);

  useEffect(() => {
    if (originPlace && destPlace) {
      calculateRoute();
    }
  }, [originPlace, destPlace, calculateRoute]);

  const previewResult = results?.[previewResultIndex] || results?.[0] || null;
  const previewPlan = previewResult?.spatialPlan || null;
  const previewEntry = previewPlan?.multi.containers[previewTrailerIndex] || null;
  const previewBalance = previewPlan?.balances[previewTrailerIndex] || null;
  const previewSequence = previewPlan?.loadingSequences[previewTrailerIndex] || [];
  const currentLoadingStep = visibleLoadingSteps === "all" ? null : previewSequence[Math.max(0, visibleLoadingSteps - 1)] || null;

  const handleSelectPreview = useCallback((resultIndex: number) => {
    setPreviewResultIndex(resultIndex);
    setPreviewTrailerIndex(0);
    setVisibleLoadingSteps("all");
    setActiveResultTab("plan");
  }, []);

  const handleSelectPreviewTrailer = useCallback((trailerIndex: number) => {
    setPreviewTrailerIndex(trailerIndex);
    setVisibleLoadingSteps("all");
  }, []);

  const handleExportLoadingPdf = useCallback(async () => {
    if (!previewPlan) return;
    setPdfLoading(true);
    try {
      const { generateTruckLoadingReportBlob } = await import("@/lib/truckPdf");
      const { loadAccessToNorthLogoDataUrl } = await import("@/lib/loadingReportPdfBrand");
      const cargoRows = packingItems.map(item => ({
        name: item.name,
        dimensionsIn: [item.length, item.width, item.height] as [number, number, number],
        weightEachLbs: item.quantity > 0 ? item.weight / item.quantity : item.weight,
        quantity: item.quantity,
      }));
      const logoDataUrl = await loadAccessToNorthLogoDataUrl();
      const blob = await generateTruckLoadingReportBlob({ plan: previewPlan, cargoRows, unitSystem, logoDataUrl });
      if (blob.size < 1000) throw new Error("The generated report was unexpectedly empty.");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `truck-loading-plan-${previewPlan.trailer.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: "PDF report downloaded", description: "The loading plan, balance summary, and loading sequence are included." });
    } catch (error) {
      console.error("Truck PDF export failed", error);
      toast({ title: "PDF export failed", description: "Please try again. Your loading plan is still available on screen.", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  }, [packingItems, previewPlan, toast, unitSystem]);

  const handleExportLoadingCsv = useCallback(() => {
    if (!previewPlan) return;
    const url = URL.createObjectURL(new Blob([buildTruckPlacementCsv(previewPlan, unitSystem)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `AccessToNorth_TruckPlacements_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ title: "Placement CSV ready", description: "Trailer, loading step, position, dimensions, color, and weight are included." });
  }, [previewPlan, toast, unitSystem]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <Breadcrumbs items={[{ label: "Tools", href: "/tools" }, { label: "Truck Load Planner" }]} />

          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge className="mb-3 bg-primary/10 text-primary border-0 px-3 py-1">Free Tool</Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-4 text-slate-900" data-testid="text-tool-title">
              Truck Load Planner
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Build a collision-aware loading plan, compare trailer options, preview every placement in 3D,
              and export an operational loading sequence for dry vans, reefers, flatbeds, step decks, and more.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="max-w-5xl mx-auto mb-5">
                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white" data-testid="mode-tabs">
                  <button
                    onClick={() => { setMode("pro"); setShowResults(false); setResults(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      mode === "pro" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    data-testid="tab-mode-pro"
                  >
                    <Truck className="w-4 h-4" />
                    I Have a Trailer
                  </button>
                  <button
                    onClick={() => { setMode("beginner"); setShowResults(false); setResults(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      mode === "beginner" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    data-testid="tab-mode-beginner"
                  >
                    <Star className="w-4 h-4" />
                    Help Me Choose
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {mode === "pro" && (
                  <div className="lg:col-span-1">
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-primary" />
                          Trailer Selection
                        </h2>

                        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                          {TRAILER_PRESETS.map(t => (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedTrailerId(t.id); setUseCustomTrailer(false); }}
                              className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                                !useCustomTrailer && selectedTrailerId === t.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                              data-testid={`trailer-${t.id}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <TrailerTypeIcon category={t.category} name={t.name} active={!useCustomTrailer && selectedTrailerId === t.id} className="h-9 w-16 shrink-0" />
                                <div className="min-w-0"><div className="truncate font-semibold text-slate-900">{t.name}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {isMetric
                                  ? `${(t.lengthIn * IN_TO_CM / 100).toFixed(1)}×${(t.widthIn * IN_TO_CM / 100).toFixed(1)}×${(t.heightIn * IN_TO_CM / 100).toFixed(1)} m`
                                  : `${(t.lengthIn / 12).toFixed(0)}'×${(t.widthIn / 12).toFixed(1)}'×${(t.heightIn / 12).toFixed(1)}'`
                                }
                                {" · "}
                                {isMetric
                                  ? `${Math.round(t.maxPayloadLbs * LB_TO_KG).toLocaleString()} kg`
                                  : `${t.maxPayloadLbs.toLocaleString()} lbs`
                                }
                              </div></div></div>
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setUseCustomTrailer(!useCustomTrailer)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                            useCustomTrailer
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-dashed border-slate-300 hover:border-slate-400 bg-white"
                          }`}
                          data-testid="trailer-custom"
                        >
                          <div className="flex items-center gap-2.5"><TrailerTypeIcon custom active={useCustomTrailer} className="h-9 w-16 shrink-0" /><div><div className="font-semibold text-slate-900">Custom Trailer</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Enter your own dimensions</div></div></div>
                        </button>

                        {useCustomTrailer && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-[10px] text-slate-500">L ({dimUnit})</Label>
                                <Input type="number" min={1} value={toDisplay(customTrailer.lengthIn)} onChange={e => setCustomTrailer(p => ({ ...p, lengthIn: fromDisplay(e.target.value) }))} className="h-7 text-xs px-1.5" data-testid="input-custom-trailer-l" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">W ({dimUnit})</Label>
                                <Input type="number" min={1} value={toDisplay(customTrailer.widthIn)} onChange={e => setCustomTrailer(p => ({ ...p, widthIn: fromDisplay(e.target.value) }))} className="h-7 text-xs px-1.5" data-testid="input-custom-trailer-w" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">H ({dimUnit})</Label>
                                <Input type="number" min={1} value={toDisplay(customTrailer.heightIn)} onChange={e => setCustomTrailer(p => ({ ...p, heightIn: fromDisplay(e.target.value) }))} className="h-7 text-xs px-1.5" data-testid="input-custom-trailer-h" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] text-slate-500">Max Payload ({weightUnit})</Label>
                              <Input type="number" min={1} value={toDisplayWeight(customTrailer.maxPayloadLbs)} onChange={e => setCustomTrailer(p => ({ ...p, maxPayloadLbs: fromDisplayWeight(e.target.value) }))} className="h-7 text-xs px-1.5" data-testid="input-custom-trailer-payload" />
                            </div>
                          </div>
                        )}

                        {activeTrailer && (
                          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
                              <div>
                                <p className="font-bold text-slate-900">{isMetric ? `${(activeTrailer.lengthIn * IN_TO_CM / 100).toFixed(1)}` : `${(activeTrailer.lengthIn / 12).toFixed(0)}'`}</p>
                                <p className="text-[9px] text-slate-400">Length</p>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{isMetric ? `${(activeTrailer.widthIn * IN_TO_CM / 100).toFixed(1)}` : `${(activeTrailer.widthIn / 12).toFixed(1)}'`}</p>
                                <p className="text-[9px] text-slate-400">Width</p>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{isMetric ? `${(activeTrailer.heightIn * IN_TO_CM / 100).toFixed(1)}` : `${(activeTrailer.heightIn / 12).toFixed(1)}'`}</p>
                                <p className="text-[9px] text-slate-400">Height</p>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{isMetric ? `${Math.round(activeTrailer.maxPayloadLbs * LB_TO_KG).toLocaleString()}` : `${activeTrailer.maxPayloadLbs.toLocaleString()}`}</p>
                                <p className="text-[9px] text-slate-400">{weightUnit}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className={mode === "pro" ? "lg:col-span-2" : "lg:col-span-3"}>
                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          Cargo Input
                        </h2>
                        <div className="flex items-center gap-2">
                          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                            <button onClick={() => setUnitSystem("imperial")} className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${unitSystem === "imperial" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`} data-testid="button-unit-imperial">in/lbs</button>
                            <button onClick={() => setUnitSystem("metric")} className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${unitSystem === "metric" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`} data-testid="button-unit-metric">cm/kg</button>
                          </div>
                          {cargoMode !== "bulk" && (
                            <>
                              <Button variant="outline" size="sm" onClick={openImportModal} className="gap-1.5 h-7 text-xs" data-testid="button-import">
                                <FileUp className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Import</span>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setBulkSettingsOpen(true)} className="h-7 w-7 p-0" data-testid="button-bulk-settings" title="Bulk Cargo Settings">
                                <Settings2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-4">
                        {(["cartons", "pallets", "bulk"] as CargoMode[]).map(cm => (
                          <button
                            key={cm}
                            onClick={() => setCargoMode(cm)}
                            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                              cargoMode === cm ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                            data-testid={`tab-cargo-${cm}`}
                          >
                            {cm === "cartons" && <Box className="w-3.5 h-3.5" />}
                            {cm === "pallets" && <Layers className="w-3.5 h-3.5" />}
                            {cm === "bulk" && <CircleDot className="w-3.5 h-3.5" />}
                            {cm.charAt(0).toUpperCase() + cm.slice(1)}
                          </button>
                        ))}
                      </div>

                      {cargoMode === "cartons" && (
                        <div className="space-y-3">
                          {cartons.map((item, idx) => (
                            <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-white" data-testid={`carton-row-${idx}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <input type="color" value={item.color} onChange={e => updateCarton(item.id, "color", e.target.value)} className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5" aria-label={`Carton ${idx + 1} color`} data-testid={`input-carton-color-${idx}`} />
                                  <Input placeholder={`Carton ${idx + 1}`} value={item.name} onChange={e => updateCarton(item.id, "name", e.target.value)} className="h-7 max-w-[220px] text-xs font-medium" data-testid={`input-carton-name-${idx}`} />
                                </div>
                                {cartons.length > 1 && (
                                  <button onClick={() => setCartons(prev => prev.filter(c => c.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors p-1" data-testid={`button-remove-carton-${idx}`}>
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">L ({dimUnit})</Label>
                                  <Input type="number" min={0} step="0.1" value={toDisplay(item.lengthIn)} onChange={e => updateCarton(item.id, "lengthIn", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-carton-l-${idx}`} />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">W ({dimUnit})</Label>
                                  <Input type="number" min={0} step="0.1" value={toDisplay(item.widthIn)} onChange={e => updateCarton(item.id, "widthIn", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-carton-w-${idx}`} />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">H ({dimUnit})</Label>
                                  <Input type="number" min={0} step="0.1" value={toDisplay(item.heightIn)} onChange={e => updateCarton(item.id, "heightIn", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-carton-h-${idx}`} />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Wt ({weightUnit})</Label>
                                  <Input type="number" min={0} step="0.1" value={toDisplayWeight(item.weightLbs)} onChange={e => updateCarton(item.id, "weightLbs", fromDisplayWeight(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-carton-wt-${idx}`} />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Qty</Label>
                                  <Input type="number" min={1} value={item.quantity || ""} onChange={e => updateCarton(item.id, "quantity", parseInt(e.target.value) || 0)} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-carton-qty-${idx}`} />
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Stack</Label>
                                  <button
                                    onClick={() => updateCarton(item.id, "stackable", !item.stackable)}
                                    className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                      item.stackable ? "bg-green-50 border-green-300 text-green-700" : "bg-amber-50 border-amber-300 text-amber-700"
                                    }`}
                                    data-testid={`toggle-carton-stack-${idx}`}
                                  >
                                    {item.stackable ? "\u2713 Yes" : "No"}
                                  </button>
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Rotate</Label>
                                  <button
                                    onClick={() => {
                                      const next: RotationMode = item.rotation === "all" ? "horizontal" : item.rotation === "horizontal" ? "fixed" : "all";
                                      updateCarton(item.id, "rotation", next);
                                    }}
                                    className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                      item.rotation === "all" ? "bg-blue-50 border-blue-300 text-blue-700" : item.rotation === "horizontal" ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-slate-50 border-slate-300 text-slate-500"
                                    }`}
                                    data-testid={`toggle-carton-rotation-${idx}`}
                                  >
                                    {item.rotation === "all" ? "All" : item.rotation === "horizontal" ? "Horiz" : "Fixed"}
                                  </button>
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Priority</Label>
                                  <button
                                    onClick={() => {
                                      const next = item.priority === 0 ? 1 : item.priority === 1 ? 2 : 0;
                                      updateCarton(item.id, "priority", next);
                                    }}
                                    className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                      item.priority === 0 ? "bg-slate-50 border-slate-300 text-slate-600" : item.priority === 1 ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-amber-50 border-amber-300 text-amber-700"
                                    }`}
                                    data-testid={`toggle-carton-priority-${idx}`}
                                  >
                                    {item.priority === 0 ? "Norm" : item.priority === 1 ? "High" : "Low"}
                                  </button>
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Pallet</Label>
                                  <select
                                    value={item.palletAssign}
                                    onChange={e => updateCarton(item.id, "palletAssign", e.target.value)}
                                    className="w-full h-6 px-0.5 text-[10px] rounded border border-slate-200 bg-white"
                                    data-testid={`select-carton-pallet-${idx}`}
                                  >
                                    <option value="none">None</option>
                                    {Object.entries(PALLET_TYPES).filter(([k]) => k !== "custom").map(([k, v]) => (
                                      <option key={k} value={k}>{v.label.split("(")[0].trim()}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                          {cartons.some(item => item.palletAssign !== "none") && (
                            <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-800">
                              Auto-build uses a 72 in / 2,500 lb loaded-pallet limit. For custom limits, mixed cartons, or layer controls, use the <Link href="/tools/pallet-builder" className="font-semibold underline">Pallet Builder</Link> first.
                            </p>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setCartons(prev => [...prev, defaultCarton(prev.length)])} className="gap-1.5 w-full" data-testid="button-add-carton">
                            <Plus className="w-3.5 h-3.5" /> Add Carton
                          </Button>
                        </div>
                      )}

                      {cargoMode === "pallets" && (
                        <div className="space-y-3">
                          {pallets.map((item, idx) => (
                            <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-white" data-testid={`pallet-row-${idx}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <input type="color" value={item.color} onChange={e => updatePallet(item.id, "color", e.target.value)} className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5" aria-label={`Pallet ${idx + 1} color`} data-testid={`input-pallet-color-${idx}`} />
                                  <Input placeholder={`Pallet ${idx + 1}`} value={item.name} onChange={e => updatePallet(item.id, "name", e.target.value)} className="h-7 max-w-[220px] text-xs font-medium" data-testid={`input-pallet-name-${idx}`} />
                                </div>
                                {pallets.length > 1 && (
                                  <button onClick={() => setPallets(prev => prev.filter(p => p.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors p-1" data-testid={`button-remove-pallet-${idx}`}>
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                                <div className="col-span-2 sm:col-span-1">
                                  <Label className="text-[9px] text-slate-400 uppercase">Pallet Type</Label>
                                  <select
                                    value={item.palletType}
                                    onChange={e => updatePallet(item.id, "palletType", e.target.value)}
                                    className="w-full h-6 px-1 text-[10px] rounded border border-slate-200 bg-white"
                                    data-testid={`select-pallet-type-${idx}`}
                                  >
                                    {Object.entries(PALLET_TYPES).map(([k, v]) => (
                                      <option key={k} value={k}>{v.label}</option>
                                    ))}
                                  </select>
                                </div>
                                {item.palletType === "custom" && (
                                  <>
                                    <div>
                                      <Label className="text-[9px] text-slate-400 uppercase">P.L ({dimUnit})</Label>
                                      <Input type="number" min={0} value={toDisplay(item.customL)} onChange={e => updatePallet(item.id, "customL", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-pallet-cl-${idx}`} />
                                    </div>
                                    <div>
                                      <Label className="text-[9px] text-slate-400 uppercase">P.W ({dimUnit})</Label>
                                      <Input type="number" min={0} value={toDisplay(item.customW)} onChange={e => updatePallet(item.id, "customW", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-pallet-cw-${idx}`} />
                                    </div>
                                  </>
                                )}
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Height ({dimUnit})</Label>
                                  <Input type="number" min={0} step="0.1" value={toDisplay(item.heightIn)} onChange={e => updatePallet(item.id, "heightIn", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-pallet-h-${idx}`} />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Wt ({weightUnit})</Label>
                                  <Input type="number" min={0} step="0.1" value={toDisplayWeight(item.weightLbs)} onChange={e => updatePallet(item.id, "weightLbs", fromDisplayWeight(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-pallet-wt-${idx}`} />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Qty</Label>
                                  <Input type="number" min={1} value={item.quantity || ""} onChange={e => updatePallet(item.id, "quantity", parseInt(e.target.value) || 0)} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-pallet-qty-${idx}`} />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Stack</Label>
                                  <button
                                    onClick={() => updatePallet(item.id, "stackable", !item.stackable)}
                                    className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                      item.stackable ? "bg-green-50 border-green-300 text-green-700" : "bg-amber-50 border-amber-300 text-amber-700"
                                    }`}
                                    data-testid={`toggle-pallet-stack-${idx}`}
                                  >
                                    {item.stackable ? "\u2713 Yes" : "No"}
                                  </button>
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Rotate</Label>
                                  <button
                                    onClick={() => {
                                      const next: RotationMode = item.rotation === "all" ? "horizontal" : item.rotation === "horizontal" ? "fixed" : "all";
                                      updatePallet(item.id, "rotation", next);
                                    }}
                                    className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                      item.rotation === "all" ? "bg-blue-50 border-blue-300 text-blue-700" : item.rotation === "horizontal" ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-slate-50 border-slate-300 text-slate-500"
                                    }`}
                                    data-testid={`toggle-pallet-rotation-${idx}`}
                                  >
                                    {item.rotation === "all" ? "All" : item.rotation === "horizontal" ? "Horiz" : "Fixed"}
                                  </button>
                                </div>
                                <div>
                                  <Label className="text-[9px] text-slate-400 uppercase">Priority</Label>
                                  <button
                                    onClick={() => {
                                      const next = item.priority === 0 ? 1 : item.priority === 1 ? 2 : 0;
                                      updatePallet(item.id, "priority", next);
                                    }}
                                    className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                      item.priority === 0 ? "bg-slate-50 border-slate-300 text-slate-600" : item.priority === 1 ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-amber-50 border-amber-300 text-amber-700"
                                    }`}
                                    data-testid={`toggle-pallet-priority-${idx}`}
                                  >
                                    {item.priority === 0 ? "Norm" : item.priority === 1 ? "High" : "Low"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setPallets(prev => [...prev, defaultPallet(prev.length)])} className="gap-1.5 w-full" data-testid="button-add-pallet">
                            <Plus className="w-3.5 h-3.5" /> Add Pallet
                          </Button>
                        </div>
                      )}

                      {cargoMode === "bulk" && (
                        <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3" data-testid="bulk-form">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-slate-500">Total Weight ({weightUnit})</Label>
                              <Input type="number" min={0} value={toDisplayWeight(bulk.totalWeightLbs)} onChange={e => setBulk(prev => ({ ...prev, totalWeightLbs: fromDisplayWeight(e.target.value) }))} className="h-8 text-xs" data-testid="input-bulk-weight" />
                            </div>
                            <div>
                              <Label className="text-xs text-slate-500">Total Volume ({volUnit})</Label>
                              <Input type="number" min={0} step="0.1" value={toDisplayVolume(bulk.totalVolumeCuFt) || ""} onChange={e => { const v = parseFloat(e.target.value) || 0; setBulk(prev => ({ ...prev, totalVolumeCuFt: isMetric ? v / CUFT_TO_CUM : v })); }} className="h-8 text-xs" data-testid="input-bulk-volume" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Packaging Type</Label>
                            <select
                              value={bulk.packagingType}
                              onChange={e => setBulk(prev => ({ ...prev, packagingType: e.target.value as PackagingType }))}
                              className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 bg-white"
                              data-testid="select-bulk-packaging"
                            >
                              <option value="loose">Loose Items</option>
                              <option value="bags">Bags / Sacks</option>
                              <option value="drums">Drums / Barrels</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Description (optional)</Label>
                            <Input placeholder="e.g., 50 bags of grain, 200kg each" value={bulk.description} onChange={e => setBulk(prev => ({ ...prev, description: e.target.value }))} className="h-8 text-xs" data-testid="input-bulk-desc" />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-5">
                        <Button onClick={calculate} className="flex-1 h-10 gap-2 font-semibold" data-testid="button-calculate">
                          <BarChart3 className="w-4 h-4" />
                          {mode === "pro" ? "Build Loading Plan" : "Find Best Trailers"}
                        </Button>
                        <Button variant="outline" onClick={handleReset} className="h-10 gap-1.5 text-xs" data-testid="button-reset">
                          <Trash2 className="w-3.5 h-3.5" /> Reset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {showResults && results && results.length > 0 && (
                    <div className="mt-5 space-y-5">
                      {results.map((r, ri) => (
                        <motion.div key={r.trailer.id + ri} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ri * 0.1 }}>
                          {mode === "beginner" && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                ri === 0 ? "bg-amber-500" : ri === 1 ? "bg-slate-400" : "bg-amber-700"
                              }`}>
                                #{ri + 1}
                              </div>
                              <span className="text-sm font-bold text-slate-900">{r.trailer.name}</span>
                              {r.fits && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">{r.spatialPlan ? `${r.trailersRequired} trailer${r.trailersRequired === 1 ? "" : "s"}` : "Fits"}</Badge>}
                              {!r.fits && <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Not suitable</Badge>}
                            </div>
                          )}

                          <Card className={`border-2 ${r.fits ? "border-green-200" : "border-red-200"}`}>
                            <CardContent className="p-5">
                              {mode === "pro" && (
                                <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${
                                  r.fits ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                                }`} data-testid="fitment-result">
                                  {r.fits ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                                  )}
                                  <div>
                                    <p className={`font-bold ${r.fits ? "text-green-800" : "text-red-800"}`}>
                                      {r.fits
                                        ? r.trailersRequired === 1 ? "Fits in one trailer" : `Requires ${r.trailersRequired} trailers`
                                        : r.spatialPlan ? "Some cargo cannot be placed" : "Cargo does not fit"}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                      {r.fits
                                        ? r.trailersRequired === 1
                                          ? `All ${r.piecesTotal || "entered"} pieces have collision-free positions in the ${r.trailer.name}.`
                                          : `All ${r.piecesTotal} pieces are placed across ${r.trailersRequired} × ${r.trailer.name}.`
                                        : r.spatialPlan
                                          ? `${r.piecesLoaded} of ${r.piecesTotal} pieces were placed. See the recommendations below.`
                                          : "See warnings and recommendations below."
                                      }
                                    </p>
                                  </div>
                                </div>
                              )}

                              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                                {mode === "pro" ? "Loading Summary" : `${r.trailer.name} — Summary`}
                              </h3>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <StatCard
                                  icon={Weight}
                                  label="Total Weight"
                                  value={`${(r.totalWeightLbs * weightFactor).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${weightUnit}`}
                                  sub={`of ${(r.maxPayloadLbs * weightFactor).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${weightUnit}`}
                                  color="#22c55e"
                                />
                                <StatCard
                                  icon={Package}
                                  label="Total Volume"
                                  value={`${(isMetric ? r.totalVolumeCuFt * CUFT_TO_CUM : r.totalVolumeCuFt).toFixed(1)} ${volUnit}`}
                                  sub={`of ${(isMetric ? r.trailerVolumeCuFt * CUFT_TO_CUM : r.trailerVolumeCuFt).toFixed(isMetric ? 1 : 0)} ${volUnit}`}
                                  color="#8b5cf6"
                                />
                                <StatCard
                                  icon={Ruler}
                                  label="Floor Area"
                                  value={`${(isMetric ? r.trailerFloorAreaSqFt * SQFT_TO_SQM : r.trailerFloorAreaSqFt).toFixed(1)} ${areaUnit}`}
                                  color="#f59e0b"
                                />
                                <StatCard
                                  icon={Truck}
                                  label="Trailer"
                                  value={r.spatialPlan ? `${r.trailersRequired} × ${r.trailer.name}` : r.trailer.name}
                                  sub={r.trailer.category}
                                  color="#3b82f6"
                                />
                              </div>

                              <div className="space-y-3 mb-4">
                                <UtilBar pct={r.volumeUtil} label={r.trailersRequired > 1 ? "Average Volume Utilization" : "Volume Utilization"} color="#8b5cf6" />
                                <UtilBar pct={r.weightUtil} label={r.trailersRequired > 1 ? "Average Payload Utilization" : "Payload Utilization"} color="#22c55e" />
                              </div>

                              {(r.oversizeWarnings.length > 0 || r.overweightWarning) && (
                                <div className="space-y-2 mb-4">
                                  {r.overweightWarning && (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200" data-testid="warning-overweight">
                                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs font-semibold text-red-800">Overweight</p>
                                        <p className="text-[11px] text-red-700">
                                          Total weight ({(r.totalWeightLbs * weightFactor).toLocaleString(undefined, { maximumFractionDigits: 0 })} {weightUnit}) exceeds max payload ({(r.maxPayloadLbs * weightFactor).toLocaleString(undefined, { maximumFractionDigits: 0 })} {weightUnit})
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {r.oversizeWarnings.map((w, wi) => (
                                    <div key={wi} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200" data-testid={`warning-oversize-${wi}`}>
                                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                      <p className="text-[11px] text-amber-800">{w}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {r.recommendations.length > 0 && (
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200" data-testid="recommendations">
                                  <p className="text-xs font-semibold text-blue-800 mb-1.5 flex items-center gap-1">
                                    <Info className="w-3.5 h-3.5" /> Recommendations
                                  </p>
                                  <ul className="space-y-1">
                                    {r.recommendations.map((rec, ri2) => (
                                      <li key={ri2} className="text-[11px] text-blue-700 flex items-start gap-1.5">
                                        <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {r.spatialPlan && r.spatialPlan.multi.containers.length > 0 && (
                                <Button variant="outline" className="mt-4 w-full gap-2 border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100" onClick={() => handleSelectPreview(ri)} data-testid={`button-view-truck-plan-${ri}`}>
                                  <Play className="h-4 w-4" /> View spatial loading plan
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}

                      {previewResult && previewPlan && previewEntry && previewBalance && (
                        <Card className="overflow-hidden border-slate-200 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.45)]" data-testid="truck-spatial-plan">
                          <CardContent className="p-0">
                            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-3 sm:p-4">
                              <div className="grid w-full grid-cols-3 gap-1" role="tablist" aria-label="Truck loading result views">
                                {([
                                  { id: "plan" as const, label: "Loading Plan", icon: Truck },
                                  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
                                  { id: "details" as const, label: "Cargo Details", icon: ListChecks },
                                ]).map((tab) => {
                                  const Icon = tab.icon;
                                  const selected = activeResultTab === tab.id;
                                  return <button key={tab.id} type="button" role="tab" aria-selected={selected} onClick={() => setActiveResultTab(tab.id)} className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-semibold whitespace-nowrap transition sm:gap-2 sm:px-3 sm:text-sm ${selected ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`} data-testid={`truck-result-tab-${tab.id}`}><Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /><span className="truncate">{tab.label}</span></button>;
                                })}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={handleExportLoadingCsv} className="gap-1.5 px-2 text-xs sm:text-sm" data-testid="button-truck-csv"><FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Placement CSV</Button>
                                <Button variant="outline" size="sm" onClick={handleExportLoadingPdf} disabled={pdfLoading} className="gap-1.5 px-2 text-xs sm:text-sm" data-testid="button-truck-pdf">{pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Complete PDF</Button>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                              <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200"><TrailerTypeIcon category={previewResult.trailer.category} name={previewResult.trailer.name} custom={previewResult.trailer.id === "custom"} active className="h-11 w-24" /></div>
                              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{previewResult.trailer.name}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">Trailer {previewTrailerIndex + 1} of {previewPlan.trailersRequired} · {previewEntry.result.piecesLoaded} pieces · {previewEntry.result.weightUtil.toFixed(0)}% payload</p></div>
                              {previewPlan.trailersRequired > 1 && <select value={previewTrailerIndex} onChange={event => handleSelectPreviewTrailer(Number(event.target.value))} className="h-9 max-w-28 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold" aria-label="Preview trailer" data-testid="select-preview-trailer">{previewPlan.multi.containers.map((_, index) => <option key={index} value={index}>Trailer {index + 1}</option>)}</select>}
                            </div>

                            {activeResultTab === "plan" && <div className="space-y-5 p-4 sm:p-5">
                              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Calculated placement</p><h3 className="mt-1 text-lg font-bold">3D spatial loading plan</h3></div>
                              <TruckLoadPreview3D placed={previewEntry.result.placed} trailer={previewResult.trailer} loadingSequence={previewSequence} visibleSteps={visibleLoadingSteps} />
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="truck-loading-sequence">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-slate-800">Nose-to-door loading sequence</p><p className="mt-0.5 text-[11px] text-slate-500">{currentLoadingStep ? `Step ${currentLoadingStep.step} of ${previewSequence.length}: ${currentLoadingStep.cargoName} at about ${toDisplay(currentLoadingStep.positionFromNoseIn)} ${dimUnit} from the nose.` : `Full plan shown · ${previewSequence.length} placement step${previewSequence.length === 1 ? "" : "s"}.`}</p></div>
                                  <div className="flex flex-wrap items-center gap-2" data-testid="truck-loading-sequence-controls"><Button variant="outline" size="sm" onClick={() => setVisibleLoadingSteps("all")} className="h-8 text-xs">Full plan</Button><Button variant="outline" size="sm" onClick={() => setVisibleLoadingSteps(1)} disabled={!previewSequence.length} className="h-8 gap-1 text-xs"><Play className="h-3 w-3" /> Start</Button><Button variant="outline" size="sm" onClick={() => setVisibleLoadingSteps(value => value === "all" ? Math.max(1, previewSequence.length - 1) : Math.max(1, value - 1))} disabled={!previewSequence.length || visibleLoadingSteps === 1} className="h-8 px-2" aria-label="Previous loading step"><ArrowLeft className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" onClick={() => setVisibleLoadingSteps(value => value === "all" ? 1 : Math.min(previewSequence.length, value + 1))} disabled={!previewSequence.length || visibleLoadingSteps === previewSequence.length} className="h-8 px-2" aria-label="Next loading step"><ArrowRight className="h-3.5 w-3.5" /></Button></div>
                                </div>
                              </div>
                            </div>}

                            {activeResultTab === "overview" && <div className="space-y-5 p-4 sm:p-5">
                              <div className={`flex items-start gap-3 rounded-2xl border p-4 ${previewBalance.status === "balanced" ? "border-emerald-200 bg-emerald-50" : previewBalance.status === "caution" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}><CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${previewBalance.status === "balanced" ? "text-emerald-600" : previewBalance.status === "caution" ? "text-amber-600" : "text-red-600"}`} /><div><p className="text-sm font-bold text-slate-900">{previewBalance.status === "balanced" ? "Plan ready for dispatch review" : "Balance review recommended"}</p><p className="mt-1 text-xs leading-5 text-slate-600">All displayed positions are collision-free and follow the entered stacking and rotation rules. Securement, axle loads, and concentrated floor loads still require carrier confirmation.</p></div></div>
                              <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard icon={Package} label="Pieces loaded" value={`${previewEntry.result.piecesLoaded}/${previewEntry.result.piecesTotal}`} color="#3b82f6" /><StatCard icon={Weight} label="Placed weight" value={`${(previewEntry.result.totalWeight * weightFactor).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${weightUnit}`} sub={`of ${(previewResult.trailer.maxPayloadLbs * weightFactor).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${weightUnit}`} color="#22c55e" /><StatCard icon={Package} label="Volume use" value={`${previewEntry.result.volumeUtil.toFixed(1)}%`} color="#8b5cf6" /><StatCard icon={Truck} label="Equipment" value={`Trailer ${previewTrailerIndex + 1}`} sub={previewResult.trailer.category} color="#0284c7" /></div>
                              <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]" data-testid="truck-balance-panel"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-800">Cargo balance estimate</p><Badge className={previewBalance.status === "balanced" ? "border-0 bg-emerald-100 text-emerald-700" : previewBalance.status === "caution" ? "border-0 bg-amber-100 text-amber-700" : "border-0 bg-red-100 text-red-700"}>{previewBalance.status}</Badge></div><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs"><div><dt className="text-slate-400">Cargo centre</dt><dd className="font-semibold text-slate-800">{toDisplay(previewBalance.distanceFromNoseIn)} {dimUnit} from nose</dd></div><div><dt className="text-slate-400">Centre position</dt><dd className="font-semibold text-slate-800">{previewBalance.longitudinalPct.toFixed(1)}% length · {previewBalance.lateralPct.toFixed(1)}% width</dd></div><div><dt className="text-slate-400">Nose / rear half</dt><dd className="font-semibold text-slate-800">{previewBalance.noseWeightPct.toFixed(1)}% / {previewBalance.doorWeightPct.toFixed(1)}%</dd></div><div><dt className="text-slate-400">Left / right half</dt><dd className="font-semibold text-slate-800">{previewBalance.sideAWeightPct.toFixed(1)}% / {previewBalance.sideBWeightPct.toFixed(1)}%</dd></div></dl></div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="mb-2 text-xs font-bold text-amber-900">Dispatch review</p>{previewBalance.guidance.length > 0 ? <ul className="mb-3 space-y-1.5 text-xs text-amber-900">{previewBalance.guidance.map(item => <li key={item} className="flex gap-2"><ChevronRight className="mt-0.5 h-3 w-3 shrink-0" />{item}</li>)}</ul> : <p className="mb-3 text-xs text-amber-900">The geometric cargo centre is reasonably balanced within this trailer.</p>}<p className="text-[11px] leading-relaxed text-amber-800"><strong>Not an axle-weight calculation.</strong> Confirm tractor weight, kingpin and axle positions, sliding tandems, fuel, and concentrated-load limits with the carrier.</p></div></div>
                            </div>}

                            {activeResultTab === "details" && <div className="space-y-5 p-4 sm:p-5"><div><h3 className="text-sm font-bold text-slate-900">Cargo manifest</h3><p className="mt-1 text-[11px] text-slate-500">Rows used for this spatial calculation.</p></div><div className="space-y-2">{packingItems.map((item) => <div key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs"><span className="h-4 w-4 rounded-md shadow-sm ring-1 ring-black/5" style={{ backgroundColor: item.color }} /><div className="min-w-0"><p className="truncate font-bold text-slate-800">{item.name}</p><p className="mt-0.5 text-[10px] text-slate-500">{toDisplay(item.length)} × {toDisplay(item.width)} × {toDisplay(item.height)} {dimUnit} · {toDisplayWeight(item.weight / Math.max(1, item.quantity))} {weightUnit} each</p></div><span className="font-bold text-slate-700">× {item.quantity}</span></div>)}</div><div><h3 className="text-sm font-bold text-slate-900">Trailer {previewTrailerIndex + 1} loading order</h3><div className="mt-3 space-y-2">{previewSequence.map((step) => <div key={step.step} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-sky-700 shadow-sm">{step.step}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{step.cargoName}</p><p className="mt-0.5 text-[10px] text-slate-500">{toDisplay(step.positionFromNoseIn)} {dimUnit} from nose · {toDisplay(step.levelIn)} {dimUnit} above floor</p></div></div>)}</div></div></div>}
                          </CardContent>
                        </Card>
                      )}

                      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900 mb-1">Need help with your shipment?</h3>
                              <p className="text-sm text-slate-600">Get expert freight, customs clearance, and compliance assistance from our team.</p>
                            </div>
                            <Link href="/contact">
                              <Button size="sm" className="gap-1" data-testid="button-contact-us">
                                Contact Us <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          {/* ─── Route Planner Section ──────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-5xl mx-auto mt-10">
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2" data-testid="text-route-planner-title">
                  <Route className="w-4 h-4 text-primary" />
                  Route Planner
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Enter origin and destination to calculate route distance, driving time, and jurisdictions crossed.
                </p>

                {!GOOGLE_MAPS_API_KEY ? (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Google Maps API key is not configured. Route planning is unavailable.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-green-600" />
                          Origin (A)
                        </Label>
                        <Input
                          ref={originInputRef}
                          type="text"
                          placeholder="Start typing an address..."
                          value={originText}
                          onChange={e => { setOriginText(e.target.value); setOriginPlace(null); }}
                          data-testid="input-origin"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          Destination (B)
                        </Label>
                        <Input
                          ref={destInputRef}
                          type="text"
                          placeholder="Start typing an address..."
                          value={destText}
                          onChange={e => { setDestText(e.target.value); setDestPlace(null); }}
                          data-testid="input-destination"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Button
                        onClick={handleCalculateRoute}
                        disabled={routeLoading || (!originText.trim() || !destText.trim())}
                        size="sm"
                        className="gap-2"
                        data-testid="button-calculate-route"
                      >
                        {routeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                        Calculate Route
                      </Button>
                    </div>

                    {routeLoading && (
                      <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4" data-testid="route-loading">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-700">Calculating route and detecting jurisdictions...</span>
                      </div>
                    )}

                    {routeError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4 text-sm text-red-700" data-testid="route-error">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {routeError}
                      </div>
                    )}

                    {routeInfo && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" data-testid="route-summary">
                        <StatCard icon={Navigation} label="Distance" value={routeInfo.distanceText} color="#3b82f6" />
                        <StatCard icon={Clock} label="Drive Time" value={routeInfo.durationText} color="#8b5cf6" />
                        <StatCard icon={Flag} label="Jurisdictions" value={String(jurisdictions.length)} color="#f59e0b" />
                        <StatCard icon={Route} label="Route" value={`${originPlace?.formatted?.split(",")[0] || "A"} → ${destPlace?.formatted?.split(",")[0] || "B"}`} color="#22c55e" />
                      </div>
                    )}

                    <div className="relative w-full rounded-xl border border-slate-200 overflow-hidden mb-4 h-[250px] sm:h-[350px]" data-testid="route-map-wrapper">
                      <div
                        ref={mapContainerRef}
                        className="w-full h-full"
                        data-testid="route-map"
                      />
                      {!routeInfo && !routeLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                          <MapPin className="w-8 h-8 mb-2 opacity-40" />
                          <p className="text-sm">Enter addresses and calculate route to see map</p>
                        </div>
                      )}
                    </div>

                    {routeInfo && jurisdictions.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} data-testid="jurisdictions-section">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Flag className="w-3.5 h-3.5 text-primary" />
                          Jurisdictions Crossed (in travel order)
                        </h3>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-sm" data-testid="jurisdictions-table">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-700 w-8">#</th>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Jurisdiction</th>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Country</th>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Rules &amp; permits</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jurisdictions.map((j, idx) => {
                                const guidance = getTruckJurisdictionGuidance(j);
                                return <tr key={j.code} className="border-b border-slate-100 last:border-0" data-testid={`jurisdiction-row-${idx}`}>
                                  <td className="px-4 py-2.5 text-slate-400 text-xs font-medium">{idx + 1}</td>
                                  <td className="px-4 py-2.5 font-medium text-slate-900">
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                        {j.code}
                                      </span>
                                      {j.name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-600">
                                    <Badge variant="outline" className="text-[10px]">
                                      {j.country === "Canada" ? "CA" : j.country === "United States" ? "US" : j.country}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs">
                                    <p className="font-medium text-slate-700">{guidance.summary}</p>
                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                      {guidance.rulesUrl && <a href={guidance.rulesUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{guidance.rulesLabel}<ExternalLink className="h-3 w-3" /></a>}
                                      {guidance.permitUrl && <a href={guidance.permitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{guidance.permitLabel}<ExternalLink className="h-3 w-3" /></a>}
                                    </div>
                                  </td>
                                </tr>
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden space-y-2" data-testid="jurisdictions-cards">
                          {jurisdictions.map((j, idx) => {
                            const guidance = getTruckJurisdictionGuidance(j);
                            return <div key={j.code} className="p-3 rounded-lg border border-slate-200 bg-white" data-testid={`jurisdiction-card-${idx}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{j.name} ({j.code})</p>
                                    <p className="text-[11px] text-slate-500">
                                      {j.country === "Canada" ? "Canada" : j.country === "United States" ? "United States" : j.country}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right text-[10px]"><p className="max-w-44 text-slate-600">{guidance.summary}</p>{guidance.permitUrl && <a href={guidance.permitUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-primary">{guidance.permitLabel}<ExternalLink className="h-2.5 w-2.5" /></a>}</div>
                              </div>
                            </div>
                          })}
                        </div>

                        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                          These are official planning references, not permit approval. Gross and axle legality depends on the tractor, axle count and spacing, registered weight, seasonal restrictions, exact roads, and local permit conditions. Scale the assembled vehicle before dispatch.
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <section className="mt-16 border-t border-slate-200 bg-white/70 py-10" aria-labelledby="truck-planner-guide">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
                <h2 id="truck-planner-guide" className="text-lg font-bold font-display text-slate-900 sm:text-xl">How to choose a trailer for your cargo</h2>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500 transition group-open:rotate-45">+</span>
              </summary>
              <div className="border-t border-slate-100 p-5 sm:p-6">
            <div className="max-w-3xl mb-8">
              <p className="text-slate-600 leading-relaxed">
                Enter the outside dimensions, total gross weight, quantity, stacking rules, and cargo type.
                The planner compares the load against common dry van, reefer, flatbed, step-deck, and specialized
                trailer presets. For cartons and pallets it calculates collision-free positions, trailer count,
                loading order, and a geometric balance estimate before flagging cargo that may be oversized or overweight.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-9">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Planning checks</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  {[
                    "Collision-aware placement for every carton or pallet",
                    "Actual trailer count, utilization, and gross weight",
                    "Stacking, rotation, pallet, and load-priority restrictions",
                    "Trailer recommendation when you do not know which equipment to request",
                    "3D/top-view preview, loading sequence, balance guidance, and PDF report",
                    "Route distance and jurisdictions when Google Maps is configured",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Important limitation</h3>
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  The result is a planning estimate, not a legal permit or axle analysis. Actual capacity changes with
                  tractor weight, trailer configuration, axle spacing, fuel, accessories, cargo centre of gravity,
                  and the laws of every jurisdiction on the route.
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Before dispatch, confirm the load with the carrier and permit provider—especially for overwidth,
                  overheight, overweight, concentrated loads, or cross-border movements.
                </p>
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Truck load planner FAQ</h3>
              <details className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold text-slate-800">Can the planner suggest a trailer automatically?</summary>
                <p className="mt-3 text-sm text-slate-600">Yes. Select “Help Me Choose” and enter the cargo. The tool ranks presets by actual spatial fit, trailer count, utilization, and payload.</p>
              </details>
              <details className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold text-slate-800">Can I upload a packing list?</summary>
                <p className="mt-3 text-sm text-slate-600">Yes. CSV and spreadsheet columns can be mapped, while supported documents, emails, text files, PDFs, and images use AI extraction. Confirm the preview and the tool fills every cargo input row for you.</p>
              </details>
              <details className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold text-slate-800">Does the warning mean a permit is definitely required?</summary>
                <p className="mt-3 text-sm text-slate-600">No. It means the entered cargo may exceed a common equipment or legal limit. Final permit needs depend on the complete vehicle configuration and route.</p>
              </details>
            </div>
              </div>
            </details>
          </div>
        </section>
      </main>

      {bulkSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setBulkSettingsOpen(false)} data-testid="bulk-settings-overlay">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="bulk-settings-modal">
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  Bulk Cargo Settings
                </h3>
                <button onClick={() => setBulkSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" data-testid="button-close-bulk-settings">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mb-5">Changes will apply to all existing items and set defaults for new items.</p>

              <div className="mb-5">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Stacking</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setDefaultStacking(true)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      defaultStacking ? "border-green-400 bg-green-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    data-testid="bulk-stack-yes"
                  >
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Stackable</p>
                      <p className="text-[10px] text-slate-500">Other items can be placed on top</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDefaultStacking(false)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      !defaultStacking ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    data-testid="bulk-stack-no"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <X className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Not Stackable</p>
                      <p className="text-[10px] text-slate-500">Nothing placed on top of this item</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Rotation</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setDefaultRotation("all")}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      defaultRotation === "all" ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    data-testid="bulk-rotate-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Box className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">All Axes</p>
                      <p className="text-[10px] text-slate-500">Rotate freely in all directions</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDefaultRotation("horizontal")}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      defaultRotation === "horizontal" ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    data-testid="bulk-rotate-horizontal"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                      <Box className="w-4 h-4 text-sky-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Horizontal Only</p>
                      <p className="text-[10px] text-slate-500">Rotate on floor plane only (keeps upright)</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDefaultRotation("fixed")}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      defaultRotation === "fixed" ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    data-testid="bulk-rotate-fixed"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                      <Box className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Fixed</p>
                      <p className="text-[10px] text-slate-500">No rotation allowed</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                onClick={() => {
                  setCartons(prev => prev.map(c => ({ ...c, stackable: defaultStacking, rotation: defaultRotation })));
                  setPallets(prev => prev.map(p => ({ ...p, stackable: defaultStacking, rotation: defaultRotation })));
                  setBulkSettingsOpen(false);
                  toast({ title: "Settings applied", description: "All cargo items have been updated." });
                }}
                className="w-full h-9 gap-2 font-semibold"
                data-testid="button-apply-bulk-settings"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply to All Items
              </Button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowImportModal(false)} data-testid="import-modal-overlay">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="import-modal">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-primary" />
                  Import Cargo Data
                </h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" data-testid="button-close-import">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {importStep === "upload" && (
                <>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) handleImportFile(file); }}
                    data-testid="import-dropzone"
                  >
                    {importLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-600">Processing file...</p>
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-700 mb-1">Drag & drop your file here</p>
                        <p className="text-xs text-slate-500 mb-3">Spreadsheets, documents, emails, text, PDFs, or images</p>
                        <div className="flex justify-center gap-2 mb-3">
                          <Badge variant="outline" className="text-[10px] gap-1"><FileSpreadsheet className="w-3 h-3" /> CSV/Excel</Badge>
                          <Badge variant="outline" className="text-[10px] gap-1"><FileImage className="w-3 h-3" /> PDF/Image</Badge>
                          <Badge variant="outline" className="text-[10px] gap-1"><Sparkles className="w-3 h-3" /> AI Extract</Badge>
                        </div>
                        <label className="inline-block">
                          <span className="px-4 py-2 text-xs font-medium text-primary border border-primary rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">Browse Files</span>
                          <input type="file" accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.rtf,.odt,.ppt,.pptx,.txt,.text,.md,.json,.xml,.html,.htm,.eml,.jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }} data-testid="import-file-input" />
                        </label>
                      </>
                    )}
                  </div>

                  {importError && <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{importError}</div>}

                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">CSV Template</span>
                      </div>
                      <button onClick={downloadSampleCSV} className="text-[10px] text-primary hover:underline font-medium" data-testid="button-download-template">Download</button>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Use headers like: Name, Length, Width, Height, Weight Each, Quantity</p>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600">
                            <th className="px-2 py-1.5 text-left font-semibold">Name</th>
                            <th className="px-2 py-1.5 text-right font-semibold">Length</th>
                            <th className="px-2 py-1.5 text-right font-semibold">Width</th>
                            <th className="px-2 py-1.5 text-right font-semibold">Height</th>
                            <th className="px-2 py-1.5 text-right font-semibold">Weight Each</th>
                            <th className="px-2 py-1.5 text-right font-semibold">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600">
                          <tr className="border-t border-slate-100">
                            <td className="px-2 py-1.5">Cardboard Box A</td>
                            <td className="px-2 py-1.5 text-right">24</td>
                            <td className="px-2 py-1.5 text-right">18</td>
                            <td className="px-2 py-1.5 text-right">12</td>
                            <td className="px-2 py-1.5 text-right">15</td>
                            <td className="px-2 py-1.5 text-right">10</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-500">Units:</span>
                      <div className="flex rounded border border-slate-200 overflow-hidden">
                        <button onClick={() => setImportUnits("imperial")} className={`px-2 py-0.5 text-[10px] font-medium ${importUnits === "imperial" ? "bg-primary text-white" : "bg-white text-slate-600"}`}>in/lbs</button>
                        <button onClick={() => setImportUnits("metric")} className={`px-2 py-0.5 text-[10px] font-medium ${importUnits === "metric" ? "bg-primary text-white" : "bg-white text-slate-600"}`}>cm/kg</button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {importStep === "mapping" && (
                <>
                  <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Map Your Columns</h4>
                  {importError && <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{importError}</div>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(["name", "length", "width", "height", "weight", "quantity"] as const).map(field => {
                      const labels: Record<string, string> = { name: "Item Name", length: "Length", width: "Width", height: "Height", weight: "Weight", quantity: "Quantity" };
                      const required = ["length", "width", "height"].includes(field);
                      return (
                        <div key={field}>
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
                            {labels[field]}
                            {required && <span className="text-red-400">*</span>}
                          </Label>
                          <select
                            value={importColMap[field]}
                            onChange={e => setImportColMap(prev => ({ ...prev, [field]: e.target.value }))}
                            className="mt-1 w-full h-[30px] px-2 text-[11px] font-medium rounded-md border border-slate-200 bg-white"
                            data-testid={`mapping-select-${field}`}
                          >
                            <option value="">— Skip —</option>
                            {importRawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                  {importRawRows.length > 0 && (
                    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-slate-100">{importRawHeaders.map(h => <th key={h} className="px-2 py-1.5 text-left font-semibold text-slate-600">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {importRawRows.slice(0, 3).map((r, i) => (
                            <tr key={i} className="border-t border-slate-100">{importRawHeaders.map(h => <td key={h} className="px-2 py-1 text-slate-500">{r[h]}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setImportStep("upload")} className="gap-1">
                      <ArrowLeft className="w-3 h-3" /> Back
                    </Button>
                    <Button size="sm" onClick={applyColumnMapping} className="flex-1 gap-1" data-testid="button-apply-mapping">
                      Continue to Preview <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}

              {importStep === "preview" && (
                <>
                  <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Preview ({importItems.filter(i => i.include).length} items)</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {importItems.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${item.include ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-50"}`} data-testid={`import-row-${idx}`}>
                        <input type="checkbox" checked={item.include} onChange={() => setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, include: !it.include } : it))} className="shrink-0" />
                        <span className="flex-1 font-medium truncate">{item.name || `Item ${idx + 1}`}</span>
                        <span className="text-slate-500">{item.length}×{item.width}×{item.height}</span>
                        <span className="text-slate-400">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setImportStep("mapping")} className="gap-1">
                      <ArrowLeft className="w-3 h-3" /> Back
                    </Button>
                    <Button size="sm" onClick={confirmImport} className="flex-1" data-testid="button-confirm-import">
                      Import {importItems.filter(i => i.include).length} Items
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
