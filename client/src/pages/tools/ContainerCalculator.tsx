import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react";
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
  FileUp,
  FileSpreadsheet,
  FileImage,
  Sparkles,
  Table,
  FileDown,
  MousePointerClick,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
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
  customPalletL: number;
  customPalletW: number;
  customPalletH: number;
  rotationMode: RotationMode;
  included: boolean;
  loadPriority: LoadPriority;
}

type BulkApplyScope = "all" | "selected" | "defaults";

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
  stackable: boolean;
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
        stackable: box.stackable,
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

export type SnapshotExportFn = () => { iso: string; top: string; sideA: string; front: string } | null;

function ContainerViewer3D({
  placed,
  container,
  unitSystem,
  onReadyExport,
}: {
  placed: PlacedBox[];
  container: ContainerSpec;
  unitSystem: "imperial" | "metric";
  onReadyExport?: (fn: SnapshotExportFn) => void;
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
    renderer.shadowMap.type = THREE.PCFShadowMap;
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

    const gridSize = Math.max(cL, cW) * 2;
    const gridDivisions = 120;
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0xcbd5e1, 0xe2e8f0);
    grid.position.set(cL / 2, -0.01, cW / 2);
    if (Array.isArray(grid.material)) {
      grid.material.forEach((m) => {
        (m as THREE.LineBasicMaterial).transparent = true;
        (m as THREE.LineBasicMaterial).opacity = 0.25;
      });
    } else {
      (grid.material as THREE.LineBasicMaterial).transparent = true;
      (grid.material as THREE.LineBasicMaterial).opacity = 0.25;
    }
    scene.add(grid);

    const containerEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(cL, cH, cW));
    const containerWire = new THREE.LineSegments(
      containerEdges,
      new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 })
    );
    containerWire.position.set(cL / 2, cH / 2, cW / 2);
    scene.add(containerWire);

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

    const doorLineMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
    const doorX = cL;
    const doorInset = 0.005;
    const doorFramePts = [
      new THREE.Vector3(doorX + doorInset, 0, 0),
      new THREE.Vector3(doorX + doorInset, cH, 0),
      new THREE.Vector3(doorX + doorInset, cH, cW),
      new THREE.Vector3(doorX + doorInset, 0, cW),
      new THREE.Vector3(doorX + doorInset, 0, 0),
    ];
    const doorFrameGeo = new THREE.BufferGeometry().setFromPoints(doorFramePts);
    scene.add(new THREE.Line(doorFrameGeo, doorLineMat));
    const doorCenterPts = [
      new THREE.Vector3(doorX + doorInset, 0, cW / 2),
      new THREE.Vector3(doorX + doorInset, cH, cW / 2),
    ];
    const doorCenterGeo = new THREE.BufferGeometry().setFromPoints(doorCenterPts);
    const doorDashedMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: cH * 0.04, gapSize: cH * 0.02 });
    const doorCenterLine = new THREE.Line(doorCenterGeo, doorDashedMat);
    doorCenterLine.computeLineDistances();
    scene.add(doorCenterLine);

    const cargoMeshes: THREE.Mesh[] = [];
    const runningPiece: Record<string, number> = {};
    for (let idx = 0; idx < placed.length; idx++) {
      const box = placed[idx];
      const bL = inToM(box.l);
      const bW = inToM(box.w);
      const bH = inToM(box.h);
      const bX = inToM(box.x);
      const bY = inToM(box.y);
      const bZ = inToM(box.z);

      const boxGeo = new THREE.BoxGeometry(bL * 0.98, bH * 0.98, bW * 0.98);
      const baseColor = new THREE.Color(box.color);
      const boxMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.4,
        metalness: 0.1,
      });

      runningPiece[box.cargoId] = (runningPiece[box.cargoId] || 0) + 1;
      const pieceNo = runningPiece[box.cargoId];
      const dimF = unitSystem === "metric" ? IN_TO_CM : 1;
      const wtF = unitSystem === "metric" ? LB_TO_KG : 1;
      const dimU = unitSystem === "metric" ? "cm" : "in";
      const wtU = unitSystem === "metric" ? "kg" : "lb";

      const labelCanvas = document.createElement("canvas");
      const labelSize = 256;
      labelCanvas.width = labelSize;
      labelCanvas.height = labelSize;
      const lctx = labelCanvas.getContext("2d")!;

      const r = parseInt(box.color.slice(1, 3), 16);
      const g = parseInt(box.color.slice(3, 5), 16);
      const b = parseInt(box.color.slice(5, 7), 16);
      lctx.fillStyle = `rgba(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)}, 1)`;
      lctx.fillRect(0, 0, labelSize, labelSize);

      lctx.fillStyle = "rgba(255,255,255,0.75)";
      lctx.beginPath();
      lctx.roundRect(12, 12, labelSize - 24, labelSize - 24, 10);
      lctx.fill();

      lctx.fillStyle = "#0f172a";
      lctx.font = "bold 28px Inter, sans-serif";
      lctx.textAlign = "center";
      const itemName = (box.cargoName || "Box").length > 14
        ? (box.cargoName || "Box").slice(0, 13) + "…"
        : (box.cargoName || "Box");
      lctx.fillText(`${itemName} #${pieceNo}`, labelSize / 2, 70);

      lctx.fillStyle = "#334155";
      lctx.font = "22px Inter, sans-serif";
      lctx.fillText(`${(box.l * dimF).toFixed(0)}×${(box.w * dimF).toFixed(0)}×${(box.h * dimF).toFixed(0)} ${dimU}`, labelSize / 2, 115);

      lctx.font = "20px Inter, sans-serif";
      lctx.fillStyle = "#475569";
      lctx.fillText(`${(box.weight * wtF).toFixed(0)} ${wtU}`, labelSize / 2, 155);

      lctx.font = "18px Inter, sans-serif";
      lctx.fillStyle = "#64748b";
      lctx.fillText(box.stackable ? "Stackable" : "No stack", labelSize / 2, 190);

      const labelTex = new THREE.CanvasTexture(labelCanvas);
      labelTex.needsUpdate = true;
      const topMat = new THREE.MeshStandardMaterial({
        map: labelTex,
        roughness: 0.5,
        metalness: 0.05,
      });

      const materials = [
        boxMat, boxMat,
        topMat, boxMat,
        boxMat, boxMat,
      ];

      const boxMesh = new THREE.Mesh(boxGeo, materials);
      boxMesh.position.set(bX + bL / 2, bY + bH / 2, bZ + bW / 2);
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      boxMesh.userData = { placedIndex: idx, l: bL, w: bW, h: bH, origL: box.l, origW: box.w };
      scene.add(boxMesh);
      cargoMeshes.push(boxMesh);

      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(bL, bH, bW));
      const edgeMat = new THREE.LineBasicMaterial({
        color: baseColor.clone().multiplyScalar(0.6),
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(boxMesh.position);
      edges.userData = { linkedTo: idx };
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

    const fmtLabel = (inches: number) =>
      unitSystem === "metric"
        ? `${(inches * 2.54).toFixed(0)} cm`
        : `${inches.toFixed(1)}"`;

    addAxisLabel(
      fmtLabel(container.lengthIn),
      new THREE.Vector3(cL / 2, -0.15, -0.2)
    );
    addAxisLabel(
      fmtLabel(container.widthIn),
      new THREE.Vector3(-0.3, -0.15, cW / 2)
    );
    addAxisLabel(
      fmtLabel(container.heightIn),
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

    if (onReadyExport) {
      const exportSnapshots: SnapshotExportFn = () => {
        const s = sceneRef.current;
        if (!s) return null;
        const { renderer: r, scene: sc, camera: cam, controls: ctrl } = s;

        const savedPos = cam.position.clone();
        const savedTarget = ctrl.target.clone();

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
        const sideA = capture(cL * 2.5, cH * 0.8, centerZ);
        const front = capture(centerX, cH * 0.8, cW * 3);

        cam.position.copy(savedPos);
        ctrl.target.copy(savedTarget);
        cam.lookAt(savedTarget.x, savedTarget.y, savedTarget.z);
        cam.updateProjectionMatrix();
        ctrl.update();
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
  }, [placed, container, unitSystem]);

  const fmt = (inches: number) => {
    if (unitSystem === "metric") return `${(inches * IN_TO_CM).toFixed(1)} cm`;
    return `${inches.toFixed(1)} in`;
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5">L: <span className="font-semibold">{fmt(container.lengthIn)}</span></span>
          <span className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5">W: <span className="font-semibold">{fmt(container.widthIn)}</span></span>
          <span className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5">H: <span className="font-semibold">{fmt(container.heightIn)}</span></span>
        </div>
      </div>
      {webglError ? (
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
      ) : (
        <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50" data-testid="container-3d-viewer">
          <div ref={mountRef} className="absolute inset-0" />
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

export default function ContainerCalculator() {
  usePageMeta({
    title: "Container Loading Calculator | 3D Load Planner | AccessToNorth.com",
    description:
      "Free 3D container loading calculator. Plan optimal cargo placement in 20', 40', 40' HC, and 45' HC shipping containers. Visualize your load plan instantly.",
    canonical: "https://www.accesstonorth.com/tools/container-calculator",
  });

  const { toast } = useToast();
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [suggestedContainerId, setSuggestedContainerId] = useState<string | null>(null);
  const [pendingRecalc, setPendingRecalc] = useState(false);
  const [containerId, setContainerId] = useState("20dc");
  const [customContainer, setCustomContainer] = useState({
    lengthIn: 232.2,
    widthIn: 92.6,
    heightIn: 94.2,
    maxPayloadLbs: 62170,
  });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDefaults, setBulkDefaults] = useState({
    stackable: true,
    rotationMode: "all" as RotationMode,
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
  const [snapshotExportFn, setSnapshotExportFn] = useState<SnapshotExportFn | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importUnits, setImportUnits] = useState<"imperial" | "metric">("imperial");
  const [importItems, setImportItems] = useState<Array<{ name: string; length: number; width: number; height: number; weight: number; quantity: number; stackable?: boolean; rotationMode?: RotationMode; loadPriority?: LoadPriority; palletized?: boolean; include: boolean }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importRawHeaders, setImportRawHeaders] = useState<string[]>([]);
  const [importRawRows, setImportRawRows] = useState<Record<string, string>[]>([]);
  const [importColMap, setImportColMap] = useState<Record<string, string>>({ name: "", length: "", width: "", height: "", weight: "", quantity: "", stackable: "", rotation: "", priority: "", palletized: "" });

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
  }, []);

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

  const openImportModal = useCallback(() => {
    setImportStep("upload");
    setImportLoading(false);
    setImportError(null);
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
    const items = importRawRows
      .map((r) => ({
        name: nKey ? String(r[nKey] || "").substring(0, 100) : "",
        length: Math.max(0, parseFloat(lKey ? r[lKey] : "") || 0),
        width: Math.max(0, parseFloat(wKey ? r[wKey] : "") || 0),
        height: Math.max(0, parseFloat(hKey ? r[hKey] : "") || 0),
        weight: Math.max(0, parseFloat(wtKey ? r[wtKey] : "") || 0),
        quantity: Math.max(1, Math.round(parseFloat(qKey ? r[qKey] : "") || 1)),
        stackable: sKey ? parseStackable(r[sKey] || "") : undefined,
        rotationMode: rKey ? parseRotation(r[rKey] || "") : undefined,
        loadPriority: pKey ? parsePriority(r[pKey] || "") : undefined,
        palletized: plKey ? parseStackable(r[plKey] || "") : undefined,
        include: true,
      }))
      .filter((i) => i.length > 0 || i.width > 0 || i.height > 0);
    if (items.length === 0) {
      setImportError("No valid dimensional data found with the selected column mapping.");
      return;
    }
    setImportError(null);
    setImportItems(items);
    setImportStep("preview");
  }, [importColMap, importRawRows]);

  const handleImportFile = useCallback(async (file: File) => {
    setImportError(null);
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

      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (isImage || isPdf) {
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
        setImportItems(data.items.map((i: any) => ({ ...i, include: true })));
        setImportStep("preview");
        setImportLoading(false);
        return;
      }

      setImportError("Unsupported file type. Please upload a CSV, Excel, PDF, or image (JPG/PNG).");
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
    const toAdd = importItems.filter((i) => i.include && (i.length > 0 || i.width > 0 || i.height > 0));
    if (toAdd.length === 0) return;
    const isImportMetric = importUnits === "metric";
    const startIdx = cargoItems.length;
    const newItems: CargoItem[] = toAdd.map((item, idx) => ({
      id: generateId(),
      name: item.name,
      length: isImportMetric ? item.length * CM_TO_IN : item.length,
      width: isImportMetric ? item.width * CM_TO_IN : item.width,
      height: isImportMetric ? item.height * CM_TO_IN : item.height,
      weight: isImportMetric ? item.weight * KG_TO_LB : item.weight,
      quantity: item.quantity,
      color: CARGO_COLORS[(startIdx + idx) % CARGO_COLORS.length],
      stackable: item.stackable !== undefined ? item.stackable : bulkDefaults.stackable,
      palletized: item.palletized !== undefined ? item.palletized : bulkDefaults.palletized,
      palletType: bulkDefaults.palletType,
      customPalletL: bulkDefaults.customPalletL,
      customPalletW: bulkDefaults.customPalletW,
      customPalletH: bulkDefaults.customPalletH,
      rotationMode: item.rotationMode !== undefined ? item.rotationMode : bulkDefaults.rotationMode,
      included: true,
      loadPriority: item.loadPriority !== undefined ? item.loadPriority : bulkDefaults.loadPriority,
    }));
    setCargoItems((prev) => [...prev, ...newItems]);
    setShowImportModal(false);
    toast({
      title: `${newItems.length} item${newItems.length > 1 ? "s" : ""} imported`,
      description: "Items have been added to your packing list.",
    });
  }, [importItems, importUnits, cargoItems.length, bulkDefaults, toast]);

  const downloadSampleCSV = useCallback(() => {
    const csvContent = `Name,Length,Width,Height,Weight,Quantity,Stackable,Rotation,Priority,Palletized\nCardboard Box A,24,18,12,15,10,yes,all,normal,no\nPallet Load B,48,40,36,250,4,no,fixed,first,yes\nSmall Carton C,12,10,8,5,25,yes,horizontal,last,no`;
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
        const totalPiecesAll = validItems.reduce((s, i) => s + i.quantity, 0);

        const useContainer = container;

        const res = packBoxes(validItems, useContainer);

        if (containerId !== "custom" && res.unplaced.length > 0) {
          const currentIdx = CONTAINER_PRESETS.findIndex((c) => c.id === containerId);
          const nextPreset = currentIdx >= 0 && currentIdx < CONTAINER_PRESETS.length - 1
            ? CONTAINER_PRESETS[currentIdx + 1]
            : null;
          setSuggestedContainerId(nextPreset ? nextPreset.id : null);
        } else {
          setSuggestedContainerId(null);
        }

        if (res.unplaced.length === 0) {
          setMultiResult({
            containers: [{ container: useContainer, result: res, label: `1 × ${useContainer.name}` }],
            totalContainers: 1,
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
  }, [selectedIds]);

  const handleReset = useCallback(() => {
    setMultiResult(null);
    setCargoItems([defaultCargoItem(0), defaultCargoItem(1)]);
    setSelectedIds(new Set());
  }, [defaultCargoItem]);

  const handleExportPDF = useCallback(async () => {
    if (!multiResult || multiResult.containers.length === 0) return;
    toast({ title: "Generating PDF...", description: "Please wait while we create your report." });
    try {
      const { generatePackingReportBlob, buildCargoSummaryRows } = await import(
        "./container-pdf/ContainerPackingReportPDF"
      );

      let images = { iso: "", top: "", sideA: "", front: "" };
      if (snapshotExportFn) {
        const snaps = snapshotExportFn();
        if (snaps) images = snaps;
      }

      const cr = multiResult.containers[0];
      const cargoRows = buildCargoSummaryRows(cargoItems);

      const blob = await generatePackingReportBlob({
        containerSpec: cr.container,
        cargoRows,
        result: cr.result,
        totalContainers: multiResult.totalContainers,
        unitSystem,
        images,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AccessToNorth_PackingReport_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "PDF Downloaded", description: "Your packing report has been saved." });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: "PDF Export Failed", description: "Could not generate the report.", variant: "destructive" });
    }
  }, [multiResult, unitSystem, cargoItems, snapshotExportFn, toast]);

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

          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-5">
              <Card className="border-slate-200">
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
                            setContainerId(ct.id);
                            setMultiResult(null);
                          }}
                          className={`text-left p-2.5 rounded-lg border text-sm transition-all ${
                            containerId === ct.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          data-testid={`button-container-${ct.id}`}
                        >
                          <span className="font-semibold text-slate-900 block leading-tight text-xs">
                            {ct.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{dimsDisplay}</span>
                          <span className="text-[10px] text-slate-500 block">{volDisplay}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        setContainerId("custom");
                        setMultiResult(null);
                      }}
                      className={`text-left p-2.5 rounded-lg border text-sm transition-all col-span-2 ${
                        containerId === "custom"
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

                  {containerId === "custom" && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
                      <div className="grid grid-cols-4 gap-1.5">
                        <div>
                          <Label className="text-[10px] text-slate-500">L ({dimUnit})</Label>
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
                            onChange={(e) =>
                              setCustomContainer((p) => ({
                                ...p,
                                widthIn: fromDisplay(e.target.value),
                              }))
                            }
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
                            onChange={(e) =>
                              setCustomContainer((p) => ({
                                ...p,
                                heightIn: fromDisplay(e.target.value),
                              }))
                            }
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
                            onChange={(e) =>
                              setCustomContainer((p) => ({
                                ...p,
                                maxPayloadLbs: fromDisplayWeight(e.target.value),
                              }))
                            }
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
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Box className="w-4 h-4 text-primary" />
                      Packing List
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
                                              className="w-full h-7 px-2 text-xs rounded border border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                                              data-testid="popup-pallet-custom-w"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-slate-400 uppercase">Height</label>
                                            <input
                                              type="number"
                                              placeholder="H"
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
                                  accept=".csv,.tsv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.webp"
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
                                      CSV spreadsheets are parsed instantly. Images and PDFs are read by AI.
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
                                  Use headers like: Name, Length, Width, Height, Weight, Quantity, Stackable, Rotation, Priority, Palletized
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
                                        <th className="px-2 py-1.5 text-right font-semibold">Weight</th>
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
                                        <td className="px-2 py-1.5 text-right">15</td>
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
                                        <td className="px-2 py-1.5 text-right">250</td>
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
                                  const labels: Record<string, string> = { name: "Item Name", length: "Length", width: "Width", height: "Height", weight: "Weight", quantity: "Quantity", stackable: "Stackable", rotation: "Rotation", priority: "Priority", palletized: "Palletized" };
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
                                <Button variant="outline" onClick={() => { setImportStep("upload"); setImportError(null); }} className="gap-1.5" data-testid="button-mapping-back">
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
                                      <th className="px-2 py-2 text-right font-semibold">Wt</th>
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
                                  Import {importItems.filter((i) => i.include).length} Item{importItems.filter((i) => i.include).length !== 1 ? "s" : ""}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => { setImportStep("upload"); setImportItems([]); setImportError(null); }}
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
                          <th className="px-0.5 py-2 text-left" style={{ width: 28 }}>
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
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{weightUnit}</span>
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
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                  />
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
                  className="space-y-5"
                  data-testid="results-section"
                >
                  {suggestedContainerId && multiResult.totalPiecesLoaded < multiResult.totalPiecesAll && (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3" data-testid="notice-does-not-fit">
                      <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                      <div className="text-sm flex-1">
                        <p className="font-semibold text-amber-900">Some cargo does not fit in the selected container</p>
                        <p className="text-amber-800 mt-1">
                          We kept your selected container type. You can try a larger container to see if it reduces leftovers or number of containers.
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid="button-try-larger-container"
                            onClick={() => {
                              const next = CONTAINER_PRESETS.find((c) => c.id === suggestedContainerId);
                              if (!next) return;
                              setContainerId(next.id);
                              setSuggestedContainerId(null);
                              setPendingRecalc(true);
                            }}
                          >
                            Try {CONTAINER_PRESETS.find((c) => c.id === suggestedContainerId)?.name ?? "larger container"}
                          </Button>
                        </div>
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

                  {multiResult.totalContainers === 1 && multiResult.containers[0].result.unplaced.length === 0 && (
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
                            <div className="flex items-center gap-2">
                              {ci === 0 && (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExportPDF} data-testid="button-export-pdf">
                                  <FileDown className="w-3.5 h-3.5" />
                                  PDF Report
                                </Button>
                              )}
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div ref={ci === 0 ? viewerRef : undefined}>
                              <ContainerViewer3D
                                placed={cResult.placed}
                                container={cr.container}
                                unitSystem={unitSystem}
                                onReadyExport={ci === 0 ? (fn) => setSnapshotExportFn(() => fn) : undefined}
                              />
                            </div>
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
                                label="Floor Area"
                                value={`${(isMetric ? cResult.floorArea * 0.092903 : cResult.floorArea).toFixed(1)} ${isMetric ? "m²" : "ft²"}`}
                                sub={`of ${(isMetric ? cResult.containerFloorArea * 0.092903 : cResult.containerFloorArea).toFixed(isMetric ? 1 : 0)} ${isMetric ? "m²" : "ft²"}`}
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
