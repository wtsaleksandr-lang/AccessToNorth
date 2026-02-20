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

interface MultiContainerResult {
  containers: {
    container: ContainerSpec;
    result: LoadingResult;
    label: string;
  }[];
  totalContainers: number;
  upgraded: boolean;
  upgradeFrom?: string;
  upgradeTo?: string;
  totalPiecesAll: number;
  totalPiecesLoaded: number;
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

  const [cargoItems, setCargoItems] = useState<CargoItem[]>([defaultCargoItem(0), defaultCargoItem(1)]);
  const [multiResult, setMultiResult] = useState<MultiContainerResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visualPopup, setVisualPopup] = useState<{ type: "stackable" | "rotation"; itemId: string } | null>(null);

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
    setMultiResult(null);
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
  }, []);

  const updateItem = useCallback((id: string, field: keyof CargoItem, value: any) => {
    setCargoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  const UPGRADE_MAP: Record<string, string> = {
    "20dc": "40dc",
    "40dc": "40hc",
    "40hc": "45hc",
  };

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
        const totalPiecesAll = validItems.reduce((s, i) => s + i.quantity, 0);

        let useContainer = container;
        let upgraded = false;
        let upgradeFrom = "";
        let upgradeTo = "";

        let res = packBoxes(validItems, useContainer);

        if (res.unplaced.length > 0 && containerId !== "custom") {
          let nextId = UPGRADE_MAP[containerId];
          while (nextId && res.unplaced.length > 0) {
            const nextContainer = CONTAINER_PRESETS.find((c) => c.id === nextId)!;
            const tryRes = packBoxes(validItems, nextContainer);
            if (tryRes.unplaced.length < res.unplaced.length || tryRes.piecesLoaded > res.piecesLoaded) {
              if (!upgraded) {
                upgradeFrom = useContainer.name;
              }
              useContainer = nextContainer;
              res = tryRes;
              upgraded = true;
              upgradeTo = nextContainer.name;
            }
            nextId = UPGRADE_MAP[nextId] || "";
          }
        }

        if (res.unplaced.length === 0) {
          setMultiResult({
            containers: [{ container: useContainer, result: res, label: `1 × ${useContainer.name}` }],
            totalContainers: 1,
            upgraded,
            upgradeFrom: upgraded ? upgradeFrom : undefined,
            upgradeTo: upgraded ? upgradeTo : undefined,
            totalPiecesAll,
            totalPiecesLoaded: res.piecesLoaded,
          });
        } else {
          const allContainers: MultiContainerResult["containers"] = [];
          let remaining = validItems.map((i) => ({ ...i }));
          let containerNum = 0;

          while (remaining.length > 0 && containerNum < 10) {
            containerNum++;
            const thisResult = packBoxes(remaining, useContainer);
            allContainers.push({
              container: useContainer,
              result: thisResult,
              label: `Container ${containerNum} — ${useContainer.name}`,
            });

            if (thisResult.unplaced.length === 0) {
              remaining = [];
            } else {
              const placedCounts = new Map<string, number>();
              for (const p of thisResult.placed) {
                placedCounts.set(p.cargoId, (placedCounts.get(p.cargoId) || 0) + 1);
              }
              const nextRemaining: CargoItem[] = [];
              for (const item of remaining) {
                const placedQty = placedCounts.get(item.id) || 0;
                const leftover = item.quantity - placedQty;
                if (leftover > 0) {
                  nextRemaining.push({ ...item, quantity: leftover });
                }
              }
              remaining = nextRemaining;

              if (thisResult.piecesLoaded === 0) break;
            }
          }

          const totalLoaded = allContainers.reduce((s, c) => s + c.result.piecesLoaded, 0);

          setMultiResult({
            containers: allContainers,
            totalContainers: allContainers.length,
            upgraded,
            upgradeFrom: upgraded ? upgradeFrom : undefined,
            upgradeTo: upgraded ? upgradeTo : undefined,
            totalPiecesAll,
            totalPiecesLoaded: totalLoaded,
          });

          if (totalLoaded < totalPiecesAll) {
            toast({
              title: "Some items still didn't fit",
              description: `${totalPiecesAll - totalLoaded} piece(s) could not be placed even with ${allContainers.length} container(s).`,
              variant: "destructive",
            });
          }
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
  }, [cargoItems, container, containerId, toast]);

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
  }, [selectedIds]);

  const handleReset = useCallback(() => {
    setMultiResult(null);
    setCargoItems([defaultCargoItem(0), defaultCargoItem(1)]);
    setSelectedIds(new Set());
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
                          setMultiResult(null);
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
                        setMultiResult(null);
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
                      Your Cargo List
                    </h2>
                    <div className="flex items-center gap-2">
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
                        onClick={addItem}
                        className="gap-1 h-7 text-xs"
                        data-testid="button-add-cargo"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Item
                      </Button>
                    </div>
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

                  {visualPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setVisualPopup(null)} data-testid="visual-popup-overlay">
                      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()} data-testid="visual-popup">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-sm text-slate-900">
                            {visualPopup.type === "stackable" ? "Stackable Options" : "Rotation Modes"}
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
                        ) : (
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
                        )}
                      </div>
                    </div>
                  )}

                  <div className="sm:hidden space-y-2" data-testid="cargo-mobile-cards">
                    {cargoItems.map((item, idx) => {
                      const totalWt = item.weight * item.quantity;
                      const displayTotalWt = unitSystem === "metric" ? (totalWt * LB_TO_KG).toFixed(1) : totalWt.toFixed(1);
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
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
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
                              <span className="text-[8px] text-slate-400 uppercase block">W/pc</span>
                              <Input type="number" min={0} step="0.1" value={toDisplayWeight(item.weight)} onChange={(e) => updateItem(item.id, "weight", fromDisplayWeight(e.target.value))} className="h-6 text-[10px] text-center px-0.5" data-testid={`input-cargo-weight-${idx}`} />
                            </div>
                            <div className="text-center">
                              <span className="text-[8px] text-slate-400 uppercase block">Total</span>
                              <div className="h-6 flex items-center justify-center text-[10px] text-slate-500 font-medium" data-testid={`text-wtotal-${idx}`}>
                                {item.weight > 0 && item.quantity > 0 ? displayTotalWt : "—"}
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
                                className="w-full h-6 rounded text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:border-primary/50 transition-colors"
                                data-testid={`select-rotation-${idx}`}
                              >
                                {item.rotationMode === "all" ? "All" : item.rotationMode === "horizontal" ? "Horiz" : "Fixed"}
                              </button>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Priority</span>
                              <select
                                value={item.loadPriority}
                                onChange={(e) => updateItem(item.id, "loadPriority", e.target.value as LoadPriority)}
                                className="w-full h-6 px-0.5 text-[10px] font-medium rounded border border-slate-200 bg-white cursor-pointer"
                                data-testid={`select-priority-${idx}`}
                              >
                                <option value="first">1st</option>
                                <option value="normal">Norm</option>
                                <option value="last">Last</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Pallet</span>
                              <div className="flex rounded border border-slate-200 overflow-hidden h-6">
                                <button
                                  onClick={() => { updateItem(item.id, "palletized", true); if (item.palletType === "none") updateItem(item.id, "palletType", "us48x40"); }}
                                  className={`flex-1 text-[10px] font-medium transition-colors ${item.palletized ? "bg-green-500 text-white" : "bg-white text-slate-400"}`}
                                  data-testid={`toggle-palletized-yes-${idx}`}
                                >Y</button>
                                <button
                                  onClick={() => { updateItem(item.id, "palletized", false); updateItem(item.id, "palletType", "none"); }}
                                  className={`flex-1 text-[10px] font-medium transition-colors ${!item.palletized ? "bg-slate-500 text-white" : "bg-white text-slate-400"}`}
                                  data-testid={`toggle-palletized-no-${idx}`}
                                >N</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden sm:block overflow-x-auto -mx-5 px-5" data-testid="cargo-table-scroll">
                    <table className="w-full border-collapse min-w-[920px]" data-testid="cargo-table">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-1.5 py-2 text-left w-[32px]">
                            <button
                              onClick={toggleSelectAll}
                              className="text-slate-400 hover:text-primary transition-colors"
                              data-testid="button-select-all"
                              title={selectedIds.size === cargoItems.length ? "Deselect All" : "Select All"}
                            >
                              {selectedIds.size === cargoItems.length && cargoItems.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : selectedIds.size > 0 ? (
                                <Minus className="w-4 h-4 text-primary" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="px-1 py-2 text-left min-w-[100px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Name</span>
                          </th>
                          <th className="px-1 py-2 text-center w-[58px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">L<span className="text-slate-300 ml-0.5">({dimUnit})</span></span>
                          </th>
                          <th className="px-1 py-2 text-center w-[58px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">W<span className="text-slate-300 ml-0.5">({dimUnit})</span></span>
                          </th>
                          <th className="px-1 py-2 text-center w-[58px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">H<span className="text-slate-300 ml-0.5">({dimUnit})</span></span>
                          </th>
                          <th className="px-1 py-2 text-center w-[48px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Qty</span>
                          </th>
                          <th className="px-1 py-2 text-center w-[62px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">W/pcs<span className="text-slate-300 ml-0.5">({weightUnit})</span></span>
                          </th>
                          <th className="px-1 py-2 text-center w-[62px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">W/total</span>
                          </th>
                          <th className="px-1 py-2 text-center w-[62px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Vol<span className="text-slate-300 ml-0.5">({unitSystem === "imperial" ? "ft³" : "m³"})</span></span>
                          </th>
                          <th className="px-1 py-2 text-center w-[68px]">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Stack</div>
                            <button
                              onClick={() => {
                                const allStackable = cargoItems.every(i => i.stackable);
                                cargoItems.forEach(i => updateItem(i.id, "stackable", !allStackable));
                              }}
                              className="text-[8px] text-slate-300 hover:text-primary transition-colors"
                              data-testid="button-toggle-all-stackable"
                            >
                              {cargoItems.every(i => i.stackable) ? "all ✓" : "toggle all"}
                            </button>
                          </th>
                          <th className="px-1 py-2 text-center w-[78px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rotation</span>
                          </th>
                          <th className="px-1 py-2 text-center w-[72px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Priority</span>
                          </th>
                          <th className="px-1 py-2 text-center w-[78px]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Pallet</span>
                          </th>
                          <th className="px-1 py-2 text-center w-[30px]">
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cargoItems.map((item, idx) => {
                          const displayWt = toDisplayWeight(item.weight);
                          const totalWt = item.weight * item.quantity;
                          const displayTotalWt = unitSystem === "metric"
                            ? (totalWt * LB_TO_KG).toFixed(1)
                            : totalWt.toFixed(1);
                          const volIn3 = item.length * item.width * item.height * item.quantity;
                          const displayVol = unitSystem === "imperial"
                            ? (volIn3 / 1728).toFixed(2)
                            : (volIn3 * 0.000016387064).toFixed(4);

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
                              <td className="px-1.5 py-1.5">
                                <div className="flex items-center gap-1">
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
                                  <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                  />
                                </div>
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  placeholder={`Cargo ${idx + 1}`}
                                  value={item.name}
                                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                  className="h-7 text-xs min-w-0"
                                  data-testid={`input-cargo-name-${idx}`}
                                />
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplay(item.length)}
                                  onChange={(e) => updateItem(item.id, "length", fromDisplay(e.target.value))}
                                  className="h-7 text-xs text-center px-1"
                                  data-testid={`input-cargo-length-${idx}`}
                                />
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplay(item.width)}
                                  onChange={(e) => updateItem(item.id, "width", fromDisplay(e.target.value))}
                                  className="h-7 text-xs text-center px-1"
                                  data-testid={`input-cargo-width-${idx}`}
                                />
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplay(item.height)}
                                  onChange={(e) => updateItem(item.id, "height", fromDisplay(e.target.value))}
                                  className="h-7 text-xs text-center px-1"
                                  data-testid={`input-cargo-height-${idx}`}
                                />
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number" min={1}
                                  value={item.quantity || ""}
                                  onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                  className="h-7 text-xs text-center px-1"
                                  data-testid={`input-cargo-qty-${idx}`}
                                />
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number" min={0} step="0.1"
                                  value={toDisplayWeight(item.weight)}
                                  onChange={(e) => updateItem(item.id, "weight", fromDisplayWeight(e.target.value))}
                                  className="h-7 text-xs text-center px-1"
                                  data-testid={`input-cargo-weight-${idx}`}
                                />
                              </td>
                              <td className="px-1 py-1.5 text-center">
                                <span className="text-[11px] text-slate-500 font-medium" data-testid={`text-wtotal-${idx}`}>
                                  {item.weight > 0 && item.quantity > 0 ? displayTotalWt : "—"}
                                </span>
                              </td>
                              <td className="px-1 py-1.5 text-center">
                                <span className="text-[11px] text-slate-500 font-medium" data-testid={`text-volume-${idx}`}>
                                  {item.length > 0 && item.width > 0 && item.height > 0 && item.quantity > 0 ? displayVol : "—"}
                                </span>
                              </td>
                              <td className="px-1 py-1.5">
                                <button
                                  onClick={() => setVisualPopup({ type: "stackable", itemId: item.id })}
                                  className={`w-full flex items-center justify-center gap-1 h-7 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                                    item.stackable
                                      ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                      : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                                  }`}
                                  data-testid={`toggle-stackable-yes-${idx}`}
                                  title="Click to change"
                                >
                                  {item.stackable ? "✓ Yes" : "✗ No"}
                                  <Eye className="w-2.5 h-2.5 opacity-50" />
                                </button>
                              </td>
                              <td className="px-1 py-1.5">
                                <button
                                  onClick={() => setVisualPopup({ type: "rotation", itemId: item.id })}
                                  className={`w-full flex items-center justify-center gap-1 h-7 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                                    item.rotationMode === "all"
                                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                                      : item.rotationMode === "horizontal"
                                      ? "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                                      : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                                  }`}
                                  data-testid={`select-rotation-${idx}`}
                                  title="Click to change"
                                >
                                  {item.rotationMode === "all" ? "All" : item.rotationMode === "horizontal" ? "Horiz." : "Fixed"}
                                  <Eye className="w-2.5 h-2.5 opacity-50" />
                                </button>
                              </td>
                              <td className="px-1 py-1.5">
                                <select
                                  value={item.loadPriority}
                                  onChange={(e) => updateItem(item.id, "loadPriority", e.target.value as LoadPriority)}
                                  className="w-full h-7 px-1 text-[10px] font-medium rounded-md border border-slate-200 bg-white hover:border-primary/50 transition-colors cursor-pointer"
                                  data-testid={`select-priority-${idx}`}
                                >
                                  <option value="first">First</option>
                                  <option value="normal">Normal</option>
                                  <option value="last">Last</option>
                                </select>
                              </td>
                              <td className="px-1 py-1.5">
                                <div className="flex rounded-md border border-slate-200 overflow-hidden mb-0.5">
                                  <button
                                    onClick={() => {
                                      updateItem(item.id, "palletized", true);
                                      if (item.palletType === "none") updateItem(item.id, "palletType", "us48x40");
                                    }}
                                    className={`flex-1 px-1 py-1 text-[10px] font-medium transition-colors ${
                                      item.palletized
                                        ? "bg-green-500 text-white"
                                        : "bg-white text-slate-400 hover:bg-slate-50"
                                    }`}
                                    data-testid={`toggle-palletized-yes-${idx}`}
                                  >
                                    Y
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateItem(item.id, "palletized", false);
                                      updateItem(item.id, "palletType", "none");
                                    }}
                                    className={`flex-1 px-1 py-1 text-[10px] font-medium transition-colors ${
                                      !item.palletized
                                        ? "bg-slate-500 text-white"
                                        : "bg-white text-slate-400 hover:bg-slate-50"
                                    }`}
                                    data-testid={`toggle-palletized-no-${idx}`}
                                  >
                                    N
                                  </button>
                                </div>
                                {item.palletized && (
                                  <select
                                    value={item.palletType}
                                    onChange={(e) => updateItem(item.id, "palletType", e.target.value as PalletType)}
                                    className="w-full h-5 px-0.5 text-[9px] font-medium rounded border border-slate-200 bg-white cursor-pointer"
                                    data-testid={`select-pallet-type-${idx}`}
                                  >
                                    <option value="us48x40">US 48×40"</option>
                                    <option value="euro">Euro</option>
                                    <option value="custom">Custom</option>
                                  </select>
                                )}
                              </td>
                              <td className="px-1 py-1.5 text-center">
                                {cargoItems.length > 1 ? (
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                                    data-testid={`button-remove-cargo-${idx}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <div className="w-4" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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

              {multiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                  data-testid="results-section"
                >
                  {multiResult.upgraded && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3" data-testid="notice-upgrade">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-900">
                          Container automatically upgraded
                        </p>
                        <p className="text-blue-800 mt-1">
                          Your cargo didn't fit in a {multiResult.upgradeFrom}. We upgraded to a{" "}
                          <strong>{multiResult.upgradeTo}</strong> to accommodate all items.
                        </p>
                      </div>
                    </div>
                  )}

                  {multiResult.totalContainers > 1 && (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3" data-testid="notice-multi-container">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900">
                          Multiple containers required
                        </p>
                        <p className="text-amber-800 mt-1">
                          Your cargo requires <strong>{multiResult.totalContainers} containers</strong> to
                          fit all {multiResult.totalPiecesAll} pieces.
                          {multiResult.totalPiecesLoaded < multiResult.totalPiecesAll && (
                            <span className="block mt-1 text-red-700 font-medium">
                              {multiResult.totalPiecesAll - multiResult.totalPiecesLoaded} piece(s) still
                              could not be placed.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {multiResult.totalContainers === 1 && !multiResult.upgraded && multiResult.containers[0].result.unplaced.length === 0 && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3" data-testid="notice-all-fit">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm font-semibold text-green-800">
                        All {multiResult.totalPiecesAll} piece(s) fit in 1 × {multiResult.containers[0].container.name}
                      </p>
                    </div>
                  )}

                  {multiResult.containers.map((cr, ci) => {
                    const cResult = cr.result;
                    return (
                      <div key={ci} className="space-y-5" data-testid={`container-result-${ci}`}>
                        {multiResult.totalContainers > 1 && (
                          <div className="flex items-center gap-2 pt-2">
                            <div className="h-px flex-1 bg-slate-200" />
                            <Badge variant="outline" className="text-xs font-bold px-3 py-1 border-primary/30 text-primary">
                              {cr.label}
                            </Badge>
                            <div className="h-px flex-1 bg-slate-200" />
                          </div>
                        )}

                        <Card className="border-slate-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                              <Maximize2 className="w-4 h-4 text-primary" />
                              3D Loading Visualization
                              {multiResult.totalContainers > 1 && (
                                <span className="text-xs font-normal text-slate-500 ml-1">
                                  ({ci + 1} of {multiResult.totalContainers})
                                </span>
                              )}
                            </h2>
                            <p className="text-xs text-slate-500">Click and drag to rotate, scroll to zoom</p>
                          </div>
                          <CardContent className="p-4">
                            <ContainerViewer3D placed={cResult.placed} container={cr.container} />
                          </CardContent>
                        </Card>

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
                                value={`${cResult.totalWeight.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })} lbs`}
                                sub={`of ${cResult.maxPayload.toLocaleString()} lbs`}
                                color="#22c55e"
                              />
                              <StatCard
                                icon={Box}
                                label="Volume Used"
                                value={`${cResult.totalVolume.toFixed(1)} ft³`}
                                sub={`of ${cResult.containerVolume.toFixed(0)} ft³`}
                                color="#8b5cf6"
                              />
                              <StatCard
                                icon={Ruler}
                                label="Floor Area"
                                value={`${cResult.floorArea.toFixed(1)} ft²`}
                                sub={`of ${cResult.containerFloorArea.toFixed(0)} ft²`}
                                color="#f59e0b"
                              />
                            </div>

                            <div className="space-y-3">
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
                          </CardContent>
                        </Card>

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
                              <table className="w-full text-sm" data-testid={`table-loading-details-${ci}`}>
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
                                  {cResult.placed.map((p, i) => (
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
      </main>
      <Footer />
    </div>
  );
}
