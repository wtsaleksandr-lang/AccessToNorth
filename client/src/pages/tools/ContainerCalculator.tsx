import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  RotateCw,
  Eye,
  EyeOff,
  ArrowUpDown,
  ChevronDown,
  CheckSquare,
  Square,
  Minus,
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const IN_TO_CM = 2.54;
const CM_TO_IN = 1 / IN_TO_CM;
const LB_TO_KG = 0.453592;
const KG_TO_LB = 1 / LB_TO_KG;

interface ContainerSpec {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  maxPayloadLbs: number;
  volumeCuFt: number;
  tare: number;
}

const CONTAINER_PRESETS: ContainerSpec[] = [
  {
    id: "20dc",
    name: "20' Standard (DC)",
    lengthIn: 232.2,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 62170,
    volumeCuFt: 1172,
    tare: 5071,
  },
  {
    id: "40dc",
    name: "40' Standard (DC)",
    lengthIn: 473.8,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 58820,
    volumeCuFt: 2390,
    tare: 8333,
  },
  {
    id: "40hc",
    name: "40' High Cube (HC)",
    lengthIn: 473.8,
    widthIn: 92.6,
    heightIn: 105.1,
    maxPayloadLbs: 58420,
    volumeCuFt: 2694,
    tare: 8775,
  },
  {
    id: "45hc",
    name: "45' High Cube (HC)",
    lengthIn: 524.8,
    widthIn: 92.6,
    heightIn: 105.1,
    maxPayloadLbs: 57650,
    volumeCuFt: 3043,
    tare: 10580,
  },
];

type RotationMode = "all" | "horizontal" | "fixed";
type LoadPriority = "first" | "normal" | "last";
type PalletType = "none" | "us48x40" | "euro" | "custom";

interface CargoItem {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  color: string;
  stackable: boolean;
  palletized: boolean;
  palletType: PalletType;
  rotationMode: RotationMode;
  included: boolean;
  loadPriority: LoadPriority;
}

const PALLET_DIMS: Record<string, { l: number; w: number; h: number; label: string }> = {
  us48x40: { l: 48, w: 40, h: 6, label: "US 48×40\"" },
  euro: { l: 47.2, w: 31.5, h: 5.7, label: "Euro 1200×800mm" },
};

interface PlacedBox {
  cargoId: string;
  cargoName: string;
  color: string;
  x: number;
  y: number;
  z: number;
  l: number;
  w: number;
  h: number;
  weight: number;
  rotation: string;
}

interface LoadingResult {
  placed: PlacedBox[];
  unplaced: { name: string; qty: number }[];
  totalWeight: number;
  totalVolume: number;
  containerVolume: number;
  maxPayload: number;
  volumeUtil: number;
  weightUtil: number;
  floorArea: number;
  containerFloorArea: number;
  piecesLoaded: number;
  piecesTotal: number;
}

const CARGO_COLORS = [
  "#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7",
  "#6366f1", "#10b981", "#e11d48", "#0ea5e9", "#d946ef",
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function inToM(inches: number) {
  return inches * 0.0254;
}

function cuInToCuFt(cuIn: number) {
  return cuIn / 1728;
}

function sqInToSqFt(sqIn: number) {
  return sqIn / 144;
}

function getRotations(
  bl: number, bw: number, bh: number, mode: RotationMode
): [number, number, number, string][] {
  if (mode === "fixed") {
    return [[bl, bw, bh, "LWH"]];
  }
  if (mode === "horizontal") {
    return [
      [bl, bw, bh, "LWH"],
      [bw, bl, bh, "WLH"],
    ];
  }
  return [
    [bl, bw, bh, "LWH"],
    [bl, bh, bw, "LHW"],
    [bw, bl, bh, "WLH"],
    [bw, bh, bl, "WHL"],
    [bh, bl, bw, "HLW"],
    [bh, bw, bl, "HWL"],
  ];
}

function packBoxes(
  items: CargoItem[],
  container: ContainerSpec,
): LoadingResult {
  const cL = container.lengthIn;
  const cW = container.widthIn;
  const cH = container.heightIn;
  const maxPay = container.maxPayloadLbs;

  const includedItems = items.filter((i) => i.included);

  const allBoxes: {
    cargoId: string;
    name: string;
    color: string;
    dims: [number, number, number];
    weight: number;
    stackable: boolean;
    rotationMode: RotationMode;
    loadPriority: LoadPriority;
  }[] = [];

  for (const item of includedItems) {
    let boxL = item.length;
    let boxW = item.width;
    let boxH = item.height;
    let boxWeight = item.weight;

    if (item.palletized && item.palletType !== "none" && item.palletType !== "custom") {
      const pd = PALLET_DIMS[item.palletType];
      if (pd) {
        boxL = Math.max(boxL, pd.l);
        boxW = Math.max(boxW, pd.w);
        boxH = boxH + pd.h;
        boxWeight = boxWeight + 40;
      }
    }

    for (let q = 0; q < item.quantity; q++) {
      allBoxes.push({
        cargoId: item.id,
        name: item.name || `Item ${items.indexOf(item) + 1}`,
        color: item.color,
        dims: [boxL, boxW, boxH],
        weight: boxWeight,
        stackable: item.stackable,
        rotationMode: item.rotationMode,
        loadPriority: item.loadPriority,
      });
    }
  }

  const priorityOrder: Record<LoadPriority, number> = { first: 0, normal: 1, last: 2 };
  allBoxes.sort((a, b) => {
    const pa = priorityOrder[a.loadPriority];
    const pb = priorityOrder[b.loadPriority];
    if (pa !== pb) return pa - pb;
    const volA = a.dims[0] * a.dims[1] * a.dims[2];
    const volB = b.dims[0] * b.dims[1] * b.dims[2];
    return volB - volA;
  });

  const placed: PlacedBox[] = [];
  const unplacedMap = new Map<string, number>();
  let totalWeight = 0;

  const spaces: { x: number; y: number; z: number; l: number; w: number; h: number }[] = [
    { x: 0, y: 0, z: 0, l: cL, w: cW, h: cH },
  ];

  for (const box of allBoxes) {
    const [bl, bw, bh] = box.dims;
    const rotations = getRotations(bl, bw, bh, box.rotationMode);

    let bestFit: { spaceIdx: number; rotation: [number, number, number, string] } | null = null;
    let bestWaste = Infinity;

    for (let si = 0; si < spaces.length; si++) {
      const sp = spaces[si];
      if (!box.stackable && sp.y > 0.1) continue;

      for (const rot of rotations) {
        const [rl, rw, rh] = rot;
        if (rl <= sp.l + 0.01 && rw <= sp.w + 0.01 && rh <= sp.h + 0.01) {
          if (totalWeight + box.weight <= maxPay) {
            const waste = (sp.l * sp.w * sp.h) - (rl * rw * rh);
            if (waste < bestWaste) {
              bestWaste = waste;
              bestFit = { spaceIdx: si, rotation: rot };
            }
          }
        }
      }
    }

    if (bestFit) {
      const sp = spaces[bestFit.spaceIdx];
      const [rl, rw, rh, rotLabel] = bestFit.rotation;

      placed.push({
        cargoId: box.cargoId,
        cargoName: box.name,
        color: box.color,
        x: sp.x,
        y: sp.y,
        z: sp.z,
        l: rl,
        w: rw,
        h: rh,
        weight: box.weight,
        rotation: rotLabel,
      });

      totalWeight += box.weight;
      spaces.splice(bestFit.spaceIdx, 1);

      if (sp.l - rl > 0.1) {
        spaces.push({ x: sp.x + rl, y: sp.y, z: sp.z, l: sp.l - rl, w: sp.w, h: sp.h });
      }
      if (sp.w - rw > 0.1) {
        spaces.push({ x: sp.x, y: sp.y, z: sp.z + rw, l: rl, w: sp.w - rw, h: sp.h });
      }
      if (sp.h - rh > 0.1) {
        spaces.push({ x: sp.x, y: sp.y + rh, z: sp.z, l: rl, w: rw, h: sp.h - rh });
      }

      spaces.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 0.1) return a.y - b.y;
        if (Math.abs(a.z - b.z) > 0.1) return a.z - b.z;
        return a.x - b.x;
      });
    } else {
      unplacedMap.set(box.name, (unplacedMap.get(box.name) || 0) + 1);
    }
  }

  const totalVolume = placed.reduce((s, p) => s + p.l * p.w * p.h, 0);
  const containerVolume = cL * cW * cH;
  const totalPiecesAll = items.filter((i) => i.included).reduce((s, i) => s + i.quantity, 0);

  let maxX = 0, maxZ = 0;
  for (const p of placed) {
    maxX = Math.max(maxX, p.x + p.l);
    maxZ = Math.max(maxZ, p.z + p.w);
  }
  const floorArea = maxX * maxZ;

  return {
    placed,
    unplaced: Array.from(unplacedMap.entries()).map(([name, qty]) => ({ name, qty })),
    totalWeight,
    totalVolume: cuInToCuFt(totalVolume),
    containerVolume: cuInToCuFt(containerVolume),
    maxPayload: maxPay,
    volumeUtil: (totalVolume / containerVolume) * 100,
    weightUtil: (totalWeight / maxPay) * 100,
    floorArea: sqInToSqFt(floorArea),
    containerFloorArea: sqInToSqFt(cL * cW),
    piecesLoaded: placed.length,
    piecesTotal: totalPiecesAll,
  };
}

function ContainerViewer3D({
  placed,
  container,
}: {
  placed: PlacedBox[];
  container: ContainerSpec;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    animId: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current || webglError) return;

    const el = mountRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglError(true);
      return;
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);

    const cL = inToM(container.lengthIn);
    const cW = inToM(container.widthIn);
    const cH = inToM(container.heightIn);

    camera.position.set(cL * 1.5, cH * 1.8, cW * 2.5);
    camera.lookAt(cL / 2, cH / 3, cW / 2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(cL / 2, cH / 3, cW / 2);
    controls.minDistance = 1;
    controls.maxDistance = 30;
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(cL, cH * 2, cW * 1.5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-cL, cH, -cW);
    scene.add(fillLight);

    const floorGeo = new THREE.PlaneGeometry(cL * 4, cW * 4);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cL / 2, -0.005, cW / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const containerEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(cL, cH, cW));
    const containerWire = new THREE.LineSegments(
      containerEdges,
      new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 })
    );
    containerWire.position.set(cL / 2, cH / 2, cW / 2);
    scene.add(containerWire);

    const containerFloorGeo = new THREE.PlaneGeometry(cL, cW);
    const containerFloorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      transparent: true,
      opacity: 0.3,
    });
    const containerFloor = new THREE.Mesh(containerFloorGeo, containerFloorMat);
    containerFloor.rotation.x = -Math.PI / 2;
    containerFloor.position.set(cL / 2, 0.001, cW / 2);
    scene.add(containerFloor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(cW, cH), wallMat);
    backWall.position.set(0, cH / 2, cW / 2);
    backWall.rotation.y = Math.PI / 2;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(cL, cH), wallMat);
    leftWall.position.set(cL / 2, cH / 2, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(cL, cH), wallMat);
    rightWall.position.set(cL / 2, cH / 2, cW);
    scene.add(rightWall);

    for (const box of placed) {
      const bL = inToM(box.l);
      const bW = inToM(box.w);
      const bH = inToM(box.h);
      const bX = inToM(box.x);
      const bY = inToM(box.y);
      const bZ = inToM(box.z);

      const boxGeo = new THREE.BoxGeometry(bL * 0.98, bH * 0.98, bW * 0.98);
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(box.color),
        roughness: 0.4,
        metalness: 0.1,
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.position.set(bX + bL / 2, bY + bH / 2, bZ + bW / 2);
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      scene.add(boxMesh);

      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(bL, bH, bW));
      const edgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(box.color).multiplyScalar(0.6),
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(boxMesh.position);
      scene.add(edges);
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

    addAxisLabel(
      `${container.lengthIn.toFixed(1)}"`,
      new THREE.Vector3(cL / 2, -0.15, -0.2)
    );
    addAxisLabel(
      `${container.widthIn.toFixed(1)}"`,
      new THREE.Vector3(-0.3, -0.15, cW / 2)
    );
    addAxisLabel(
      `${container.heightIn.toFixed(1)}"`,
      new THREE.Vector3(-0.3, cH / 2, -0.2)
    );

    let animId = 0;
    function animate() {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    sceneRef.current = { renderer, scene, camera, controls, animId };

    const handleResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [placed, container]);

  if (webglError) {
    return (
      <div
        className="w-full h-[300px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-6"
        data-testid="container-3d-viewer"
      >
        <Box className="w-12 h-12 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700 mb-1">3D Preview Unavailable</p>
        <p className="text-xs text-slate-500">
          Your browser does not support WebGL. The loading plan details are shown below.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
      data-testid="container-3d-viewer"
    />
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

export default function ContainerCalculator() {
  usePageMeta({
    title: "Container Loading Calculator | 3D Load Planner | AccessToNorth.com",
    description:
      "Free 3D container loading calculator. Plan optimal cargo placement in 20', 40', 40' HC, and 45' HC shipping containers. Visualize your load plan instantly.",
    canonical: "https://www.accesstonorth.com/tools/container-calculator",
  });

  const { toast } = useToast();
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [containerId, setContainerId] = useState("20dc");
  const [customContainer, setCustomContainer] = useState({
    lengthIn: 232.2,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 62170,
  });
  const defaultCargoItem = useCallback((colorIdx: number): CargoItem => ({
    id: generateId(),
    name: "",
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    quantity: 1,
    color: CARGO_COLORS[colorIdx % CARGO_COLORS.length],
    stackable: true,
    palletized: false,
    palletType: "none",
    rotationMode: "all",
    included: true,
    loadPriority: "normal",
  }), []);

  const [cargoItems, setCargoItems] = useState<CargoItem[]>([defaultCargoItem(0)]);
  const [result, setResult] = useState<LoadingResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isMetric = unitSystem === "metric";
  const dimFactor = isMetric ? IN_TO_CM : 1;
  const weightFactor = isMetric ? LB_TO_KG : 1;
  const dimUnit = isMetric ? "cm" : "in";
  const weightUnit = isMetric ? "kg" : "lbs";

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

  const handleUnitSwitch = useCallback((newUnit: "imperial" | "metric") => {
    if (newUnit === unitSystem) return;
    setUnitSystem(newUnit);
    setResult(null);
  }, [unitSystem]);

  const addItem = useCallback(() => {
    const colorIdx = cargoItems.length;
    setCargoItems((prev) => [...prev, defaultCargoItem(colorIdx)]);
  }, [cargoItems.length, defaultCargoItem]);

  const removeItem = useCallback((id: string) => {
    setCargoItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateItem = useCallback((id: string, field: keyof CargoItem, value: any) => {
    setCargoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
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
        const res = packBoxes(validItems, container);
        setResult(res);
        setCalculating(false);

        if (res.unplaced.length > 0) {
          toast({
            title: "Some items didn't fit",
            description: `${res.unplaced.reduce((s, u) => s + u.qty, 0)} piece(s) could not fit in the container.`,
          });
        }
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
  }, [cargoItems, container, toast]);

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

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const bulkUpdate = useCallback((field: keyof CargoItem, value: any) => {
    setCargoItems((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, [field]: value } : item
      )
    );
  }, [selectedIds]);

  const handleReset = useCallback(() => {
    setResult(null);
    setCargoItems([defaultCargoItem(0)]);
    setSelectedIds(new Set());
    setExpandedIds(new Set());
  }, [defaultCargoItem]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <Breadcrumbs
            items={[
              { label: "Tools", href: "/tools" },
              { label: "Container Loading Calculator" },
            ]}
          />

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
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-5">
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Container Type
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTAINER_PRESETS.map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => {
                          setContainerId(ct.id);
                          setResult(null);
                        }}
                        className={`text-left p-3 rounded-lg border text-sm transition-all ${
                          containerId === ct.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        data-testid={`button-container-${ct.id}`}
                      >
                        <span className="font-semibold text-slate-900 block leading-tight">
                          {ct.name}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 block">
                          {ct.volumeCuFt.toLocaleString()} cu ft
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setContainerId("custom");
                        setResult(null);
                      }}
                      className={`text-left p-3 rounded-lg border text-sm transition-all col-span-2 ${
                        containerId === "custom"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      data-testid="button-container-custom"
                    >
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5 text-primary" />
                        Custom Dimensions
                      </span>
                      <span className="text-xs text-slate-500 mt-1 block">
                        Enter your own container size
                      </span>
                    </button>
                  </div>

                  {containerId === "custom" && (
                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/15 space-y-3">
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Custom Container Dimensions
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-slate-500">Length ({dimUnit})</Label>
                          <Input
                            type="number"
                            min={1}
                            step="0.1"
                            value={toDisplay(customContainer.lengthIn)}
                            onChange={(e) =>
                              setCustomContainer((p) => ({
                                ...p,
                                lengthIn: fromDisplay(e.target.value),
                              }))
                            }
                            className="h-8 text-sm"
                            data-testid="input-custom-length"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500">Width ({dimUnit})</Label>
                          <Input
                            type="number"
                            min={1}
                            step="0.1"
                            value={toDisplay(customContainer.widthIn)}
                            onChange={(e) =>
                              setCustomContainer((p) => ({
                                ...p,
                                widthIn: fromDisplay(e.target.value),
                              }))
                            }
                            className="h-8 text-sm"
                            data-testid="input-custom-width"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500">Height ({dimUnit})</Label>
                          <Input
                            type="number"
                            min={1}
                            step="0.1"
                            value={toDisplay(customContainer.heightIn)}
                            onChange={(e) =>
                              setCustomContainer((p) => ({
                                ...p,
                                heightIn: fromDisplay(e.target.value),
                              }))
                            }
                            className="h-8 text-sm"
                            data-testid="input-custom-height"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Max Payload ({weightUnit})</Label>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          value={toDisplayWeight(customContainer.maxPayloadLbs)}
                          onChange={(e) =>
                            setCustomContainer((p) => ({
                              ...p,
                              maxPayloadLbs: fromDisplayWeight(e.target.value),
                            }))
                          }
                          className="h-8 text-sm"
                          data-testid="input-custom-payload"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Internal Dimensions
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-length">
                          {isMetric
                            ? `${(container.lengthIn * IN_TO_CM).toFixed(1)} cm`
                            : `${parseFloat(container.lengthIn.toFixed(1))}"`}
                        </p>
                        <p className="text-slate-500">Length</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-width">
                          {isMetric
                            ? `${(container.widthIn * IN_TO_CM).toFixed(1)} cm`
                            : `${parseFloat(container.widthIn.toFixed(1))}"`}
                        </p>
                        <p className="text-slate-500">Width</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-height">
                          {isMetric
                            ? `${(container.heightIn * IN_TO_CM).toFixed(1)} cm`
                            : `${parseFloat(container.heightIn.toFixed(1))}"`}
                        </p>
                        <p className="text-slate-500">Height</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-payload">
                          {isMetric
                            ? `${Math.round(container.maxPayloadLbs * LB_TO_KG).toLocaleString()} kg`
                            : `${container.maxPayloadLbs.toLocaleString()} lbs`}
                        </p>
                        <p className="text-slate-500">Max Payload</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900" data-testid="text-container-volume">
                          {container.volumeCuFt.toLocaleString()} ft³
                        </p>
                        <p className="text-slate-500">Volume</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary" />
                      Units
                    </h2>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => handleUnitSwitch("imperial")}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
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
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
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
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Box className="w-4 h-4 text-primary" />
                      Cargo Items
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="gap-1"
                      data-testid="button-add-cargo"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </Button>
                  </div>

                  {cargoItems.length > 1 && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-primary transition-colors"
                        data-testid="button-select-all"
                      >
                        {selectedIds.size === cargoItems.length ? (
                          <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        ) : selectedIds.size > 0 ? (
                          <Minus className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        {selectedIds.size === cargoItems.length ? "Deselect All" : "Select All"}
                      </button>
                      {selectedIds.size > 0 && (
                        <span className="text-xs text-slate-400">
                          {selectedIds.size} selected
                        </span>
                      )}
                    </div>
                  )}

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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                  <div className="space-y-3">
                    {cargoItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`border rounded-xl relative group transition-all ${
                          !item.included
                            ? "border-slate-200/60 bg-slate-50/50 opacity-60"
                            : selectedIds.has(item.id)
                            ? "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/10"
                            : "border-slate-200"
                        }`}
                        data-testid={`cargo-item-${idx}`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-2.5">
                            {cargoItems.length > 1 && (
                              <button
                                onClick={() => toggleSelect(item.id)}
                                className="mt-2 shrink-0 text-slate-400 hover:text-primary transition-colors"
                                data-testid={`checkbox-cargo-${idx}`}
                              >
                                {selectedIds.has(item.id) ? (
                                  <CheckSquare className="w-4 h-4 text-primary" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <div
                              className="w-3.5 h-3.5 rounded-full mt-2.5 shrink-0 border border-white ring-1 ring-slate-200"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-6 gap-3">
                              <div className="sm:col-span-3">
                                <Label className="text-xs text-slate-500">Name</Label>
                                <Input
                                  placeholder={`Cargo ${idx + 1}`}
                                  value={item.name}
                                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                  className="h-9 text-sm"
                                  data-testid={`input-cargo-name-${idx}`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-500">Qty</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity || ""}
                                  onChange={(e) =>
                                    updateItem(item.id, "quantity", parseInt(e.target.value) || 0)
                                  }
                                  className="h-9 text-sm"
                                  data-testid={`input-cargo-qty-${idx}`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-500">Weight ({weightUnit})</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.1"
                                  value={toDisplayWeight(item.weight)}
                                  onChange={(e) =>
                                    updateItem(item.id, "weight", fromDisplayWeight(e.target.value))
                                  }
                                  className="h-9 text-sm"
                                  data-testid={`input-cargo-weight-${idx}`}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {cargoItems.length > 1 && (
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                                  data-testid={`button-remove-cargo-${idx}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 ml-[calc(1rem+14px)] sm:ml-[calc(1rem+14px)] grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs text-slate-500">Length ({dimUnit})</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.1"
                                value={toDisplay(item.length)}
                                onChange={(e) =>
                                  updateItem(item.id, "length", fromDisplay(e.target.value))
                                }
                                className="h-9 text-sm"
                                data-testid={`input-cargo-length-${idx}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-slate-500">Width ({dimUnit})</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.1"
                                value={toDisplay(item.width)}
                                onChange={(e) =>
                                  updateItem(item.id, "width", fromDisplay(e.target.value))
                                }
                                className="h-9 text-sm"
                                data-testid={`input-cargo-width-${idx}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-slate-500">Height ({dimUnit})</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.1"
                                value={toDisplay(item.height)}
                                onChange={(e) =>
                                  updateItem(item.id, "height", fromDisplay(e.target.value))
                                }
                                className="h-9 text-sm"
                                data-testid={`input-cargo-height-${idx}`}
                              />
                            </div>
                          </div>

                          <div className="mt-3 ml-[calc(1rem+14px)] sm:ml-[calc(1rem+14px)]">
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary transition-colors"
                              data-testid={`button-advanced-${idx}`}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  expandedIds.has(item.id) ? "rotate-180" : ""
                                }`}
                              />
                              Advanced Options
                              <div className="flex gap-1 ml-1">
                                {!item.stackable && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">No Stack</span>
                                )}
                                {item.rotationMode !== "all" && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium">
                                    {item.rotationMode === "fixed" ? "Fixed" : "Horiz."}
                                  </span>
                                )}
                                {item.loadPriority !== "normal" && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-medium">
                                    {item.loadPriority === "first" ? "1st" : "Last"}
                                  </span>
                                )}
                                {item.palletized && (
                                  <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-medium">Pallet</span>
                                )}
                                {!item.included && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-medium">Excluded</span>
                                )}
                              </div>
                            </button>

                            {expandedIds.has(item.id) && (
                              <div className="mt-3 p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 block">
                                      Stackable
                                    </Label>
                                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                                      <button
                                        onClick={() => updateItem(item.id, "stackable", true)}
                                        className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                          item.stackable
                                            ? "bg-green-500 text-white"
                                            : "bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                        data-testid={`toggle-stackable-yes-${idx}`}
                                      >
                                        <Layers className="w-3 h-3 inline mr-1" />
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => updateItem(item.id, "stackable", false)}
                                        className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                          !item.stackable
                                            ? "bg-amber-500 text-white"
                                            : "bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                        data-testid={`toggle-stackable-no-${idx}`}
                                      >
                                        No
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 block">
                                      Rotation
                                    </Label>
                                    <select
                                      value={item.rotationMode}
                                      onChange={(e) => updateItem(item.id, "rotationMode", e.target.value as RotationMode)}
                                      className="w-full h-[30px] px-2 text-[11px] font-medium rounded-lg border border-slate-200 bg-white hover:border-primary/50 transition-colors cursor-pointer"
                                      data-testid={`select-rotation-${idx}`}
                                    >
                                      <option value="all">All axes</option>
                                      <option value="horizontal">Horizontal only</option>
                                      <option value="fixed">Fixed (upright)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 block">
                                      Load Sequence
                                    </Label>
                                    <select
                                      value={item.loadPriority}
                                      onChange={(e) => updateItem(item.id, "loadPriority", e.target.value as LoadPriority)}
                                      className="w-full h-[30px] px-2 text-[11px] font-medium rounded-lg border border-slate-200 bg-white hover:border-primary/50 transition-colors cursor-pointer"
                                      data-testid={`select-priority-${idx}`}
                                    >
                                      <option value="first">Load First (back)</option>
                                      <option value="normal">Normal</option>
                                      <option value="last">Load Last (door)</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 block">
                                      Palletized
                                    </Label>
                                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                                      <button
                                        onClick={() => {
                                          updateItem(item.id, "palletized", true);
                                          if (item.palletType === "none") updateItem(item.id, "palletType", "us48x40");
                                        }}
                                        className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                          item.palletized
                                            ? "bg-green-500 text-white"
                                            : "bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                        data-testid={`toggle-palletized-yes-${idx}`}
                                      >
                                        <Package className="w-3 h-3 inline mr-1" />
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => {
                                          updateItem(item.id, "palletized", false);
                                          updateItem(item.id, "palletType", "none");
                                        }}
                                        className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                          !item.palletized
                                            ? "bg-slate-500 text-white"
                                            : "bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                        data-testid={`toggle-palletized-no-${idx}`}
                                      >
                                        No
                                      </button>
                                    </div>
                                    {item.palletized && (
                                      <select
                                        value={item.palletType}
                                        onChange={(e) => updateItem(item.id, "palletType", e.target.value as PalletType)}
                                        className="mt-1.5 w-full h-[28px] px-2 text-[11px] font-medium rounded-md border border-slate-200 bg-white cursor-pointer"
                                        data-testid={`select-pallet-type-${idx}`}
                                      >
                                        <option value="us48x40">US 48×40"</option>
                                        <option value="euro">Euro 1200×800mm</option>
                                        <option value="custom">Custom pallet</option>
                                      </select>
                                    )}
                                  </div>

                                  <div>
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 block">
                                      Include in Plan
                                    </Label>
                                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                                      <button
                                        onClick={() => updateItem(item.id, "included", true)}
                                        className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                                          item.included
                                            ? "bg-green-500 text-white"
                                            : "bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                        data-testid={`toggle-included-yes-${idx}`}
                                      >
                                        <Eye className="w-3 h-3" />
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => updateItem(item.id, "included", false)}
                                        className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                                          !item.included
                                            ? "bg-slate-500 text-white"
                                            : "bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                        data-testid={`toggle-included-no-${idx}`}
                                      >
                                        <EyeOff className="w-3 h-3" />
                                        No
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex gap-3">
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
                      variant="outline"
                      onClick={handleReset}
                      className="gap-1"
                      data-testid="button-reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  <Card className="border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-primary" />
                        3D Loading Visualization
                      </h2>
                      <p className="text-xs text-slate-500">Click and drag to rotate, scroll to zoom</p>
                    </div>
                    <CardContent className="p-4">
                      <ContainerViewer3D placed={result.placed} container={container} />
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Loading Summary
                      </h2>

                      {result.unplaced.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">
                              {result.unplaced.reduce((s, u) => s + u.qty, 0)} item(s) could not fit
                            </p>
                            <p className="text-amber-700 text-xs mt-1">
                              {result.unplaced.map((u) => `${u.name} (×${u.qty})`).join(", ")}
                            </p>
                          </div>
                        </div>
                      )}

                      {result.unplaced.length === 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <p className="text-sm font-medium text-green-800">
                            All {result.piecesTotal} piece(s) fit in 1 × {container.name}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <StatCard
                          icon={Package}
                          label="Pieces Loaded"
                          value={`${result.piecesLoaded} / ${result.piecesTotal}`}
                          color="#3b82f6"
                        />
                        <StatCard
                          icon={Weight}
                          label="Weight"
                          value={`${result.totalWeight.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })} lbs`}
                          sub={`of ${result.maxPayload.toLocaleString()} lbs`}
                          color="#22c55e"
                        />
                        <StatCard
                          icon={Box}
                          label="Volume Used"
                          value={`${result.totalVolume.toFixed(1)} ft³`}
                          sub={`of ${result.containerVolume.toFixed(0)} ft³`}
                          color="#8b5cf6"
                        />
                        <StatCard
                          icon={Ruler}
                          label="Floor Area"
                          value={`${result.floorArea.toFixed(1)} ft²`}
                          sub={`of ${result.containerFloorArea.toFixed(0)} ft²`}
                          color="#f59e0b"
                        />
                      </div>

                      <div className="space-y-3">
                        <UtilBar
                          pct={result.volumeUtil}
                          label="Volume Utilization"
                          color="#8b5cf6"
                        />
                        <UtilBar
                          pct={result.weightUtil}
                          label="Weight Utilization"
                          color="#22c55e"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Loading Details
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" data-testid="table-loading-details">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 pr-2 text-xs font-semibold text-slate-500 uppercase">
                                #
                              </th>
                              <th className="text-left py-2 pr-2 text-xs font-semibold text-slate-500 uppercase">
                                Item
                              </th>
                              <th className="text-right py-2 pr-2 text-xs font-semibold text-slate-500 uppercase">
                                L × W × H (in)
                              </th>
                              <th className="text-right py-2 pr-2 text-xs font-semibold text-slate-500 uppercase">
                                Weight
                              </th>
                              <th className="text-center py-2 pr-2 text-xs font-semibold text-slate-500 uppercase">
                                Rot.
                              </th>
                              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">
                                ft³
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.placed.map((p, i) => (
                              <tr key={i} className="border-b border-slate-100 last:border-0">
                                <td className="py-2 pr-2">
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ backgroundColor: p.color }}
                                  >
                                    {i + 1}
                                  </div>
                                </td>
                                <td className="py-2 pr-2 font-medium text-slate-900 text-xs">
                                  {p.cargoName}
                                </td>
                                <td className="py-2 pr-2 text-right text-slate-600 text-xs">
                                  {p.l.toFixed(1)} × {p.w.toFixed(1)} × {p.h.toFixed(1)}
                                </td>
                                <td className="py-2 pr-2 text-right text-slate-600 text-xs">
                                  {p.weight.toFixed(0)}
                                </td>
                                <td className="py-2 pr-2 text-center">
                                  <span className="text-[10px] font-mono text-slate-400">{p.rotation}</span>
                                </td>
                                <td className="py-2 text-right text-slate-600 text-xs">
                                  {cuInToCuFt(p.l * p.w * p.h).toFixed(1)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

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
      </main>
      <Footer />
    </div>
  );
}
