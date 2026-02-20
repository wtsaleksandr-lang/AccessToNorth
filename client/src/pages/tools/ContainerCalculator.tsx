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
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CONTAINER_TYPES = [
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
}

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

function packBoxes(
  items: CargoItem[],
  container: (typeof CONTAINER_TYPES)[0],
  unitSystem: "imperial" | "metric"
): LoadingResult {
  const cL = container.lengthIn;
  const cW = container.widthIn;
  const cH = container.heightIn;
  const maxPay = container.maxPayloadLbs;

  const toInches = unitSystem === "metric" ? 0.393701 : 1;
  const toLbs = unitSystem === "metric" ? 2.20462 : 1;

  const allBoxes: {
    cargoId: string;
    name: string;
    color: string;
    dims: [number, number, number];
    weight: number;
    stackable: boolean;
  }[] = [];

  for (const item of items) {
    for (let q = 0; q < item.quantity; q++) {
      allBoxes.push({
        cargoId: item.id,
        name: item.name || `Item ${items.indexOf(item) + 1}`,
        color: item.color,
        dims: [
          item.length * toInches,
          item.width * toInches,
          item.height * toInches,
        ],
        weight: item.weight * toLbs,
        stackable: item.stackable,
      });
    }
  }

  allBoxes.sort((a, b) => {
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
    const rotations: [number, number, number, string][] = [
      [bl, bw, bh, "LWH"],
      [bl, bh, bw, "LHW"],
      [bw, bl, bh, "WLH"],
      [bw, bh, bl, "WHL"],
      [bh, bl, bw, "HLW"],
      [bh, bw, bl, "HWL"],
    ];

    let bestFit: { spaceIdx: number; rotation: [number, number, number, string] } | null = null;
    let bestWaste = Infinity;

    for (let si = 0; si < spaces.length; si++) {
      const sp = spaces[si];
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
    piecesTotal: allBoxes.length,
  };
}

function ContainerViewer3D({
  placed,
  container,
}: {
  placed: PlacedBox[];
  container: (typeof CONTAINER_TYPES)[0];
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
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([
    {
      id: generateId(),
      name: "",
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      quantity: 1,
      color: CARGO_COLORS[0],
      stackable: true,
    },
  ]);
  const [result, setResult] = useState<LoadingResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");

  const container = CONTAINER_TYPES.find((c) => c.id === containerId)!;
  const dimUnit = unitSystem === "imperial" ? "in" : "cm";
  const weightUnit = unitSystem === "imperial" ? "lbs" : "kg";

  const addItem = useCallback(() => {
    const colorIdx = cargoItems.length % CARGO_COLORS.length;
    setCargoItems((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        quantity: 1,
        color: CARGO_COLORS[colorIdx],
        stackable: true,
      },
    ]);
  }, [cargoItems.length]);

  const removeItem = useCallback((id: string) => {
    setCargoItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, field: keyof CargoItem, value: any) => {
    setCargoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  const handleCalculate = useCallback(() => {
    const validItems = cargoItems.filter(
      (i) => i.length > 0 && i.width > 0 && i.height > 0 && i.quantity > 0
    );
    if (validItems.length === 0) {
      toast({
        title: "No cargo entered",
        description: "Please enter at least one cargo item with valid dimensions.",
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    setTimeout(() => {
      const res = packBoxes(validItems, container, unitSystem);
      setResult(res);
      setCalculating(false);

      if (res.unplaced.length > 0) {
        toast({
          title: "Some items didn't fit",
          description: `${res.unplaced.reduce((s, u) => s + u.qty, 0)} piece(s) could not fit in the container.`,
        });
      }
    }, 500);
  }, [cargoItems, container, unitSystem, toast]);

  const handleReset = useCallback(() => {
    setResult(null);
    setCargoItems([
      {
        id: generateId(),
        name: "",
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        quantity: 1,
        color: CARGO_COLORS[0],
        stackable: true,
      },
    ]);
  }, []);

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
                    {CONTAINER_TYPES.map((ct) => (
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
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Internal Dimensions
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{container.lengthIn}"</p>
                        <p className="text-slate-500">Length</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{container.widthIn}"</p>
                        <p className="text-slate-500">Width</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{container.heightIn}"</p>
                        <p className="text-slate-500">Height</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">
                          {container.maxPayloadLbs.toLocaleString()} lbs
                        </p>
                        <p className="text-slate-500">Max Payload</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
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
                        onClick={() => setUnitSystem("imperial")}
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
                        onClick={() => setUnitSystem("metric")}
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

                  <div className="space-y-3">
                    {cargoItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-xl p-4 relative group"
                        data-testid={`cargo-item-${idx}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-4 h-4 rounded-full mt-2 shrink-0 border border-white ring-1 ring-slate-200"
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
                                value={item.weight || ""}
                                onChange={(e) =>
                                  updateItem(item.id, "weight", parseFloat(e.target.value) || 0)
                                }
                                className="h-9 text-sm"
                                data-testid={`input-cargo-weight-${idx}`}
                              />
                            </div>
                          </div>
                          {cargoItems.length > 1 && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors mt-1"
                              data-testid={`button-remove-cargo-${idx}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-3 ml-7 grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-slate-500">Length ({dimUnit})</Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.1"
                              value={item.length || ""}
                              onChange={(e) =>
                                updateItem(item.id, "length", parseFloat(e.target.value) || 0)
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
                              value={item.width || ""}
                              onChange={(e) =>
                                updateItem(item.id, "width", parseFloat(e.target.value) || 0)
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
                              value={item.height || ""}
                              onChange={(e) =>
                                updateItem(item.id, "height", parseFloat(e.target.value) || 0)
                              }
                              className="h-9 text-sm"
                              data-testid={`input-cargo-height-${idx}`}
                            />
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
                              <th className="text-left py-2 pr-3 text-xs font-semibold text-slate-500 uppercase">
                                #
                              </th>
                              <th className="text-left py-2 pr-3 text-xs font-semibold text-slate-500 uppercase">
                                Item
                              </th>
                              <th className="text-right py-2 pr-3 text-xs font-semibold text-slate-500 uppercase">
                                L × W × H (in)
                              </th>
                              <th className="text-right py-2 pr-3 text-xs font-semibold text-slate-500 uppercase">
                                Weight (lbs)
                              </th>
                              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">
                                Volume (ft³)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.placed.map((p, i) => (
                              <tr key={i} className="border-b border-slate-100 last:border-0">
                                <td className="py-2 pr-3">
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ backgroundColor: p.color }}
                                  >
                                    {i + 1}
                                  </div>
                                </td>
                                <td className="py-2 pr-3 font-medium text-slate-900">
                                  {p.cargoName}
                                </td>
                                <td className="py-2 pr-3 text-right text-slate-600">
                                  {p.l.toFixed(1)} × {p.w.toFixed(1)} × {p.h.toFixed(1)}
                                </td>
                                <td className="py-2 pr-3 text-right text-slate-600">
                                  {p.weight.toFixed(1)}
                                </td>
                                <td className="py-2 text-right text-slate-600">
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
