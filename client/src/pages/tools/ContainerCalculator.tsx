import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToolWorkedExample } from "@/components/ToolWorkedExample";
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
  Box,
  RotateCcw,
  Package,
  Weight,
  Ruler,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Download,
  Mail,
  X,
  Maximize2,
  Settings2,
  Layers,
  Undo2,
  Redo2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  CheckSquare,
  Square,
  Minus,
  FileUp,
  FileSpreadsheet,
  FileImage,
  Sparkles,
  Table,
  FileDown,
  MousePointerClick,
  Crosshair,
  Play,
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  Ship,
  Minimize2,
  Grid3X3,
  Eye,
  Camera,
  Share2,
  PanelRightClose,
  PanelRightOpen,
  ImageDown,
  FolderOpen,
  Save,
  Copy,
  Clock3,
  Home,
  CircleHelp,
  Mouse,
  Link2,
  Facebook,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CONTAINER_PRESETS,
  cuInToCuFt,
  packIntoContainers,
  recommendContainer,
  type CargoItem,
  type ContainerRecommendation,
  type ContainerSpec,
  type LoadPriority,
  type MultiContainerResult,
  type PalletType,
  type PlacedBox,
  type RotationMode,
} from "@/lib/containerPacking";
import { mergeImportedCargoItems, type ImportedCargoRow } from "@/lib/containerImport";
import {
  alignManualSelection,
  findSafeManualPlacement,
  rotateManualSelection,
  translateManualSelection,
  validateManualLayout,
  validateManualPlacement,
  type ManualAlignment,
  type ManualRotationDirection,
} from "@/lib/containerLayout";
import { calculateContainerBalance, centerContainerCargoLayout } from "@/lib/containerBalance";
import { compareContainerPlans, type ContainerPlanComparison } from "@/lib/containerComparison";
import { consumePalletPlanTransfer } from "@/lib/palletTransfer";
import { consumeContainerShareTransfer } from "@/lib/containerShareTransfer";
import { getContainerRenderProfile, type ContainerRenderQuality } from "@/lib/container3dQuality";
import {
  buildContainerPlanReview,
  diagnoseUnplacedCargo,
  type PlanReviewItem,
} from "@/lib/containerPlanInsights";
import { buildContainerPlacementCsv } from "@/lib/containerPlanExport";
import {
  duplicateContainerProject,
  persistContainerDraft,
  persistContainerProjects,
  readContainerDraft,
  readContainerProjects,
  saveContainerProject,
  type ContainerProjectSnapshot,
  type SavedContainerProject,
} from "@/lib/containerProjects";

const IN_TO_CM = 2.54;
const CM_TO_IN = 1 / IN_TO_CM;
const LB_TO_KG = 0.453592;
const KG_TO_LB = 1 / LB_TO_KG;

type BulkApplyScope = "all" | "selected" | "defaults";
type ResultWorkspaceTab = "overview" | "plan" | "details";
type ContainerViewPreset = "isometric" | "doors" | "side" | "top";
type CargoWorkspaceZone = "dock1" | "loaded" | "dock2";
type StagingDock = Exclude<CargoWorkspaceZone, "loaded">;
type StagedCargo = {
  id: string;
  zone: StagingDock;
  box: PlacedBox;
};
type ShareLifetimeDays = 7 | 30 | 90 | 180;
type ManagedShareLink = {
  token: string;
  url: string;
  expiresAt: string;
  revokeToken: string;
};

const CARGO_COLORS = [
  "#8FD8C9", "#A9C9F7", "#F2C6A0", "#C8B5F2", "#EEAFC3",
  "#9EDCE8", "#C7D0DB", "#F4B69B", "#A9D9AE", "#D8B3E6",
  "#A7BFF2", "#BBD99D", "#EDB6C6", "#A9D4E8", "#E3B6D9",
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function ContainerLineIcon({
  active = false,
  className = "h-12 w-20",
  short = false,
}: {
  active?: boolean;
  className?: string;
  short?: boolean;
}) {
  const start = short ? 26 : 8;
  const front = start + 20;
  const end = 112;
  const ribXs = Array.from(
    { length: short ? 5 : 7 },
    (_, index) => front + 10 + index * ((end - front - 16) / (short ? 4 : 6)),
  );
  const stroke = active ? "#007BFF" : "#64748b";

  return (
    <svg viewBox="0 0 120 66" className={className} aria-hidden="true">
      <ellipse cx="64" cy="58" rx={short ? 39 : 52} ry="4" fill="#0f172a" opacity="0.08" />
      <path
        d={`M${start} 18 91 7l21 10-66 13Z`}
        fill={active ? "#dbeafe" : "#eef2f7"}
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d={`M${front} 30 112 17v31L${front} 60Z`}
        fill={active ? "#eff6ff" : "#ffffff"}
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d={`M${start} 18l${front - start} 12v30L${start} 49Z`}
        fill={active ? "#bfdbfe" : "#e2e8f0"}
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {ribXs.map((x) => (
        <path
          key={x}
          d={`M${x} ${30 - (x - front) * 0.19}v29`}
          stroke={active ? "#93c5fd" : "#cbd5e1"}
          strokeWidth="1.15"
        />
      ))}
      <path d={`M${start + 10} 24v30M${start} 33l${front - start} 11`} stroke={active ? "#60a5fa" : "#94a3b8"} strokeWidth="1" />
      <path d={`M${start + 6} 37v7m8-3v7`} stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CargoMixPanel({ placed, unitSystem }: { placed: PlacedBox[]; unitSystem: "imperial" | "metric" }) {
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; color: string; pieces: number; weightLbs: number; volumeCuFt: number }>();
    placed.forEach(box => {
      const key = `${box.cargoId}:${box.cargoName}`;
      const current = map.get(key) || { name: box.cargoName || "Cargo", color: box.color, pieces: 0, weightLbs: 0, volumeCuFt: 0 };
      current.pieces += 1;
      current.weightLbs += box.weight;
      current.volumeCuFt += cuInToCuFt(box.l * box.w * box.h);
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.volumeCuFt - a.volumeCuFt);
  }, [placed]);
  const totalVolume = groups.reduce((sum, group) => sum + group.volumeCuFt, 0);
  const metric = unitSystem === "metric";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" data-testid="cargo-mix-panel">
      <div className="mb-3 flex items-center justify-between">
        <div><p className="text-xs font-bold text-slate-900">Cargo breakdown</p><p className="mt-0.5 text-[10px] text-slate-500">Share of loaded volume</p></div>
        <Badge variant="outline" className="text-[10px]">{placed.length} units</Badge>
      </div>
      <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {groups.map(group => <div key={`${group.name}-${group.color}`} style={{ width: `${totalVolume > 0 ? group.volumeCuFt / totalVolume * 100 : 0}%`, backgroundColor: group.color }} title={`${group.name}: ${totalVolume > 0 ? (group.volumeCuFt / totalVolume * 100).toFixed(1) : 0}%`} />)}
      </div>
      <div className="space-y-2.5">
        {groups.slice(0, 6).map(group => (
          <div key={`${group.name}-${group.color}`} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-[11px]">
            <div className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: group.color }} /><span className="truncate font-semibold text-slate-700">{group.name}</span></div>
            <span className="text-slate-500">{group.pieces} pcs</span>
            <span className="min-w-16 text-right font-medium text-slate-700">{metric ? `${(group.weightLbs * LB_TO_KG).toFixed(0)} kg` : `${group.weightLbs.toFixed(0)} lb`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanReviewPanel({ items }: { items: PlanReviewItem[] }) {
  const appearance = {
    pass: { icon: CheckCircle2, iconClass: "text-emerald-600", boxClass: "border-emerald-100 bg-emerald-50/55", label: "Ready" },
    warning: { icon: AlertTriangle, iconClass: "text-amber-600", boxClass: "border-amber-100 bg-amber-50/55", label: "Review" },
    action: { icon: X, iconClass: "text-rose-600", boxClass: "border-rose-100 bg-rose-50/60", label: "Action" },
    manual: { icon: Settings2, iconClass: "text-sky-600", boxClass: "border-sky-100 bg-sky-50/55", label: "Manual" },
  } as const;

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4" data-testid="plan-review-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Plan review</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">Checks that matter before the plan is handed to a loading crew</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">4 operational checks</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const style = appearance[item.status];
          const StatusIcon = style.icon;
          return (
            <div key={item.id} className={`rounded-lg border p-3 ${style.boxClass}`} data-testid={`plan-review-${item.id}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${style.iconClass}`} />
                  <p className="text-xs font-bold text-slate-800">{item.label}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${style.iconClass}`}>{style.label}</span>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">{item.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function inToM(inches: number) {
  return inches * 0.0254;
}

function placementTextForValidation(reason: "inside" | "collision" | "unsupported" | null) {
  if (reason === "collision") return "That position overlaps another cargo item.";
  if (reason === "unsupported") return "That position would leave stacked cargo without enough support.";
  if (reason === "inside") return "Cargo must remain fully inside the container.";
  return "Valid position.";
}

export type SnapshotExportFn = () => { iso: string; top: string; sideA: string; front: string } | null;

function ViewerHoverLabel({ children, side = "left" }: { children: string; side?: "left" | "right" | "bottom" }) {
  const position = side === "right"
    ? "left-full top-1/2 ml-2 -translate-y-1/2"
    : side === "bottom"
      ? "left-1/2 top-full mt-2 -translate-x-1/2"
      : "right-full top-1/2 mr-2 -translate-y-1/2";
  return <span role="tooltip" className={`pointer-events-none absolute z-[80] w-max max-w-48 rounded-lg border border-slate-700/10 bg-slate-950 px-2 py-1 text-[9px] font-semibold leading-4 text-white opacity-0 shadow-lg group-hover:opacity-100 group-focus-visible:opacity-100 ${position}`}>{children}</span>;
}

function ContainerFallback2D({
  placed,
  container,
  onRetry,
}: {
  placed: PlacedBox[];
  container: ContainerSpec;
  onRetry: () => void;
}) {
  const padding = Math.max(3, container.widthIn * 0.04);
  const labelSize = Math.max(3, container.widthIn * 0.045);

  return (
    <div
      className="w-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-5"
      data-testid="container-3d-viewer"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">2D Load Preview</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive 3D could not start in this browser session, so the same loading plan is shown from above.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 gap-1.5 bg-white"
          data-testid="button-retry-3d"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry 3D
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-inner">
        <svg
          viewBox={`${-padding} ${-padding} ${container.lengthIn + padding * 2} ${container.widthIn + padding * 2}`}
          className="block w-full h-[220px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Top view of ${placed.length} loaded pieces inside ${container.name}`}
        >
          <rect
            x="0"
            y="0"
            width={container.lengthIn}
            height={container.widthIn}
            rx="2"
            fill="#e2e8f0"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {placed.map((box, index) => {
            const canLabel = box.l >= labelSize * 2.2 && box.w >= labelSize * 1.5;
            return (
              <g key={`${box.cargoId}-${index}`}>
                <rect
                  x={box.x + 0.5}
                  y={box.z + 0.5}
                  width={Math.max(0.5, box.l - 1)}
                  height={Math.max(0.5, box.w - 1)}
                  rx="1"
                  fill={box.color}
                  fillOpacity="0.76"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
                {canLabel && (
                  <text
                    x={box.x + box.l / 2}
                    y={box.z + box.w / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={labelSize}
                    fontWeight="700"
                    fill="#ffffff"
                    stroke="rgba(15,23,42,0.45)"
                    strokeWidth="0.35"
                    paintOrder="stroke"
                  >
                    {index + 1}
                  </text>
                )}
              </g>
            );
          })}
          <line
            x1={container.lengthIn}
            y1="0"
            x2={container.lengthIn}
            y2={container.widthIn}
            stroke="#0f7fe5"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 text-[11px] text-slate-500">
        <span>Universal SVG preview — no graphics hardware required</span>
        <span className="font-medium text-slate-600">Dashed blue line: container doors</span>
      </div>
    </div>
  );
}

export function ContainerViewer3D({
  placed,
  container,
  unitSystem,
  onReadyExport,
  onPlacedChange,
  onExportPdf,
  onExportCsv,
  onSharePlan,
  shareUrl,
  onSaveProject,
  onOpenProjects,
  onEditCargo,
  onEditContainer,
  planIndex = 0,
  planCount = 1,
  onPreviousPlan,
  onNextPlan,
  rotationModesByCargoId,
}: {
  placed: PlacedBox[];
  container: ContainerSpec;
  unitSystem: "imperial" | "metric";
  onReadyExport?: (fn: SnapshotExportFn | null) => void;
  onPlacedChange?: (nextPlaced: PlacedBox[]) => void;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
  onSharePlan?: () => void;
  shareUrl?: string | null;
  onSaveProject?: () => void;
  onOpenProjects?: () => void;
  onEditCargo?: () => void;
  onEditContainer?: () => void;
  planIndex?: number;
  planCount?: number;
  onPreviousPlan?: () => void;
  onNextPlan?: () => void;
  rotationModesByCargoId?: Record<string, RotationMode>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const [rendererAttempt, setRendererAttempt] = useState(0);
  const [arrangeMode, setArrangeMode] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [placementMessage, setPlacementMessage] = useState("Select a cargo item and drag it to a new position.");
  const [sequenceMode, setSequenceMode] = useState(false);
  const [sequenceStep, setSequenceStep] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<ContainerViewPreset>("isometric");
  const [showGrid, setShowGrid] = useState(true);
  const [showShell, setShowShell] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [renderQuality, setRenderQuality] = useState<ContainerRenderQuality>("auto");
  const [hoveredCargoIndex, setHoveredCargoIndex] = useState<number | null>(null);
  const [selectedCargoIndices, setSelectedCargoIndices] = useState<Set<number>>(new Set());
  const [movementStep, setMovementStep] = useState<"fine" | "coarse">("fine");
  const selectedCargoIndicesRef = useRef<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [activeCargoZone, setActiveCargoZone] = useState<CargoWorkspaceZone>("loaded");
  const [displayControlsOpen, setDisplayControlsOpen] = useState(false);
  const [warningPanelOpen, setWarningPanelOpen] = useState(false);
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [placementSummaryOpen, setPlacementSummaryOpen] = useState(false);
  const [balanceSummaryOpen, setBalanceSummaryOpen] = useState(false);
  const [expandedCargoGroups, setExpandedCargoGroups] = useState<Set<string>>(new Set());
  const [stagedCargo, setStagedCargo] = useState<StagedCargo[]>([]);
  const stagingMutationRef = useRef(false);
  const arrangementHistoryRef = useRef<PlacedBox[][]>([]);
  const arrangementRedoRef = useRef<PlacedBox[][]>([]);
  const optimizedLayoutRef = useRef<PlacedBox[]>(placed.map((box) => ({ ...box })));
  const optimizedLayoutIdentityRef = useRef("");
  const cameraViewRef = useRef<{
    containerId: string;
    position: [number, number, number];
    target: [number, number, number];
  } | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    cargoMeshes: THREE.Mesh[];
    gridObjects: THREE.Object3D[];
    containerGroup: THREE.Group;
    setCargoHover: (index: number | null) => void;
    setView: (preset: ContainerViewPreset) => void;
    render: () => void;
  } | null>(null);

  const sequenceOrder = useMemo(
    () => placed
      .map((box, index) => ({ box, index }))
      .sort((a, b) => (
        a.box.x - b.box.x ||
        a.box.y - b.box.y ||
        a.box.z - b.box.z
      ))
      .map((entry) => entry.index),
    [placed],
  );
  const sequenceCargo = sequenceStep > 0
    ? placed[sequenceOrder[Math.min(sequenceStep, sequenceOrder.length) - 1]]
    : null;

  const layoutIdentity = useMemo(
    () => `${container.id}:${placed.map((box) => `${box.cargoId}:${box.l}:${box.w}:${box.h}`).join("|")}`,
    [container.id, placed],
  );

  const loadSummary = useMemo(() => {
    const usedLength = placed.reduce((max, box) => Math.max(max, box.x + box.l), 0);
    const usedWidth = placed.reduce((max, box) => Math.max(max, box.z + box.w), 0);
    const usedHeight = placed.reduce((max, box) => Math.max(max, box.y + box.h), 0);
    const totalWeight = placed.reduce((sum, box) => sum + box.weight, 0);
    const usedVolumeCuFt = placed.reduce((sum, box) => sum + (box.l * box.w * box.h) / 1728, 0);
    return { usedLength, usedWidth, usedHeight, totalWeight, usedVolumeCuFt };
  }, [placed]);
  const stagedByZone = useMemo(() => ({
    dock1: stagedCargo.filter((entry) => entry.zone === "dock1"),
    dock2: stagedCargo.filter((entry) => entry.zone === "dock2"),
  }), [stagedCargo]);
  const cargoGroups = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; color: string; indexes: number[]; weight: number; box: PlacedBox }>();
    placed.forEach((box, index) => {
      const id = box.cargoId || `${box.cargoName}-${box.l}-${box.w}-${box.h}`;
      const existing = groups.get(id);
      if (existing) {
        existing.indexes.push(index);
        existing.weight += box.weight;
      } else {
        groups.set(id, { id, name: box.cargoName || `Cargo ${groups.size + 1}`, color: box.color, indexes: [index], weight: box.weight, box });
      }
    });
    return [...groups.values()];
  }, [placed]);
  const balance = useMemo(() => calculateContainerBalance(placed, container), [placed, container]);
  const volumeUtilization = container.volumeCuFt > 0 ? (loadSummary.usedVolumeCuFt / container.volumeCuFt) * 100 : 0;
  const payloadUtilization = container.maxPayloadLbs > 0 ? (loadSummary.totalWeight / container.maxPayloadLbs) * 100 : 0;
  const hasPlacementWarning = /invalid|unsupported|overlap|outside|must remain|cannot|exceed|no collision-safe|would leave/i.test(placementMessage);

  useEffect(() => {
    if (cargoGroups.length === 0) return;
    setExpandedCargoGroups((current) => current.size > 0 ? current : new Set([cargoGroups[0].id]));
  }, [cargoGroups]);

  useEffect(() => {
    selectedCargoIndicesRef.current = selectedCargoIndices;
    sceneRef.current?.setCargoHover(hoveredCargoIndex);
  }, [hoveredCargoIndex, selectedCargoIndices]);

  const toggleFullscreen = useCallback(async () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    try {
      if (document.fullscreenElement === workspace) {
        await document.exitFullscreen();
      } else if (workspace.requestFullscreen) {
        await workspace.requestFullscreen();
      } else {
        setIsFullscreen((current) => !current);
      }
    } catch {
      setIsFullscreen((current) => !current);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === workspaceRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (optimizedLayoutIdentityRef.current === layoutIdentity) return;
    if (stagingMutationRef.current) {
      stagingMutationRef.current = false;
      optimizedLayoutIdentityRef.current = layoutIdentity;
      return;
    }
    optimizedLayoutIdentityRef.current = layoutIdentity;
    optimizedLayoutRef.current = placed.map((box) => ({ ...box }));
    arrangementHistoryRef.current = [];
    arrangementRedoRef.current = [];
    setHistoryCount(0);
    setRedoCount(0);
    setStagedCargo([]);
    setSelectedCargoIndices(new Set());
  }, [layoutIdentity, placed]);

  const undoArrangement = useCallback(() => {
    const previous = arrangementHistoryRef.current.pop();
    if (!previous) return;
    arrangementRedoRef.current = [
      ...arrangementRedoRef.current,
      placed.map((box) => ({ ...box })),
    ].slice(-20);
    setHistoryCount(arrangementHistoryRef.current.length);
    setRedoCount(arrangementRedoRef.current.length);
    setPlacementMessage("Previous cargo position restored.");
    const currentColors = new Map(placed.map((box) => [box.cargoId, box.color]));
    onPlacedChange?.(previous.map((box) => ({
      ...box,
      color: currentColors.get(box.cargoId) ?? box.color,
    })));
  }, [onPlacedChange, placed]);

  const redoArrangement = useCallback(() => {
    const next = arrangementRedoRef.current.pop();
    if (!next) return;
    arrangementHistoryRef.current = [
      ...arrangementHistoryRef.current,
      placed.map((box) => ({ ...box })),
    ].slice(-20);
    setHistoryCount(arrangementHistoryRef.current.length);
    setRedoCount(arrangementRedoRef.current.length);
    setPlacementMessage("Cargo move reapplied.");
    const currentColors = new Map(placed.map((box) => [box.cargoId, box.color]));
    onPlacedChange?.(next.map((box) => ({
      ...box,
      color: currentColors.get(box.cargoId) ?? box.color,
    })));
  }, [onPlacedChange, placed]);

  const toggleCargoSelection = useCallback((index: number, additive = true) => {
    setSelectedCargoIndices((current) => {
      const next = additive ? new Set(current) : new Set<number>();
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const applySelectionAlignment = useCallback((alignment: ManualAlignment) => {
    const selected = [...selectedCargoIndices].filter((index) => placed[index]);
    if (!selected.length) {
      setPlacementMessage("Select one or more cargo units before using alignment controls.");
      return;
    }
    const nextLayout = alignManualSelection(placed, selected, container, alignment);
    if (!nextLayout) {
      setPlacementMessage("That alignment would overlap cargo or break stack support, so the current layout was kept.");
      setWarningPanelOpen(true);
      return;
    }
    arrangementHistoryRef.current = [
      ...arrangementHistoryRef.current,
      placed.map((box) => ({ ...box })),
    ].slice(-20);
    arrangementRedoRef.current = [];
    setHistoryCount(arrangementHistoryRef.current.length);
    setRedoCount(0);
    setPlacementMessage(`${selected.length} selected cargo unit${selected.length === 1 ? "" : "s"} aligned safely.`);
    onPlacedChange?.(nextLayout);
  }, [container, onPlacedChange, placed, selectedCargoIndices]);

  const applySelectionRotation = useCallback((direction: ManualRotationDirection) => {
    const selected = [...selectedCargoIndices].filter((index) => placed[index]);
    if (!selected.length) {
      setPlacementMessage("Select one or more cargo units before rotating.");
      return;
    }
    const locked = selected.some((index) => rotationModesByCargoId?.[placed[index].cargoId] === "fixed");
    if (locked) {
      setPlacementMessage("This selection includes fixed-orientation cargo and cannot be rotated.");
      setWarningPanelOpen(true);
      return;
    }
    const nextLayout = rotateManualSelection(placed, selected, container, direction);
    if (!nextLayout) {
      setPlacementMessage("That rotation would overlap cargo, exceed the container, or lose stack support.");
      setWarningPanelOpen(true);
      return;
    }
    arrangementHistoryRef.current = [
      ...arrangementHistoryRef.current,
      placed.map((box) => ({ ...box })),
    ].slice(-20);
    arrangementRedoRef.current = [];
    setHistoryCount(arrangementHistoryRef.current.length);
    setRedoCount(0);
    setPlacementMessage(`${selected.length} selected cargo unit${selected.length === 1 ? "" : "s"} rotated safely.`);
    onPlacedChange?.(nextLayout);
  }, [container, onPlacedChange, placed, rotationModesByCargoId, selectedCargoIndices]);

  const movementStepIn = unitSystem === "metric"
    ? (movementStep === "fine" ? 1 : 10) / IN_TO_CM
    : movementStep === "fine" ? 1 : 6;

  const nudgeSelection = useCallback((deltaX: number, deltaZ: number) => {
    const selected = [...selectedCargoIndices].filter((index) => placed[index]);
    if (!selected.length) {
      setPlacementMessage("Select cargo before using the position controls.");
      return;
    }
    const nextLayout = translateManualSelection(placed, selected, deltaX, deltaZ);
    const validation = validateManualLayout(nextLayout, container);
    if (!validation.valid) {
      setPlacementMessage(placementTextForValidation(validation.reason));
      setWarningPanelOpen(true);
      return;
    }
    arrangementHistoryRef.current = [
      ...arrangementHistoryRef.current,
      placed.map((box) => ({ ...box })),
    ].slice(-20);
    arrangementRedoRef.current = [];
    setHistoryCount(arrangementHistoryRef.current.length);
    setRedoCount(0);
    setPlacementMessage(`${selected.length} selected cargo unit${selected.length === 1 ? "" : "s"} moved safely.`);
    onPlacedChange?.(nextLayout);
  }, [container, onPlacedChange, placed, selectedCargoIndices]);

  const resetArrangement = useCallback(() => {
    arrangementHistoryRef.current = [];
    arrangementRedoRef.current = [];
    setHistoryCount(0);
    setRedoCount(0);
    setPlacementMessage("The optimized loading plan has been restored.");
    setSelectedCargoIndices(new Set());
    const restoringStagedCargo = stagedCargo.length > 0;
    setStagedCargo([]);
    stagingMutationRef.current = restoringStagedCargo;
    const currentColors = new Map(placed.map((box) => [box.cargoId, box.color]));
    onPlacedChange?.(optimizedLayoutRef.current.map((box) => ({
      ...box,
      color: currentColors.get(box.cargoId) ?? box.color,
    })));
  }, [onPlacedChange, placed, stagedCargo.length]);

  const stageCargo = useCallback((index: number, zone: StagingDock) => {
    const selected = placed[index];
    if (!selected) return;
    const nextPlaced = placed.filter((_, placedIndex) => placedIndex !== index).map((box) => ({ ...box }));
    const remainingLayout = validateManualLayout(nextPlaced, container);
    if (!remainingLayout.valid) {
      setPlacementMessage("Move the cargo resting above this item first; staging it would leave cargo unsupported.");
      setWarningPanelOpen(true);
      return;
    }
    arrangementHistoryRef.current = [];
    arrangementRedoRef.current = [];
    setHistoryCount(0);
    setRedoCount(0);
    setHoveredCargoIndex(null);
    setSelectedCargoIndices(new Set());
    setStagedCargo((current) => [
      ...current,
      {
        id: `${selected.cargoId}-${Date.now()}-${index}`,
        zone,
        box: { ...selected },
      },
    ]);
    stagingMutationRef.current = true;
    onPlacedChange?.(nextPlaced);
    setPlacementMessage(`${selected.cargoName || "Cargo item"} moved to ${zone === "dock1" ? "Dock 1" : "Dock 2"}.`);
    setActiveCargoZone(zone);
  }, [container, onPlacedChange, placed]);

  const loadStagedCargo = useCallback((stagedId: string) => {
    const staged = stagedCargo.find((entry) => entry.id === stagedId);
    if (!staged) return;
    const safePlacement = findSafeManualPlacement(staged.box, placed, container);
    if (!safePlacement) {
      setPlacementMessage("No collision-safe space is available. Move loaded cargo or choose a larger container.");
      setWarningPanelOpen(true);
      return;
    }
    arrangementHistoryRef.current = [];
    arrangementRedoRef.current = [];
    setHistoryCount(0);
    setRedoCount(0);
    setSelectedCargoIndices(new Set());
    setStagedCargo((current) => current.filter((entry) => entry.id !== stagedId));
    stagingMutationRef.current = true;
    onPlacedChange?.([...placed.map((box) => ({ ...box })), safePlacement]);
    setPlacementMessage(`${safePlacement.cargoName || "Cargo item"} loaded from the staging dock.`);
    setActiveCargoZone("loaded");
  }, [container, onPlacedChange, placed, stagedCargo]);

  useEffect(() => {
    const handleEditorShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redoArrangement();
        else undoArrangement();
      } else if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoArrangement();
      } else if (arrangeMode && selectedCargoIndicesRef.current.size > 0 && !modifier && event.key === "ArrowUp") {
        event.preventDefault();
        nudgeSelection(-movementStepIn, 0);
      } else if (arrangeMode && selectedCargoIndicesRef.current.size > 0 && !modifier && event.key === "ArrowDown") {
        event.preventDefault();
        nudgeSelection(movementStepIn, 0);
      } else if (arrangeMode && selectedCargoIndicesRef.current.size > 0 && !modifier && event.key === "ArrowLeft") {
        event.preventDefault();
        nudgeSelection(0, -movementStepIn);
      } else if (arrangeMode && selectedCargoIndicesRef.current.size > 0 && !modifier && event.key === "ArrowRight") {
        event.preventDefault();
        nudgeSelection(0, movementStepIn);
      } else if (arrangeMode && selectedCargoIndicesRef.current.size > 0 && !modifier && event.key.toLowerCase() === "q") {
        event.preventDefault();
        applySelectionRotation("counterclockwise");
      } else if (arrangeMode && selectedCargoIndicesRef.current.size > 0 && !modifier && event.key.toLowerCase() === "e") {
        event.preventDefault();
        applySelectionRotation("clockwise");
      } else if (event.key === "Escape") {
        setArrangeMode(false);
        setSequenceMode(false);
        setDisplayControlsOpen(false);
        setWarningPanelOpen(false);
        setHelpPanelOpen(false);
        setSharePanelOpen(false);
        setMobilePanelOpen(false);
      }
    };
    window.addEventListener("keydown", handleEditorShortcut);
    return () => window.removeEventListener("keydown", handleEditorShortcut);
  }, [applySelectionRotation, arrangeMode, movementStepIn, nudgeSelection, redoArrangement, undoArrangement]);

  useEffect(() => {
    if (!mountRef.current || webglError) return;

    const el = mountRef.current;
    const w = Math.max(el.clientWidth, 320);
    const h = Math.max(el.clientHeight, 300);
    const deviceNavigator = navigator as Navigator & { deviceMemory?: number };
    const renderProfile = getContainerRenderProfile({
      quality: renderQuality,
      viewportWidth: w,
      devicePixelRatio: window.devicePixelRatio || 1,
      itemCount: placed.length + stagedCargo.length,
      deviceMemoryGb: deviceNavigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
    });

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: renderProfile.antialias,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
        });
      } catch {
        onReadyExport?.(null);
        setWebglError(true);
        return;
      }
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(renderProfile.pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.08;
    // Keep the planning canvas diagram-like and crisp. Scene shadows made the
    // transparent container look heavy and obscured cargo when zoomed out.
    renderer.shadowMap.enabled = false;
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onReadyExport?.(null);
      if (rendererAttempt < 2) {
        window.setTimeout(() => setRendererAttempt((attempt) => attempt + 1), 200);
      } else {
        setWebglError(true);
      }
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);

    const cL = inToM(container.lengthIn);
    const cW = inToM(container.widthIn);
    const cH = inToM(container.heightIn);

    const applyViewportComposition = (viewportWidth: number, viewportHeight: number) => {
      camera.clearViewOffset();
      if (sidebarOpen && viewportWidth >= 1024) {
        // Render one uninterrupted scene, but compose the load in the open
        // space to the left of the floating 320px inspector.
        camera.setViewOffset(viewportWidth + 344, viewportHeight, 344, 0, viewportWidth, viewportHeight);
      }
      camera.updateProjectionMatrix();
    };
    applyViewportComposition(w, h);

    camera.position.set(cL * 1.4, cH * 1.65, cW * 2.35);
    camera.lookAt(cL / 2, cH * 0.38, cW / 2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = isFullscreen;
    controls.rotateSpeed = 0.62;
    controls.zoomSpeed = 0.78;
    controls.panSpeed = 0.55;
    controls.target.set(cL / 2, cH * 0.38, cW / 2);
    controls.minDistance = 1;
    controls.maxDistance = 30;
    if (cameraViewRef.current?.containerId === container.id) {
      camera.position.fromArray(cameraViewRef.current.position);
      controls.target.fromArray(cameraViewRef.current.target);
    }
    controls.update();

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dee5, 1.34));
    scene.add(new THREE.AmbientLight(0xffffff, 0.58));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.48);
    dirLight.position.set(cL, cH * 2, cW * 1.5);
    dirLight.castShadow = false;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = Math.max(cL, cW) * 5;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe8f3ff, 0.78);
    fillLight.position.set(-cL, cH, -cW);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.38);
    rimLight.position.set(cL * 0.2, cH * 1.4, cW * 2.2);
    scene.add(rimLight);

    const gridSize = Math.max(cL, cW) * 18;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(gridSize * 1.4, gridSize * 1.4),
      new THREE.MeshStandardMaterial({ color: 0xe6eaef, roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cL / 2, -0.035, cW / 2);
    ground.receiveShadow = false;
    scene.add(ground);

    const gridDivisions = renderProfile.gridDivisions;
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0xd2d9e1, 0xffffff);
    grid.position.set(cL / 2, -0.02, cW / 2);
    if (Array.isArray(grid.material)) {
      grid.material.forEach((m) => {
        (m as THREE.LineBasicMaterial).transparent = true;
        (m as THREE.LineBasicMaterial).opacity = 0.72;
      });
    } else {
      (grid.material as THREE.LineBasicMaterial).transparent = true;
      (grid.material as THREE.LineBasicMaterial).opacity = 0.72;
    }
    scene.add(grid);

    const gridObjects: THREE.Object3D[] = [ground, grid];
    ground.visible = showGrid;
    grid.visible = showGrid;

    // Two quiet staging areas make the loading direction immediately clear
    // and leave room for the upcoming dock-based manual workflow.
    const createDockOutline = (zMin: number, zMax: number) => {
      const xMin = -cL * 0.12;
      const xMax = cL * 1.12;
      const radius = Math.min(cL * 0.08, (zMax - zMin) * 0.18);
      const points: THREE.Vector3[] = [];
      const addCorner = (cx: number, cz: number, startAngle: number) => {
        for (let step = 0; step <= 8; step++) {
          const angle = startAngle + (Math.PI / 2) * (step / 8);
          points.push(new THREE.Vector3(cx + Math.cos(angle) * radius, -0.005, cz + Math.sin(angle) * radius));
        }
      };
      addCorner(xMax - radius, zMin + radius, -Math.PI / 2);
      addCorner(xMax - radius, zMax - radius, 0);
      addCorner(xMin + radius, zMax - radius, Math.PI / 2);
      addCorner(xMin + radius, zMin + radius, Math.PI);
      points.push(points[0].clone());
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({ color: 0x89939f, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.62 });
      const outline = new THREE.Line(geometry, material);
      outline.computeLineDistances();
      outline.visible = showGrid;
      scene.add(outline);
      gridObjects.push(outline);
    };
    const dockDepth = cW * 1.5;
    const dockGap = cW * 0.28;
    createDockOutline(-dockGap - dockDepth, -dockGap);
    createDockOutline(cW + dockGap, cW + dockGap + dockDepth);

    const containerGroup = new THREE.Group();
    containerGroup.name = "container-shell";
    containerGroup.visible = showShell;
    scene.add(containerGroup);

    const containerEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(cL, cH, cW));
    const containerWire = new THREE.LineSegments(
      containerEdges,
      new THREE.LineBasicMaterial({ color: 0x718096, transparent: true, opacity: 0.46 })
    );
    containerWire.position.set(cL / 2, cH / 2, cW / 2);
    containerGroup.add(containerWire);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(cL, 0.035, cW),
      new THREE.MeshStandardMaterial({ color: 0xbfc6ce, roughness: 0.96, metalness: 0.02 }),
    );
    floor.position.set(cL / 2, -0.015, cW / 2);
    floor.receiveShadow = false;
    containerGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe4e9ef,
      transparent: true,
      opacity: 0.12,
      roughness: 0.42,
      metalness: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(cW, cH), wallMat);
    backWall.position.set(0, cH / 2, cW / 2);
    backWall.rotation.y = Math.PI / 2;
    containerGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(cL, cH), wallMat);
    leftWall.position.set(cL / 2, cH / 2, 0);
    containerGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(cL, cH), wallMat);
    rightWall.position.set(cL / 2, cH / 2, cW);
    containerGroup.add(rightWall);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(cL, cW), wallMat.clone());
    (ceiling.material as THREE.MeshStandardMaterial).opacity = 0.045;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(cL / 2, cH, cW / 2);
    containerGroup.add(ceiling);

    // Subtle corrugation makes the shell read like a real ISO container while
    // keeping the wall transparent enough to inspect the load.
    const ribPoints: THREE.Vector3[] = [];
    const ribCount = Math.max(renderProfile.performanceMode ? 8 : 12, Math.round(cL / (renderProfile.performanceMode ? 0.95 : 0.55)));
    for (let index = 1; index < ribCount; index++) {
      const x = (cL * index) / ribCount;
      for (const z of [0.008, cW - 0.008]) {
        ribPoints.push(new THREE.Vector3(x, cH * 0.05, z), new THREE.Vector3(x, cH * 0.95, z));
      }
    }
    const ribs = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(ribPoints),
      new THREE.LineBasicMaterial({ color: 0xaab3bd, transparent: true, opacity: 0.18 }),
    );
    containerGroup.add(ribs);

    const doorX = cL;
    const doorLineMaterial = new THREE.LineBasicMaterial({ color: 0x687684, transparent: true, opacity: 0.58 });
    const doorPanelMaterial = new THREE.MeshBasicMaterial({ color: 0xf2f5f8, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
    const doorOpeningDetails = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(doorX + 0.002, 0, cW / 2), new THREE.Vector3(doorX + 0.002, cH, cW / 2),
      ]),
      doorLineMaterial.clone(),
    );
    containerGroup.add(doorOpeningDetails);

    const createOpenDoor = (side: "left" | "right") => {
      const direction = side === "left" ? 1 : -1;
      const door = new THREE.Group();
      const doorWidth = cW * 0.49;
      door.position.set(doorX + 0.006, 0, side === "left" ? 0 : cW);
      door.rotation.y = direction * THREE.MathUtils.degToRad(26);

      const panel = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, cH), doorPanelMaterial.clone());
      panel.rotation.y = Math.PI / 2;
      panel.position.set(0, cH / 2, direction * doorWidth / 2);
      door.add(panel);

      const freeEdge = direction * doorWidth;
      const lockZ = direction * doorWidth * 0.56;
      const doorOutline = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, cH, 0),
          new THREE.Vector3(0, cH, 0), new THREE.Vector3(0, cH, freeEdge),
          new THREE.Vector3(0, cH, freeEdge), new THREE.Vector3(0, 0, freeEdge),
          new THREE.Vector3(0, 0, freeEdge), new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, cH * 0.5, 0), new THREE.Vector3(0, cH * 0.5, freeEdge),
          new THREE.Vector3(0, cH * 0.12, lockZ), new THREE.Vector3(0, cH * 0.88, lockZ),
          new THREE.Vector3(0, cH * 0.42, lockZ), new THREE.Vector3(0, cH * 0.42, lockZ + direction * doorWidth * 0.16),
        ]),
        doorLineMaterial.clone(),
      );
      doorOutline.renderOrder = 8;
      door.add(doorOutline);

      containerGroup.add(door);
    };
    createOpenDoor("left");
    createOpenDoor("right");

    const formatSceneLength = (inches: number) =>
      unitSystem === "metric"
        ? `${(inches * IN_TO_CM).toFixed(0)} cm`
        : `${inches.toFixed(1)} in`;
    const cargoMeshes: THREE.Mesh[] = [];
    const hoverMeasurementGroup = new THREE.Group();
    hoverMeasurementGroup.visible = false;
    scene.add(hoverMeasurementGroup);
    let activeMeasurementIndex: number | null = null;
    const createMeasurementLabel = (text: string, scale: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      canvas.height = 80;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.roundRect(4, 4, 376, 72, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(100,116,139,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#475569";
      ctx.font = "600 28px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 192, 41);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      sprite.scale.set(scale, scale * 0.208, 1);
      sprite.renderOrder = 20;
      return sprite;
    };
    const createRulerLabel = (text: string, scale: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 56;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "rgba(71,85,105,0.9)";
      ctx.font = "600 23px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 28);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      sprite.scale.set(scale, scale * 0.219, 1);
      sprite.renderOrder = 18;
      return sprite;
    };
    const rulerOffset = Math.max(0.16, cW * 0.16);
    const rulerZ = cW + rulerOffset;
    const rulerY = 0.025;
    const rulerTick = Math.max(0.045, cW * 0.035);
    const rulerMaterial = new THREE.LineBasicMaterial({ color: 0x718096, transparent: true, opacity: 0.56, depthTest: false });
    const rulerPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, rulerY, rulerZ), new THREE.Vector3(cL, rulerY, rulerZ),
      new THREE.Vector3(0, rulerY, cW), new THREE.Vector3(0, rulerY, rulerZ + rulerTick),
      new THREE.Vector3(cL, rulerY, cW), new THREE.Vector3(cL, rulerY, rulerZ + rulerTick),
    ];
    const rulerValuesIn: number[] = [0];
    const preferredStepIn = unitSystem === "metric" ? 200 / IN_TO_CM : 96;
    for (let value = preferredStepIn; value < container.lengthIn; value += preferredStepIn) rulerValuesIn.push(value);
    rulerValuesIn.push(container.lengthIn);
    rulerValuesIn.forEach((valueIn) => {
      const x = inToM(valueIn);
      rulerPoints.push(
        new THREE.Vector3(x, rulerY, rulerZ - rulerTick),
        new THREE.Vector3(x, rulerY, rulerZ + rulerTick),
      );
      const label = createRulerLabel(formatSceneLength(valueIn), Math.max(0.42, Math.min(0.62, cW * 0.26)));
      label.position.set(x, rulerY + 0.035, rulerZ + rulerTick * 2.4);
      containerGroup.add(label);
    });
    const lengthRuler = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rulerPoints), rulerMaterial);
    lengthRuler.renderOrder = 17;
    containerGroup.add(lengthRuler);

    // Width and height callouts complete the container envelope without a
    // separate header card. They stay in the scene and move with the model.
    const endGuideX = cL + rulerOffset * 0.72;
    const envelopeGuides = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(cL, rulerY, 0), new THREE.Vector3(endGuideX, rulerY, 0),
        new THREE.Vector3(cL, rulerY, cW), new THREE.Vector3(endGuideX, rulerY, cW),
        new THREE.Vector3(endGuideX, rulerY, 0), new THREE.Vector3(endGuideX, rulerY, cW),
        new THREE.Vector3(0, 0, rulerZ), new THREE.Vector3(0, cH, rulerZ),
        new THREE.Vector3(0, 0, cW), new THREE.Vector3(0, 0, rulerZ + rulerTick),
        new THREE.Vector3(0, cH, cW), new THREE.Vector3(0, cH, rulerZ + rulerTick),
      ]),
      rulerMaterial.clone(),
    );
    envelopeGuides.renderOrder = 17;
    containerGroup.add(envelopeGuides);
    const widthLabel = createRulerLabel(`W ${formatSceneLength(container.widthIn)}`, Math.max(0.5, Math.min(0.74, cW * 0.31)));
    widthLabel.position.set(endGuideX + 0.035, rulerY + 0.04, cW / 2);
    containerGroup.add(widthLabel);
    const heightLabel = createRulerLabel(`H ${formatSceneLength(container.heightIn)}`, Math.max(0.5, Math.min(0.74, cH * 0.28)));
    heightLabel.material.rotation = Math.PI / 2;
    heightLabel.position.set(0, cH / 2, rulerZ + rulerTick * 2.2);
    containerGroup.add(heightLabel);

    const addMeasurementRange = (group: THREE.Group, startX: number, endX: number, y: number, z: number, label: string) => {
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x718096, transparent: true, opacity: 0.72, depthTest: false });
      const tick = Math.max(cW * 0.035, 0.045);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(startX, y, z), new THREE.Vector3(endX, y, z),
        new THREE.Vector3(startX, y, cW), new THREE.Vector3(startX, y, z + tick),
        new THREE.Vector3(endX, y, cW), new THREE.Vector3(endX, y, z + tick),
      ]);
      const lines = new THREE.LineSegments(geometry, lineMaterial);
      lines.renderOrder = 19;
      group.add(lines);
      const labelSprite = createMeasurementLabel(label, Math.max(0.62, Math.min(cL * 0.22, Math.max(0.8, endX - startX) * 0.72)));
      labelSprite.position.set((startX + endX) / 2, y + Math.max(0.06, cH * 0.025), z);
      group.add(labelSprite);
    };
    const clearHoverMeasurements = () => {
      while (hoverMeasurementGroup.children.length > 0) {
        const child = hoverMeasurementGroup.children.pop()!;
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        } else if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      }
    };
    const updateHoverMeasurements = (index: number | null) => {
      if (index === activeMeasurementIndex) return;
      activeMeasurementIndex = index;
      clearHoverMeasurements();
      const box = index === null ? null : placed[index];
      if (!box) {
        hoverMeasurementGroup.visible = false;
        return;
      }
      const bX = inToM(box.x);
      const bL = inToM(box.l);
      const measurementY = rulerY + 0.012;
      const measurementZ = rulerZ;
      addMeasurementRange(hoverMeasurementGroup, 0, bX, measurementY, measurementZ, `Back ${formatSceneLength(box.x)}`);
      addMeasurementRange(hoverMeasurementGroup, bX + bL, cL, measurementY, measurementZ, `Doors ${formatSceneLength(Math.max(0, container.lengthIn - box.x - box.l))}`);
      hoverMeasurementGroup.visible = true;
    };
    for (let idx = 0; idx < placed.length; idx++) {
      const box = placed[idx];
      const bL = inToM(box.l);
      const bW = inToM(box.w);
      const bH = inToM(box.h);
      const bX = inToM(box.x);
      const bY = inToM(box.y);
      const bZ = inToM(box.z);

      const boxGeo = new THREE.BoxGeometry(bL * 0.996, bH * 0.996, bW * 0.996);
      const baseColor = new THREE.Color(box.color);
      const luminance = baseColor.r * 0.2126 + baseColor.g * 0.7152 + baseColor.b * 0.0722;
      const displayColor = baseColor.clone().lerp(new THREE.Color(0xffffff), luminance < 0.45 ? 0.34 : 0.1);

      const useDetailedLabel = showLabels && renderProfile.detailedLabels;
      let materials: THREE.Material;
      if (useDetailedLabel) {
        const unitReference = `#${idx + 1}`;
        const canvas = document.createElement("canvas");
        canvas.width = 192;
        canvas.height = 192;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = displayColor.getStyle();
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(71,85,105,0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#334155";
        ctx.font = "bold 36px Inter, Arial, sans-serif";
        ctx.fillText(unitReference, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 1;
        materials = new THREE.MeshStandardMaterial({
          map: texture,
          color: 0xffffff,
          transparent: true,
          opacity: 0.76,
          roughness: 0.92,
          metalness: 0,
        });
      } else {
        materials = new THREE.MeshStandardMaterial({
          color: displayColor,
          transparent: true,
          opacity: 0.76,
          roughness: 0.92,
          metalness: 0,
        });
      }

      const boxMesh = new THREE.Mesh(boxGeo, materials);
      boxMesh.position.set(bX + bL / 2, bY + bH / 2, bZ + bW / 2);
      boxMesh.castShadow = false;
      boxMesh.receiveShadow = false;
      boxMesh.userData = {
        placedIndex: idx,
        cargoId: box.cargoId,
        cargoName: box.cargoName || "Cargo item",
        l: bL,
        w: bW,
        h: bH,
        origL: box.l,
        origW: box.w,
      };
      scene.add(boxMesh);
      cargoMeshes.push(boxMesh);

      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(bL, bH, bW));
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x66717d,
        transparent: true,
        opacity: 0.34,
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(boxMesh.position);
      edges.userData = { linkedTo: idx };
      boxMesh.userData.linkedEdges = edges;
      scene.add(edges);
    }

    const stagedMeshes: THREE.Mesh[] = [];
    const dockCursors: Record<StagingDock, number> = { dock1: 0, dock2: 0 };
    const dockRows: Record<StagingDock, number> = { dock1: 0, dock2: 0 };
    for (const staged of stagedCargo) {
      const { box, zone } = staged;
      const bL = inToM(box.l);
      const bW = inToM(box.w);
      const bH = inToM(box.h);
      const gap = 0.04;
      if (dockCursors[zone] + bL > cL) {
        dockCursors[zone] = 0;
        dockRows[zone] += 1;
      }
      const dockCenterZ = zone === "dock1" ? -dockGap - dockDepth / 2 : cW + dockGap + dockDepth / 2;
      const rowDirection = zone === "dock1" ? -1 : 1;
      const rowOffset = dockRows[zone] * Math.max(bW + gap, cW * 0.32) * rowDirection;
      const stagedMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bL * 0.996, bH * 0.996, bW * 0.996),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(box.color).lerp(new THREE.Color(0xffffff), 0.2),
          transparent: true,
          opacity: 0.7,
          roughness: 0.92,
          metalness: 0,
        }),
      );
      stagedMesh.position.set(dockCursors[zone] + bL / 2, bH / 2, dockCenterZ + rowOffset);
      stagedMesh.castShadow = false;
      stagedMesh.receiveShadow = false;
      stagedMesh.userData = { stagedId: staged.id, zone };
      scene.add(stagedMesh);
      stagedMeshes.push(stagedMesh);

      const stagedEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(bL, bH, bW)),
        new THREE.LineBasicMaterial({ color: 0x737d88, transparent: true, opacity: 0.4 }),
      );
      stagedEdges.position.copy(stagedMesh.position);
      scene.add(stagedEdges);
      dockCursors[zone] += bL + gap;
    }

    function addAxisLabel(text: string, pos: THREE.Vector3) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 28px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, 128, 40);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(pos);
      sprite.scale.set(cL * 0.3, cL * 0.075, 1);
      scene.add(sprite);
    }

    addAxisLabel("DOCK 1", new THREE.Vector3(cL / 2, 0.015, -dockGap - dockDepth / 2));
    addAxisLabel("DOCK 2", new THREE.Vector3(cL / 2, 0.015, cW + dockGap + dockDepth / 2));

    let renderFrameId: number | null = null;
    const renderScene = () => {
      if (renderFrameId !== null) return;
      renderFrameId = window.requestAnimationFrame(() => {
        renderFrameId = null;
        renderer.render(scene, camera);
      });
    };

    const setView = (preset: ContainerViewPreset) => {
      camera.up.set(0, 1, 0);
      controls.target.set(cL / 2, cH * 0.4, cW / 2);
      if (preset === "doors") {
        camera.position.set(cL * 1.42, cH * 0.82, cW * 0.5);
      } else if (preset === "side") {
        camera.position.set(cL * 0.52, cH * 0.78, cW * 3.05);
      } else if (preset === "top") {
        camera.up.set(0, 0, -1);
        camera.position.set(cL * 0.5, Math.max(cL * 1.05, cH * 3.4), cW * 0.5);
      } else {
        camera.position.set(cL * 1.35, cH * 1.62, cW * 2.35);
      }
      camera.lookAt(controls.target);
      controls.update();
      renderScene();
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragIntersection = new THREE.Vector3();
    type DragState = {
      pointerId: number;
      mesh: THREE.Mesh;
      index: number;
      indices: number[];
      startPositions: Map<number, THREE.Vector3>;
      offset: THREE.Vector3;
      plane: THREE.Plane;
      nextLayout: PlacedBox[] | null;
      dropZone: StagingDock | null;
      valid: boolean;
    };
    let dragState: DragState | null = null;

    const updatePointer = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    };

    const highlightMesh = (mesh: THREE.Mesh, color: number | null) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        material.emissive.setHex(color ?? 0x000000);
        material.emissiveIntensity = color === null ? 0 : 0.24;
      });
    };

    const setCargoHover = (index: number | null) => {
      updateHoverMeasurements(index);
      cargoMeshes.forEach((mesh) => {
        const active = index === (mesh.userData.placedIndex as number);
        const selected = selectedCargoIndicesRef.current.has(mesh.userData.placedIndex as number);
        const linkedEdges = mesh.userData.linkedEdges as THREE.LineSegments | undefined;
        if (linkedEdges) {
          const material = linkedEdges.material as THREE.LineBasicMaterial;
          material.color.setHex(active ? 0x0f78c7 : selected ? 0x4f73d9 : 0x66717d);
          material.opacity = active || selected ? 0.82 : 0.34;
          material.needsUpdate = true;
          linkedEdges.scale.setScalar(active || selected ? 1.008 : 1);
        }
        if (!dragState || dragState.mesh !== mesh) {
          highlightMesh(mesh, active ? 0x38bdf8 : selected ? 0x60a5fa : null);
        }
      });
      renderScene();
    };

    const moveMesh = (mesh: THREE.Mesh, position: THREE.Vector3) => {
      mesh.position.copy(position);
      const linkedEdges = mesh.userData.linkedEdges as THREE.LineSegments | undefined;
      linkedEdges?.position.copy(position);
    };

    const placementText = (reason: "inside" | "collision" | "unsupported" | null) => {
      if (reason === "collision") return "That position overlaps another cargo item.";
      if (reason === "unsupported") return "That position would leave stacked cargo without enough support.";
      if (reason === "inside") return "Cargo must remain fully inside the container.";
      return "Valid position — release to place cargo.";
    };

    let inspectionPointer: { pointerId: number; clientX: number; clientY: number; index: number } | null = null;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      updatePointer(event);
      const stagedIntersection = raycaster.intersectObjects(stagedMeshes, false)[0];
      if (arrangeMode && stagedIntersection?.object instanceof THREE.Mesh) {
        const stagedId = stagedIntersection.object.userData.stagedId as string | undefined;
        if (stagedId) {
          event.preventDefault();
          event.stopPropagation();
          loadStagedCargo(stagedId);
          return;
        }
      }
      const intersection = raycaster.intersectObjects(cargoMeshes, false)[0];
      if (!intersection || !(intersection.object instanceof THREE.Mesh)) return;

      if (!arrangeMode) {
        inspectionPointer = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          index: intersection.object.userData.placedIndex as number,
        };
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const mesh = intersection.object;
      const index = mesh.userData.placedIndex as number;
      if (event.shiftKey) {
        const next = new Set(selectedCargoIndicesRef.current);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        selectedCargoIndicesRef.current = next;
        setSelectedCargoIndices(next);
        setCargoHover(index);
        setPlacementMessage(`${next.size} cargo unit${next.size === 1 ? "" : "s"} selected. Shift-click or use the cargo list to change the group.`);
        return;
      }
      const indices = selectedCargoIndicesRef.current.has(index)
        ? [...selectedCargoIndicesRef.current].filter((selectedIndex) => placed[selectedIndex])
        : [index];
      if (!selectedCargoIndicesRef.current.has(index)) {
        const next = new Set([index]);
        selectedCargoIndicesRef.current = next;
        setSelectedCargoIndices(next);
      }
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -mesh.position.y);
      if (!raycaster.ray.intersectPlane(plane, dragIntersection)) return;

      dragState = {
        pointerId: event.pointerId,
        mesh,
        index,
        indices,
        startPositions: new Map(indices.map((selectedIndex) => [selectedIndex, cargoMeshes[selectedIndex].position.clone()])),
        offset: dragIntersection.clone().sub(mesh.position),
        plane,
        nextLayout: null,
        dropZone: null,
        valid: false,
      };
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
      orbiting = false;
      controls.enabled = false;
      indices.forEach((selectedIndex) => highlightMesh(cargoMeshes[selectedIndex], 0x0ea5e9));
      setPlacementMessage(indices.length > 1
        ? `Moving ${indices.length} selected units together — relative spacing and stack heights stay locked.`
        : "Drag horizontally — floor and supported stack levels snap automatically.");
      renderScene();
    };

    let currentHoverIndex: number | null = null;
    let orbiting = false;
    let interactionResolutionActive = false;
    const setInteractionResolution = (active: boolean) => {
      if (interactionResolutionActive === active) return;
      interactionResolutionActive = active;
      renderer.setPixelRatio(active ? Math.min(renderProfile.pixelRatio, 0.85) : renderProfile.pixelRatio);
    };
    const handleOrbitStart = () => {
      if (dragState) return;
      orbiting = true;
      setInteractionResolution(true);
      if (currentHoverIndex !== null) {
        currentHoverIndex = null;
        setHoveredCargoIndex(null);
        setCargoHover(null);
      }
      renderer.domElement.style.cursor = "grabbing";
    };
    const handleOrbitEnd = () => {
      orbiting = false;
      setInteractionResolution(false);
      renderer.domElement.style.cursor = arrangeMode ? "grab" : "default";
      renderScene();
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState) {
        if (orbiting) return;
        if (event.pointerType === "touch") return;
        updatePointer(event);
        const intersection = raycaster.intersectObjects(cargoMeshes, false)[0];
        const stagedIntersection = intersection ? null : raycaster.intersectObjects(stagedMeshes, false)[0];
        const nextIndex = intersection?.object instanceof THREE.Mesh
          ? intersection.object.userData.placedIndex as number
          : null;
        if (nextIndex !== currentHoverIndex) {
          currentHoverIndex = nextIndex;
          setHoveredCargoIndex(nextIndex);
          setCargoHover(nextIndex);
        }
        renderer.domElement.style.cursor = nextIndex !== null
          ? arrangeMode ? "grab" : "pointer"
          : arrangeMode && stagedIntersection ? "pointer" : "default";
        return;
      }
      if (dragState.pointerId !== event.pointerId) return;
      event.preventDefault();
      updatePointer(event);
      if (!raycaster.ray.intersectPlane(dragState.plane, dragIntersection)) return;

      const mesh = dragState.mesh;
      const halfLength = (mesh.userData.l as number) / 2;
      const halfWidth = (mesh.userData.w as number) / 2;
      const halfHeight = (mesh.userData.h as number) / 2;
      const snap = inToM(1);
      const unclampedX = dragIntersection.x - dragState.offset.x;
      const unclampedZ = dragIntersection.z - dragState.offset.z;
      const candidateDock: StagingDock | null = dragState.indices.length === 1
        ? unclampedZ >= -dockGap - dockDepth && unclampedZ <= -dockGap
          ? "dock1"
          : unclampedZ >= cW + dockGap && unclampedZ <= cW + dockGap + dockDepth
            ? "dock2"
            : null
        : null;
      if (candidateDock) {
        const dockMin = candidateDock === "dock1" ? -dockGap - dockDepth : cW + dockGap;
        const dockMax = candidateDock === "dock1" ? -dockGap : cW + dockGap + dockDepth;
        const dockX = Math.min(cL - halfLength, Math.max(halfLength, unclampedX));
        const dockZ = Math.min(dockMax - halfWidth, Math.max(dockMin + halfWidth, unclampedZ));
        dragState.dropZone = candidateDock;
        dragState.nextLayout = null;
        dragState.valid = true;
        moveMesh(mesh, new THREE.Vector3(dockX, halfHeight, dockZ));
        highlightMesh(mesh, 0x10b981);
        setPlacementMessage(`Release to move this unit to ${candidateDock === "dock1" ? "Dock 1" : "Dock 2"}.`);
        renderScene();
        return;
      }
      dragState.dropZone = null;
      const nextX = Math.min(cL - halfLength, Math.max(halfLength, Math.round(unclampedX / snap) * snap));
      const nextZ = Math.min(cW - halfWidth, Math.max(halfWidth, Math.round(unclampedZ / snap) * snap));
      const current = placed[dragState.index];
      if (dragState.indices.length > 1) {
        const selectedBoxes = dragState.indices.map((index) => placed[index]);
        const minX = Math.min(...selectedBoxes.map((box) => box.x));
        const maxX = Math.max(...selectedBoxes.map((box) => box.x + box.l));
        const minZ = Math.min(...selectedBoxes.map((box) => box.z));
        const maxZ = Math.max(...selectedBoxes.map((box) => box.z + box.w));
        const desiredDeltaX = Math.round((((nextX - halfLength) / 0.0254) - current.x));
        const desiredDeltaZ = Math.round((((nextZ - halfWidth) / 0.0254) - current.z));
        const deltaX = Math.min(container.lengthIn - maxX, Math.max(-minX, desiredDeltaX));
        const deltaZ = Math.min(container.widthIn - maxZ, Math.max(-minZ, desiredDeltaZ));
        const nextLayout = translateManualSelection(placed, dragState.indices, deltaX, deltaZ);
        const validation = validateManualLayout(nextLayout, container);
        dragState.nextLayout = nextLayout;
        dragState.valid = validation.valid;
        dragState.indices.forEach((selectedIndex) => {
          const start = dragState!.startPositions.get(selectedIndex)!;
          moveMesh(cargoMeshes[selectedIndex], new THREE.Vector3(start.x + inToM(deltaX), start.y, start.z + inToM(deltaZ)));
          highlightMesh(cargoMeshes[selectedIndex], validation.valid ? 0x10b981 : 0xef4444);
        });
        setPlacementMessage(validation.valid
          ? `${dragState.indices.length} units can be placed here safely.`
          : placementText(validation.reason));
        renderScene();
        return;
      }
      const horizontalCandidate: PlacedBox = {
        ...current,
        x: Number(((nextX - halfLength) / 0.0254).toFixed(3)),
        z: Number(((nextZ - halfWidth) / 0.0254).toFixed(3)),
      };
      const otherBoxes = placed.filter((_, index) => index !== dragState!.index);
      const verticalLevels = Array.from(new Set([
        current.y,
        0,
        ...otherBoxes.filter((box) => box.stackable).map((box) => Number((box.y + box.h).toFixed(3))),
      ]))
        .filter((level) => level >= 0 && level + current.h <= container.heightIn + 0.05)
        .sort((a, b) => Math.abs(a - current.y) - Math.abs(b - current.y));

      let candidate = horizontalCandidate;
      for (const level of verticalLevels) {
        const levelCandidate = { ...horizontalCandidate, y: level };
        if (validateManualPlacement(levelCandidate, otherBoxes, container).valid) {
          candidate = levelCandidate;
          break;
        }
      }
      const nextLayout = placed.map((box, index) => index === dragState!.index ? candidate : box);
      const validation = validateManualLayout(nextLayout, container);
      const nextPosition = new THREE.Vector3(nextX, inToM(candidate.y) + halfHeight, nextZ);

      dragState.nextLayout = nextLayout;
      dragState.valid = validation.valid;
      moveMesh(mesh, nextPosition);
      highlightMesh(mesh, validation.valid ? 0x10b981 : 0xef4444);
      setPlacementMessage(
        validation.valid && Math.abs(candidate.y - current.y) > 0.05
          ? candidate.y <= 0.05
            ? "Valid position — cargo snapped safely to the container floor."
            : "Valid position — cargo snapped safely onto a supported level."
          : placementText(validation.reason),
      );
      renderScene();
    };

    const finishDrag = (event: PointerEvent, commit: boolean) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const completedDrag = dragState;
      dragState = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      controls.enabled = true;
      orbiting = false;
      renderer.domElement.style.cursor = arrangeMode ? "grab" : "default";
      completedDrag.indices.forEach((index) => highlightMesh(cargoMeshes[index], null));

      const moved = completedDrag.indices.some((index) => {
        const start = completedDrag.startPositions.get(index);
        return Boolean(start && start.distanceTo(cargoMeshes[index].position) > 0.001);
      });
      if (commit && moved && completedDrag.dropZone && completedDrag.indices.length === 1) {
        const start = completedDrag.startPositions.get(completedDrag.index);
        if (start) moveMesh(completedDrag.mesh, start);
        stageCargo(completedDrag.index, completedDrag.dropZone);
        setCargoHover(null);
      } else if (commit && moved && completedDrag.valid && completedDrag.nextLayout) {
        arrangementHistoryRef.current = [
          ...arrangementHistoryRef.current,
          placed.map((box) => ({ ...box })),
        ].slice(-20);
        arrangementRedoRef.current = [];
        setHistoryCount(arrangementHistoryRef.current.length);
        setRedoCount(0);
        setPlacementMessage(completedDrag.indices.length > 1
          ? `${completedDrag.indices.length} cargo units moved safely. You can undo or continue adjusting.`
          : "Cargo placed safely. You can undo or continue adjusting.");
        onPlacedChange?.(completedDrag.nextLayout.map((box) => ({ ...box })));
      } else {
        completedDrag.indices.forEach((index) => {
          const start = completedDrag.startPositions.get(index);
          if (start) moveMesh(cargoMeshes[index], start);
        });
        if (moved && !completedDrag.valid) {
          setPlacementMessage("Invalid move cancelled — the previous position was restored.");
        }
      }
      setCargoHover(currentHoverIndex);
      renderScene();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (inspectionPointer?.pointerId === event.pointerId) {
        const movement = Math.hypot(event.clientX - inspectionPointer.clientX, event.clientY - inspectionPointer.clientY);
        if (movement < 7) {
          setHoveredCargoIndex(inspectionPointer.index);
          setCargoHover(inspectionPointer.index);
          setActiveCargoZone("loaded");
          if (event.pointerType === "touch") setMobilePanelOpen(true);
        }
        inspectionPointer = null;
        return;
      }
      finishDrag(event, true);
    };
    const handlePointerCancel = (event: PointerEvent) => {
      inspectionPointer = null;
      finishDrag(event, false);
    };
    const handlePointerLeave = () => {
      if (dragState) return;
      inspectionPointer = null;
      currentHoverIndex = null;
      setHoveredCargoIndex(null);
      setCargoHover(null);
    };

    renderer.domElement.style.cursor = arrangeMode ? "grab" : "default";
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerCancel);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    controls.addEventListener("start", handleOrbitStart);
    controls.addEventListener("end", handleOrbitEnd);
    controls.addEventListener("change", renderScene);
    renderScene();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      cargoMeshes,
      gridObjects,
      containerGroup,
      setCargoHover,
      setView,
      render: renderScene,
    };

    if (onReadyExport) {
      const exportSnapshots: SnapshotExportFn = () => {
        const s = sceneRef.current;
        if (!s) return null;
        const { renderer: r, scene: sc, camera: cam, controls: ctrl } = s;

        const savedPos = cam.position.clone();
        const savedTarget = ctrl.target.clone();
        const savedVisibility = cargoMeshes.map((mesh) => ({
          mesh,
          visible: mesh.visible,
          edge: mesh.userData.linkedEdges as THREE.LineSegments | undefined,
          edgeVisible: (mesh.userData.linkedEdges as THREE.LineSegments | undefined)?.visible,
        }));
        savedVisibility.forEach(({ mesh, edge }) => {
          mesh.visible = true;
          if (edge) edge.visible = true;
        });

        const centerX = cL / 2;
        const centerY = cH / 3;
        const centerZ = cW / 2;

        const capture = (px: number, py: number, pz: number) => {
          cam.position.set(px, py, pz);
          cam.lookAt(centerX, centerY, centerZ);
          cam.updateProjectionMatrix();
          r.render(sc, cam);
          return r.domElement.toDataURL("image/png");
        };

        const iso = capture(cL * 1.5, cH * 1.8, cW * 2.5);
        const top = capture(centerX, Math.max(cL, cW) * 2.5, centerZ + 0.01);
        const sideA = capture(centerX, cH * 0.8, cW * 3);
        const front = capture(cL * 2.5, cH * 0.8, centerZ);

        cam.position.copy(savedPos);
        ctrl.target.copy(savedTarget);
        cam.lookAt(savedTarget.x, savedTarget.y, savedTarget.z);
        cam.updateProjectionMatrix();
        ctrl.update();
        savedVisibility.forEach(({ mesh, visible, edge, edgeVisible }) => {
          mesh.visible = visible;
          if (edge) edge.visible = edgeVisible ?? visible;
        });
        r.render(sc, cam);

        return { iso, top, sideA, front };
      };
      onReadyExport(exportSnapshots);
    }

    const handleResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh;
      applyViewportComposition(nw, nh);
      renderer.setSize(nw, nh);
      renderScene();
    };
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(el);
    window.addEventListener("resize", handleResize);

    return () => {
      cameraViewRef.current = {
        containerId: container.id,
        position: camera.position.toArray() as [number, number, number],
        target: controls.target.toArray() as [number, number, number],
      };
      sceneRef.current = null;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerCancel);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      controls.removeEventListener("start", handleOrbitStart);
      controls.removeEventListener("end", handleOrbitEnd);
      controls.removeEventListener("change", renderScene);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      controls.dispose();
      if (renderFrameId !== null) window.cancelAnimationFrame(renderFrameId);
      const disposeMaterial = (material: THREE.Material) => {
        const map = (material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.SpriteMaterial).map;
        map?.dispose();
        material.dispose();
      };
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(obj.material);
          }
        } else if (obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(obj.material);
          }
        } else if (obj instanceof THREE.Sprite) {
          disposeMaterial(obj.material);
        }
      });
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [
    placed,
    container,
    unitSystem,
    arrangeMode,
    rendererAttempt,
    webglError,
    isFullscreen,
    showGrid,
    showShell,
    showLabels,
    renderQuality,
    sidebarOpen,
    stagedCargo,
    loadStagedCargo,
    stageCargo,
  ]);

  useEffect(() => {
    sceneRef.current?.setView(activeView);
  }, [activeView]);

  useEffect(() => {
    const sceneState = sceneRef.current;
    if (!sceneState) return;
    const visibleIndexes = new Set(sequenceOrder.slice(0, sequenceStep));
    sceneState.cargoMeshes.forEach((mesh) => {
      const index = mesh.userData.placedIndex as number;
      const visible = !sequenceMode || visibleIndexes.has(index);
      mesh.visible = visible;
      const linkedEdges = mesh.userData.linkedEdges as THREE.LineSegments | undefined;
      if (linkedEdges) linkedEdges.visible = visible;
    });
    sceneState.render();
  }, [sequenceMode, sequenceStep, sequenceOrder]);

  useEffect(() => {
    setSequenceStep((current) => Math.min(Math.max(current, placed.length > 0 ? 1 : 0), placed.length));
  }, [placed.length]);

  const fmt = (inches: number) => {
    if (unitSystem === "metric") return `${(inches * IN_TO_CM).toFixed(1)} cm`;
    return `${inches.toFixed(1)} in`;
  };

  const cycleCameraView = () => {
    const views: ContainerViewPreset[] = ["isometric", "doors", "side", "top"];
    const next = views[(views.indexOf(activeView) + 1) % views.length];
    setActiveView(next);
  };

  const resetCameraView = () => {
    setActiveView("isometric");
    sceneRef.current?.setView("isometric");
    setDisplayControlsOpen(false);
    setWarningPanelOpen(false);
  };

  const runExternalAction = (action?: () => void) => {
    if (!action) return;
    if (document.fullscreenElement === workspaceRef.current) {
      document.exitFullscreen().then(action).catch(action);
      return;
    }
    action();
  };

  const currentShareUrl = () => shareUrl || (!onSharePlan && typeof window !== "undefined" ? window.location.href : "");

  const shareCurrentView = () => {
    const url = currentShareUrl();
    if (!url && onSharePlan) {
      runExternalAction(onSharePlan);
      return;
    }
    if (navigator.share) {
      navigator.share({ title: `${container.name} loading plan`, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(url).then(() => setPlacementMessage("Share link copied.")).catch(() => undefined);
  };

  const copyShareLink = () => {
    const url = currentShareUrl();
    if (!url) {
      setSharePanelOpen(false);
      runExternalAction(onSharePlan);
      return;
    }
    navigator.clipboard?.writeText(url).then(() => setPlacementMessage("Share link copied.")).catch(() => undefined);
    setSharePanelOpen(false);
  };

  const openShareTarget = (target: "email" | "facebook" | "linkedin" | "whatsapp") => {
    const url = currentShareUrl();
    if (!url) {
      setSharePanelOpen(false);
      runExternalAction(onSharePlan);
      return;
    }
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(`${container.name} loading plan`);
    const destinations = {
      email: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Open the loading plan: ${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };
    window.open(destinations[target], "_blank", "noopener,noreferrer");
    setSharePanelOpen(false);
  };

  const toggleCargoGroup = (groupId: string) => {
    setExpandedCargoGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleCargoGroupSelection = (indexes: number[]) => {
    setArrangeMode(true);
    setSequenceMode(false);
    setSelectedCargoIndices((current) => {
      const next = new Set(current);
      const allSelected = indexes.every((index) => next.has(index));
      indexes.forEach((index) => allSelected ? next.delete(index) : next.add(index));
      return next;
    });
    setPlacementMessage(`${indexes.length} cargo unit${indexes.length === 1 ? "" : "s"} ready for safe adjustment.`);
  };

  const downloadCurrentSnapshot = () => {
    const sceneState = sceneRef.current;
    if (!sceneState) return;
    sceneState.render();
    const link = document.createElement("a");
    link.download = `container-loading-${container.id}.png`;
    link.href = sceneState.renderer.domElement.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      ref={workspaceRef}
      className={`bg-white ${isFullscreen ? "h-screen w-screen overflow-hidden p-3 sm:p-4" : "rounded-xl"}`}
      data-testid="container-viewer-workspace"
    >
      <h2 className="sr-only">Interactive 3D container loading workspace</h2>
      {webglError ? (
        <ContainerFallback2D
          placed={placed}
          container={container}
          onRetry={() => {
            setRendererAttempt(0);
            setWebglError(false);
          }}
        />
      ) : (
        <div className={`relative min-h-0 ${isFullscreen ? "h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)]" : "h-[540px] md:h-[620px] xl:h-[700px]"}`}>
        <div
          className="relative h-full min-h-0 w-full overflow-hidden rounded-xl border border-slate-200/90 bg-[#e6eaef]"
          data-testid="container-3d-viewer"
        >
          <div ref={mountRef} className="absolute inset-0" />
          <div className="absolute left-3 top-3 z-30 flex items-center gap-2">
            <div className="relative" data-testid="container-scene-actions">
              <button type="button" onClick={() => { setDisplayControlsOpen((current) => !current); setSharePanelOpen(false); setWarningPanelOpen(false); setHelpPanelOpen(false); }} className={`group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/95 bg-white/[0.94] transition duration-150 hover:-translate-y-0.5 hover:scale-105 hover:text-primary hover:shadow-md ${displayControlsOpen ? "text-primary shadow-sm" : "text-slate-600"}`} aria-label="Scene settings" data-testid="button-floating-settings"><Settings2 className="h-4 w-4" />{!displayControlsOpen && <ViewerHoverLabel side="right">Scene settings</ViewerHoverLabel>}</button>
              {displayControlsOpen && (
                <div className="absolute left-0 top-12 w-64 rounded-2xl border border-white/95 bg-white/[0.98] p-3 text-left text-slate-700 shadow-[0_20px_55px_-22px_rgba(15,23,42,0.32)]" data-testid="floating-display-controls">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Scene settings</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">{[
                    { label: "Grid", active: showGrid, set: setShowGrid, icon: Grid3X3 },
                    { label: "Shell", active: showShell, set: setShowShell, icon: Eye },
                    { label: "Refs", active: showLabels, set: setShowLabels, icon: Box },
                  ].map(({ label, active, set, icon: Icon }) => <button key={label} type="button" onClick={() => set(!active)} className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-[9px] font-bold transition hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-blue-200 bg-blue-50 text-primary" : "border-slate-200 bg-slate-100 text-slate-400"}`} aria-pressed={active} data-testid={`button-container-layer-${label === "Refs" ? "labels" : label.toLowerCase()}`}><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"><Icon className="h-3.5 w-3.5" /></span>{label}</button>)}</div>
                  <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Camera angle</p>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">{([ ["isometric", "3D"], ["doors", "Doors"], ["side", "Side"], ["top", "Top"] ] as const).map(([preset, label]) => <button key={preset} type="button" onClick={() => setActiveView(preset)} className={`rounded-lg border px-1 py-2 text-[9px] font-bold transition ${activeView === preset ? "border-blue-300 bg-blue-50 text-primary" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`} aria-pressed={activeView === preset} data-testid={`button-container-view-${preset}`}>{label}</button>)}</div>
                  <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Rendering</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">{([ ["auto", "Auto"], ["performance", "Fast"], ["quality", "High"] ] as const).map(([quality, label]) => <button key={quality} type="button" onClick={() => setRenderQuality(quality)} className={`rounded-lg border px-1 py-2 text-[9px] font-bold transition ${renderQuality === quality ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`} aria-pressed={renderQuality === quality} data-testid={`button-container-quality-${quality}`}>{label}</button>)}</div>
                </div>
              )}
            </div>
            {arrangeMode && <><button type="button" onClick={undoArrangement} disabled={historyCount === 0} className="h-8 rounded-lg border border-white/80 bg-white/95 px-2.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-white disabled:opacity-40" data-testid="button-undo-cargo-move"><Undo2 className="mr-1 inline h-3.5 w-3.5" />Undo</button><button type="button" onClick={redoArrangement} disabled={redoCount === 0} className="h-8 rounded-lg border border-white/80 bg-white/95 px-2.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-white disabled:opacity-40" data-testid="button-redo-cargo-move"><Redo2 className="mr-1 inline h-3.5 w-3.5" />Redo</button><button type="button" onClick={resetArrangement} className="h-8 rounded-lg border border-white/80 bg-white/95 px-2.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-white" data-testid="button-reset-cargo-layout"><RotateCcw className="mr-1 inline h-3.5 w-3.5" />Reset</button></>}
          </div>
          {arrangeMode && selectedCargoIndices.size > 0 && (
            <div className="absolute left-3 top-14 z-20 w-[min(430px,calc(100%-5rem))] rounded-2xl border border-white/90 bg-white/[0.98] p-3 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.5)]" data-testid="cargo-group-controls">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{selectedCargoIndices.size} selected</p>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-[9px] font-bold">
                  <button type="button" onClick={() => setMovementStep("fine")} className={`rounded-md px-2 py-1 ${movementStep === "fine" ? "bg-white text-primary shadow-sm" : "text-slate-400"}`} aria-pressed={movementStep === "fine"}>{unitSystem === "metric" ? "1 cm" : "1 in"}</button>
                  <button type="button" onClick={() => setMovementStep("coarse")} className={`rounded-md px-2 py-1 ${movementStep === "coarse" ? "bg-white text-primary shadow-sm" : "text-slate-400"}`} aria-pressed={movementStep === "coarse"}>{unitSystem === "metric" ? "10 cm" : "6 in"}</button>
                  <button type="button" onClick={() => setSelectedCargoIndices(new Set())} className="rounded-md px-2 py-1 text-slate-400 hover:bg-white hover:text-slate-700">Clear</button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[8px] font-bold text-slate-500 sm:grid-cols-6">
                <button type="button" onClick={() => applySelectionRotation("counterclockwise")} className="flex min-h-10 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-primary" aria-label="Rotate selected cargo left" title="Rotate 90° left (Q)" data-testid="button-rotate-selection-left"><RotateCcw className="h-3.5 w-3.5" /><span>Left 90°</span></button>
                <button type="button" onClick={() => nudgeSelection(-movementStepIn, 0)} className="flex min-h-10 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-primary" aria-label="Move selected cargo toward the closed end" title="Move toward closed end (↑)" data-testid="button-nudge-closed-end"><ArrowUp className="h-3.5 w-3.5" /><span>Closed</span></button>
                <button type="button" onClick={() => applySelectionRotation("clockwise")} className="flex min-h-10 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-primary" aria-label="Rotate selected cargo right" title="Rotate 90° right (E)" data-testid="button-rotate-selection-right"><RotateCw className="h-3.5 w-3.5" /><span>Right 90°</span></button>
                <button type="button" onClick={() => nudgeSelection(0, -movementStepIn)} className="flex min-h-10 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-primary" aria-label="Move selected cargo toward side A" title="Move toward side A (←)" data-testid="button-nudge-side-a"><ArrowLeft className="h-3.5 w-3.5" /><span>Side A</span></button>
                <button type="button" onClick={() => nudgeSelection(movementStepIn, 0)} className="flex min-h-10 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-primary" aria-label="Move selected cargo toward the doors" title="Move toward doors (↓)" data-testid="button-nudge-doors"><ArrowDown className="h-3.5 w-3.5" /><span>Doors</span></button>
                <button type="button" onClick={() => nudgeSelection(0, movementStepIn)} className="flex min-h-10 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-primary" aria-label="Move selected cargo toward side B" title="Move toward side B (→)" data-testid="button-nudge-side-b"><ArrowRight className="h-3.5 w-3.5" /><span>Side B</span></button>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1 text-[8px] sm:grid-cols-6">{([ ["closed-end", "Align closed"], ["length-center", "Length ctr"], ["doors", "Align doors"], ["side-a", "Align A"], ["width-center", "Width ctr"], ["side-b", "Align B"] ] as const).map(([alignment, label]) => <button key={alignment} type="button" onClick={() => applySelectionAlignment(alignment)} className="rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 font-bold text-slate-500 hover:border-blue-300 hover:bg-white hover:text-primary" data-testid={`button-align-${alignment}`}>{label}</button>)}</div>
              <p className="mt-2 text-[9px] leading-4 text-slate-400">Drag, nudge or rotate the group. Collision, boundary and stack-support checks remain active.</p>
            </div>
          )}
          <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-full border border-white/95 bg-white/[0.94] p-1 shadow-sm lg:hidden">
            <button type="button" onClick={() => { setMobilePanelOpen((current) => !current); setDisplayControlsOpen(false); setWarningPanelOpen(false); }} className={`flex h-8 w-8 items-center justify-center rounded-full transition ${mobilePanelOpen ? "bg-blue-50 text-primary" : "text-slate-600"}`} aria-label={mobilePanelOpen ? "Hide cargo and dock panel" : "Show cargo and dock panel"} title={mobilePanelOpen ? "Hide cargo and dock panel" : "Show cargo and dock panel"} data-testid="button-mobile-cargo-panel">{mobilePanelOpen ? <PanelRightClose className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}</button>
            <button type="button" onClick={toggleFullscreen} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-primary" aria-label={isFullscreen ? "Exit full screen" : "Open full workspace"} title={isFullscreen ? "Exit full screen" : "Open full workspace"}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
          </div>
          <div className={`absolute right-3 top-3 z-30 hidden max-h-[calc(100%-4.5rem)] flex-col items-center gap-0.5 overflow-visible rounded-2xl border border-white/90 bg-white/[0.98] p-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.34)] transition-[right] lg:flex ${sidebarOpen ? "lg:right-[344px]" : ""}`} data-testid="container-floating-tool-rail">
            {onPlacedChange && <button type="button" onClick={() => { setSequenceMode(false); setSharePanelOpen(false); setDisplayControlsOpen(false); setWarningPanelOpen(false); setHelpPanelOpen(false); setArrangeMode((current) => !current); setPlacementMessage("Select a cargo item and drag it to a new position."); }} className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition duration-150 hover:-translate-x-0.5 hover:scale-105 hover:bg-white hover:shadow-md ${arrangeMode ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:text-primary"}`} aria-label="Adjust cargo layout" data-testid="button-arrange-cargo"><MousePointerClick className="h-4 w-4" /><ViewerHoverLabel>Adjust cargo layout</ViewerHoverLabel></button>}
            <button type="button" onClick={() => { setArrangeMode(false); setSharePanelOpen(false); setDisplayControlsOpen(false); setWarningPanelOpen(false); setHelpPanelOpen(false); setSequenceMode((current) => { if (!current) setSequenceStep(1); return !current; }); }} disabled={placed.length === 0} className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition duration-150 hover:-translate-x-0.5 hover:scale-105 hover:bg-white hover:shadow-md disabled:opacity-35 ${sequenceMode ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:text-primary"}`} aria-label="Loading sequence" data-testid="button-loading-sequence"><Play className="h-4 w-4" /><ViewerHoverLabel>Play loading sequence</ViewerHoverLabel></button>
            <div className="my-0.5 h-px w-6 bg-slate-200" />
            <button type="button" onClick={() => { cycleCameraView(); setSharePanelOpen(false); setDisplayControlsOpen(false); setWarningPanelOpen(false); }} className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:text-primary hover:shadow-md" aria-label="Change camera angle" data-testid="button-floating-camera"><Camera className="h-4 w-4" /><ViewerHoverLabel>Next camera angle</ViewerHoverLabel></button>
            <button type="button" onClick={resetCameraView} className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:text-primary hover:shadow-md" aria-label="Reset camera view" data-testid="button-reset-camera"><Home className="h-4 w-4" /><ViewerHoverLabel>Reset camera</ViewerHoverLabel></button>
            <div className="my-0.5 h-px w-6 bg-slate-200" />
            {onSaveProject && <button type="button" onClick={() => runExternalAction(onSaveProject)} className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-150 hover:-translate-x-0.5 hover:scale-105 hover:bg-white hover:text-emerald-600 hover:shadow-md" aria-label="Save project" data-testid="button-save-scene"><Save className="h-4 w-4" /><ViewerHoverLabel>Save project</ViewerHoverLabel></button>}
            <button type="button" onClick={() => { setSharePanelOpen((current) => !current); setHelpPanelOpen(false); setDisplayControlsOpen(false); setWarningPanelOpen(false); }} className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition duration-150 hover:-translate-x-0.5 hover:scale-105 hover:bg-white hover:shadow-md ${sharePanelOpen ? "bg-blue-50 text-primary" : "text-slate-600 hover:text-primary"}`} aria-label="Share loading plan" data-testid="button-share-scene"><Share2 className="h-4 w-4" /><ViewerHoverLabel>Share loading plan</ViewerHoverLabel></button>
            {onExportPdf && <button type="button" onClick={onExportPdf} className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:text-primary hover:shadow-md" aria-label="Download PDF report" data-testid="button-floating-pdf"><FileDown className="h-4 w-4" /><ViewerHoverLabel>Download PDF report</ViewerHoverLabel></button>}
            <button type="button" onClick={downloadCurrentSnapshot} className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:text-primary hover:shadow-md" aria-label="Download scene image" data-testid="button-floating-snapshot"><ImageDown className="h-4 w-4" /><ViewerHoverLabel>Download scene image</ViewerHoverLabel></button>
            <button type="button" onClick={() => { setHelpPanelOpen((current) => !current); setSharePanelOpen(false); setDisplayControlsOpen(false); setWarningPanelOpen(false); }} className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition duration-150 hover:-translate-x-0.5 hover:scale-105 hover:bg-white hover:shadow-md ${helpPanelOpen ? "bg-blue-50 text-primary" : "text-slate-600 hover:text-primary"}`} aria-label="Workspace help" data-testid="button-container-help"><CircleHelp className="h-4 w-4" /><ViewerHoverLabel>Workspace help</ViewerHoverLabel></button>
            <button type="button" onClick={() => { setWarningPanelOpen((current) => !current); setSharePanelOpen(false); setDisplayControlsOpen(false); setHelpPanelOpen(false); }} className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-md ${warningPanelOpen ? "bg-slate-900 text-white" : "text-slate-600 hover:text-primary"}`} aria-label="Placement checks" data-testid="button-floating-warnings"><AlertTriangle className="h-4 w-4" />{hasPlacementWarning && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />}<ViewerHoverLabel>Placement checks</ViewerHoverLabel></button>
            <button type="button" onClick={() => setSidebarOpen((current) => !current)} className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-150 hover:-translate-x-0.5 hover:scale-105 hover:bg-white hover:text-primary hover:shadow-md" aria-label={sidebarOpen ? "Hide cargo panel" : "Show cargo panel"} data-testid="button-container-sidebar-toggle">{sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}<ViewerHoverLabel>{sidebarOpen ? "Hide cargo panel" : "Show cargo panel"}</ViewerHoverLabel></button>
            <button type="button" onClick={toggleFullscreen} className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:text-primary hover:shadow-md" aria-label={isFullscreen ? "Exit full screen" : "Open full workspace"} data-testid="button-container-fullscreen">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}<ViewerHoverLabel>{isFullscreen ? "Exit full screen" : "Open full workspace"}</ViewerHoverLabel></button>
            {sharePanelOpen && <div className="absolute right-12 top-20 w-64 rounded-2xl border border-white/95 bg-white/[0.98] p-2.5 text-left shadow-[0_22px_55px_-24px_rgba(15,23,42,0.38)]" data-testid="container-share-panel">
              <div className="flex items-center justify-between gap-2 px-1 pb-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Share loading plan</p><p className="mt-0.5 text-[9px] text-slate-400">Anyone with the link can preview it.</p></div><Share2 className="h-4 w-4 text-primary" /></div>
              <button type="button" onClick={copyShareLink} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-primary" data-testid="button-share-copy-link"><Link2 className="h-4 w-4" />{currentShareUrl() ? "Copy share link" : "Create share link"}</button>
              <div className="mt-1 grid grid-cols-4 gap-1 border-t border-slate-100 pt-2">{([ ["email", "Email", Mail], ["facebook", "Facebook", Facebook], ["linkedin", "LinkedIn", Linkedin], ["whatsapp", "WhatsApp", MessageCircle] ] as const).map(([target, label, Icon]) => <button key={target} type="button" onClick={() => openShareTarget(target)} className="group/share flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[8px] font-semibold text-slate-500 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-primary" aria-label={`Share via ${label}`} data-testid={`button-share-${target}`}><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 transition group-hover/share:bg-white group-hover/share:shadow-sm"><Icon className="h-3.5 w-3.5" /></span>{label}</button>)}</div>
              {!currentShareUrl() && <p className="mt-1 px-1 text-[8px] leading-3 text-slate-400">Create the secure public link first; then reopen Share to send it.</p>}
              {currentShareUrl() && typeof navigator !== "undefined" && "share" in navigator && <button type="button" onClick={shareCurrentView} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[9px] font-bold text-white hover:bg-slate-700"><Share2 className="h-3.5 w-3.5" />More sharing options</button>}
            </div>}
            {helpPanelOpen && <div className="absolute right-12 bottom-16 w-72 rounded-2xl border border-white/95 bg-white/[0.98] p-3 text-left shadow-[0_22px_55px_-24px_rgba(15,23,42,0.38)]" data-testid="container-help-panel">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Workspace controls</p>
              <div className="mt-2 space-y-1.5 text-[10px] leading-4 text-slate-600"><p><strong className="text-slate-800">Drag</strong> to rotate the scene. In Adjust mode, drag cargo instead.</p><p><strong className="text-slate-800">Right-drag</strong> to pan in fullscreen. Use the wheel or pinch to zoom.</p><p><strong className="text-slate-800">Cargo moves</strong> stay inside the container and are checked for collisions and stack support.</p></div>
            </div>}
            {warningPanelOpen && (
              <div className="absolute right-12 top-0 w-60 rounded-2xl border border-white/90 bg-white/[0.98] p-3 text-left shadow-[0_20px_55px_-22px_rgba(15,23,42,0.45)]" data-testid="floating-warning-panel">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Plan status</p>
                <div className="mt-2 flex gap-2 rounded-xl bg-slate-50 p-2.5"><AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${hasPlacementWarning ? "text-red-500" : "text-emerald-500"}`} /><p className="text-[10px] leading-4 text-slate-600">{arrangeMode || hasPlacementWarning ? placementMessage : "No active placement warnings. Use Adjust layout to validate manual moves."}</p></div>
              </div>
            )}
          </div>
          {mobilePanelOpen && (
            <section className="absolute bottom-3 left-3 right-14 z-30 flex max-h-[68%] min-h-0 flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/[0.98] shadow-[0_24px_70px_-24px_rgba(15,23,42,0.5)] lg:hidden" aria-label="Cargo and staging docks" data-testid="mobile-cargo-panel">
              <div className="border-b border-slate-200 bg-white/90 px-3 pb-3 pt-2.5">
                <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-slate-200" aria-hidden="true" />
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary"><Ship className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-slate-900">{container.name}</p>
                    <p className="mt-0.5 truncate text-[9px] text-slate-500">{placed.length} loaded · {unitSystem === "metric" ? `${(loadSummary.totalWeight * LB_TO_KG).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg` : `${loadSummary.totalWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} lb`}</p>
                  </div>
                  <button type="button" onClick={() => setMobilePanelOpen(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close cargo panel" data-testid="button-close-mobile-cargo-panel"><X className="h-4 w-4" /></button>
                </div>
                {onPlacedChange ? (
                  <div className="mt-2.5 grid grid-cols-3 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Cargo workspace zones">
                    {([ ["dock1", "Dock 1"], ["loaded", "Loaded"], ["dock2", "Dock 2"] ] as const).map(([zone, label]) => (
                      <button key={zone} type="button" role="tab" aria-selected={activeCargoZone === zone} onClick={() => setActiveCargoZone(zone)} className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[9px] font-bold transition ${activeCargoZone === zone ? "bg-white text-primary shadow-sm" : "text-slate-500"}`} data-testid={`button-mobile-cargo-zone-${zone}`}>
                        <span>{label}</span><span className={`min-w-4 rounded-full px-1 text-center text-[8px] ${activeCargoZone === zone ? "bg-blue-50 text-primary" : "bg-slate-200/70 text-slate-500"}`}>{zone === "loaded" ? placed.length : stagedByZone[zone].length}</span>
                      </button>
                    ))}
                  </div>
                ) : <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Cargo units</p>}
                {onPlacedChange && activeCargoZone === "loaded" && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[9px] text-slate-500">{arrangeMode ? `${selectedCargoIndices.size} selected` : "Inspect cargo below"}</p>
                    {arrangeMode ? <div className="flex gap-1">
                      <button type="button" onClick={() => setSelectedCargoIndices(new Set(placed.map((_, index) => index)))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-600" data-testid="button-mobile-select-all-cargo">Select all</button>
                      <button type="button" onClick={() => setSelectedCargoIndices(new Set())} disabled={selectedCargoIndices.size === 0} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-500 disabled:opacity-40" data-testid="button-mobile-clear-cargo-selection">Clear</button>
                    </div> : <button type="button" onClick={() => { setSequenceMode(false); setArrangeMode(true); setPlacementMessage("Select cargo below, then drag or use the precision controls."); }} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-bold text-white" data-testid="button-mobile-open-adjust-layout"><MousePointerClick className="mr-1 inline h-3 w-3" />Adjust layout</button>}
                  </div>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                {activeCargoZone === "loaded" || !onPlacedChange ? <div className="space-y-1">
                  {placed.map((box, index) => (
                    <div key={`${box.cargoId}-mobile-${index}`} className={`flex items-center gap-1.5 rounded-xl border p-1.5 transition ${selectedCargoIndices.has(index) ? "border-blue-300 bg-blue-50/80 ring-2 ring-blue-100" : hoveredCargoIndex === index ? "border-sky-300 bg-white" : "border-transparent bg-white/60"}`} data-testid={`mobile-container-cargo-row-${index}`}>
                      {onPlacedChange && arrangeMode && <button type="button" onClick={() => toggleCargoSelection(index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary" aria-label={`${selectedCargoIndices.has(index) ? "Deselect" : "Select"} ${box.cargoName || "cargo item"}`} aria-pressed={selectedCargoIndices.has(index)} data-testid={`button-mobile-select-container-cargo-${index}`}>{selectedCargoIndices.has(index) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}</button>}
                      <button type="button" onClick={() => { setHoveredCargoIndex(index); sceneRef.current?.setCargoHover(index); }} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-0.5 text-left" data-testid={`button-mobile-container-cargo-${index}`}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-900" style={{ backgroundColor: `${box.color}45` }}><Box className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold text-slate-800">{box.cargoName || `Cargo ${index + 1}`}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{fmt(box.l)} × {fmt(box.w)} × {fmt(box.h)} · {unitSystem === "metric" ? `${(box.weight * LB_TO_KG).toFixed(0)} kg` : `${box.weight.toFixed(0)} lb`}</span></span>
                      </button>
                      {onPlacedChange && <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => stageCargo(index, "dock1")} className="flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[8px] font-bold text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-primary" aria-label={`Move ${box.cargoName || "cargo item"} to Dock 1`} title="Move to Dock 1" data-testid={`button-mobile-stage-dock1-${index}`}><Package className="h-3 w-3" />D1</button>
                        <button type="button" onClick={() => stageCargo(index, "dock2")} className="flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[8px] font-bold text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-primary" aria-label={`Move ${box.cargoName || "cargo item"} to Dock 2`} title="Move to Dock 2" data-testid={`button-mobile-stage-dock2-${index}`}><Package className="h-3 w-3" />D2</button>
                      </div>}
                    </div>
                  ))}
                </div> : stagedByZone[activeCargoZone].length > 0 ? <div className="space-y-1">
                  {stagedByZone[activeCargoZone].map((entry) => <div key={`${entry.id}-mobile`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm" data-testid={`mobile-staged-cargo-${entry.id}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-900" style={{ backgroundColor: `${entry.box.color}45` }}><Package className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold text-slate-800">{entry.box.cargoName || "Cargo item"}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{fmt(entry.box.l)} × {fmt(entry.box.w)} × {fmt(entry.box.h)}</span></span>
                    <button type="button" onClick={() => loadStagedCargo(entry.id)} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-bold text-white" data-testid={`button-mobile-load-staged-${entry.id}`}>Load</button>
                  </div>)}
                </div> : <div className="px-4 py-7 text-center"><Package className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-[11px] font-bold text-slate-600">No cargo staged here</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Use the D1 or D2 control beside a loaded unit.</p></div>}
              </div>
            </section>
          )}
          {hoveredCargoIndex !== null && placed[hoveredCargoIndex] && (
            <div
              className={`pointer-events-none absolute top-3 z-20 w-max max-w-[calc(100%-6.5rem)] -translate-x-1/2 rounded-2xl border border-white/95 bg-white/[0.98] px-3 py-2 text-slate-700 shadow-[0_14px_36px_-22px_rgba(15,23,42,0.32)] ${sidebarOpen ? "left-1/2 lg:left-[calc(50%-172px)]" : "left-1/2"}`}
              data-testid="container-cargo-hover-card"
            >
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-slate-300" style={{ backgroundColor: placed[hoveredCargoIndex].color }} />
                  <strong className="max-w-36 truncate text-[10px] text-slate-800">Unit #{hoveredCargoIndex + 1} · {placed[hoveredCargoIndex].cargoName || "Cargo item"}</strong>
                </span>
                <span className="text-[9px] text-slate-500"><strong className="text-slate-700">Size</strong> {fmt(placed[hoveredCargoIndex].l)} × {fmt(placed[hoveredCargoIndex].w)} × {fmt(placed[hoveredCargoIndex].h)}</span>
                <span className="text-[9px] text-slate-500"><strong className="text-slate-700">Weight</strong> {unitSystem === "metric" ? `${(placed[hoveredCargoIndex].weight * LB_TO_KG).toFixed(0)} kg` : `${placed[hoveredCargoIndex].weight.toFixed(0)} lb`}</span>
                <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                <span className="hidden text-[9px] text-slate-500 sm:inline"><strong className="text-slate-700">Container</strong> {fmt(container.lengthIn)} × {fmt(container.widthIn)} × {fmt(container.heightIn)}</span>
                <span className="hidden text-[9px] text-slate-500 md:inline"><strong className="text-slate-700">Back</strong> {fmt(placed[hoveredCargoIndex].x)} · <strong className="text-slate-700">Doors</strong> {fmt(Math.max(0, container.lengthIn - placed[hoveredCargoIndex].x - placed[hoveredCargoIndex].l))}</span>
              </div>
            </div>
          )}
          {sequenceMode ? (
            <div className="absolute bottom-3 left-3 right-3 z-30 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:min-w-[390px] lg:bottom-14 rounded-xl border border-indigo-200 bg-white/[0.98] p-2 shadow-lg" data-testid="loading-sequence-controls">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSequenceStep((step) => Math.max(0, step - 1))}
                  disabled={sequenceStep === 0}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-35 disabled:cursor-not-allowed"
                  aria-label="Previous loading step"
                  data-testid="button-sequence-previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">Loading step {sequenceStep} of {sequenceOrder.length}</p>
                  <p className="truncate text-xs font-bold text-slate-900 mt-0.5">
                    {sequenceCargo ? sequenceCargo.cargoName || "Cargo item" : "Empty container — begin loading"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSequenceStep((step) => Math.min(sequenceOrder.length, step + 1))}
                  disabled={sequenceStep >= sequenceOrder.length}
                  className="w-8 h-8 rounded-lg border border-indigo-200 bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-35 disabled:cursor-not-allowed"
                  aria-label="Next loading step"
                  data-testid="button-sequence-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-indigo-100">
                <div className="h-full rounded-full bg-indigo-500 transition-[width] duration-200" style={{ width: `${sequenceOrder.length > 0 ? (sequenceStep / sequenceOrder.length) * 100 : 0}%` }} />
              </div>
              <p className="mt-1.5 text-center text-[9px] text-slate-500">Suggested order: closed end to doors, lower levels first</p>
            </div>
          ) : !mobilePanelOpen && (
            <div className={`absolute bottom-3 right-3 left-3 z-20 sm:left-auto sm:max-w-[75%] lg:hidden rounded-md border px-2.5 py-1.5 text-[10px] font-medium shadow-sm pointer-events-none ${
              arrangeMode
                ? placementMessage.includes("overlap") || placementMessage.includes("without enough") || placementMessage.includes("cancelled")
                  ? "border-red-200 bg-red-50/90 text-red-700"
                  : "border-sky-200 bg-white/90 text-slate-700"
                : "border-white/80 bg-white/75 text-slate-600"
            }`}>
              {arrangeMode ? placementMessage : <><span className="sm:hidden">Drag to rotate · Pinch to zoom · Tap cargo to inspect</span><span className="hidden sm:inline">Drag to rotate · Scroll or pinch to zoom</span></>}
            </div>
          )}
          <div className="pointer-events-none absolute bottom-14 left-3 z-20 hidden max-w-[440px] items-center gap-3 rounded-xl border border-white/85 bg-white/95 px-3 py-2 text-[9px] text-slate-500 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.45)] lg:flex" data-testid="container-interaction-legend">
            <Mouse className="h-4 w-4 shrink-0 text-slate-500" />
            <span><strong className="text-slate-700">Left-drag</strong> rotate scene / move selected cargo</span>
            <span><strong className="text-slate-700">Right-drag</strong> pan</span>
            <span><strong className="text-slate-700">Wheel</strong> zoom</span>
          </div>
          {(onOpenProjects || onEditCargo || onEditContainer) && <nav className="absolute inset-x-0 bottom-0 z-40 hidden h-12 grid-cols-4 border-t border-white/90 bg-white/95 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.42)] lg:grid" aria-label="Loading plan workflow" data-testid="container-workflow-bar">
            <button type="button" onClick={() => runExternalAction(onOpenProjects)} disabled={!onOpenProjects} className="flex items-center justify-center gap-2 border-r border-slate-200/70 text-[10px] font-semibold text-slate-500 transition hover:bg-white hover:text-primary disabled:cursor-default disabled:opacity-60"><FolderOpen className="h-3.5 w-3.5" />Projects</button>
            <button type="button" onClick={() => runExternalAction(onEditCargo)} disabled={!onEditCargo} className="flex items-center justify-center gap-2 border-r border-slate-200/70 text-[10px] font-semibold text-slate-500 transition hover:bg-white hover:text-primary disabled:cursor-default disabled:opacity-60"><Package className="h-3.5 w-3.5" />Cargo</button>
            <button type="button" onClick={() => runExternalAction(onEditContainer)} disabled={!onEditContainer} className="flex items-center justify-center gap-2 border-r border-slate-200/70 text-[10px] font-semibold text-slate-500 transition hover:bg-white hover:text-primary disabled:cursor-default disabled:opacity-60"><Ship className="h-3.5 w-3.5" />Container</button>
            <span className="flex items-center justify-center gap-2 bg-blue-50/80 text-[10px] font-bold text-primary"><LayoutDashboard className="h-3.5 w-3.5" />Loading plan</span>
          </nav>}
        </div>
        {sidebarOpen && (
          <aside className="absolute bottom-14 right-3 top-3 z-20 hidden w-[320px] min-h-0 flex-col overflow-hidden rounded-3xl border border-white/95 bg-white/[0.98] shadow-[0_24px_70px_-24px_rgba(15,23,42,0.3)] lg:flex" data-testid="container-viewer-sidebar">
            <div className="border-b border-slate-200 bg-white/90 p-3">
              <div className="grid grid-cols-[32px_1fr_32px] items-center gap-2">
                <button type="button" onClick={onPreviousPlan} disabled={!onPreviousPlan || planIndex <= 0} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-white hover:text-primary disabled:opacity-30" aria-label="Previous container plan" data-testid="button-viewer-previous-plan"><ChevronLeft className="h-4 w-4" /></button>
                <div className="min-w-0 text-center">
                  <p className="truncate text-xs font-bold text-slate-900">{container.name}</p>
                  <p className="mt-0.5 truncate text-[9px] text-slate-500">{fmt(container.lengthIn)} × {fmt(container.widthIn)} × {fmt(container.heightIn)} · {unitSystem === "metric" ? `${(container.volumeCuFt * 0.0283168).toFixed(1)} m³` : `${container.volumeCuFt.toFixed(0)} ft³`}</p>
                </div>
                <button type="button" onClick={onNextPlan} disabled={!onNextPlan || planIndex >= planCount - 1} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-white hover:text-primary disabled:opacity-30" aria-label="Next container plan" data-testid="button-viewer-next-plan"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <p className="mt-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">Container {planIndex + 1} / {Math.max(1, planCount)}</p>
              <div className="mt-2 grid grid-cols-3 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Cargo workspace zones">
                {([
                  ["dock1", "Dock 1"],
                  ["loaded", "Loaded"],
                  ["dock2", "Dock 2"],
                ] as const).map(([zone, label]) => (
                  <button
                    key={zone}
                    type="button"
                    role="tab"
                    aria-selected={activeCargoZone === zone}
                    onClick={() => setActiveCargoZone(zone)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${activeCargoZone === zone ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    data-testid={`button-cargo-zone-${zone}`}
                  >
                    <span>{label}</span><span className={`min-w-4 rounded-full px-1 text-center text-[8px] ${activeCargoZone === zone ? "bg-blue-50 text-primary" : "bg-slate-200/70 text-slate-500"}`}>{zone === "loaded" ? placed.length : stagedByZone[zone].length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-200 bg-white/90">
              <button type="button" onClick={() => setPlacementSummaryOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50" aria-expanded={placementSummaryOpen} data-testid="button-toggle-placement-summary">
                <span><span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Placement calculations</span><span className="mt-0.5 block text-[9px] text-slate-400">{volumeUtilization.toFixed(0)}% volume · {payloadUtilization.toFixed(0)}% payload · {placed.length} units</span></span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${placementSummaryOpen ? "rotate-180" : ""}`} />
              </button>
              {placementSummaryOpen && <div className="border-t border-slate-100 px-3 pb-3 pt-2" data-testid="viewer-placement-summary">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1.5 text-[10px]">
                  <span className="font-medium text-slate-500">Used</span><span className="text-right font-medium text-slate-400">Capacity</span><span className="text-right font-medium text-slate-400">Free</span>
                  {[
                    [fmt(loadSummary.usedLength), fmt(container.lengthIn), fmt(Math.max(0, container.lengthIn - loadSummary.usedLength))],
                    [fmt(loadSummary.usedWidth), fmt(container.widthIn), fmt(Math.max(0, container.widthIn - loadSummary.usedWidth))],
                    [fmt(loadSummary.usedHeight), fmt(container.heightIn), fmt(Math.max(0, container.heightIn - loadSummary.usedHeight))],
                  ].map((row, index) => <Fragment key={index}><span className="font-semibold text-slate-800">{row[0]}</span><span className="text-right text-slate-500">{row[1]}</span><span className="text-right font-bold text-emerald-600">{row[2]}</span></Fragment>)}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]"><div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-400">Weight</span><strong className="mt-0.5 block text-[10px] text-slate-800">{unitSystem === "metric" ? `${(loadSummary.totalWeight * LB_TO_KG).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg` : `${loadSummary.totalWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} lb`}</strong></div><div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-400">Volume</span><strong className="mt-0.5 block text-[10px] text-slate-800">{unitSystem === "metric" ? `${(loadSummary.usedVolumeCuFt * 0.0283168).toFixed(1)} m³` : `${loadSummary.usedVolumeCuFt.toFixed(1)} ft³`}</strong></div></div>
              </div>}
              <button type="button" onClick={() => setBalanceSummaryOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50" aria-expanded={balanceSummaryOpen} data-testid="button-toggle-viewer-balance">
                <span><span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Weight balance &amp; COG</span><span className="mt-0.5 block text-[9px] capitalize text-slate-400">{balance.status} · length {balance.longitudinalPct.toFixed(0)}% · side {balance.lateralPct.toFixed(0)}%</span></span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${balanceSummaryOpen ? "rotate-180" : ""}`} />
              </button>
              {balanceSummaryOpen && <div className="border-t border-slate-100 px-3 pb-3 pt-2" data-testid="viewer-balance-summary">
                <div className="grid grid-cols-2 gap-2 text-[9px]"><div className="rounded-lg bg-slate-50 p-2 text-slate-500"><span className="block">Closed end / doors</span><strong className="mt-0.5 block text-[10px] text-slate-800">{balance.closedEndWeightPct.toFixed(0)}% / {balance.doorEndWeightPct.toFixed(0)}%</strong></div><div className="rounded-lg bg-slate-50 p-2 text-slate-500"><span className="block">Side A / Side B</span><strong className="mt-0.5 block text-[10px] text-slate-800">{balance.sideAWeightPct.toFixed(0)}% / {balance.sideBWeightPct.toFixed(0)}%</strong></div></div>
                <p className="mt-2 flex gap-1.5 text-[9px] leading-4 text-slate-400"><Info className="mt-0.5 h-3 w-3 shrink-0" />A practical planning aid only. Real loads still require appropriate blocking, bracing and carrier checks.</p>
              </div>}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
              <div className="sticky top-0 z-10 mb-1 flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{activeCargoZone === "loaded" ? "Cargo units" : activeCargoZone === "dock1" ? "Dock 1 staging" : "Dock 2 staging"}</p>
                <p className="text-[9px] text-slate-400">{activeCargoZone === "loaded" ? "Hover to inspect" : `${stagedByZone[activeCargoZone].length} staged`}</p>
              </div>
              {activeCargoZone === "loaded" ? <div className="space-y-1.5">
                {cargoGroups.map((cargoGroup) => <div key={cargoGroup.id} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/75">
                  <div className="flex items-center gap-1.5 p-1.5">
                    {onPlacedChange && arrangeMode && <button type="button" onClick={() => toggleCargoGroupSelection(cargoGroup.indexes)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-blue-50" aria-label={`Select all ${cargoGroup.name} units`} data-testid={`button-select-cargo-group-${cargoGroup.id}`}><CheckSquare className="h-3.5 w-3.5" /></button>}
                    <button type="button" onClick={() => { setHoveredCargoIndex(cargoGroup.indexes[0]); sceneRef.current?.setCargoHover(cargoGroup.indexes[0]); }} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-0.5 text-left">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-900" style={{ backgroundColor: `${cargoGroup.color}45` }}><Box className="h-3.5 w-3.5" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold text-slate-800">{cargoGroup.name}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{cargoGroup.indexes.length} units · {fmt(cargoGroup.box.l)} × {fmt(cargoGroup.box.w)} × {fmt(cargoGroup.box.h)}</span></span>
                    </button>
                    <button type="button" onClick={() => toggleCargoGroup(cargoGroup.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label={`${expandedCargoGroups.has(cargoGroup.id) ? "Collapse" : "Expand"} ${cargoGroup.name}`} aria-expanded={expandedCargoGroups.has(cargoGroup.id)} data-testid={`button-toggle-cargo-group-${cargoGroup.id}`}><ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedCargoGroups.has(cargoGroup.id) ? "rotate-180" : ""}`} /></button>
                  </div>
                  {expandedCargoGroups.has(cargoGroup.id) && <div className="space-y-0.5 border-t border-slate-100 bg-slate-50/65 p-1">
                  {cargoGroup.indexes.map((index) => { const box = placed[index]; return (
                  <div
                    key={`${box.cargoId}-${index}`}
                    onMouseEnter={() => setHoveredCargoIndex(index)}
                    onMouseLeave={() => setHoveredCargoIndex(null)}
                    className={`group flex w-full items-center gap-1 rounded-xl border p-1.5 text-left transition ${selectedCargoIndices.has(index) ? "border-blue-300 bg-blue-50/70 shadow-sm ring-2 ring-blue-100" : hoveredCargoIndex === index ? "border-blue-300 bg-white shadow-sm ring-2 ring-blue-100" : "border-transparent hover:border-slate-200 hover:bg-white"}`}
                    data-testid={`container-cargo-row-${index}`}
                  >
                    {onPlacedChange && arrangeMode && <button type="button" onClick={() => toggleCargoSelection(index)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-white" aria-label={`${selectedCargoIndices.has(index) ? "Deselect" : "Select"} ${box.cargoName || "cargo item"}`} aria-pressed={selectedCargoIndices.has(index)} data-testid={`button-select-container-cargo-${index}`}>{selectedCargoIndices.has(index) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}</button>}
                    <button
                      type="button"
                      onFocus={() => setHoveredCargoIndex(index)}
                      onBlur={() => setHoveredCargoIndex(null)}
                      className="flex min-w-0 flex-1 items-start gap-2 rounded-lg p-0.5 text-left"
                      data-testid={`button-container-cargo-${index}`}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-900" style={{ backgroundColor: `${box.color}45` }}>
                        <Box className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[10px] font-bold text-slate-800">{box.cargoName || `Cargo ${index + 1}`}</span>
                        <span className="mt-0.5 block truncate text-[9px] text-slate-500">{fmt(box.l)} × {fmt(box.w)} × {fmt(box.h)}</span>
                        <span className="mt-0.5 block text-[9px] text-slate-400">{unitSystem === "metric" ? `${(box.weight * LB_TO_KG).toFixed(0)} kg` : `${box.weight.toFixed(0)} lb`} · x {box.x.toFixed(0)} / y {box.y.toFixed(0)}</span>
                      </span>
                    </button>
                    {onPlacedChange && <div className="flex shrink-0 gap-1 opacity-60 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      <button type="button" onClick={() => stageCargo(index, "dock1")} className="flex h-7 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[8px] font-bold text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-primary" title="Move to Dock 1" aria-label={`Move ${box.cargoName || "cargo item"} to Dock 1`} data-testid={`button-stage-dock1-${index}`}><Package className="h-3 w-3" />D1</button>
                      <button type="button" onClick={() => stageCargo(index, "dock2")} className="flex h-7 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[8px] font-bold text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-primary" title="Move to Dock 2" aria-label={`Move ${box.cargoName || "cargo item"} to Dock 2`} data-testid={`button-stage-dock2-${index}`}><Package className="h-3 w-3" />D2</button>
                    </div>}
                  </div>
                  ); })}
                  </div>}
                </div>)}
              </div> : (
                stagedByZone[activeCargoZone].length > 0 ? <div className="space-y-1">
                  {stagedByZone[activeCargoZone].map((entry) => <div key={entry.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm" data-testid={`staged-cargo-${entry.id}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-900" style={{ backgroundColor: `${entry.box.color}45` }}><Package className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold text-slate-800">{entry.box.cargoName || "Cargo item"}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{fmt(entry.box.l)} × {fmt(entry.box.w)} × {fmt(entry.box.h)}</span></span>
                    <button type="button" onClick={() => loadStagedCargo(entry.id)} className="rounded-lg bg-slate-900 px-2 py-1.5 text-[9px] font-bold text-white hover:bg-slate-700" data-testid={`button-load-staged-${entry.id}`}>Load</button>
                  </div>)}
                </div> : <div className="mx-2 mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-7 text-center">
                  <Package className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-[11px] font-bold text-slate-600">No cargo staged here</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Use the arrows beside a loaded unit to move it into this dock.</p>
                </div>
              )}
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-1.5 border-t border-slate-200 bg-white/92 px-3 py-2" data-testid="viewer-export-actions">
              {onExportCsv ? <button type="button" onClick={() => runExternalAction(onExportCsv)} className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[9px] font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700" data-testid="button-viewer-export-csv"><FileSpreadsheet className="h-3.5 w-3.5" />Placement CSV</button> : <span />}
              {onExportPdf && <button type="button" onClick={() => runExternalAction(onExportPdf)} className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-[9px] font-bold text-white hover:bg-slate-700" data-testid="button-viewer-export-pdf"><FileDown className="h-3.5 w-3.5" />Save to PDF</button>}
            </div>
          </aside>
        )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function UtilBar({ pct, label, color }: { pct: number; label: string; color: string }) {
  const capped = Math.min(pct, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${capped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function BalanceSplitBar({
  firstLabel,
  secondLabel,
  firstPct,
}: {
  firstLabel: string;
  secondLabel: string;
  firstPct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] font-medium text-slate-600">
        <span>{firstLabel} <strong className="text-slate-900">{firstPct.toFixed(0)}%</strong></span>
        <span><strong className="text-slate-900">{(100 - firstPct).toFixed(0)}%</strong> {secondLabel}</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className="absolute inset-y-0 left-0 bg-slate-700" style={{ width: `${firstPct}%` }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/90" />
      </div>
    </div>
  );
}

function ContainerBalancePanel({
  placed,
  container,
  unitSystem,
  onPlacedChange,
  undoPlaced,
  onUndo,
}: {
  placed: PlacedBox[];
  container: ContainerSpec;
  unitSystem: "imperial" | "metric";
  onPlacedChange?: (placed: PlacedBox[], previousPlaced?: PlacedBox[]) => void;
  undoPlaced?: PlacedBox[];
  onUndo?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const balance = useMemo(() => calculateContainerBalance(placed, container), [placed, container]);
  const centeredLayout = useMemo(() => centerContainerCargoLayout(placed, container), [placed, container]);
  const metric = unitSystem === "metric";
  const fmtDim = (inches: number) => metric
    ? `${(inches * IN_TO_CM).toFixed(0)} cm`
    : `${inches.toFixed(1)} in`;
  const status = balance.status === "balanced"
    ? { label: "Well balanced", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" }
    : balance.status === "caution"
      ? { label: "Balance caution", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" }
      : balance.status === "review"
        ? { label: "Review balance", badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" }
        : { label: "No weight data", badge: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" data-testid="container-balance-panel">
      <div className="flex items-center transition-colors hover:bg-slate-50">
        <button type="button" onClick={() => setOpen(value => !value)} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left" data-testid="button-toggle-container-balance" aria-expanded={open}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Crosshair className="h-4 w-4" /></div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">Weight Balance & Center of Gravity</h3>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">Optional planning aid · closed by default</p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${status.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
        <span className="group relative mr-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" tabIndex={0} aria-label="Practical centre-of-gravity note">
          <Info className="h-3.5 w-3.5" />
          <span role="tooltip" className="pointer-events-none absolute right-0 top-9 z-20 hidden w-72 rounded-lg border border-slate-200 bg-slate-950 px-3 py-2.5 text-[10px] font-normal leading-relaxed text-white shadow-xl group-hover:block group-focus:block">
            Ocean loads are rarely centred perfectly. Moving cargo only to improve the calculated COG can make blocking, bracing, forklift access, or unloading less practical. Treat this as guidance—not a loading rule.
          </span>
        </span>
      </div>

      {open && <div className="border-t border-slate-200 p-4">
      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-4">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            <span>Closed end</span>
            <span>Doors</span>
          </div>
          <svg
            viewBox={`0 0 ${container.lengthIn} ${container.widthIn}`}
            className="block w-full rounded-md bg-slate-100"
            role="img"
            aria-label={`Top view showing center of gravity at ${balance.longitudinalPct.toFixed(0)} percent of container length and ${balance.lateralPct.toFixed(0)} percent of container width`}
          >
            <rect x="0.8" y="0.8" width={container.lengthIn - 1.6} height={container.widthIn - 1.6} rx="2" fill="#e2e8f0" stroke="#334155" strokeWidth="1.6" />
            <rect
              x={container.lengthIn * 0.35}
              y={container.widthIn * 0.3}
              width={container.lengthIn * 0.3}
              height={container.widthIn * 0.4}
              rx="2"
              fill="#10b981"
              fillOpacity="0.08"
              stroke="#10b981"
              strokeOpacity="0.4"
              strokeWidth="0.9"
              strokeDasharray="3 2"
            />
            {placed.map((box, index) => (
              <rect
                key={`${box.cargoId}-${index}`}
                x={box.x + 0.7}
                y={box.z + 0.7}
                width={Math.max(0.5, box.l - 1.4)}
                height={Math.max(0.5, box.w - 1.4)}
                rx="1"
                fill={box.color}
                fillOpacity="0.36"
                stroke="#ffffff"
                strokeOpacity="0.8"
                strokeWidth="0.7"
              />
            ))}
            <line x1={balance.centerXIn} y1="0" x2={balance.centerXIn} y2={container.widthIn} stroke="#0f172a" strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="0" y1={balance.centerZIn} x2={container.lengthIn} y2={balance.centerZIn} stroke="#0f172a" strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="2 2" />
            <circle cx={balance.centerXIn} cy={balance.centerZIn} r={Math.max(2.5, container.widthIn * 0.045)} fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
            <circle cx={balance.centerXIn} cy={balance.centerZIn} r={Math.max(0.9, container.widthIn * 0.016)} fill="#0f7fe5" />
            <line x1={container.lengthIn} y1="0" x2={container.lengthIn} y2={container.widthIn} stroke="#0f7fe5" strokeWidth="1.6" strokeDasharray="3 2" />
          </svg>
          <div className="flex items-center justify-between gap-3 mt-2 text-[10px] text-slate-500">
            <span>Green zone is a neutral planning target</span>
            <span className="font-semibold text-slate-700">● Estimated CG</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">From closed end</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{fmtDim(balance.centerXIn)}</p>
              <p className="text-[10px] text-slate-500">{balance.longitudinalPct.toFixed(0)}% of length</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">From Side A</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{fmtDim(balance.centerZIn)}</p>
              <p className="text-[10px] text-slate-500">{balance.lateralPct.toFixed(0)}% of width</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">CG height</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{fmtDim(balance.centerYIn)}</p>
              <p className="text-[10px] text-slate-500">{balance.heightPct.toFixed(0)}% of height</p>
            </div>
          </div>

          <BalanceSplitBar firstLabel="Closed end" secondLabel="Doors" firstPct={balance.closedEndWeightPct} />
          <BalanceSplitBar firstLabel="Side A" secondLabel="Side B" firstPct={balance.sideAWeightPct} />

          {balance.guidance.length > 0 ? (
            <div className={`rounded-lg border p-3 ${balance.status === "review" ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-[11px] font-bold ${balance.status === "review" ? "text-rose-800" : "text-amber-800"}`}>Suggested adjustment</p>
              <ul className={`mt-1 space-y-0.5 text-[11px] ${balance.status === "review" ? "text-rose-700" : "text-amber-700"}`}>
                {balance.guidance.map((item) => <li key={item}>• {item}</li>)}
              </ul>
              {onPlacedChange && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!centeredLayout.changed}
                  onClick={() => {
                    if (!centeredLayout.changed) return;
                    onPlacedChange(centeredLayout.placed, placed);
                    const parts = [
                      Math.abs(centeredLayout.shiftXIn) > 0.1 ? `${fmtDim(Math.abs(centeredLayout.shiftXIn))} ${centeredLayout.shiftXIn > 0 ? "toward the doors" : "toward the closed end"}` : "",
                      Math.abs(centeredLayout.shiftZIn) > 0.1 ? `${fmtDim(Math.abs(centeredLayout.shiftZIn))} laterally` : "",
                    ].filter(Boolean);
                    setAdjustmentNote(`The complete cargo block moved ${parts.join(" and ")}. Existing spacing and stacking were preserved.`);
                  }}
                  className="mt-3 h-8 gap-1.5 border-current bg-white/70 text-[11px]"
                  data-testid="button-apply-cog-adjustment"
                >
                  <Crosshair className="h-3.5 w-3.5" /> Apply safe centering
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-700">
              Weight is reasonably centered for planning purposes.
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
        Planning estimate only. It does not calculate chassis axle loads, floor point loads, lashing forces, or regulatory compliance. Confirm the final plan with the carrier and loading facility.
      </p>
      {adjustmentNote && <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-[10px] leading-relaxed text-sky-700" data-testid="cog-adjustment-note">{adjustmentNote}</p>}
      {undoPlaced && onUndo && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            onUndo();
            setAdjustmentNote("Safe centering was undone and the previous calculated layout was restored.");
          }}
          className="mt-2 h-8 gap-1.5 text-[11px] text-slate-600"
          data-testid="button-undo-cog-adjustment"
        >
          <Undo2 className="h-3.5 w-3.5" /> Undo safe centering
        </Button>
      )}
      </div>}
    </div>
  );
}

function ContainerComparisonPanel({
  comparisons,
  recommendedId,
  activeId,
  unitSystem,
  onSelect,
}: {
  comparisons: ContainerPlanComparison[];
  recommendedId: string | null;
  activeId: string;
  unitSystem: "imperial" | "metric";
  onSelect: (containerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inferredRecommendation = [...comparisons].sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? -1 : 1;
    if (!a.complete && a.piecesMissing !== b.piecesMissing) return a.piecesMissing - b.piecesMissing;
    if (a.containerCount !== b.containerCount) return a.containerCount - b.containerCount;
    return a.totalCapacityCuFt - b.totalCapacityCuFt;
  })[0] ?? null;
  const effectiveRecommendedId = recommendedId ?? inferredRecommendation?.container.id ?? null;
  const recommended = comparisons.find((comparison) => comparison.container.id === effectiveRecommendedId) ?? null;
  const metric = unitSystem === "metric";
  const fmtVolume = (cuFt: number) => metric
    ? `${(cuFt * 0.0283168).toFixed(0)} m³`
    : `${Math.round(cuFt).toLocaleString()} ft³`;

  return (
    <Card className="border-slate-200 overflow-hidden" data-testid="container-comparison-panel">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white px-5 py-4 text-left hover:bg-slate-50" aria-expanded={open} data-testid="button-toggle-container-comparison">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Table className="w-4 h-4 text-primary" />Why this container?</h2>
          <p className="text-xs text-slate-500 mt-1">Calculated comparison of all standard sizes · closed by default</p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <CardContent className="border-t border-slate-200 p-4">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {comparisons.map((comparison) => {
            const isRecommended = comparison.container.id === effectiveRecommendedId;
            const isActive = comparison.container.id === activeId;
            const unusedDifference = recommended
              ? Math.max(0, comparison.unusedVolumeCuFt - recommended.unusedVolumeCuFt)
              : 0;
            let explanation = comparison.complete
              ? "All cargo fits."
              : `${comparison.piecesMissing} piece${comparison.piecesMissing === 1 ? "" : "s"} cannot be placed.`;
            if (isRecommended && comparison.complete) {
              explanation = "Fewest containers with the lowest suitable capacity.";
            } else if (comparison.complete && recommended) {
              if (comparison.containerCount > recommended.containerCount) {
                explanation = `Needs ${comparison.containerCount - recommended.containerCount} additional container${comparison.containerCount - recommended.containerCount === 1 ? "" : "s"}.`;
              } else if (unusedDifference > 1) {
                explanation = `${fmtVolume(unusedDifference)} more unused capacity.`;
              }
            }

            return (
              <div
                key={comparison.container.id}
                className={`relative rounded-xl border p-3.5 transition-colors ${
                  isRecommended
                    ? "border-primary/45 bg-primary/[0.035] shadow-sm"
                    : isActive
                      ? "border-slate-400 bg-slate-50"
                      : "border-slate-200 bg-white"
                }`}
                data-testid={`container-comparison-${comparison.container.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{comparison.container.name}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {comparison.containerCount} container{comparison.containerCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  {isRecommended && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Best fit
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 px-2 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Space used</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{comparison.volumeUtilPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Weight used</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{comparison.weightUtilPct.toFixed(1)}%</p>
                  </div>
                </div>

                <p className={`mt-3 min-h-8 text-[11px] leading-4 ${comparison.complete ? "text-slate-600" : "font-medium text-rose-600"}`}>
                  {explanation}
                </p>

                {isActive ? (
                  <div className="mt-3 h-8 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-[11px] font-semibold text-emerald-700">
                    Current plan
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(comparison.container.id)}
                    disabled={!comparison.complete}
                    className="mt-3 h-8 w-full rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                    data-testid={`button-use-container-${comparison.container.id}`}
                  >
                    {comparison.complete ? "Use this container" : "Not suitable"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>}
    </Card>
  );
}

export default function ContainerCalculator() {
  const isEmbedMode = typeof window !== "undefined" && window.location.pathname.startsWith("/embed/");
  usePageMeta({
    title: "Free 3D Container Loading Calculator | AccessToNorth.com",
    description:
      "Free 3D container loading calculator for 20', 40', 40' HC, and 45' HC containers. Import cargo dimensions, get a best-fit recommendation, and export a PDF load plan.",
    canonical: "/tools/container-calculator",
  });

  const { toast } = useToast();
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [recommendation, setRecommendation] = useState<ContainerRecommendation | null>(null);
  const [pendingRecalc, setPendingRecalc] = useState(false);
  const [containerId, setContainerId] = useState("20dc");
  const [containerSelectionMode, setContainerSelectionMode] = useState<"recommend" | "manual">("recommend");
  const [customContainer, setCustomContainer] = useState({
    lengthIn: 232.2,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 62170,
  });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDefaults, setBulkDefaults] = useState({
    stackable: false,
    rotationMode: "horizontal" as RotationMode,
    loadPriority: "normal" as LoadPriority,
    palletized: false,
    palletType: "none" as PalletType,
    customPalletL: 48,
    customPalletW: 40,
    customPalletH: 6,
  });
  const [tempBulk, setTempBulk] = useState({ ...bulkDefaults });
  const [bulkApplyScope, setBulkApplyScope] = useState<BulkApplyScope>("all");
  const defaultCargoItem = useCallback((colorIdx: number): CargoItem => ({
    id: generateId(),
    name: "",
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    quantity: 1,
    color: CARGO_COLORS[colorIdx % CARGO_COLORS.length],
    stackable: bulkDefaults.stackable,
    palletized: bulkDefaults.palletized,
    palletType: bulkDefaults.palletType,
    customPalletL: bulkDefaults.customPalletL,
    customPalletW: bulkDefaults.customPalletW,
    customPalletH: bulkDefaults.customPalletH,
    rotationMode: bulkDefaults.rotationMode,
    included: true,
    loadPriority: bulkDefaults.loadPriority,
  }), [bulkDefaults]);

  const [cargoItems, setCargoItems] = useState<CargoItem[]>([defaultCargoItem(0), defaultCargoItem(1)]);
  const [multiResult, setMultiResult] = useState<MultiContainerResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visualPopup, setVisualPopup] = useState<{ type: "stackable" | "rotation" | "palletized" | "priority"; itemId: string } | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const resultContainerRailRef = useRef<HTMLDivElement>(null);
  const [snapshotExportFn, setSnapshotExportFn] = useState<SnapshotExportFn | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<ResultWorkspaceTab>("plan");
  const [activeResultContainer, setActiveResultContainer] = useState(0);
  const [cogUndoLayouts, setCogUndoLayouts] = useState<Record<number, PlacedBox[]>>({});
  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLifetimeDays, setShareLifetimeDays] = useState<ShareLifetimeDays>(30);
  const [managedShareLink, setManagedShareLink] = useState<ManagedShareLink | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem("atn-managed-container-share");
      const parsed = saved ? JSON.parse(saved) as ManagedShareLink : null;
      return parsed?.expiresAt && new Date(parsed.expiresAt).getTime() > Date.now() ? parsed : null;
    } catch {
      return null;
    }
  });
  const [savedProjects, setSavedProjects] = useState<SavedContainerProject[]>(() => readContainerProjects());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const persistenceHydratedRef = useRef(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importUnits, setImportUnits] = useState<"imperial" | "metric">("imperial");
  const [importItems, setImportItems] = useState<ImportedCargoRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importRawHeaders, setImportRawHeaders] = useState<string[]>([]);
  const [importRawRows, setImportRawRows] = useState<Record<string, string>[]>([]);
  const [importColMap, setImportColMap] = useState<Record<string, string>>({ name: "", length: "", width: "", height: "", weight: "", quantity: "", stackable: "", rotation: "", priority: "", palletized: "" });

  useEffect(() => {
    if (typeof window === "undefined" || new URLSearchParams(window.location.search).get("from") !== "pallet-builder") return;
    const transfer = consumePalletPlanTransfer();
    if (!transfer) return;
    setCargoItems(transfer.rows.map((row) => ({
      id: generateId(),
      name: row.name,
      length: row.lengthIn,
      width: row.widthIn,
      height: row.heightIn,
      weight: row.grossWeightLbs * row.quantity,
      quantity: row.quantity,
      color: row.color,
      stackable: false,
      palletized: false,
      palletType: "none",
      customPalletL: row.lengthIn,
      customPalletW: row.widthIn,
      customPalletH: 0,
      rotationMode: "horizontal",
      included: true,
      loadPriority: "normal",
    })));
    setUnitSystem("imperial");
    setContainerSelectionMode("recommend");
    setMultiResult(null);
    setRecommendation(null);
    setCogUndoLayouts({});
    toast({
      title: `${transfer.rows.reduce((sum, row) => sum + row.quantity, 0)} built pallet${transfer.rows.reduce((sum, row) => sum + row.quantity, 0) === 1 ? "" : "s"} filled in`,
      description: "Choose Calculate Loading Plan to get the recommended container and placement.",
    });
  }, [toast]);

  const restoreProjectSnapshot = useCallback((snapshot: ContainerProjectSnapshot) => {
    const validContainerId = snapshot.containerId === "custom"
      || CONTAINER_PRESETS.some((entry) => entry.id === snapshot.containerId)
      ? snapshot.containerId
      : "20dc";
    setUnitSystem(snapshot.unitSystem);
    setContainerSelectionMode(snapshot.containerSelectionMode);
    setContainerId(validContainerId);
    setCustomContainer({ ...snapshot.customContainer });
    setCargoItems(snapshot.cargoItems.map((item) => ({ ...item })));
    setMultiResult(snapshot.multiResult ? JSON.parse(JSON.stringify(snapshot.multiResult)) as MultiContainerResult : null);
    setRecommendation(null);
    setSelectedIds(new Set());
    setCogUndoLayouts({});
    setSnapshotExportFn(null);
    setActiveResultTab("plan");
    setActiveResultContainer(Math.max(0, Math.min(snapshot.activeResultContainer, (snapshot.multiResult?.containers.length || 1) - 1)));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (persistenceHydratedRef.current) return;
    persistenceHydratedRef.current = true;
    const source = new URLSearchParams(window.location.search).get("from");
    if (source === "pallet-builder") {
      setPersistenceReady(true);
      return;
    }
    if (source === "shared-plan") {
      const transfer = consumeContainerShareTransfer();
      if (transfer) {
        restoreProjectSnapshot(transfer.snapshot);
        setCurrentProjectId(null);
        setProjectName(transfer.title);
        persistContainerDraft(transfer.snapshot);
        setLastSavedAt(Date.now());
        toast({
          title: "Editable copy created",
          description: "The shared inputs and 3D placement are ready. Your changes will not affect the original link.",
        });
      } else {
        toast({
          title: "Shared copy was not available",
          description: "Open the share link again and choose Copy and edit.",
          variant: "destructive",
        });
      }
      setPersistenceReady(true);
      return;
    }
    const draft = readContainerDraft();
    if (draft) {
      restoreProjectSnapshot(draft);
      setLastSavedAt(Date.now());
    }
    setPersistenceReady(true);
  }, [restoreProjectSnapshot, toast]);

  const captureProjectSnapshot = useCallback((): ContainerProjectSnapshot => ({
    unitSystem,
    containerSelectionMode,
    containerId,
    customContainer: { ...customContainer },
    cargoItems: cargoItems.map((item) => ({ ...item })),
    multiResult: multiResult ? JSON.parse(JSON.stringify(multiResult)) as MultiContainerResult : null,
    activeResultContainer,
  }), [activeResultContainer, cargoItems, containerId, containerSelectionMode, customContainer, multiResult, unitSystem]);

  useEffect(() => {
    if (!persistenceReady) return;
    const timer = window.setTimeout(() => {
      const snapshot = captureProjectSnapshot();
      const draftSaved = persistContainerDraft(snapshot);
      if (currentProjectId) {
        setSavedProjects((current) => {
          const existing = current.find((project) => project.id === currentProjectId);
          if (!existing) return current;
          const saved = saveContainerProject(current, snapshot, existing.name, currentProjectId);
          persistContainerProjects(saved.projects);
          return saved.projects;
        });
      }
      if (draftSaved) setLastSavedAt(Date.now());
    }, 700);
    return () => window.clearTimeout(timer);
  }, [captureProjectSnapshot, currentProjectId, persistenceReady]);

  const saveCurrentProject = useCallback(() => {
    const current = currentProjectId ? savedProjects.find((project) => project.id === currentProjectId) : null;
    const fallbackName = cargoItems.find((item) => item.name.trim())?.name.trim()
      || `Loading plan ${new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`;
    const saved = saveContainerProject(savedProjects, captureProjectSnapshot(), projectName || current?.name || fallbackName, currentProjectId);
    setSavedProjects(saved.projects);
    persistContainerProjects(saved.projects);
    persistContainerDraft(saved.project.snapshot);
    setCurrentProjectId(saved.project.id);
    setProjectName(saved.project.name);
    setLastSavedAt(Date.now());
    toast({ title: current ? "Project updated" : "Project saved", description: `${saved.project.name} is saved on this device.` });
  }, [captureProjectSnapshot, cargoItems, currentProjectId, projectName, savedProjects, toast]);

  const openProjectLibrary = useCallback(() => {
    const current = currentProjectId ? savedProjects.find((project) => project.id === currentProjectId) : null;
    setProjectName(current?.name || cargoItems.find((item) => item.name.trim())?.name.trim() || "");
    setProjectDialogOpen(true);
  }, [cargoItems, currentProjectId, savedProjects]);

  const restoreSavedProject = useCallback((project: SavedContainerProject) => {
    restoreProjectSnapshot(project.snapshot);
    persistContainerDraft(project.snapshot);
    setCurrentProjectId(project.id);
    setProjectName(project.name);
    setLastSavedAt(Date.now());
    setProjectDialogOpen(false);
    toast({ title: "Project opened", description: project.name });
  }, [restoreProjectSnapshot, toast]);

  const duplicateSavedProject = useCallback((project: SavedContainerProject) => {
    const copy = duplicateContainerProject(project);
    const next = [copy, ...savedProjects].slice(0, 20);
    setSavedProjects(next);
    persistContainerProjects(next);
    toast({ title: "Project duplicated", description: copy.name });
  }, [savedProjects, toast]);

  const deleteSavedProject = useCallback((project: SavedContainerProject) => {
    if (!window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    const next = savedProjects.filter((entry) => entry.id !== project.id);
    setSavedProjects(next);
    persistContainerProjects(next);
    if (currentProjectId === project.id) {
      setCurrentProjectId(null);
      setProjectName("");
    }
  }, [currentProjectId, savedProjects]);

  const isMetric = unitSystem === "metric";
  const dimFactor = isMetric ? IN_TO_CM : 1;
  const weightFactor = isMetric ? LB_TO_KG : 1;
  const dimUnit = isMetric ? "cm" : "in";
  const weightUnit = isMetric ? "kg" : "lbs";
  const hasCalculatedResult = multiResult !== null;
  const rotationModesByCargoId = useMemo(
    () => Object.fromEntries(cargoItems.map((item) => [item.id, item.rotationMode])) as Record<string, RotationMode>,
    [cargoItems],
  );
  const containerComparisons = useMemo(
    () => hasCalculatedResult ? compareContainerPlans(cargoItems) : [],
    [cargoItems, hasCalculatedResult],
  );

  function toDisplay(valInches: number): string {
    if (!valInches) return "";
    const converted = valInches * dimFactor;
    return parseFloat(converted.toFixed(2)).toString();
  }
  function toDisplayWeight(valLbs: number): string {
    if (!valLbs) return "";
    const converted = valLbs * weightFactor;
    return parseFloat(converted.toFixed(2)).toString();
  }
  function fromDisplay(displayVal: string): number {
    const v = parseFloat(displayVal) || 0;
    return isMetric ? v * CM_TO_IN : v;
  }
  function fromDisplayWeight(displayVal: string): number {
    const v = parseFloat(displayVal) || 0;
    return isMetric ? v * KG_TO_LB : v;
  }

  const container: ContainerSpec = useMemo(() => {
    if (containerId === "custom") {
      const vol = cuInToCuFt(customContainer.lengthIn * customContainer.widthIn * customContainer.heightIn);
      return {
        id: "custom",
        name: "Custom Container",
        lengthIn: customContainer.lengthIn,
        widthIn: customContainer.widthIn,
        heightIn: customContainer.heightIn,
        maxPayloadLbs: customContainer.maxPayloadLbs,
        volumeCuFt: Math.round(vol),
        tare: 0,
      };
    }
    return CONTAINER_PRESETS.find((c) => c.id === containerId)!;
  }, [containerId, customContainer]);

  const planReview = useMemo(
    () => multiResult ? buildContainerPlanReview(cargoItems, multiResult) : [],
    [cargoItems, multiResult],
  );
  const unplacedDiagnostics = useMemo(() => {
    if (!multiResult || multiResult.totalPiecesLoaded >= multiResult.totalPiecesAll) return [];
    const lastContainer = multiResult.containers[multiResult.containers.length - 1];
    if (!lastContainer) return [];
    return diagnoseUnplacedCargo(cargoItems, lastContainer.container, lastContainer.result.unplaced, unitSystem);
  }, [cargoItems, multiResult, unitSystem]);

  const invalidateCalculatedPlan = useCallback(() => {
    setMultiResult(null);
    setRecommendation(null);
    setCogUndoLayouts({});
    setSnapshotExportFn(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (managedShareLink) window.localStorage.setItem("atn-managed-container-share", JSON.stringify(managedShareLink));
    else window.localStorage.removeItem("atn-managed-container-share");
  }, [managedShareLink]);

  const handleUnitSwitch = useCallback((newUnit: "imperial" | "metric") => {
    if (newUnit === unitSystem) return;
    setUnitSystem(newUnit);
    invalidateCalculatedPlan();
  }, [invalidateCalculatedPlan, unitSystem]);

  const addItem = useCallback(() => {
    const colorIdx = cargoItems.length;
    setCargoItems((prev) => [...prev, defaultCargoItem(colorIdx)]);
    invalidateCalculatedPlan();
  }, [cargoItems.length, defaultCargoItem, invalidateCalculatedPlan]);

  const duplicateItem = useCallback((id: string) => {
    setCargoItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const src = prev[idx];
      const copy: CargoItem = { ...src, id: generateId(), name: src.name ? `${src.name} (copy)` : "", color: CARGO_COLORS[(prev.length) % CARGO_COLORS.length] };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    invalidateCalculatedPlan();
  }, [invalidateCalculatedPlan]);

  const removeItem = useCallback((id: string) => {
    setCargoItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    invalidateCalculatedPlan();
  }, [invalidateCalculatedPlan]);

  const updateItem = useCallback((id: string, field: keyof CargoItem, value: any) => {
    setCargoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    if (field === "color" || field === "name") {
      setMultiResult((current) => current ? {
        ...current,
        containers: current.containers.map((entry) => ({
          ...entry,
          result: {
            ...entry.result,
            placed: entry.result.placed.map((box) => box.cargoId === id
              ? { ...box, ...(field === "color" ? { color: value } : { cargoName: value || "Cargo" }) }
              : box),
          },
        })),
      } : current);
      setCogUndoLayouts((current) => Object.fromEntries(
        Object.entries(current).map(([index, layout]) => [index, layout.map((box) => box.cargoId === id
          ? { ...box, ...(field === "color" ? { color: value } : { cargoName: value || "Cargo" }) }
          : box)]),
      ));
    } else {
      invalidateCalculatedPlan();
    }
  }, [invalidateCalculatedPlan]);

  const openImportModal = useCallback(() => {
    setImportStep("upload");
    setImportLoading(false);
    setImportError(null);
    setImportWarnings([]);
    setImportItems([]);
    setImportUnits(unitSystem);
    setDragOver(false);
    setImportRawHeaders([]);
    setImportRawRows([]);
    setImportColMap({ name: "", length: "", width: "", height: "", weight: "", quantity: "", stackable: "", rotation: "", priority: "", palletized: "" });
    setShowImportModal(true);
  }, [unitSystem]);

  const autoDetectColumns = useCallback((headers: string[]): Record<string, string> => {
    const lc = headers.map((h) => h.toLowerCase().trim());
    const find = (keywords: string[]) => {
      const idx = lc.findIndex((h) => keywords.some((k) => h.includes(k)));
      return idx >= 0 ? headers[idx] : "";
    };
    return {
      name: find(["name", "item", "description", "product", "desc"]),
      length: find(["length", "len"]),
      width: find(["width", "wid"]),
      height: find(["height", "hgt", "ht"]),
      weight: find(["weight", "wt", "wgt", "mass"]),
      quantity: find(["quantity", "qty", "count", "units", "pcs"]),
      stackable: find(["stackable", "stack"]),
      rotation: find(["rotation", "rotate", "orient"]),
      priority: find(["priority", "sequence", "order", "load"]),
      palletized: find(["palletized", "pallet"]),
    };
  }, []);

  const parseSpreadsheetToRows = useCallback((headers: string[], rows: Record<string, string>[]) => {
    setImportRawHeaders(headers);
    setImportRawRows(rows);
    setImportColMap(autoDetectColumns(headers));
    setImportStep("mapping");
    setImportLoading(false);
  }, [autoDetectColumns]);

  const parseStackable = (val: string): boolean | undefined => {
    const v = val.toLowerCase().trim();
    if (["yes", "true", "1", "y"].includes(v)) return true;
    if (["no", "false", "0", "n"].includes(v)) return false;
    return undefined;
  };
  const parseRotation = (val: string): RotationMode | undefined => {
    const v = val.toLowerCase().trim();
    if (["all", "any", "full"].includes(v)) return "all";
    if (["horizontal", "horiz", "h"].includes(v)) return "horizontal";
    if (["fixed", "none", "no", "f"].includes(v)) return "fixed";
    return undefined;
  };
  const parsePriority = (val: string): LoadPriority | undefined => {
    const v = val.toLowerCase().trim();
    if (["first", "1", "high", "top"].includes(v)) return "first";
    if (["normal", "medium", "mid", "2"].includes(v)) return "normal";
    if (["last", "3", "low", "bottom"].includes(v)) return "last";
    return undefined;
  };

  const applyColumnMapping = useCallback(() => {
    const { name: nKey, length: lKey, width: wKey, height: hKey, weight: wtKey, quantity: qKey, stackable: sKey, rotation: rKey, priority: pKey, palletized: plKey } = importColMap;
    if (!lKey && !wKey && !hKey) {
      setImportError("Please map at least one dimension column (Length, Width, or Height).");
      return;
    }
    const weightHeader = wtKey.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const weightIsPerPiece = /(^| )(unit weight|weight per|per unit|per piece|each weight|wt pc)( |$)/.test(weightHeader);
    const items = importRawRows
      .map((r) => {
        const quantity = Math.max(1, Math.round(parseFloat(qKey ? r[qKey] : "") || 1));
        const rawWeight = Math.max(0, parseFloat(wtKey ? r[wtKey] : "") || 0);
        return {
          name: nKey ? String(r[nKey] || "").substring(0, 100) : "",
          length: Math.max(0, parseFloat(lKey ? r[lKey] : "") || 0),
          width: Math.max(0, parseFloat(wKey ? r[wKey] : "") || 0),
          height: Math.max(0, parseFloat(hKey ? r[hKey] : "") || 0),
          weight: weightIsPerPiece ? rawWeight * quantity : rawWeight,
          quantity,
          stackable: sKey ? parseStackable(r[sKey] || "") : undefined,
          rotationMode: rKey ? parseRotation(r[rKey] || "") : undefined,
          loadPriority: pKey ? parsePriority(r[pKey] || "") : undefined,
          palletized: plKey ? parseStackable(r[plKey] || "") : undefined,
          include: true,
        };
      })
      .filter((i) => i.length > 0 || i.width > 0 || i.height > 0);
    if (items.length === 0) {
      setImportError("No valid dimensional data found with the selected column mapping.");
      return;
    }
    setImportError(null);
    setImportWarnings(weightIsPerPiece
      ? ["A per-unit weight column was detected and converted to total row weight using the quantity."]
      : []);
    setImportItems(items);
    setImportStep("preview");
  }, [importColMap, importRawRows]);

  const handleImportFile = useCallback(async (file: File) => {
    setImportError(null);
    setImportWarnings([]);
    setImportLoading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isCSV = ext === "csv" || ext === "tsv" || file.type === "text/csv";
      const isExcel = ext === "xlsx" || ext === "xls" || file.type.includes("spreadsheet") || file.type.includes("excel");

      if (isCSV) {
        const text = await file.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            if (!results.data || results.data.length === 0) {
              setImportError("No data rows found in the file.");
              setImportLoading(false);
              return;
            }
            const rows = results.data as Record<string, string>[];
            const headers = Object.keys(rows[0]);
            parseSpreadsheetToRows(headers, rows);
          },
          error: () => {
            setImportError("Failed to parse the CSV file. Please check the format.");
            setImportLoading(false);
          },
        });
        return;
      }

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) {
          setImportError("No sheets found in the Excel file.");
          setImportLoading(false);
          return;
        }
        const sheet = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
        if (jsonData.length === 0) {
          setImportError("No data rows found in the Excel file.");
          setImportLoading(false);
          return;
        }
        const headers = Object.keys(jsonData[0]);
        const rows = jsonData.map((r) => {
          const row: Record<string, string> = {};
          for (const k of headers) row[k] = String(r[k] ?? "");
          return row;
        });
        parseSpreadsheetToRows(headers, rows);
        return;
      }

      const aiDocumentExtensions = new Set([
        "pdf", "doc", "docx", "rtf", "odt", "ppt", "pptx",
        "txt", "text", "md", "markdown", "json", "xml", "html", "htm", "eml",
        "jpg", "jpeg", "png", "webp", "gif",
      ]);
      if (aiDocumentExtensions.has(ext)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/cargo/extract", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setImportError(data.error || "Failed to process document.");
          setImportLoading(false);
          return;
        }
        if (!data.items || data.items.length === 0) {
          setImportError("No cargo items were found in the document. Try a clearer image.");
          setImportLoading(false);
          return;
        }
        setImportUnits(data.units === "metric" ? "metric" : "imperial");
        setImportWarnings(Array.isArray(data.warnings) ? data.warnings : []);
        setImportItems(data.items.map((i: any) => ({ ...i, include: true })));
        setImportStep("preview");
        setImportLoading(false);
        return;
      }

      setImportError("Unsupported file type. Upload a common spreadsheet, PDF, Word, PowerPoint, email, text, or image file.");
      setImportLoading(false);
    } catch (err) {
      setImportError("An unexpected error occurred while processing the file.");
      setImportLoading(false);
    }
  }, [parseSpreadsheetToRows]);

  const handleImportDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImportFile(file);
  }, [handleImportFile]);

  const confirmImport = useCallback(() => {
    const importedCount = importItems.filter((i) => (
      i.include && (i.length > 0 || i.width > 0 || i.height > 0)
    )).length;
    if (importedCount === 0) return;

    setCargoItems((previousItems) => {
      return mergeImportedCargoItems({
        previousItems,
        importedRows: importItems,
        units: importUnits,
        defaults: bulkDefaults,
        colors: CARGO_COLORS,
        createId: generateId,
      }).items;
    });
    setUnitSystem(importUnits);
    invalidateCalculatedPlan();
    setShowImportModal(false);
    toast({
      title: `${importedCount} item${importedCount > 1 ? "s" : ""} filled in`,
      description: "The extracted cargo fields are ready for review in the calculator.",
    });
  }, [importItems, importUnits, bulkDefaults, invalidateCalculatedPlan, toast]);

  const downloadSampleCSV = useCallback(() => {
    const csvContent = `Name,Length,Width,Height,Total Weight,Quantity,Stackable,Rotation,Priority,Palletized\nCardboard Box A,24,18,12,150,10,yes,all,normal,no\nPallet Load B,48,40,36,1000,4,no,fixed,first,yes\nSmall Carton C,12,10,8,125,25,yes,horizontal,last,no`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cargo-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleCalculate = useCallback(() => {
    const validItems = cargoItems.filter(
      (i) => i.included && i.length > 0 && i.width > 0 && i.height > 0 && i.quantity > 0
    );
    if (validItems.length === 0) {
      toast({
        title: "No cargo entered",
        description: "Please enter at least one included cargo item with valid dimensions.",
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    setTimeout(() => {
      try {
        const bestPlan = containerSelectionMode === "manual" && containerId === "custom"
          ? null
          : recommendContainer(validItems);
        const selectedPlan = containerSelectionMode === "recommend" && bestPlan
          ? bestPlan.plan
          : packIntoContainers(validItems, container);

        if (containerSelectionMode === "recommend" && bestPlan) {
          setContainerId(bestPlan.container.id);
        }
        setActiveResultContainer(0);
        setActiveResultTab("plan");
        setCogUndoLayouts({});
        setMultiResult(selectedPlan);
        setRecommendation(bestPlan);

        if (selectedPlan.totalPiecesLoaded < selectedPlan.totalPiecesAll) {
          toast({
            title: "Some items still didn't fit",
            description: `${selectedPlan.totalPiecesAll - selectedPlan.totalPiecesLoaded} piece(s) could not be placed. Check the item dimensions, orientation, and payload limits.`,
            variant: "destructive",
          });
        }
        setCalculating(false);
      } catch (err) {
        console.error("packBoxes error:", err);
        setCalculating(false);
        toast({
          title: "Calculation error",
          description: "Something went wrong. Please check your inputs.",
          variant: "destructive",
        });
      }
    }, 500);
  }, [cargoItems, container, containerId, containerSelectionMode, toast]);

  useEffect(() => {
    if (pendingRecalc) {
      setPendingRecalc(false);
      handleCalculate();
    }
  }, [pendingRecalc, handleCalculate]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === cargoItems.length
        ? new Set()
        : new Set(cargoItems.map((i) => i.id))
    );
  }, [cargoItems]);

  const bulkUpdate = useCallback((field: keyof CargoItem, value: any) => {
    setCargoItems((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, [field]: value } : item
      )
    );
    invalidateCalculatedPlan();
  }, [invalidateCalculatedPlan, selectedIds]);

  const handleReset = useCallback(() => {
    setMultiResult(null);
    setRecommendation(null);
    setContainerId("20dc");
    setContainerSelectionMode("recommend");
    setCargoItems([defaultCargoItem(0), defaultCargoItem(1)]);
    setSelectedIds(new Set());
    setActiveResultTab("plan");
    setActiveResultContainer(0);
    setCogUndoLayouts({});
    setSnapshotExportFn(null);
    setShareDialogOpen(false);
    setCurrentProjectId(null);
    setProjectName("");
  }, [defaultCargoItem]);

  const handleExportPDF = useCallback(async () => {
    if (!multiResult || multiResult.containers.length === 0) return;
    toast({ title: "Generating PDF...", description: "Please wait while we create your report." });
    try {
      const activeIndex = Math.min(activeResultContainer, multiResult.containers.length - 1);
      const cr = multiResult.containers[activeIndex];
      const containerPlans = multiResult.containers.map((entry) => ({
        label: entry.label,
        containerSpec: entry.container,
        result: entry.result,
      }));
      let logoDataUrl: string | undefined;
      try {
        const response = await fetch("/favicon.png", { cache: "force-cache" });
        if (response.ok) {
          const logoBlob = await response.blob();
          logoDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(logoBlob);
          });
        }
      } catch (logoError) {
        console.warn("Brand icon could not be embedded; using the vector fallback.", logoError);
      }
      const reportBrand = { logoDataUrl };
      let blob: Blob | null = null;

      try {
        const { generatePackingReportBlob, buildCargoSummaryRows } = await import(
          "./container-pdf/ContainerPackingReportPDF"
        );
        let images = { iso: "", top: "", sideA: "", front: "" };

        if (snapshotExportFn) {
          try {
            const snaps = snapshotExportFn();
            if (snaps) images = snaps;
          } catch (snapshotError) {
            console.warn("3D snapshots unavailable; generating the report without them.", snapshotError);
          }
        }

        blob = await generatePackingReportBlob({
          containerSpec: cr.container,
          cargoRows: buildCargoSummaryRows(cargoItems),
          result: cr.result,
          totalContainers: multiResult.totalContainers,
          unitSystem,
          images,
          containerPlans,
          brand: reportBrand,
        });
      } catch (richReportError) {
        console.warn("Rich PDF generation failed; using the compatibility report.", richReportError);
        const { generateBasicPackingReportBlob } = await import(
          "./container-pdf/ContainerPackingReportFallback"
        );
        blob = await generateBasicPackingReportBlob({
          containerSpec: cr.container,
          cargoItems,
          result: cr.result,
          totalContainers: multiResult.totalContainers,
          unitSystem,
          containerPlans,
          brand: reportBrand,
        });
      }

      if (!blob || blob.size < 1000) {
        throw new Error("Generated PDF was empty.");
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AccessToNorth_PackingReport_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      toast({ title: "PDF Ready", description: "Your packing report download has started." });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: "PDF Export Failed", description: "Could not generate the report.", variant: "destructive" });
    }
  }, [multiResult, activeResultContainer, unitSystem, cargoItems, snapshotExportFn, toast]);

  const handleExportCSV = useCallback(() => {
    if (!multiResult || multiResult.containers.length === 0) return;
    try {
      const csv = buildContainerPlacementCsv(multiResult, unitSystem);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `AccessToNorth_LoadingPlan_${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast({ title: "Placement CSV ready", description: "Every assigned item and container is included." });
    } catch (error) {
      console.error("CSV export error:", error);
      toast({ title: "CSV Export Failed", description: "Could not generate the placement data.", variant: "destructive" });
    }
  }, [multiResult, unitSystem, toast]);

  const handleSharePlan = useCallback(async () => {
    if (!multiResult || multiResult.containers.length === 0 || creatingShareLink) return;
    setCreatingShareLink(true);
    try {
      const response = await fetch("/api/shared-load-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${multiResult.totalContainers}-container loading plan`,
          unitSystem,
          containers: multiResult.containers.map((entry) => ({
            label: entry.label,
            container: entry.container,
            placed: entry.result.placed,
          })),
          editorState: {
            containerSelectionMode,
            containerId,
            customContainer,
            cargoItems,
          },
          expiresInDays: shareLifetimeDays,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Could not create a share link.");
      }
      const absoluteUrl = new URL(data.url, window.location.origin).toString();
      const token = absoluteUrl.split("/").filter(Boolean).at(-1) || "";
      setManagedShareLink({
        token,
        url: absoluteUrl,
        expiresAt: String(data.expiresAt || ""),
        revokeToken: String(data.revokeToken || ""),
      });
      try {
        await navigator.clipboard.writeText(absoluteUrl);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = absoluteUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      toast({
        title: "Share link copied",
        description: `Anyone with the link can open this read-only loading plan for ${shareLifetimeDays} days.`,
      });
    } catch (error) {
      console.error("Share-link error:", error);
      toast({
        title: "Could not create share link",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingShareLink(false);
    }
  }, [cargoItems, containerId, containerSelectionMode, creatingShareLink, customContainer, multiResult, shareLifetimeDays, toast, unitSystem]);

  const copyManagedShareLink = useCallback(async () => {
    if (!managedShareLink) return;
    try {
      await navigator.clipboard.writeText(managedShareLink.url);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = managedShareLink.url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    toast({ title: "Share link copied", description: "Ready to send to your customer or warehouse." });
  }, [managedShareLink, toast]);

  const revokeManagedShareLink = useCallback(async () => {
    if (!managedShareLink) return;
    const response = await fetch(`/api/shared-load-plans/${encodeURIComponent(managedShareLink.token)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${managedShareLink.revokeToken}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast({ title: "Could not revoke link", description: data.message || "Please try again.", variant: "destructive" });
      return;
    }
    setManagedShareLink(null);
    toast({ title: "Share link revoked", description: "The public loading plan can no longer be opened." });
  }, [managedShareLink, toast]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {calculating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" data-testid="calculating-overlay">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 max-w-xs">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              <Package className="absolute inset-0 m-auto w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900 text-sm">Calculating optimal layout...</p>
              <p className="text-xs text-slate-500 mt-1">Packing your cargo into the container</p>
            </div>
          </div>
        </div>
      )}
      {projectDialogOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onClick={() => setProjectDialogOpen(false)} data-testid="project-library-overlay">
          <div className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="project-library-title" data-testid="project-library-dialog">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div><p id="project-library-title" className="text-lg font-bold text-slate-950">Loading plan projects</p><p className="mt-1 text-sm leading-5 text-slate-500">Save complete inputs and calculated placements. Projects remain private on this device.</p></div>
              <button type="button" onClick={() => setProjectDialogOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close project library"><X className="h-4 w-4" /></button>
            </div>
            <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <Label htmlFor="container-project-name" className="text-xs font-bold text-slate-600">Project name</Label>
              <div className="mt-2 flex gap-2"><Input id="container-project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={120} placeholder="e.g. Montreal export — 7 pallets" onKeyDown={(event) => { if (event.key === "Enter") saveCurrentProject(); }} /><Button type="button" className="shrink-0 gap-2" onClick={saveCurrentProject} data-testid="button-save-container-project"><Save className="h-4 w-4" />{currentProjectId ? "Update" : "Save"}</Button></div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Saved projects ({savedProjects.length}/20)</p><Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { handleReset(); setProjectDialogOpen(false); }}>New blank plan</Button></div>
              {savedProjects.length ? <div className="space-y-2">{savedProjects.map((project) => (
                <div key={project.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition ${currentProjectId === project.id ? "border-blue-300 bg-blue-50/50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`} data-testid={`saved-project-${project.id}`}>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => restoreSavedProject(project)}>
                    <span className="block truncate text-sm font-bold text-slate-900">{project.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500"><span>{project.snapshot.cargoItems.length} cargo row{project.snapshot.cargoItems.length === 1 ? "" : "s"}</span><span>{project.snapshot.multiResult?.totalContainers ? `${project.snapshot.multiResult.totalContainers} container${project.snapshot.multiResult.totalContainers === 1 ? "" : "s"}` : "Not calculated"}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{new Date(project.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span></span>
                  </button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => duplicateSavedProject(project)} aria-label={`Duplicate ${project.name}`} title="Duplicate project"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => deleteSavedProject(project)} aria-label={`Delete ${project.name}`} title="Delete project"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}</div> : <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center"><FolderOpen className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">No named projects yet</p><p className="mt-1 text-xs text-slate-500">Your current draft is still saved automatically.</p></div>}
            </div>
          </div>
        </div>
      )}
      {shareDialogOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onClick={() => setShareDialogOpen(false)} data-testid="share-plan-dialog-overlay">
          <div className="w-full max-w-lg rounded-3xl border border-white/80 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="share-plan-title" data-testid="share-plan-dialog">
            <div className="flex items-start justify-between gap-4">
              <div><p id="share-plan-title" className="text-lg font-bold text-slate-950">Share loading plan</p><p className="mt-1 text-sm leading-5 text-slate-500">Anyone with the link can inspect the read-only 3D plan without an account.</p></div>
              <button type="button" onClick={() => setShareDialogOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close share dialog"><X className="h-4 w-4" /></button>
            </div>

            {!managedShareLink ? <>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Link expires after</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {([7, 30, 90, 180] as ShareLifetimeDays[]).map((days) => <button key={days} type="button" onClick={() => setShareLifetimeDays(days)} className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${shareLifetimeDays === days ? "border-blue-400 bg-blue-50 text-primary ring-2 ring-blue-100" : "border-slate-200 text-slate-600 hover:border-slate-300"}`} aria-pressed={shareLifetimeDays === days}>{days === 180 ? "6 months" : `${days} days`}</button>)}
              </div>
              <Button className="mt-5 w-full gap-2" onClick={handleSharePlan} disabled={creatingShareLink} data-testid="button-create-share-link">{creatingShareLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}Create and copy link</Button>
            </> : <>
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Link is active</div>
                <div className="mt-3 flex gap-2"><Input readOnly value={managedShareLink.url} className="min-w-0 bg-white text-xs" aria-label="Share loading plan URL" /><Button type="button" variant="outline" onClick={copyManagedShareLink}>Copy</Button></div>
                <p className="mt-2 text-[11px] text-emerald-800/70">Expires {new Date(managedShareLink.expiresAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-500">You can disable this exact link at any time.</p><Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={revokeManagedShareLink} data-testid="button-revoke-share-link">Revoke link</Button></div>
            </>}
          </div>
        </div>
      )}
      {!isEmbedMode && <Navbar />}
      <main className={`flex-1 pb-16 ${isEmbedMode ? "pt-6" : "pt-28"}`}>
        <div className="mx-auto w-full max-w-[1920px] px-4 md:px-6 xl:px-8">
          {!isEmbedMode && <Breadcrumbs
            items={[
              { label: "Tools", href: "/tools" },
              { label: "Container Loading Calculator" },
            ]}
          />}

          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge className="mb-3 bg-primary/10 text-primary border-0 px-3 py-1">
              Free Tool
            </Badge>
            <h1
              className="text-3xl md:text-4xl font-extrabold font-display mb-3 text-slate-900"
              data-testid="text-calculator-title"
            >
              Container Loading Calculator
            </h1>
            <p className="text-lg text-slate-600">
              Plan optimal cargo placement with interactive 3D visualization. See exactly how your
              goods fit in standard shipping containers.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button type="button" size="sm" variant="outline" className="gap-2 bg-white" onClick={openProjectLibrary} data-testid="button-open-project-library"><FolderOpen className="h-4 w-4 text-primary" />Saved plans{savedProjects.length ? ` (${savedProjects.length})` : ""}</Button>
              <Button type="button" size="sm" variant="outline" className="gap-2 bg-white" onClick={saveCurrentProject} data-testid="button-quick-save-project"><Save className="h-4 w-4 text-emerald-600" />{currentProjectId ? "Save changes" : "Save project"}</Button>
              <span className="inline-flex items-center gap-1.5 px-2 text-[11px] text-slate-400"><Clock3 className="h-3.5 w-3.5" />{lastSavedAt ? `Autosaved ${new Date(lastSavedAt).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}` : "Autosave ready"}</span>
            </div>
          </div>

          <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-5">
              <Card id="container-type-setup" className="border-slate-200 scroll-mt-28" data-testid="container-type-section">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      Container Type
                    </h2>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => handleUnitSwitch("imperial")}
                        className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                          unitSystem === "imperial"
                            ? "bg-primary text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                        data-testid="button-unit-imperial"
                      >
                        in / lbs
                      </button>
                      <button
                        onClick={() => handleUnitSwitch("metric")}
                        className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                          unitSystem === "metric"
                            ? "bg-primary text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                        data-testid="button-unit-metric"
                      >
                        cm / kg
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setContainerSelectionMode("recommend");
                          invalidateCalculatedPlan();
                      }}
                      className={`col-span-2 text-left p-3 rounded-lg border text-sm transition-all ${
                        containerSelectionMode === "recommend"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-slate-200 hover:border-primary/40"
                      }`}
                      data-testid="button-container-recommend"
                    >
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Recommend the best container
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        We’ll compare every standard size after you enter the cargo details.
                      </span>
                    </button>
                    {CONTAINER_PRESETS.map((ct) => {
                      const volDisplay = isMetric
                        ? `${(ct.volumeCuFt * 0.0283168).toFixed(1)} m³`
                        : `${ct.volumeCuFt.toLocaleString()} ft³`;
                      const dimsDisplay = isMetric
                        ? `${(ct.lengthIn * IN_TO_CM / 100).toFixed(1)}×${(ct.widthIn * IN_TO_CM / 100).toFixed(1)}×${(ct.heightIn * IN_TO_CM / 100).toFixed(1)} m`
                        : `${Math.round(ct.lengthIn)}×${Math.round(ct.widthIn)}×${Math.round(ct.heightIn)}"`;
                      return (
                        <button
                          key={ct.id}
                          onClick={() => {
                            setContainerSelectionMode("manual");
                            setContainerId(ct.id);
                            invalidateCalculatedPlan();
                          }}
                          className={`text-left p-2.5 rounded-lg border text-sm transition-all ${
                            containerSelectionMode === "manual" && containerId === ct.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          data-testid={`button-container-${ct.id}`}
                        >
                          <span className="flex items-start gap-2">
                            <span data-testid={`container-icon-${ct.id}`} className={`mt-0.5 flex h-9 w-12 shrink-0 items-center justify-center rounded-lg ${
                              containerSelectionMode === "manual" && containerId === ct.id
                                ? "bg-blue-50"
                                : "bg-slate-50"
                            }`}>
                              <ContainerLineIcon
                                active={containerSelectionMode === "manual" && containerId === ct.id}
                                short={ct.id.startsWith("20")}
                                className="h-8 w-11"
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="font-semibold text-slate-900 block leading-tight text-xs">
                                {ct.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">{dimsDisplay}</span>
                              <span className="text-[10px] text-slate-500 block">{volDisplay}</span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        setContainerSelectionMode("manual");
                        setContainerId("custom");
                        invalidateCalculatedPlan();
                      }}
                      className={`text-left p-2.5 rounded-lg border text-sm transition-all col-span-2 ${
                        containerSelectionMode === "manual" && containerId === "custom"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      data-testid="button-container-custom"
                    >
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Settings2 className="w-3.5 h-3.5 text-primary" />
                        Custom Dimensions
                      </span>
                    </button>
                  </div>

                  {containerSelectionMode === "manual" && containerId === "custom" && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
                      <div className="grid grid-cols-4 gap-1.5">
                        <div>
                          <Label className="text-[10px] text-slate-500">L ({dimUnit})</Label>
                          <Input
                            type="number"
                            min={1}
                            step="0.1"
                            value={toDisplay(customContainer.lengthIn)}
                            onChange={(e) => {
                              setCustomContainer((p) => ({
                                ...p,
                                lengthIn: fromDisplay(e.target.value),
                              }));
                              invalidateCalculatedPlan();
                            }}
                            className="h-7 text-xs px-1.5"
                            data-testid="input-custom-length"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500">W ({dimUnit})</Label>
                          <Input
                            type="number"
                            min={1}
                            step="0.1"
                            value={toDisplay(customContainer.widthIn)}
                            onChange={(e) => {
                              setCustomContainer((p) => ({
                                ...p,
                                widthIn: fromDisplay(e.target.value),
                              }));
                              invalidateCalculatedPlan();
                            }}
                            className="h-7 text-xs px-1.5"
                            data-testid="input-custom-width"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500">H ({dimUnit})</Label>
                          <Input
                            type="number"
                            min={1}
                            step="0.1"
                            value={toDisplay(customContainer.heightIn)}
                            onChange={(e) => {
                              setCustomContainer((p) => ({
                                ...p,
                                heightIn: fromDisplay(e.target.value),
                              }));
                              invalidateCalculatedPlan();
                            }}
                            className="h-7 text-xs px-1.5"
                            data-testid="input-custom-height"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500">Payload ({weightUnit})</Label>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            value={toDisplayWeight(customContainer.maxPayloadLbs)}
                            onChange={(e) => {
                              setCustomContainer((p) => ({
                                ...p,
                                maxPayloadLbs: fromDisplayWeight(e.target.value),
                              }));
                              invalidateCalculatedPlan();
                            }}
                            className="h-7 text-xs px-1.5"
                            data-testid="input-custom-payload"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="grid grid-cols-5 gap-1 text-center text-[11px]">
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-length">
                          {isMetric
                            ? `${(container.lengthIn * IN_TO_CM).toFixed(0)}`
                            : `${parseFloat(container.lengthIn.toFixed(1))}`}
                        </p>
                        <p className="text-[9px] text-slate-400">L ({dimUnit})</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-width">
                          {isMetric
                            ? `${(container.widthIn * IN_TO_CM).toFixed(0)}`
                            : `${parseFloat(container.widthIn.toFixed(1))}`}
                        </p>
                        <p className="text-[9px] text-slate-400">W ({dimUnit})</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-height">
                          {isMetric
                            ? `${(container.heightIn * IN_TO_CM).toFixed(0)}`
                            : `${parseFloat(container.heightIn.toFixed(1))}`}
                        </p>
                        <p className="text-[9px] text-slate-400">H ({dimUnit})</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-payload">
                          {isMetric
                            ? `${Math.round(container.maxPayloadLbs * LB_TO_KG).toLocaleString()}`
                            : `${container.maxPayloadLbs.toLocaleString()}`}
                        </p>
                        <p className="text-[9px] text-slate-400">{weightUnit}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-volume">
                          {isMetric
                            ? `${(container.volumeCuFt * 0.0283168).toFixed(1)}`
                            : `${container.volumeCuFt.toLocaleString()}`}
                        </p>
                        <p className="text-[9px] text-slate-400">{isMetric ? "m³" : "ft³"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <Card id="packing-list-setup" className="border-slate-200 scroll-mt-28" data-testid="packing-list-section">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Box className="w-4 h-4 text-primary" />
                      Packing List
                    </h2>
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => handleUnitSwitch("imperial")}
                          className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                            unitSystem === "imperial"
                              ? "bg-primary text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                          data-testid="button-unit-imperial-table"
                        >
                          in/lbs
                        </button>
                        <button
                          onClick={() => handleUnitSwitch("metric")}
                          className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                            unitSystem === "metric"
                              ? "bg-primary text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                          data-testid="button-unit-metric-table"
                        >
                          cm/kg
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openImportModal}
                        className="gap-1.5 h-7 text-xs"
                        data-testid="button-import"
                        aria-label="Import Data"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Import</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setTempBulk({ ...bulkDefaults }); setBulkApplyScope(selectedIds.size > 0 ? "selected" : "all"); setShowBulkModal(true); }}
                        className="gap-1.5 h-7 text-xs"
                        data-testid="button-bulk-edit"
                        aria-label="Bulk Edit Settings"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bulk Edit</span>
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-blue-800">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p className="min-w-0 text-[11px] leading-[1.55] text-left">
                      Enter the <strong>total gross weight for each row</strong>. The calculator divides it across the quantity automatically.
                    </p>
                  </div>

                  {selectedIds.size > 0 && (
                    <div
                      className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15"
                      data-testid="bulk-actions-bar"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          Bulk Actions ({selectedIds.size} items)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Stackable</Label>
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => bulkUpdate("stackable", true)}
                              className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                              data-testid="bulk-stackable-yes"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => bulkUpdate("stackable", false)}
                              className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                              data-testid="bulk-stackable-no"
                            >
                              No
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Rotation</Label>
                          <select
                            onChange={(e) => bulkUpdate("rotationMode", e.target.value as RotationMode)}
                            className="mt-1 w-full h-[30px] px-2 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:border-primary/50 transition-colors cursor-pointer"
                            defaultValue=""
                            data-testid="bulk-rotation"
                          >
                            <option value="" disabled>Set...</option>
                            <option value="all">All axes</option>
                            <option value="horizontal">Horiz. only</option>
                            <option value="fixed">Fixed</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Priority</Label>
                          <select
                            onChange={(e) => bulkUpdate("loadPriority", e.target.value as LoadPriority)}
                            className="mt-1 w-full h-[30px] px-2 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:border-primary/50 transition-colors cursor-pointer"
                            defaultValue=""
                            data-testid="bulk-priority"
                          >
                            <option value="" disabled>Set...</option>
                            <option value="first">Load First</option>
                            <option value="normal">Normal</option>
                            <option value="last">Load Last</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Pallet</Label>
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => { bulkUpdate("palletized", false); bulkUpdate("palletType", "none"); }}
                              className="flex-1 px-1.5 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors"
                              data-testid="bulk-pallet-none"
                            >
                              None
                            </button>
                            <button
                              onClick={() => { bulkUpdate("palletized", true); bulkUpdate("palletType", "us48x40"); }}
                              className="flex-1 px-1.5 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors"
                              data-testid="bulk-pallet-us"
                            >
                              US
                            </button>
                            <button
                              onClick={() => { bulkUpdate("palletized", true); bulkUpdate("palletType", "euro"); }}
                              className="flex-1 px-1.5 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                              data-testid="bulk-pallet-euro"
                            >
                              Euro
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Include</Label>
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => bulkUpdate("included", true)}
                              className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                              data-testid="bulk-include-yes"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => bulkUpdate("included", false)}
                              className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                              data-testid="bulk-include-no"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {visualPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setVisualPopup(null)} data-testid="visual-popup-overlay">
                      <div className={`bg-white rounded-xl shadow-2xl border border-slate-200 p-5 w-full mx-4 ${visualPopup.type === "palletized" ? "max-w-md" : "max-w-sm"}`} onClick={(e) => e.stopPropagation()} data-testid="visual-popup">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-sm text-slate-900">
                            {visualPopup.type === "stackable" ? "Stackable Options"
                              : visualPopup.type === "rotation" ? "Rotation Modes"
                              : visualPopup.type === "palletized" ? "Pallet Options"
                              : "Loading Sequence"}
                          </h3>
                          <button onClick={() => setVisualPopup(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" data-testid="button-close-popup">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {visualPopup.type === "stackable" ? (
                          <div className="space-y-4">
                            <button
                              onClick={() => {
                                updateItem(visualPopup.itemId, "stackable", true);
                                setVisualPopup(null);
                              }}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                cargoItems.find(i => i.id === visualPopup.itemId)?.stackable
                                  ? "border-green-400 bg-green-50"
                                  : "border-slate-200 hover:border-green-300 hover:bg-green-50/50"
                              }`}
                              data-testid="popup-stackable-yes"
                            >
                              <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                <rect x="8" y="30" width="40" height="18" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
                                <rect x="8" y="8" width="40" height="18" rx="2" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1.5" />
                                <path d="M28 4 L32 8 H24 Z" fill="#22c55e" />
                                <text x="28" y="42" textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="600">BOX</text>
                                <text x="28" y="20" textAnchor="middle" fontSize="7" fill="#15803d" fontWeight="600">BOX</text>
                              </svg>
                              <div className="text-left">
                                <div className="text-xs font-semibold text-green-700">Stackable (✓)</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Other items can be placed on top</div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                updateItem(visualPopup.itemId, "stackable", false);
                                setVisualPopup(null);
                              }}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                !cargoItems.find(i => i.id === visualPopup.itemId)?.stackable
                                  ? "border-amber-400 bg-amber-50"
                                  : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                              }`}
                              data-testid="popup-stackable-no"
                            >
                              <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                <rect x="8" y="20" width="40" height="28" rx="2" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                                <text x="28" y="38" textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="600">BOX</text>
                                <line x1="14" y1="8" x2="42" y2="16" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="42" y1="8" x2="14" y2="16" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                              </svg>
                              <div className="text-left">
                                <div className="text-xs font-semibold text-amber-700">Not Stackable (✗)</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Nothing placed on top of this item</div>
                              </div>
                            </button>
                          </div>
                        ) : visualPopup.type === "rotation" ? (
                          <div className="space-y-3">
                            {(() => {
                              const currentMode = cargoItems.find(i => i.id === visualPopup.itemId)?.rotationMode;
                              return (
                                <>
                                  <button
                                    onClick={() => { updateItem(visualPopup.itemId, "rotationMode", "all"); setVisualPopup(null); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      currentMode === "all" ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                                    }`}
                                    data-testid="popup-rotation-all"
                                  >
                                    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                      <rect x="14" y="14" width="28" height="28" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                      <text x="28" y="32" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                      <path d="M28 6 C36 6 44 10 46 16" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
                                      <path d="M50 28 C50 36 46 44 40 46" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
                                      <path d="M6 28 C6 20 10 12 16 10" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
                                      <defs><marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#3b82f6" /></marker></defs>
                                    </svg>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-blue-700">All Axes</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Rotate freely in all directions</div>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => { updateItem(visualPopup.itemId, "rotationMode", "horizontal"); setVisualPopup(null); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      currentMode === "horizontal" ? "border-purple-400 bg-purple-50" : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                                    }`}
                                    data-testid="popup-rotation-horizontal"
                                  >
                                    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                      <rect x="14" y="18" width="28" height="24" rx="2" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="1.5" />
                                      <text x="28" y="34" textAnchor="middle" fontSize="7" fill="#6d28d9" fontWeight="600">BOX</text>
                                      <path d="M14 12 C20 6 36 6 42 12" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
                                      <path d="M40 10 L42 12 L40 14" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M16 10 L14 12 L16 14" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <line x1="28" y1="46" x2="28" y2="50" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                                      <circle cx="28" cy="52" r="1.5" fill="#dc2626" />
                                    </svg>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-purple-700">Horizontal Only</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Rotate on floor plane only (keeps upright)</div>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => { updateItem(visualPopup.itemId, "rotationMode", "fixed"); setVisualPopup(null); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      currentMode === "fixed" ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                    }`}
                                    data-testid="popup-rotation-fixed"
                                  >
                                    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                      <rect x="14" y="14" width="28" height="28" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                                      <text x="28" y="32" textAnchor="middle" fontSize="7" fill="#475569" fontWeight="600">BOX</text>
                                      <rect x="22" y="4" width="12" height="9" rx="2" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.2" />
                                      <circle cx="28" cy="10" r="1.5" fill="#ef4444" />
                                      <rect x="27" y="10" width="2" height="4" rx="0.5" fill="#ef4444" />
                                    </svg>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-slate-700">Fixed</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">No rotation — exactly as entered</div>
                                    </div>
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        ) : visualPopup.type === "palletized" ? (
                          <div className="space-y-3">
                            {(() => {
                              const currentItem = cargoItems.find(i => i.id === visualPopup.itemId);
                              const isPalletized = currentItem?.palletized;
                              const currentPalletType = currentItem?.palletType || "none";
                              return (
                                <>
                                  <button
                                    onClick={() => {
                                      updateItem(visualPopup.itemId, "palletized", false);
                                      updateItem(visualPopup.itemId, "palletType", "none");
                                      setVisualPopup(null);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      !isPalletized ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                    }`}
                                    data-testid="popup-pallet-none"
                                  >
                                    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                      <rect x="10" y="14" width="36" height="28" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                      <text x="28" y="32" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                      <line x1="10" y1="48" x2="46" y2="48" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
                                      <text x="28" y="54" textAnchor="middle" fontSize="5" fill="#94a3b8">FLOOR</text>
                                    </svg>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-slate-700">No Pallet</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Cargo placed directly on container floor</div>
                                    </div>
                                  </button>

                                  <div className={`rounded-lg border-2 transition-all ${isPalletized && currentPalletType === "us48x40" ? "border-teal-400 bg-teal-50/50" : "border-slate-200"}`}>
                                    <button
                                      onClick={() => {
                                        updateItem(visualPopup.itemId, "palletized", true);
                                        updateItem(visualPopup.itemId, "palletType", "us48x40");
                                        setVisualPopup(null);
                                      }}
                                      className="w-full flex items-center gap-3 p-3 rounded-t-lg hover:bg-teal-50/50 transition-all"
                                      data-testid="popup-pallet-us48x40"
                                    >
                                      <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                        <rect x="6" y="40" width="44" height="6" rx="1" fill="#99f6e4" stroke="#14b8a6" strokeWidth="1" />
                                        <rect x="10" y="44" width="4" height="8" rx="0.5" fill="#5eead4" stroke="#14b8a6" strokeWidth="0.5" />
                                        <rect x="24" y="44" width="4" height="8" rx="0.5" fill="#5eead4" stroke="#14b8a6" strokeWidth="0.5" />
                                        <rect x="38" y="44" width="4" height="8" rx="0.5" fill="#5eead4" stroke="#14b8a6" strokeWidth="0.5" />
                                        <rect x="10" y="12" width="32" height="26" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                        <text x="26" y="28" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                      </svg>
                                      <div className="text-left">
                                        <div className="text-xs font-semibold text-teal-700">US Standard Pallet</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">48 × 40 × 6 in — GMA standard, most common in North America</div>
                                      </div>
                                    </button>
                                  </div>

                                  <div className={`rounded-lg border-2 transition-all ${isPalletized && currentPalletType === "euro" ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200"}`}>
                                    <button
                                      onClick={() => {
                                        updateItem(visualPopup.itemId, "palletized", true);
                                        updateItem(visualPopup.itemId, "palletType", "euro");
                                        setVisualPopup(null);
                                      }}
                                      className="w-full flex items-center gap-3 p-3 rounded-t-lg hover:bg-indigo-50/50 transition-all"
                                      data-testid="popup-pallet-euro"
                                    >
                                      <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                        <rect x="8" y="40" width="40" height="6" rx="1" fill="#c7d2fe" stroke="#6366f1" strokeWidth="1" />
                                        <rect x="12" y="44" width="4" height="8" rx="0.5" fill="#a5b4fc" stroke="#6366f1" strokeWidth="0.5" />
                                        <rect x="26" y="44" width="4" height="8" rx="0.5" fill="#a5b4fc" stroke="#6366f1" strokeWidth="0.5" />
                                        <rect x="40" y="44" width="4" height="8" rx="0.5" fill="#a5b4fc" stroke="#6366f1" strokeWidth="0.5" />
                                        <rect x="12" y="14" width="30" height="24" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                        <text x="27" y="29" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                      </svg>
                                      <div className="text-left">
                                        <div className="text-xs font-semibold text-indigo-700">Euro Pallet (EPAL)</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">1200 × 800 × 144 mm — European standard pallet</div>
                                      </div>
                                    </button>
                                  </div>

                                  <div className={`rounded-lg border-2 transition-all ${isPalletized && currentPalletType === "custom" ? "border-orange-400 bg-orange-50/50" : "border-slate-200"}`}>
                                    <button
                                      onClick={() => {
                                        updateItem(visualPopup.itemId, "palletized", true);
                                        updateItem(visualPopup.itemId, "palletType", "custom");
                                      }}
                                      className="w-full flex items-center gap-3 p-3 hover:bg-orange-50/50 transition-all"
                                      data-testid="popup-pallet-custom"
                                    >
                                      <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                        <rect x="6" y="40" width="44" height="6" rx="1" fill="#fed7aa" stroke="#f97316" strokeWidth="1" strokeDasharray="4 2" />
                                        <rect x="10" y="44" width="4" height="8" rx="0.5" fill="#fdba74" stroke="#f97316" strokeWidth="0.5" />
                                        <rect x="24" y="44" width="4" height="8" rx="0.5" fill="#fdba74" stroke="#f97316" strokeWidth="0.5" />
                                        <rect x="38" y="44" width="4" height="8" rx="0.5" fill="#fdba74" stroke="#f97316" strokeWidth="0.5" />
                                        <rect x="10" y="12" width="32" height="26" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                        <text x="26" y="25" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                        <text x="26" y="34" textAnchor="middle" fontSize="5" fill="#ea580c">? × ? × ?</text>
                                      </svg>
                                      <div className="text-left">
                                        <div className="text-xs font-semibold text-orange-700">Custom Pallet Size</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">Enter your own pallet dimensions below</div>
                                      </div>
                                    </button>
                                    {isPalletized && currentPalletType === "custom" && (
                                      <div className="px-3 pb-3 pt-1 border-t border-orange-200">
                                        <div className="text-[10px] text-orange-600 font-medium mb-2">Custom pallet dimensions ({isMetric ? "cm" : "in"}):</div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <div>
                                            <label className="text-[9px] text-slate-400 uppercase">Length</label>
                                            <input
                                              type="number"
                                              placeholder="L"
                                              value={isMetric ? +((currentItem?.customPalletL || 0) * IN_TO_CM).toFixed(1) : currentItem?.customPalletL || ""}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                updateItem(visualPopup.itemId, "customPalletL", isMetric ? value * CM_TO_IN : value);
                                              }}
                                              className="w-full h-7 px-2 text-xs rounded border border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                                              data-testid="popup-pallet-custom-l"
                                              onKeyDown={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-slate-400 uppercase">Width</label>
                                            <input
                                              type="number"
                                              placeholder="W"
                                              value={isMetric ? +((currentItem?.customPalletW || 0) * IN_TO_CM).toFixed(1) : currentItem?.customPalletW || ""}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                updateItem(visualPopup.itemId, "customPalletW", isMetric ? value * CM_TO_IN : value);
                                              }}
                                              className="w-full h-7 px-2 text-xs rounded border border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                                              data-testid="popup-pallet-custom-w"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-slate-400 uppercase">Height</label>
                                            <input
                                              type="number"
                                              placeholder="H"
                                              value={isMetric ? +((currentItem?.customPalletH || 0) * IN_TO_CM).toFixed(1) : currentItem?.customPalletH || ""}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                updateItem(visualPopup.itemId, "customPalletH", isMetric ? value * CM_TO_IN : value);
                                              }}
                                              className="w-full h-7 px-2 text-xs rounded border border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                                              data-testid="popup-pallet-custom-h"
                                            />
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => setVisualPopup(null)}
                                          className="mt-2 w-full h-7 text-xs font-medium rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                          data-testid="popup-pallet-custom-apply"
                                        >
                                          Apply Custom Pallet
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(() => {
                              const currentPriority = cargoItems.find(i => i.id === visualPopup.itemId)?.loadPriority;
                              return (
                                <>
                                  <button
                                    onClick={() => { updateItem(visualPopup.itemId, "loadPriority", "first"); setVisualPopup(null); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      currentPriority === "first" ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-red-300 hover:bg-red-50/50"
                                    }`}
                                    data-testid="popup-priority-first"
                                  >
                                    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                      <rect x="4" y="30" width="48" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                                      <text x="28" y="45" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="500">CONTAINER</text>
                                      <rect x="8" y="34" width="12" height="14" rx="1.5" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5" />
                                      <text x="14" y="43" textAnchor="middle" fontSize="6" fill="#dc2626" fontWeight="700">1</text>
                                      <rect x="22" y="34" width="12" height="14" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                      <text x="28" y="43" textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="500">2</text>
                                      <rect x="36" y="34" width="12" height="14" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                      <text x="42" y="43" textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="500">3</text>
                                      <path d="M14 28 L14 22" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                                      <path d="M10 24 L14 20 L18 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-red-700">Load First</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Prioritized — loaded at the back of the container first</div>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => { updateItem(visualPopup.itemId, "loadPriority", "normal"); setVisualPopup(null); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      currentPriority === "normal" ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                                    }`}
                                    data-testid="popup-priority-normal"
                                  >
                                    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                      <rect x="4" y="30" width="48" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                                      <text x="28" y="45" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="500">CONTAINER</text>
                                      <rect x="8" y="34" width="12" height="14" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                      <text x="14" y="43" textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="500">1</text>
                                      <rect x="22" y="34" width="12" height="14" rx="1.5" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                      <text x="28" y="43" textAnchor="middle" fontSize="6" fill="#2563eb" fontWeight="700">2</text>
                                      <rect x="36" y="34" width="12" height="14" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                      <text x="42" y="43" textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="500">3</text>
                                      <path d="M22 26 L34 26" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                                      <path d="M30 22 L34 26 L30 30" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-blue-700">Normal Order</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Standard — loaded in default sequence, no special priority</div>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => { updateItem(visualPopup.itemId, "loadPriority", "last"); setVisualPopup(null); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      currentPriority === "last" ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                                    }`}
                                    data-testid="popup-priority-last"
                                  >
                                    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                                      <rect x="4" y="30" width="48" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                                      <text x="28" y="45" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="500">CONTAINER</text>
                                      <rect x="8" y="34" width="12" height="14" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                      <text x="14" y="43" textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="500">1</text>
                                      <rect x="22" y="34" width="12" height="14" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                      <text x="28" y="43" textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="500">2</text>
                                      <rect x="36" y="34" width="12" height="14" rx="1.5" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
                                      <text x="42" y="43" textAnchor="middle" fontSize="6" fill="#059669" fontWeight="700">3</text>
                                      <path d="M42 28 L42 22" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                                      <path d="M38 24 L42 28 L46 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-emerald-700">Load Last</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Near door — loaded last for easy first access at destination</div>
                                    </div>
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showBulkModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowBulkModal(false)} data-testid="bulk-modal-overlay">
                      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} data-testid="bulk-modal">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-primary" />
                            Bulk Cargo Settings
                          </h3>
                          <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" data-testid="bulk-modal-close" aria-label="Close">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Changes will apply to all existing items and set defaults for new items.</p>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                          <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Stacking</label>
                            <div className="space-y-2">
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, stackable: true }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.stackable ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-green-300 hover:bg-green-50/50"
                                }`}
                                data-testid="bulk-modal-stackable-yes"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="8" y="30" width="40" height="18" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
                                  <rect x="8" y="8" width="40" height="18" rx="2" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1.5" />
                                  <path d="M28 4 L32 8 H24 Z" fill="#22c55e" />
                                  <text x="28" y="42" textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="600">BOX</text>
                                  <text x="28" y="20" textAnchor="middle" fontSize="7" fill="#15803d" fontWeight="600">BOX</text>
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-green-700">Stackable</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Other items can be placed on top</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, stackable: false }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  !tempBulk.stackable ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                                }`}
                                data-testid="bulk-modal-stackable-no"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="8" y="20" width="40" height="28" rx="2" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                                  <text x="28" y="38" textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="600">BOX</text>
                                  <line x1="14" y1="8" x2="42" y2="16" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                                  <line x1="42" y1="8" x2="14" y2="16" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-amber-700">Not Stackable</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Nothing placed on top of this item</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Rotation</label>
                            <div className="space-y-2">
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, rotationMode: "all" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.rotationMode === "all" ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                                }`}
                                data-testid="bulk-modal-rotation-all"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="14" y="14" width="28" height="28" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                  <text x="28" y="32" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                  <path d="M28 6 C36 6 44 10 46 16" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#bArrowBlue)" />
                                  <path d="M50 28 C50 36 46 44 40 46" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#bArrowBlue)" />
                                  <path d="M6 28 C6 20 10 12 16 10" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#bArrowBlue)" />
                                  <defs><marker id="bArrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#3b82f6" /></marker></defs>
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-blue-700">All Axes</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Rotate freely in all directions</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, rotationMode: "horizontal" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.rotationMode === "horizontal" ? "border-purple-400 bg-purple-50" : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                                }`}
                                data-testid="bulk-modal-rotation-horizontal"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="14" y="18" width="28" height="24" rx="2" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="1.5" />
                                  <text x="28" y="34" textAnchor="middle" fontSize="7" fill="#6d28d9" fontWeight="600">BOX</text>
                                  <path d="M14 12 C20 6 36 6 42 12" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
                                  <path d="M40 10 L42 12 L40 14" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M16 10 L14 12 L16 14" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <line x1="28" y1="46" x2="28" y2="50" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                                  <circle cx="28" cy="52" r="1.5" fill="#dc2626" />
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-purple-700">Horizontal Only</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Rotate on floor plane only (keeps upright)</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, rotationMode: "fixed" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.rotationMode === "fixed" ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                }`}
                                data-testid="bulk-modal-rotation-fixed"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="14" y="14" width="28" height="28" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                                  <text x="28" y="32" textAnchor="middle" fontSize="7" fill="#475569" fontWeight="600">BOX</text>
                                  <rect x="22" y="4" width="12" height="9" rx="2" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.2" />
                                  <circle cx="28" cy="10" r="1.5" fill="#ef4444" />
                                  <rect x="27" y="10" width="2" height="4" rx="0.5" fill="#ef4444" />
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-slate-700">Fixed</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">No rotation — exactly as entered</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Loading Sequence</label>
                            <div className="space-y-2">
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, loadPriority: "first" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.loadPriority === "first" ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-red-300 hover:bg-red-50/50"
                                }`}
                                data-testid="bulk-modal-priority-first"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="4" y="30" width="48" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                                  <text x="28" y="45" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="500">CONTAINER</text>
                                  <rect x="8" y="8" width="16" height="16" rx="2" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5" />
                                  <text x="16" y="19" textAnchor="middle" fontSize="6" fill="#dc2626" fontWeight="700">1st</text>
                                  <path d="M28 16 L34 16" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 1" />
                                  <rect x="36" y="10" width="12" height="12" rx="1" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-red-700">Load First</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Goes in first, at the back of container</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, loadPriority: "normal" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.loadPriority === "normal" ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                                }`}
                                data-testid="bulk-modal-priority-normal"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="4" y="30" width="48" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                                  <text x="28" y="45" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="500">CONTAINER</text>
                                  <rect x="8" y="10" width="12" height="12" rx="1" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                  <rect x="22" y="8" width="16" height="16" rx="2" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" />
                                  <text x="30" y="19" textAnchor="middle" fontSize="5" fill="#1d4ed8" fontWeight="700">ANY</text>
                                  <rect x="40" y="10" width="12" height="12" rx="1" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-blue-700">Normal</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Algorithm decides best placement</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, loadPriority: "last" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.loadPriority === "last" ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                                }`}
                                data-testid="bulk-modal-priority-last"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="4" y="30" width="48" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                                  <text x="28" y="45" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="500">CONTAINER</text>
                                  <rect x="8" y="10" width="12" height="12" rx="1" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                                  <path d="M24 16 L30 16" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 1" />
                                  <rect x="32" y="8" width="16" height="16" rx="2" fill="#a7f3d0" stroke="#10b981" strokeWidth="1.5" />
                                  <text x="40" y="18" textAnchor="middle" fontSize="5" fill="#047857" fontWeight="700">LAST</text>
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-emerald-700">Load Last</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Placed near container doors for easy access</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Pallet</label>
                            <div className="space-y-2">
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, palletized: false, palletType: "none" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  !tempBulk.palletized ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                }`}
                                data-testid="bulk-modal-pallet-none"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="10" y="14" width="36" height="28" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                  <text x="28" y="32" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                  <line x1="10" y1="48" x2="46" y2="48" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
                                  <text x="28" y="54" textAnchor="middle" fontSize="5" fill="#94a3b8">FLOOR</text>
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-slate-700">No Pallet</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">Cargo placed directly on container floor</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, palletized: true, palletType: "us48x40" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.palletized && tempBulk.palletType === "us48x40" ? "border-teal-400 bg-teal-50/50" : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/50"
                                }`}
                                data-testid="bulk-modal-pallet-us48x40"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="6" y="40" width="44" height="6" rx="1" fill="#99f6e4" stroke="#14b8a6" strokeWidth="1" />
                                  <rect x="10" y="44" width="4" height="8" rx="0.5" fill="#5eead4" stroke="#14b8a6" strokeWidth="0.5" />
                                  <rect x="24" y="44" width="4" height="8" rx="0.5" fill="#5eead4" stroke="#14b8a6" strokeWidth="0.5" />
                                  <rect x="38" y="44" width="4" height="8" rx="0.5" fill="#5eead4" stroke="#14b8a6" strokeWidth="0.5" />
                                  <rect x="10" y="12" width="32" height="26" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                  <text x="26" y="28" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-teal-700">US Standard Pallet</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">48 × 40 × 6 in — GMA standard</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setTempBulk(p => ({ ...p, palletized: true, palletType: "euro" }))}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  tempBulk.palletized && tempBulk.palletType === "euro" ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                                }`}
                                data-testid="bulk-modal-pallet-euro"
                              >
                                <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                  <rect x="8" y="40" width="40" height="6" rx="1" fill="#c7d2fe" stroke="#6366f1" strokeWidth="1" />
                                  <rect x="12" y="44" width="4" height="8" rx="0.5" fill="#a5b4fc" stroke="#6366f1" strokeWidth="0.5" />
                                  <rect x="26" y="44" width="4" height="8" rx="0.5" fill="#a5b4fc" stroke="#6366f1" strokeWidth="0.5" />
                                  <rect x="40" y="44" width="4" height="8" rx="0.5" fill="#a5b4fc" stroke="#6366f1" strokeWidth="0.5" />
                                  <rect x="12" y="14" width="30" height="24" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                  <text x="27" y="29" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                </svg>
                                <div className="text-left">
                                  <div className="text-xs font-semibold text-indigo-700">Euro Pallet (EPAL)</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">1200 × 800 × 144 mm — European standard</div>
                                </div>
                              </button>
                              <div className={`rounded-lg border-2 transition-all ${
                                tempBulk.palletized && tempBulk.palletType === "custom" ? "border-orange-400 bg-orange-50/50" : "border-slate-200 hover:border-orange-300"
                              }`}>
                                <button
                                  onClick={() => setTempBulk(p => ({ ...p, palletized: true, palletType: "custom" }))}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-orange-50/50 transition-all"
                                  data-testid="bulk-modal-pallet-custom"
                                >
                                  <svg width="44" height="44" viewBox="0 0 56 56" className="shrink-0">
                                    <rect x="6" y="40" width="44" height="6" rx="1" fill="#fed7aa" stroke="#f97316" strokeWidth="1" strokeDasharray="4 2" />
                                    <rect x="10" y="44" width="4" height="8" rx="0.5" fill="#fdba74" stroke="#f97316" strokeWidth="0.5" />
                                    <rect x="24" y="44" width="4" height="8" rx="0.5" fill="#fdba74" stroke="#f97316" strokeWidth="0.5" />
                                    <rect x="38" y="44" width="4" height="8" rx="0.5" fill="#fdba74" stroke="#f97316" strokeWidth="0.5" />
                                    <rect x="10" y="12" width="32" height="26" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                                    <text x="26" y="25" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="600">BOX</text>
                                    <text x="26" y="34" textAnchor="middle" fontSize="5" fill="#ea580c">? × ? × ?</text>
                                  </svg>
                                  <div className="text-left">
                                    <div className="text-xs font-semibold text-orange-700">Custom Pallet Size</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Enter your own pallet dimensions below</div>
                                  </div>
                                </button>
                                {tempBulk.palletized && tempBulk.palletType === "custom" && (
                                  <div className="px-3 pb-3 pt-1 border-t border-orange-200">
                                    <div className="text-[10px] text-orange-600 font-medium mb-2">Custom pallet dimensions ({isMetric ? "cm" : "in"}):</div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[9px] text-slate-400 uppercase">Length</label>
                                        <input
                                          type="number"
                                          value={isMetric ? +(tempBulk.customPalletL * IN_TO_CM).toFixed(1) : tempBulk.customPalletL}
                                          onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 0;
                                            setTempBulk(p => ({ ...p, customPalletL: isMetric ? v / IN_TO_CM : v }));
                                          }}
                                          className="w-full h-7 px-2 text-xs rounded border border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                                          data-testid="bulk-modal-custom-pallet-l"
                                          onKeyDown={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] text-slate-400 uppercase">Width</label>
                                        <input
                                          type="number"
                                          value={isMetric ? +(tempBulk.customPalletW * IN_TO_CM).toFixed(1) : tempBulk.customPalletW}
                                          onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 0;
                                            setTempBulk(p => ({ ...p, customPalletW: isMetric ? v / IN_TO_CM : v }));
                                          }}
                                          className="w-full h-7 px-2 text-xs rounded border border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                                          data-testid="bulk-modal-custom-pallet-w"
                                          onKeyDown={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] text-slate-400 uppercase">Height</label>
                                        <input
                                          type="number"
                                          value={isMetric ? +(tempBulk.customPalletH * IN_TO_CM).toFixed(1) : tempBulk.customPalletH}
                                          onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 0;
                                            setTempBulk(p => ({ ...p, customPalletH: isMetric ? v / IN_TO_CM : v }));
                                          }}
                                          className="w-full h-7 px-2 text-xs rounded border border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                                          data-testid="bulk-modal-custom-pallet-h"
                                          onKeyDown={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Apply To</label>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => setBulkApplyScope("all")}
                                className={`p-2.5 rounded-lg border-2 text-[11px] font-medium transition-all text-center ${
                                  bulkApplyScope === "all" ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-600 hover:border-primary/40"
                                }`}
                                data-testid="bulk-modal-scope-all"
                              >
                                <div className="font-semibold">All Items</div>
                                <div className="text-[9px] mt-0.5 opacity-70">{cargoItems.length} items</div>
                              </button>
                              <button
                                onClick={() => setBulkApplyScope("selected")}
                                disabled={selectedIds.size === 0}
                                className={`p-2.5 rounded-lg border-2 text-[11px] font-medium transition-all text-center ${
                                  bulkApplyScope === "selected" ? "border-primary bg-primary/10 text-primary"
                                    : selectedIds.size === 0 ? "border-slate-100 text-slate-300 cursor-not-allowed"
                                    : "border-slate-200 text-slate-600 hover:border-primary/40"
                                }`}
                                data-testid="bulk-modal-scope-selected"
                              >
                                <div className="font-semibold">Selected</div>
                                <div className="text-[9px] mt-0.5 opacity-70">{selectedIds.size} items</div>
                              </button>
                              <button
                                onClick={() => setBulkApplyScope("defaults")}
                                className={`p-2.5 rounded-lg border-2 text-[11px] font-medium transition-all text-center ${
                                  bulkApplyScope === "defaults" ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-600 hover:border-primary/40"
                                }`}
                                data-testid="bulk-modal-scope-defaults"
                              >
                                <div className="font-semibold">Defaults Only</div>
                                <div className="text-[9px] mt-0.5 opacity-70">New items</div>
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2 border-t border-slate-100">
                            <Button
                              onClick={() => {
                                setBulkDefaults({ ...tempBulk });
                                if (bulkApplyScope !== "defaults") {
                                  const applyToIds = bulkApplyScope === "selected" ? selectedIds : null;
                                  setCargoItems(prev => prev.map(item => {
                                    if (applyToIds && !applyToIds.has(item.id)) return item;
                                    return {
                                      ...item,
                                      stackable: tempBulk.stackable,
                                      rotationMode: tempBulk.rotationMode,
                                      loadPriority: tempBulk.loadPriority,
                                      palletized: tempBulk.palletized,
                                      palletType: tempBulk.palletType,
                                      customPalletL: tempBulk.customPalletL,
                                      customPalletW: tempBulk.customPalletW,
                                      customPalletH: tempBulk.customPalletH,
                                    };
                                  }));
                                  invalidateCalculatedPlan();
                                }
                                setShowBulkModal(false);
                                const countMsg = bulkApplyScope === "all" ? `Updated ${cargoItems.length} items`
                                  : bulkApplyScope === "selected" ? `Updated ${selectedIds.size} selected items`
                                  : "Defaults updated for new items";
                                toast({ title: "Bulk settings applied", description: countMsg });
                              }}
                              className="flex-1"
                              data-testid="bulk-modal-save"
                            >
                              {bulkApplyScope === "all" ? "Apply to All Items" : bulkApplyScope === "selected" ? `Apply to ${selectedIds.size} Selected` : "Save Defaults"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowBulkModal(false)}
                              data-testid="bulk-modal-cancel"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showImportModal && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                      onClick={() => setShowImportModal(false)}
                      data-testid="import-modal-overlay"
                    >
                      <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <FileUp className="w-5 h-5 text-primary" />
                              Import Cargo Data
                            </h3>
                            <button
                              onClick={() => setShowImportModal(false)}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                              data-testid="import-modal-close"
                              aria-label="Close"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {importStep === "upload" && (
                            <div className="space-y-5">
                              <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                                  dragOver
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-300 hover:border-primary/50 hover:bg-slate-50"
                                }`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleImportDrop}
                                onClick={() => importFileRef.current?.click()}
                                data-testid="import-drop-zone"
                              >
                                <input
                                  ref={importFileRef}
                                  type="file"
                                  accept=".csv,.tsv,.xlsx,.xls,.pdf,.doc,.docx,.rtf,.odt,.ppt,.pptx,.txt,.md,.json,.xml,.html,.eml,.jpg,.jpeg,.png,.webp,.gif"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleImportFile(f);
                                    e.target.value = "";
                                  }}
                                  data-testid="import-file-input"
                                />
                                {importLoading ? (
                                  <div className="py-4">
                                    <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin mb-3" />
                                    <p className="text-sm font-medium text-slate-700">Processing document...</p>
                                    <p className="text-xs text-slate-500 mt-1">AI is reading your file and extracting cargo data</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-center gap-3 mb-4">
                                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                                      </div>
                                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <FileImage className="w-6 h-6 text-blue-600" />
                                      </div>
                                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-purple-600" />
                                      </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">
                                      Drop your file here, or click to browse
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Spreadsheets are parsed instantly. Documents, emails, PDFs, and images are read by AI.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                                        <FileSpreadsheet className="w-3 h-3" /> CSV
                                      </Badge>
                                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                                        <FileSpreadsheet className="w-3 h-3" /> Excel
                                      </Badge>
                                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                                        <FileImage className="w-3 h-3" /> JPG / PNG
                                      </Badge>
                                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                                        <FileUp className="w-3 h-3" /> PDF
                                      </Badge>
                                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                                        <FileUp className="w-3 h-3" /> Word / Text
                                      </Badge>
                                    </div>
                                  </>
                                )}
                              </div>

                              {importError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2" data-testid="import-error">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                  {importError}
                                </div>
                              )}

                              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Table className="w-4 h-4 text-slate-600" />
                                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">CSV Template</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">
                                  Use headers like: Name, Length, Width, Height, Total Weight, Quantity, Stackable, Rotation, Priority, Palletized
                                </p>
                                <p className="text-[10px] text-slate-400 mb-3">
                                  Stackable/Palletized: yes/no &bull; Rotation: all/horizontal/fixed &bull; Priority: first/normal/last
                                </p>
                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white mb-3">
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="bg-slate-100 text-slate-600">
                                        <th className="px-2 py-1.5 text-left font-semibold">Name</th>
                                        <th className="px-2 py-1.5 text-right font-semibold">Length</th>
                                        <th className="px-2 py-1.5 text-right font-semibold">Width</th>
                                        <th className="px-2 py-1.5 text-right font-semibold">Height</th>
                                        <th className="px-2 py-1.5 text-right font-semibold">Total Weight</th>
                                        <th className="px-2 py-1.5 text-right font-semibold">Qty</th>
                                        <th className="px-2 py-1.5 text-center font-semibold">Stackable</th>
                                        <th className="px-2 py-1.5 text-center font-semibold">Rotation</th>
                                        <th className="px-2 py-1.5 text-center font-semibold">Priority</th>
                                        <th className="px-2 py-1.5 text-center font-semibold">Palletized</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-slate-600">
                                      <tr className="border-t border-slate-100">
                                        <td className="px-2 py-1.5">Cardboard Box A</td>
                                        <td className="px-2 py-1.5 text-right">24</td>
                                        <td className="px-2 py-1.5 text-right">18</td>
                                        <td className="px-2 py-1.5 text-right">12</td>
                                        <td className="px-2 py-1.5 text-right">150</td>
                                        <td className="px-2 py-1.5 text-right">10</td>
                                        <td className="px-2 py-1.5 text-center">yes</td>
                                        <td className="px-2 py-1.5 text-center">all</td>
                                        <td className="px-2 py-1.5 text-center">normal</td>
                                        <td className="px-2 py-1.5 text-center">no</td>
                                      </tr>
                                      <tr className="border-t border-slate-100">
                                        <td className="px-2 py-1.5">Pallet Load B</td>
                                        <td className="px-2 py-1.5 text-right">48</td>
                                        <td className="px-2 py-1.5 text-right">40</td>
                                        <td className="px-2 py-1.5 text-right">36</td>
                                        <td className="px-2 py-1.5 text-right">1000</td>
                                        <td className="px-2 py-1.5 text-right">4</td>
                                        <td className="px-2 py-1.5 text-center">no</td>
                                        <td className="px-2 py-1.5 text-center">fixed</td>
                                        <td className="px-2 py-1.5 text-center">first</td>
                                        <td className="px-2 py-1.5 text-center">yes</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); downloadSampleCSV(); }}
                                  className="gap-1.5 text-xs"
                                  data-testid="button-download-template"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download Sample CSV
                                </Button>
                              </div>
                            </div>
                          )}

                          {importStep === "mapping" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Layers className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-semibold text-slate-800">Map Your Columns</h4>
                              </div>
                              <p className="text-xs text-slate-500">
                                We detected {importRawHeaders.length} columns and {importRawRows.length} rows. Verify the mapping below matches your data.
                              </p>

                              {importError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2" data-testid="mapping-error">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                  {importError}
                                </div>
                              )}

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(["name", "length", "width", "height", "weight", "quantity", "stackable", "rotation", "priority", "palletized"] as const).map((field) => {
                                  const labels: Record<string, string> = { name: "Item Name", length: "Length", width: "Width", height: "Height", weight: "Total Weight", quantity: "Quantity", stackable: "Stackable", rotation: "Rotation", priority: "Priority", palletized: "Palletized" };
                                  const required = field === "length" || field === "width" || field === "height";
                                  return (
                                    <div key={field}>
                                      <Label className="text-[10px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                        {labels[field]}
                                        {required && <span className="text-red-400">*</span>}
                                      </Label>
                                      <select
                                        value={importColMap[field]}
                                        onChange={(e) => setImportColMap((prev) => ({ ...prev, [field]: e.target.value }))}
                                        className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
                                        data-testid={`mapping-select-${field}`}
                                      >
                                        <option value="">— Skip —</option>
                                        {importRawHeaders.map((h) => (
                                          <option key={h} value={h}>{h}</option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>

                              {importRawRows.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">Preview (first 3 rows)</p>
                                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                    <table className="w-full text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-100 text-slate-600">
                                          {importRawHeaders.map((h) => (
                                            <th key={h} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="text-slate-600">
                                        {importRawRows.slice(0, 3).map((row, idx) => (
                                          <tr key={idx} className="border-t border-slate-100">
                                            {importRawHeaders.map((h) => (
                                              <td key={h} className="px-2 py-1 whitespace-nowrap">{row[h]}</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2 pt-1">
                                <Button onClick={applyColumnMapping} className="gap-1.5" data-testid="button-apply-mapping">
                                  <ChevronRight className="w-4 h-4" />
                                  Continue to Preview
                                </Button>
                                <Button variant="outline" onClick={() => { setImportStep("upload"); setImportError(null); setImportWarnings([]); }} className="gap-1.5" data-testid="button-mapping-back">
                                  <RotateCcw className="w-4 h-4" />
                                  Back
                                </Button>
                              </div>
                            </div>
                          )}

                          {importStep === "preview" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-600">
                                  <span className="font-semibold text-slate-800">{importItems.filter((i) => i.include).length}</span> of{" "}
                                  <span className="font-semibold text-slate-800">{importItems.length}</span> items selected for import
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Units:</span>
                                  <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                                    <button
                                      onClick={() => setImportUnits("imperial")}
                                      className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                                        importUnits === "imperial"
                                          ? "bg-primary text-white"
                                          : "bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                      data-testid="import-unit-imperial"
                                    >
                                      in/lbs
                                    </button>
                                    <button
                                      onClick={() => setImportUnits("metric")}
                                      className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                                        importUnits === "metric"
                                          ? "bg-primary text-white"
                                          : "bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                      data-testid="import-unit-metric"
                                    >
                                      cm/kg
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {importWarnings.length > 0 && (
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800" data-testid="import-warnings">
                                  <p className="font-semibold mb-1">Please verify these extracted details:</p>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {importWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
                                  </ul>
                                </div>
                              )}

                              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[45vh]">
                                <table className="w-full text-xs">
                                  <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-100 text-slate-600">
                                      <th className="px-2 py-2 text-center w-8">
                                        <button
                                          onClick={() => {
                                            const allChecked = importItems.every((i) => i.include);
                                            setImportItems((prev) => prev.map((i) => ({ ...i, include: !allChecked })));
                                          }}
                                          className="mx-auto block"
                                          data-testid="import-toggle-all"
                                        >
                                          {importItems.every((i) => i.include) ? (
                                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                                          ) : (
                                            <Square className="w-3.5 h-3.5 text-slate-400" />
                                          )}
                                        </button>
                                      </th>
                                      <th className="px-2 py-2 text-left font-semibold">Name</th>
                                      <th className="px-2 py-2 text-right font-semibold">L</th>
                                      <th className="px-2 py-2 text-right font-semibold">W</th>
                                      <th className="px-2 py-2 text-right font-semibold">H</th>
                                      <th className="px-2 py-2 text-right font-semibold">Total Wt</th>
                                      <th className="px-2 py-2 text-right font-semibold">Qty</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {importItems.map((item, idx) => (
                                      <tr
                                        key={idx}
                                        className={`border-t border-slate-100 transition-colors ${
                                          item.include ? "bg-white" : "bg-slate-50 opacity-50"
                                        }`}
                                        data-testid={`import-row-${idx}`}
                                      >
                                        <td className="px-2 py-1.5 text-center">
                                          <button
                                            onClick={() =>
                                              setImportItems((prev) =>
                                                prev.map((r, i) => (i === idx ? { ...r, include: !r.include } : r))
                                              )
                                            }
                                            data-testid={`import-check-${idx}`}
                                          >
                                            {item.include ? (
                                              <CheckSquare className="w-3.5 h-3.5 text-primary" />
                                            ) : (
                                              <Square className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                          </button>
                                        </td>
                                        <td className="px-2 py-1.5">
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                              setImportItems((prev) =>
                                                prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                                              )
                                            }
                                            className="w-full min-w-[100px] bg-transparent border-0 outline-none text-xs text-slate-800 focus:bg-blue-50 rounded px-1 py-0.5"
                                            data-testid={`import-name-${idx}`}
                                          />
                                        </td>
                                        <td className="px-2 py-1.5">
                                          <input
                                            type="number"
                                            value={item.length || ""}
                                            onChange={(e) =>
                                              setImportItems((prev) =>
                                                prev.map((r, i) =>
                                                  i === idx ? { ...r, length: Math.max(0, parseFloat(e.target.value) || 0) } : r
                                                )
                                              )
                                            }
                                            className="w-14 text-right bg-transparent border-0 outline-none text-xs text-slate-800 focus:bg-blue-50 rounded px-1 py-0.5"
                                            data-testid={`import-length-${idx}`}
                                          />
                                        </td>
                                        <td className="px-2 py-1.5">
                                          <input
                                            type="number"
                                            value={item.width || ""}
                                            onChange={(e) =>
                                              setImportItems((prev) =>
                                                prev.map((r, i) =>
                                                  i === idx ? { ...r, width: Math.max(0, parseFloat(e.target.value) || 0) } : r
                                                )
                                              )
                                            }
                                            className="w-14 text-right bg-transparent border-0 outline-none text-xs text-slate-800 focus:bg-blue-50 rounded px-1 py-0.5"
                                            data-testid={`import-width-${idx}`}
                                          />
                                        </td>
                                        <td className="px-2 py-1.5">
                                          <input
                                            type="number"
                                            value={item.height || ""}
                                            onChange={(e) =>
                                              setImportItems((prev) =>
                                                prev.map((r, i) =>
                                                  i === idx ? { ...r, height: Math.max(0, parseFloat(e.target.value) || 0) } : r
                                                )
                                              )
                                            }
                                            className="w-14 text-right bg-transparent border-0 outline-none text-xs text-slate-800 focus:bg-blue-50 rounded px-1 py-0.5"
                                            data-testid={`import-height-${idx}`}
                                          />
                                        </td>
                                        <td className="px-2 py-1.5">
                                          <input
                                            type="number"
                                            value={item.weight || ""}
                                            onChange={(e) =>
                                              setImportItems((prev) =>
                                                prev.map((r, i) =>
                                                  i === idx ? { ...r, weight: Math.max(0, parseFloat(e.target.value) || 0) } : r
                                                )
                                              )
                                            }
                                            className="w-14 text-right bg-transparent border-0 outline-none text-xs text-slate-800 focus:bg-blue-50 rounded px-1 py-0.5"
                                            data-testid={`import-weight-${idx}`}
                                          />
                                        </td>
                                        <td className="px-2 py-1.5">
                                          <input
                                            type="number"
                                            value={item.quantity || ""}
                                            onChange={(e) =>
                                              setImportItems((prev) =>
                                                prev.map((r, i) =>
                                                  i === idx ? { ...r, quantity: Math.max(1, Math.round(parseFloat(e.target.value) || 1)) } : r
                                                )
                                              )
                                            }
                                            className="w-12 text-right bg-transparent border-0 outline-none text-xs text-slate-800 focus:bg-blue-50 rounded px-1 py-0.5"
                                            data-testid={`import-qty-${idx}`}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  onClick={confirmImport}
                                  disabled={importItems.filter((i) => i.include).length === 0}
                                  className="gap-1.5"
                                  data-testid="button-confirm-import"
                                >
                                  <Plus className="w-4 h-4" />
                                  Fill Calculator with {importItems.filter((i) => i.include).length} Item{importItems.filter((i) => i.include).length !== 1 ? "s" : ""}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => { setImportStep("upload"); setImportItems([]); setImportError(null); setImportWarnings([]); }}
                                  className="gap-1.5"
                                  data-testid="button-import-back"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Upload Different File
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => setShowImportModal(false)}
                                  data-testid="button-import-cancel"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="sm:hidden space-y-2" data-testid="cargo-mobile-cards">
                    {cargoItems.map((item, idx) => {
                      const perPieceWt = item.quantity > 0 ? item.weight / item.quantity : 0;
                      const displayPerPieceWt = unitSystem === "metric" ? (perPieceWt * LB_TO_KG).toFixed(1) : perPieceWt.toFixed(1);
                      const volIn3 = item.length * item.width * item.height * item.quantity;
                      const displayVol = unitSystem === "imperial" ? (volIn3 / 1728).toFixed(2) : (volIn3 * 0.000016387064).toFixed(4);

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-2.5 transition-all ${
                            !item.included ? "opacity-40 border-slate-200/60 bg-slate-50/50"
                              : selectedIds.has(item.id) ? "border-primary/30 bg-primary/[0.02]"
                              : "border-slate-200"
                          }`}
                          data-testid={`cargo-item-${idx}`}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <button onClick={() => toggleSelect(item.id)} className="shrink-0 text-slate-400 hover:text-primary" data-testid={`checkbox-cargo-${idx}`}>
                              {selectedIds.has(item.id) ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                            <label
                              className="relative w-7 h-7 rounded-md border border-slate-200 bg-white shadow-sm shrink-0 cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-primary/30"
                              title={`Choose a color for ${item.name || `Cargo ${idx + 1}`}`}
                            >
                              <span className="absolute inset-1 rounded" style={{ backgroundColor: item.color }} />
                              <input
                                type="color"
                                value={item.color}
                                onChange={(e) => updateItem(item.id, "color", e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label={`Color for ${item.name || `Cargo ${idx + 1}`}`}
                                data-testid={`input-cargo-color-${idx}`}
                              />
                            </label>
                            <Input
                              placeholder={`Cargo ${idx + 1}`}
                              value={item.name}
                              onChange={(e) => updateItem(item.id, "name", e.target.value)}
                              className="h-7 text-xs flex-1 min-w-0"
                              data-testid={`input-cargo-name-${idx}`}
                            />
                            {cargoItems.length > 1 && (
                              <button onClick={() => removeItem(item.id)} className="shrink-0 text-slate-300 hover:text-red-500 p-0.5" data-testid={`button-remove-cargo-${idx}`}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-6 gap-1 mb-1.5">
                            <div className="text-center">
                              <span className="text-[8px] text-slate-400 uppercase block">L</span>
                              <Input type="number" min={0} step="0.1" value={toDisplay(item.length)} onChange={(e) => updateItem(item.id, "length", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-cargo-length-${idx}`} />
                            </div>
                            <div className="text-center">
                              <span className="text-[8px] text-slate-400 uppercase block">W</span>
                              <Input type="number" min={0} step="0.1" value={toDisplay(item.width)} onChange={(e) => updateItem(item.id, "width", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-cargo-width-${idx}`} />
                            </div>
                            <div className="text-center">
                              <span className="text-[8px] text-slate-400 uppercase block">H</span>
                              <Input type="number" min={0} step="0.1" value={toDisplay(item.height)} onChange={(e) => updateItem(item.id, "height", fromDisplay(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-cargo-height-${idx}`} />
                            </div>
                            <div className="text-center">
                              <span className="text-[8px] text-slate-400 uppercase block">Qty</span>
                              <Input type="number" min={1} value={item.quantity || ""} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-cargo-qty-${idx}`} />
                            </div>
                            <div className="text-center">
                              <span className="text-[8px] text-slate-400 uppercase block">Total wt</span>
                              <Input type="number" min={0} step="0.1" value={toDisplayWeight(item.weight)} onChange={(e) => updateItem(item.id, "weight", fromDisplayWeight(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-cargo-weight-${idx}`} />
                            </div>
                            <div className="text-center">
                              <span className="text-[8px] text-slate-400 uppercase block">Per pc</span>
                              <div className="h-6 flex items-center justify-center text-[10px] text-slate-500 font-medium" data-testid={`text-wtotal-${idx}`}>
                                {item.weight > 0 && item.quantity > 0 ? displayPerPieceWt : "—"}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Stack</span>
                              <button
                                onClick={() => setVisualPopup({ type: "stackable", itemId: item.id })}
                                className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                  item.stackable ? "bg-green-50 border-green-300 text-green-700" : "bg-amber-50 border-amber-300 text-amber-700"
                                }`}
                                data-testid={`toggle-stackable-yes-${idx}`}
                              >
                                {item.stackable ? "✓ Yes" : "✗ No"}
                              </button>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Rotate</span>
                              <button
                                onClick={() => setVisualPopup({ type: "rotation", itemId: item.id })}
                                className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                  item.rotationMode === "all"
                                    ? "bg-blue-50 border-blue-300 text-blue-700"
                                    : item.rotationMode === "horizontal"
                                    ? "bg-purple-50 border-purple-300 text-purple-700"
                                    : "bg-slate-50 border-slate-300 text-slate-700"
                                }`}
                                data-testid={`select-rotation-${idx}`}
                              >
                                {item.rotationMode === "all" ? "All" : item.rotationMode === "horizontal" ? "Horiz" : "Fixed"}
                              </button>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Priority</span>
                              <button
                                onClick={() => setVisualPopup({ type: "priority", itemId: item.id })}
                                className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                  item.loadPriority === "first" ? "bg-red-50 border-red-300 text-red-700"
                                    : item.loadPriority === "last" ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                    : "bg-blue-50 border-blue-300 text-blue-700"
                                }`}
                                data-testid={`select-priority-${idx}`}
                              >
                                {item.loadPriority === "first" ? "1st" : item.loadPriority === "last" ? "Last" : "Norm"}
                              </button>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Pallet</span>
                              <button
                                onClick={() => setVisualPopup({ type: "palletized", itemId: item.id })}
                                className={`w-full h-6 rounded text-[10px] font-medium border transition-colors ${
                                  item.palletized ? "bg-teal-50 border-teal-300 text-teal-700" : "border-slate-200 bg-white text-slate-600"
                                }`}
                                data-testid={`toggle-palletized-yes-${idx}`}
                              >
                                {item.palletized ? (item.palletType === "euro" ? "Euro" : item.palletType === "custom" ? "Cust" : "US") : "None"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden sm:block -mx-5 px-5" data-testid="cargo-table-scroll">
                    <table className="w-full border-collapse table-fixed" data-testid="cargo-table">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-0.5 py-2 text-left" style={{ width: 46 }}>
                            <button
                              onClick={toggleSelectAll}
                              className="text-slate-400 hover:text-primary transition-colors"
                              data-testid="button-select-all"
                              title={selectedIds.size === cargoItems.length ? "Deselect All" : "Select All"}
                            >
                              {selectedIds.size === cargoItems.length && cargoItems.length > 0 ? (
                                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                              ) : selectedIds.size > 0 ? (
                                <Minus className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </th>
                          <th className="px-0.5 py-2 text-left">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Name</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 52 }}>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">L</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 52 }}>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">W</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 52 }}>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">H</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 40 }}>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Qty</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 56 }}>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide" title="Total gross weight for this row">Total {weightUnit}</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 52 }}>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Stack</div>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 62 }}>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rot.</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 60 }}>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Priority</span>
                          </th>
                          <th className="px-0.5 py-2 text-center" style={{ width: 50 }}>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cargoItems.map((item, idx) => {
                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-slate-100 transition-colors ${
                                !item.included
                                  ? "opacity-40"
                                  : selectedIds.has(item.id)
                                  ? "bg-primary/[0.03]"
                                  : "hover:bg-slate-50/50"
                              }`}
                              data-testid={`cargo-item-${idx}`}
                            >
                              <td className="px-0.5 py-1">
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => toggleSelect(item.id)}
                                    className="shrink-0 text-slate-400 hover:text-primary transition-colors"
                                    data-testid={`checkbox-cargo-${idx}`}
                                  >
                                    {selectedIds.has(item.id) ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-primary" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <label
                                    className="relative w-6 h-6 rounded-md border border-slate-200 bg-white shadow-sm shrink-0 cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-primary/30"
                                    title={`Choose a color for ${item.name || `Cargo ${idx + 1}`}`}
                                  >
                                    <span className="absolute inset-1 rounded-sm" style={{ backgroundColor: item.color }} />
                                    <input
                                      type="color"
                                      value={item.color}
                                      onChange={(e) => updateItem(item.id, "color", e.target.value)}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      aria-label={`Color for ${item.name || `Cargo ${idx + 1}`}`}
                                      data-testid={`input-cargo-color-${idx}`}
                                    />
                                  </label>
                                </div>
                              </td>
                              <td className="px-0.5 py-1">
                                <Input
                                  placeholder={`Cargo ${idx + 1}`}
                                  value={item.name}
                                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                  className="h-7 text-xs min-w-0"
                                  data-testid={`input-cargo-name-${idx}`}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplay(item.length)}
                                  onChange={(e) => updateItem(item.id, "length", fromDisplay(e.target.value))}
                                  className="h-7 text-xs text-center px-0.5"
                                  data-testid={`input-cargo-length-${idx}`}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplay(item.width)}
                                  onChange={(e) => updateItem(item.id, "width", fromDisplay(e.target.value))}
                                  className="h-7 text-xs text-center px-0.5"
                                  data-testid={`input-cargo-width-${idx}`}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplay(item.height)}
                                  onChange={(e) => updateItem(item.id, "height", fromDisplay(e.target.value))}
                                  className="h-7 text-xs text-center px-0.5"
                                  data-testid={`input-cargo-height-${idx}`}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <Input
                                  type="number" min={1}
                                  value={item.quantity || ""}
                                  onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                  className="h-7 text-xs text-center px-0.5"
                                  data-testid={`input-cargo-qty-${idx}`}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplayWeight(item.weight)}
                                  onChange={(e) => updateItem(item.id, "weight", fromDisplayWeight(e.target.value))}
                                  className="h-7 text-xs text-center px-0.5"
                                  data-testid={`input-cargo-weight-${idx}`}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <button
                                  onClick={() => setVisualPopup({ type: "stackable", itemId: item.id })}
                                  className={`w-full flex items-center justify-center h-7 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                                    item.stackable
                                      ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                      : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                                  }`}
                                  data-testid={`toggle-stackable-yes-${idx}`}
                                  title="Click to change"
                                >
                                  {item.stackable ? "✓" : "✗"}
                                </button>
                              </td>
                              <td className="px-0.5 py-1">
                                <button
                                  onClick={() => setVisualPopup({ type: "rotation", itemId: item.id })}
                                  className={`w-full flex items-center justify-center h-7 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                                    item.rotationMode === "all"
                                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                                      : item.rotationMode === "horizontal"
                                      ? "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                                      : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                                  }`}
                                  data-testid={`select-rotation-${idx}`}
                                  title="Click to change"
                                >
                                  {item.rotationMode === "all" ? "All" : item.rotationMode === "horizontal" ? "Horiz" : "Fixed"}
                                </button>
                              </td>
                              <td className="px-0.5 py-1">
                                <button
                                  onClick={() => setVisualPopup({ type: "priority", itemId: item.id })}
                                  className={`w-full flex items-center justify-center h-7 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                                    item.loadPriority === "first"
                                      ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                                      : item.loadPriority === "last"
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                      : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                                  }`}
                                  data-testid={`select-priority-${idx}`}
                                  title="Click to change"
                                >
                                  {item.loadPriority === "first" ? "1st" : item.loadPriority === "last" ? "Last" : "Norm"}
                                </button>
                              </td>
                              <td className="px-0.5 py-1">
                                <div className="flex items-center gap-0 justify-center">
                                  <button
                                    onClick={() => duplicateItem(item.id)}
                                    className="text-slate-300 hover:text-primary transition-colors p-0.5"
                                    data-testid={`button-duplicate-cargo-${idx}`}
                                    title="Duplicate row"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  {cargoItems.length > 1 ? (
                                    <button
                                      onClick={() => removeItem(item.id)}
                                      className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                                      data-testid={`button-remove-cargo-${idx}`}
                                      title="Remove row"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <div className="w-4" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button
                      onClick={handleCalculate}
                      disabled={calculating}
                      className="flex-1 gap-2"
                      data-testid="button-calculate"
                    >
                      {calculating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          Calculate Loading Plan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleReset}
                      className="gap-1.5"
                      data-testid="button-reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {multiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5 lg:w-[calc(171.4286%+1.5rem)] lg:-ml-[calc(71.4286%+1.5rem)]"
                  data-testid="results-section"
                >
                  {recommendation
                    && recommendation.plan.totalPiecesLoaded === recommendation.plan.totalPiecesAll
                    && (
                      recommendation.container.id !== containerId
                      || recommendation.plan.totalContainers < multiResult.totalContainers
                    ) && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3" data-testid="notice-container-recommendation">
                      <Sparkles className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
                      <div className="text-sm flex-1">
                        <p className="font-semibold text-blue-900">Recommended container: {recommendation.container.name}</p>
                        <p className="text-blue-800 mt-1">
                          The best-fit plan uses <strong>{recommendation.plan.totalContainers} × {recommendation.container.name}</strong>
                          {multiResult.totalContainers !== recommendation.plan.totalContainers
                            ? ` instead of ${multiResult.totalContainers} × ${container.name}.`
                            : ` and avoids excess unused capacity.`}
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid="button-use-recommended-container"
                            onClick={() => {
                              setContainerSelectionMode("manual");
                              setContainerId(recommendation.container.id);
                              setPendingRecalc(true);
                            }}
                          >
                            Use recommended container
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {multiResult.totalPiecesLoaded < multiResult.totalPiecesAll && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4" data-testid="notice-unplaced-cargo">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-rose-900">Loading plan incomplete</p>
                          <p className="mt-1 text-xs leading-relaxed text-rose-800">
                            {multiResult.totalPiecesAll - multiResult.totalPiecesLoaded} of {multiResult.totalPiecesAll} pieces remain unassigned. They have no visual position; the CSV lists them separately as exceptions.
                          </p>
                          {multiResult.totalContainers >= 10 && (
                            <p className="mt-1 text-[11px] font-semibold text-rose-700">
                              The automatic calculation stops after 10 containers. Split very large shipments into smaller planning batches.
                            </p>
                          )}
                          {unplacedDiagnostics.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {unplacedDiagnostics.map((diagnosis, index) => (
                                <li key={`${diagnosis.name}-${index}`} className="rounded-lg border border-rose-100 bg-white/75 px-3 py-2 text-[11px] text-slate-700">
                                  <span className="font-bold text-slate-900">{diagnosis.quantity} × {diagnosis.name}:</span> {diagnosis.reason}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <ContainerComparisonPanel
                    comparisons={containerComparisons}
                    recommendedId={recommendation?.container.id ?? null}
                    activeId={multiResult.containers[0]?.container.id ?? containerId}
                    unitSystem={unitSystem}
                    onSelect={(nextContainerId) => {
                      setContainerSelectionMode("manual");
                      setContainerId(nextContainerId);
                      setPendingRecalc(true);
                    }}
                  />

                  {multiResult.totalContainers > 1 && multiResult.totalPiecesLoaded === multiResult.totalPiecesAll && (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3" data-testid="notice-multi-container">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900">
                          Multiple containers required
                        </p>
                        <p className="text-amber-800 mt-1">
                          Your cargo requires <strong>{multiResult.totalContainers} containers</strong> to
                          fit all {multiResult.totalPiecesAll} pieces.
                        </p>
                      </div>
                    </div>
                  )}

                  {multiResult.totalContainers === 1 && multiResult.containers[0].result.unplaced.length === 0 && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3" data-testid="notice-all-fit">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm font-semibold text-green-800">
                        All {multiResult.totalPiecesAll} piece(s) fit in 1 × {multiResult.containers[0].container.name}
                        {recommendation?.container.id === containerId ? " — best-fit container" : ""}
                      </p>
                    </div>
                  )}

                  <Card className="border-slate-200 overflow-hidden shadow-sm" data-testid="container-results-workspace">
                    <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="grid w-full grid-cols-3 gap-1 sm:gap-2 lg:flex lg:w-auto" role="tablist" aria-label="Loading result views" data-testid="result-workspace-tabs">
                        {([
                          { id: "plan" as const, label: "Loading Plan", icon: Ship },
                          { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
                          { id: "details" as const, label: "Cargo Details", icon: ListChecks },
                        ]).map((tab) => {
                          const TabIcon = tab.icon;
                          const selected = activeResultTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              role="tab"
                              aria-selected={selected}
                              onClick={() => setActiveResultTab(tab.id)}
                              data-testid={`result-tab-${tab.id}`}
                              className={`min-w-0 w-full inline-flex items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-semibold whitespace-nowrap transition-colors sm:gap-2 sm:px-3.5 sm:text-sm ${
                                selected
                                  ? "bg-blue-50 text-primary ring-1 ring-inset ring-blue-200"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                              }`}
                            >
                              <TabIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                              <span className="truncate">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="grid w-full grid-cols-3 gap-2 lg:flex lg:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 px-2 text-xs sm:px-3 sm:text-sm"
                          onClick={() => setShareDialogOpen(true)}
                          disabled={creatingShareLink}
                          data-testid="button-share-loading-plan"
                        >
                          {creatingShareLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 text-primary" />}
                          Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 px-2 text-xs sm:px-3 sm:text-sm"
                          onClick={handleExportCSV}
                          data-testid="button-export-csv"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          Placement CSV
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 px-2 text-xs sm:px-3 sm:text-sm"
                          onClick={handleExportPDF}
                          data-testid="button-export-pdf"
                        >
                          <FileDown className="w-4 h-4" />
                          Complete PDF
                        </Button>
                      </div>
                    </div>

                    <div className="relative bg-slate-50/70 p-3" data-testid="result-container-carousel">
                      {multiResult.totalContainers > 2 && (
                        <>
                          <button
                            type="button"
                            aria-label="Previous containers"
                            onClick={() => {
                              const nextIndex = Math.max(0, activeResultContainer - 1);
                              setActiveResultContainer(nextIndex);
                              (resultContainerRailRef.current?.children[nextIndex] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                            }}
                            disabled={activeResultContainer === 0}
                            className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur-md transition-all hover:scale-105 hover:text-primary disabled:pointer-events-none disabled:opacity-0"
                            data-testid="button-container-carousel-previous"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Next containers"
                            onClick={() => {
                              const nextIndex = Math.min(multiResult.totalContainers - 1, activeResultContainer + 1);
                              setActiveResultContainer(nextIndex);
                              (resultContainerRailRef.current?.children[nextIndex] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                            }}
                            disabled={activeResultContainer === multiResult.totalContainers - 1}
                            className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur-md transition-all hover:scale-105 hover:text-primary disabled:pointer-events-none disabled:opacity-0"
                            data-testid="button-container-carousel-next"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <div
                        ref={resultContainerRailRef}
                        className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {multiResult.containers.map((entry, index) => {
                          const selected = index === activeResultContainer;
                          const entryResult = entry.result;
                          return (
                            <button
                              type="button"
                              key={`${entry.container.id}-${index}`}
                              onClick={(event) => {
                                setActiveResultContainer(index);
                                event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                              }}
                              data-testid={`result-container-card-${index}`}
                              aria-pressed={selected}
                              className={`w-[86%] shrink-0 snap-start rounded-2xl border bg-white p-3 text-left transition-all sm:w-[calc((100%_-_0.75rem)/2)] ${
                                selected
                                  ? "border-primary shadow-sm ring-2 ring-primary/10"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`rounded-lg p-2 ${selected ? "bg-blue-50 text-primary" : "bg-slate-50 text-slate-500"}`}>
                                  <ContainerLineIcon active={selected} short={entry.container.id.startsWith("20")} className="w-16 h-9" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm text-slate-900 truncate">{entry.label}</p>
                                  <p className="text-xs text-slate-500 truncate">{entry.container.name}</p>
                                  <p className="mt-1 text-xs font-semibold text-primary">{entryResult.piecesLoaded} pieces assigned</p>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-3">
                                {[
                                  { label: "Volume", value: entryResult.volumeUtil, color: "bg-violet-500" },
                                  { label: "Payload", value: entryResult.weightUtil, color: "bg-emerald-500" },
                                ].map((metric) => (
                                  <div key={metric.label}>
                                    <div className="mb-1 flex items-center justify-between text-[9px] font-semibold text-slate-500">
                                      <span>{metric.label}</span><span>{metric.value.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                      <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${Math.min(100, metric.value)}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Card>

                  {multiResult.containers
                    .slice(activeResultContainer, activeResultContainer + 1)
                    .map((cr) => {
                    const ci = activeResultContainer;
                    const cResult = cr.result;
                    return (
                      <div key={ci} className="space-y-5" data-testid={`container-result-${ci}`}>
                        {activeResultTab === "plan" && (
                        <Card className="border-slate-200 overflow-hidden">
                          <CardContent className="p-1.5 sm:p-2">
                            <div ref={viewerRef}>
                              <ContainerViewer3D
                                placed={cResult.placed}
                                container={cr.container}
                                unitSystem={unitSystem}
                                rotationModesByCargoId={rotationModesByCargoId}
                                onReadyExport={(fn) => setSnapshotExportFn(() => fn)}
                                onExportPdf={handleExportPDF}
                                onExportCsv={handleExportCSV}
                                onSharePlan={() => setShareDialogOpen(true)}
                                shareUrl={managedShareLink?.url}
                                onSaveProject={saveCurrentProject}
                                onOpenProjects={openProjectLibrary}
                                onEditCargo={() => document.getElementById("packing-list-setup")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                onEditContainer={() => document.getElementById("container-type-setup")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                planIndex={ci}
                                planCount={multiResult.totalContainers}
                                onPreviousPlan={ci > 0 ? () => setActiveResultContainer((index) => Math.max(0, index - 1)) : undefined}
                                onNextPlan={ci < multiResult.totalContainers - 1 ? () => setActiveResultContainer((index) => Math.min(multiResult.totalContainers - 1, index + 1)) : undefined}
                                onPlacedChange={(nextPlaced) => {
                                  setCogUndoLayouts((current) => {
                                    const next = { ...current };
                                    delete next[ci];
                                    return next;
                                  });
                                  setMultiResult((current) => {
                                    if (!current) return current;
                                    const totalWeight = nextPlaced.reduce((sum, box) => sum + box.weight, 0);
                                    const totalVolumeIn3 = nextPlaced.reduce((sum, box) => sum + box.l * box.w * box.h, 0);
                                    const maxX = nextPlaced.reduce((max, box) => Math.max(max, box.x + box.l), 0);
                                    const maxZ = nextPlaced.reduce((max, box) => Math.max(max, box.z + box.w), 0);
                                    const nextContainers = current.containers.map((entry, entryIndex) =>
                                      entryIndex === ci
                                        ? {
                                            ...entry,
                                            result: {
                                              ...entry.result,
                                              placed: nextPlaced,
                                              totalWeight,
                                              totalVolume: totalVolumeIn3 / 1728,
                                              volumeUtil: (totalVolumeIn3 / (entry.container.lengthIn * entry.container.widthIn * entry.container.heightIn)) * 100,
                                              weightUtil: (totalWeight / entry.container.maxPayloadLbs) * 100,
                                              floorArea: (maxX * maxZ) / 144,
                                              piecesLoaded: nextPlaced.length,
                                            },
                                          }
                                        : entry,
                                    );
                                    return {
                                      ...current,
                                      containers: nextContainers,
                                      totalPiecesLoaded: nextContainers.reduce((sum, entry) => sum + entry.result.piecesLoaded, 0),
                                    };
                                  });
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                        )}

                        {activeResultTab === "overview" && (
                        <Card className="border-slate-200">
                          <CardContent className="p-5">
                            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-primary" />
                              Loading Summary
                              {multiResult.totalContainers > 1 && (
                                <span className="text-xs font-normal text-slate-500 ml-1">
                                  — {cr.container.name}
                                </span>
                              )}
                            </h2>

                            <PlanReviewPanel items={planReview} />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                              <StatCard
                                icon={Package}
                                label="Pieces Loaded"
                                value={`${cResult.piecesLoaded} / ${cResult.piecesTotal}`}
                                color="#3b82f6"
                              />
                              <StatCard
                                icon={Weight}
                                label="Weight"
                                value={`${(isMetric ? cResult.totalWeight * LB_TO_KG : cResult.totalWeight).toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })} ${weightUnit}`}
                                sub={`of ${(isMetric ? cResult.maxPayload * LB_TO_KG : cResult.maxPayload).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${weightUnit}`}
                                color="#22c55e"
                              />
                              <StatCard
                                icon={Box}
                                label="Volume Used"
                                value={`${(isMetric ? cResult.totalVolume * 0.0283168 : cResult.totalVolume).toFixed(1)} ${isMetric ? "m³" : "ft³"}`}
                                sub={`of ${(isMetric ? cResult.containerVolume * 0.0283168 : cResult.containerVolume).toFixed(isMetric ? 1 : 0)} ${isMetric ? "m³" : "ft³"}`}
                                color="#8b5cf6"
                              />
                              <StatCard
                                icon={Ruler}
                                label="Load Footprint"
                                value={`${(isMetric ? cResult.floorArea * 0.092903 : cResult.floorArea).toFixed(1)} ${isMetric ? "m²" : "ft²"}`}
                                sub={`of ${(isMetric ? cResult.containerFloorArea * 0.092903 : cResult.containerFloorArea).toFixed(isMetric ? 1 : 0)} ${isMetric ? "m²" : "ft²"}`}
                                color="#f59e0b"
                              />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                <UtilBar
                                  pct={cResult.volumeUtil}
                                  label="Volume Utilization"
                                  color="#8b5cf6"
                                />
                                <UtilBar
                                  pct={cResult.weightUtil}
                                  label="Weight Utilization"
                                  color="#22c55e"
                                />
                              </div>
                              <CargoMixPanel placed={cResult.placed} unitSystem={unitSystem} />
                            </div>

                            <ContainerBalancePanel
                              placed={cResult.placed}
                              container={cr.container}
                              unitSystem={unitSystem}
                              onPlacedChange={(nextPlaced, previousPlaced) => {
                                if (previousPlaced) {
                                  setCogUndoLayouts((current) => ({ ...current, [ci]: previousPlaced }));
                                }
                                setMultiResult((current) => {
                                  if (!current) return current;
                                  return {
                                    ...current,
                                    containers: current.containers.map((entry, entryIndex) =>
                                      entryIndex === ci
                                        ? { ...entry, result: { ...entry.result, placed: nextPlaced } }
                                        : entry,
                                    ),
                                  };
                                });
                              }}
                              undoPlaced={cogUndoLayouts[ci]}
                              onUndo={() => {
                                const previousPlaced = cogUndoLayouts[ci];
                                if (!previousPlaced) return;
                                setMultiResult((current) => {
                                  if (!current) return current;
                                  return {
                                    ...current,
                                    containers: current.containers.map((entry, entryIndex) =>
                                      entryIndex === ci
                                        ? { ...entry, result: { ...entry.result, placed: previousPlaced } }
                                        : entry,
                                    ),
                                  };
                                });
                                setCogUndoLayouts((current) => {
                                  const next = { ...current };
                                  delete next[ci];
                                  return next;
                                });
                              }}
                            />
                          </CardContent>
                        </Card>
                        )}

                        {activeResultTab === "details" && (
                        <Card className="border-slate-200">
                          <CardContent className="p-5">
                            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <Info className="w-4 h-4 text-primary" />
                              Loading Details
                              {multiResult.totalContainers > 1 && (
                                <span className="text-xs font-normal text-slate-500 ml-1">
                                  — {cr.container.name}
                                </span>
                              )}
                            </h2>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs" data-testid={`table-loading-details-${ci}`}>
                                <thead>
                                  <tr className="border-b border-slate-200">
                                    <th className="text-left py-1.5 pr-1 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>#</th>
                                    <th className="text-left py-1.5 pr-1 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>Item</th>
                                    <th className="text-right py-1.5 pr-1 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>L×W×H ({dimUnit})</th>
                                    <th className="text-right py-1.5 pr-1 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>Pos (X,Y,Z)</th>
                                    <th className="text-right py-1.5 pr-1 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>{weightUnit}</th>
                                    <th className="text-center py-1.5 pr-1 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>Stack</th>
                                    <th className="text-center py-1.5 pr-1 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>Rot.</th>
                                    <th className="text-right py-1.5 font-semibold text-slate-500 uppercase" style={{ fontSize: "10px" }}>{isMetric ? "m³" : "ft³"}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const groups: Record<string, { items: typeof cResult.placed; color: string }> = {};
                                    cResult.placed.forEach((p) => {
                                      if (!groups[p.cargoName]) groups[p.cargoName] = { items: [], color: p.color };
                                      groups[p.cargoName].items.push(p);
                                    });
                                    let globalIdx = 0;
                                    return Object.entries(groups).map(([name, group]) => {
                                      const groupKey = `${ci}-${name}`;
                                      const isOpen = expandedGroups.has(groupKey);
                                      const groupWt = group.items.reduce((s, p) => s + p.weight * weightFactor, 0);
                                      const groupVol = group.items.reduce((s, p) => {
                                        return s + (isMetric ? p.l * IN_TO_CM * p.w * IN_TO_CM * p.h * IN_TO_CM / 1000000 : cuInToCuFt(p.l * p.w * p.h));
                                      }, 0);
                                      const startIdx = globalIdx;
                                      globalIdx += group.items.length;
                                      return (
                                        <Fragment key={groupKey}>
                                          <tr
                                            className="border-b border-slate-200 bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => setExpandedGroups((prev) => {
                                              const next = new Set(prev);
                                              next.has(groupKey) ? next.delete(groupKey) : next.add(groupKey);
                                              return next;
                                            })}
                                            data-testid={`group-header-${ci}-${name}`}
                                          >
                                            <td className="py-1.5 pr-1">
                                              <div className="w-4 h-4 rounded flex items-center justify-center text-white font-bold" style={{ backgroundColor: group.color, fontSize: "9px" }}>
                                                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                              </div>
                                            </td>
                                            <td className="py-1.5 pr-1 font-semibold text-slate-800">{name}</td>
                                            <td className="py-1.5 pr-1 text-right text-slate-500">{group.items.length} pcs</td>
                                            <td className="py-1.5 pr-1"></td>
                                            <td className="py-1.5 pr-1 text-right text-slate-600 font-medium">{groupWt.toFixed(0)}</td>
                                            <td className="py-1.5 pr-1 text-center text-slate-500">{group.items[0].stackable ? "Y" : "N"}</td>
                                            <td className="py-1.5 pr-1"></td>
                                            <td className="py-1.5 text-right text-slate-600 font-medium">{groupVol.toFixed(isMetric ? 3 : 1)}</td>
                                          </tr>
                                          {isOpen && group.items.map((p, gi) => {
                                            const volVal = isMetric
                                              ? (p.l * IN_TO_CM * p.w * IN_TO_CM * p.h * IN_TO_CM / 1000000)
                                              : cuInToCuFt(p.l * p.w * p.h);
                                            return (
                                              <tr key={`${groupKey}-${gi}`} className="border-b border-slate-100 last:border-0">
                                                <td className="py-1 pr-1 pl-2">
                                                  <span className="text-slate-400 font-mono" style={{ fontSize: "9px" }}>{startIdx + gi + 1}</span>
                                                </td>
                                                <td className="py-1 pr-1 text-slate-600 pl-2">#{gi + 1}</td>
                                                <td className="py-1 pr-1 text-right text-slate-600 whitespace-nowrap">
                                                  {(p.l * dimFactor).toFixed(1)}×{(p.w * dimFactor).toFixed(1)}×{(p.h * dimFactor).toFixed(1)}
                                                </td>
                                                <td className="py-1 pr-1 text-right text-slate-500 font-mono whitespace-nowrap" style={{ fontSize: "10px" }}>
                                                  {(p.x * dimFactor).toFixed(0)},{(p.y * dimFactor).toFixed(0)},{(p.z * dimFactor).toFixed(0)}
                                                </td>
                                                <td className="py-1 pr-1 text-right text-slate-600">{(p.weight * weightFactor).toFixed(0)}</td>
                                                <td className="py-1 pr-1 text-center text-slate-500">{p.stackable ? "Y" : "N"}</td>
                                                <td className="py-1 pr-1 text-center">
                                                  <span className="font-mono text-slate-400" style={{ fontSize: "10px" }}>{p.rotation}</span>
                                                </td>
                                                <td className="py-1 text-right text-slate-600">{volVal.toFixed(isMetric ? 3 : 1)}</td>
                                              </tr>
                                            );
                                          })}
                                        </Fragment>
                                      );
                                    });
                                  })()}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-slate-300">
                                    <td colSpan={4} className="py-1.5 pr-1 font-bold text-slate-800">
                                      Total: {cResult.placed.length} pcs
                                    </td>
                                    <td className="py-1.5 pr-1 text-right font-bold text-slate-800">
                                      {(cResult.placed.reduce((s, p) => s + p.weight, 0) * weightFactor).toFixed(0)}
                                    </td>
                                    <td colSpan={2}></td>
                                    <td className="py-1.5 text-right font-bold text-slate-800">
                                      {isMetric
                                        ? (cResult.placed.reduce((s, p) => s + p.l * IN_TO_CM * p.w * IN_TO_CM * p.h * IN_TO_CM / 1000000, 0)).toFixed(3)
                                        : cuInToCuFt(cResult.placed.reduce((s, p) => s + p.l * p.w * p.h, 0)).toFixed(1)
                                      }
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                        )}
                      </div>
                    );
                  })}

                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-1">
                            Need help with your shipment?
                          </h3>
                          <p className="text-sm text-slate-600">
                            Get expert customs clearance, HS classification, and import compliance
                            assistance from our team.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!showEmail ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => setShowEmail(true)}
                                data-testid="button-get-report"
                              >
                                <Mail className="w-4 h-4" />
                                Email Report
                              </Button>
                              <Link href="/contact">
                                <Button size="sm" className="gap-1" data-testid="button-contact-us">
                                  Contact Us
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <Input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-9 w-56"
                                data-testid="input-report-email"
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!email || !email.includes("@")) {
                                    toast({
                                      title: "Invalid email",
                                      description: "Please enter a valid email address.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  toast({
                                    title: "Report request sent",
                                    description:
                                      "We'll send your loading plan report shortly. Our team may also reach out to help with your shipment.",
                                  });
                                  setShowEmail(false);
                                  setEmail("");
                                }}
                                data-testid="button-send-report"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <button
                                onClick={() => setShowEmail(false)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <section className="mt-12 border-t border-slate-200 bg-white/70 py-8" aria-labelledby="container-guide-heading">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm" data-testid="container-guide-details">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
                <div className="rounded-xl bg-blue-50 p-2.5 text-primary">
                  <Info className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="container-guide-heading" className="text-lg md:text-xl font-bold font-display text-slate-900">
                    How this calculator works, limits &amp; FAQ
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Container sizes, calculation rules, practical limitations, and common questions
                  </p>
                </div>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>

              <div className="border-t border-slate-200 p-5 md:p-7">
                <div className="max-w-3xl mb-9">
                  <h3 className="text-xl md:text-2xl font-bold font-display text-slate-900 mb-3">
                    How the 3D container loading calculator works
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Add each pallet, crate, or carton with its outside dimensions, quantity, and total gross weight.
                    The planner checks physical placement and payload limits, compares standard container sizes, and
                    recommends the smallest practical option that fits the complete load. You can then inspect the
                    arrangement in 3D and export the loading plan as a PDF.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Supported container sizes</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Internal dimensions*</th>
                        <th className="text-right px-4 py-3">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr><td className="px-4 py-3 font-medium">20&apos; DC</td><td className="px-4 py-3">5.90 × 2.35 × 2.39 m</td><td className="px-4 py-3 text-right">33.2 m³</td></tr>
                      <tr><td className="px-4 py-3 font-medium">40&apos; DC</td><td className="px-4 py-3">12.03 × 2.35 × 2.39 m</td><td className="px-4 py-3 text-right">67.7 m³</td></tr>
                      <tr><td className="px-4 py-3 font-medium">40&apos; HC</td><td className="px-4 py-3">12.03 × 2.35 × 2.67 m</td><td className="px-4 py-3 text-right">76.3 m³</td></tr>
                      <tr><td className="px-4 py-3 font-medium">45&apos; HC</td><td className="px-4 py-3">13.33 × 2.35 × 2.67 m</td><td className="px-4 py-3 text-right">86.2 m³</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-2">*Preset dimensions are approximate. Confirm the shipping line&apos;s equipment specification before loading.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">What the calculation checks</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  {[
                    "Whether every piece fits through the container's usable internal space",
                    "Allowed horizontal rotation, fixed orientation, pallet footprint, and stacking rules",
                    "Total gross cargo weight against the selected container's payload limit",
                    "How many containers are needed when one unit cannot hold the complete shipment",
                    "Best-fit comparison across 20' DC, 40' DC, 40' HC, and 45' HC equipment",
                    "Volume, floor-area, and weight utilization for the proposed plan",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
                </div>

                <div className="max-w-3xl">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Container loading calculator FAQ</h3>
              <div className="space-y-3">
                <details className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer font-semibold text-slate-800">Is this container loading calculator free?</summary>
                  <p className="mt-3 text-sm text-slate-600">Yes. The calculator, best-fit recommendation, 3D preview, document import, and PDF report can be used without creating an account.</p>
                </details>
                <details className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer font-semibold text-slate-800">Should I enter total weight or weight per pallet?</summary>
                  <p className="mt-3 text-sm text-slate-600">Enter the total gross weight for the complete cargo row. If one row represents seven identical pallets, enter the combined weight of all seven; the calculator derives the per-piece weight.</p>
                </details>
                <details className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer font-semibold text-slate-800">Does a calculated fit guarantee the cargo can be loaded?</summary>
                  <p className="mt-3 text-sm text-slate-600">No. Treat the result as a planning estimate. Confirm door clearance, lifting access, blocking and bracing, axle or floor concentration limits, cargo compatibility, and the carrier&apos;s exact container specification.</p>
                </details>
                <details className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer font-semibold text-slate-800">Can I import a packing list instead of typing dimensions?</summary>
                  <p className="mt-3 text-sm text-slate-600">Yes. Spreadsheets are parsed locally, and supported documents or images can be analyzed to extract cargo dimensions for review before they are added.</p>
                </details>
              </div>
              <p className="mt-6 text-sm text-slate-600">
                Planning Canadian imports? Use the free <Link href="/tools/hs-code-finder" className="text-primary hover:underline">Canadian HS Code Finder</Link> and <Link href="/customs-calculator" className="text-primary hover:underline">customs duty calculator</Link> to estimate classification and landed costs.
              </p>
                </div>
              </div>
            </details>
          </div>
        </section>
      </main>
      {!isEmbedMode && <ToolWorkedExample kind="container" />}
      {!isEmbedMode && <Footer />}
    </div>
  );
}
