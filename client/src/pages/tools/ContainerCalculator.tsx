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
  Undo2,
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
import { validateManualLayout, validateManualPlacement } from "@/lib/containerLayout";

const IN_TO_CM = 2.54;
const CM_TO_IN = 1 / IN_TO_CM;
const LB_TO_KG = 0.453592;
const KG_TO_LB = 1 / LB_TO_KG;

type BulkApplyScope = "all" | "selected" | "defaults";

const CARGO_COLORS = [
  "#0f766e", "#2563eb", "#b45309", "#7c3aed", "#be123c",
  "#0e7490", "#475569", "#c2410c", "#047857", "#6d28d9",
  "#1d4ed8", "#15803d", "#9f1239", "#0369a1", "#a21caf",
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function inToM(inches: number) {
  return inches * 0.0254;
}

export type SnapshotExportFn = () => { iso: string; top: string; sideA: string; front: string } | null;

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
                  fillOpacity="0.86"
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

function ContainerViewer3D({
  placed,
  container,
  unitSystem,
  onReadyExport,
  onPlacedChange,
}: {
  placed: PlacedBox[];
  container: ContainerSpec;
  unitSystem: "imperial" | "metric";
  onReadyExport?: (fn: SnapshotExportFn | null) => void;
  onPlacedChange?: (nextPlaced: PlacedBox[]) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const [rendererAttempt, setRendererAttempt] = useState(0);
  const [arrangeMode, setArrangeMode] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [placementMessage, setPlacementMessage] = useState("Select a cargo item and drag it to a new position.");
  const arrangementHistoryRef = useRef<PlacedBox[][]>([]);
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
    render: () => void;
  } | null>(null);

  const layoutIdentity = useMemo(
    () => `${container.id}:${placed.map((box) => `${box.cargoId}:${box.l}:${box.w}:${box.h}`).join("|")}`,
    [container.id, placed],
  );

  useEffect(() => {
    if (optimizedLayoutIdentityRef.current === layoutIdentity) return;
    optimizedLayoutIdentityRef.current = layoutIdentity;
    optimizedLayoutRef.current = placed.map((box) => ({ ...box }));
    arrangementHistoryRef.current = [];
    setHistoryCount(0);
  }, [layoutIdentity, placed]);

  const undoArrangement = useCallback(() => {
    const previous = arrangementHistoryRef.current.pop();
    if (!previous) return;
    setHistoryCount(arrangementHistoryRef.current.length);
    setPlacementMessage("Previous cargo position restored.");
    const currentColors = new Map(placed.map((box) => [box.cargoId, box.color]));
    onPlacedChange?.(previous.map((box) => ({
      ...box,
      color: currentColors.get(box.cargoId) ?? box.color,
    })));
  }, [onPlacedChange, placed]);

  const resetArrangement = useCallback(() => {
    arrangementHistoryRef.current = [];
    setHistoryCount(0);
    setPlacementMessage("The optimized loading plan has been restored.");
    const currentColors = new Map(placed.map((box) => [box.cargoId, box.color]));
    onPlacedChange?.(optimizedLayoutRef.current.map((box) => ({
      ...box,
      color: currentColors.get(box.cargoId) ?? box.color,
    })));
  }, [onPlacedChange, placed]);

  useEffect(() => {
    if (!mountRef.current || webglError) return;

    const el = mountRef.current;
    const w = Math.max(el.clientWidth, 320);
    const h = Math.max(el.clientHeight, 300);
    const compactViewport = window.matchMedia("(max-width: 767px)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !compactViewport,
        alpha: true,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      onReadyExport?.(null);
      setWebglError(true);
      return;
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactViewport ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onReadyExport?.(null);
      setWebglError(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);

    const cL = inToM(container.lengthIn);
    const cW = inToM(container.widthIn);
    const cH = inToM(container.heightIn);

    camera.position.set(cL * 1.4, cH * 1.65, cW * 2.35);
    camera.lookAt(cL / 2, cH * 0.38, cW / 2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.target.set(cL / 2, cH * 0.38, cW / 2);
    controls.minDistance = 1;
    controls.maxDistance = 30;
    if (cameraViewRef.current?.containerId === container.id) {
      camera.position.fromArray(cameraViewRef.current.position);
      controls.target.fromArray(cameraViewRef.current.target);
    }
    controls.update();

    scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x1e293b, 1.15));
    scene.add(new THREE.AmbientLight(0xffffff, 0.34));

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.05);
    dirLight.position.set(cL, cH * 2, cW * 1.5);
    dirLight.castShadow = true;
    const shadowMapSize = compactViewport ? 512 : 1024;
    dirLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = Math.max(cL, cW) * 5;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.72);
    fillLight.position.set(-cL, cH, -cW);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.38);
    rimLight.position.set(cL * 0.2, cH * 1.4, cW * 2.2);
    scene.add(rimLight);

    const gridSize = Math.max(cL, cW) * 2.25;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(gridSize, gridSize),
      new THREE.MeshStandardMaterial({ color: 0xe7ebf0, roughness: 0.98, metalness: 0.01 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cL / 2, -0.035, cW / 2);
    ground.receiveShadow = true;
    scene.add(ground);

    const gridDivisions = 48;
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0xcbd5e1, 0xdce3ea);
    grid.position.set(cL / 2, -0.02, cW / 2);
    if (Array.isArray(grid.material)) {
      grid.material.forEach((m) => {
        (m as THREE.LineBasicMaterial).transparent = true;
        (m as THREE.LineBasicMaterial).opacity = 0.11;
      });
    } else {
      (grid.material as THREE.LineBasicMaterial).transparent = true;
      (grid.material as THREE.LineBasicMaterial).opacity = 0.11;
    }
    scene.add(grid);

    const containerEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(cL, cH, cW));
    const containerWire = new THREE.LineSegments(
      containerEdges,
      new THREE.LineBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.5 })
    );
    containerWire.position.set(cL / 2, cH / 2, cW / 2);
    scene.add(containerWire);

    const structureMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.34,
      metalness: 0.7,
    });
    const addStructure = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
      const beam = new THREE.Mesh(geometry, structureMat);
      beam.position.set(x, y, z);
      beam.castShadow = true;
      scene.add(beam);
    };
    const rail = Math.max(0.032, Math.min(cH, cW) * 0.018);
    for (const x of [0, cL]) {
      for (const z of [0, cW]) {
        addStructure(new THREE.BoxGeometry(rail, cH, rail), x, cH / 2, z);
      }
    }
    for (const y of [0, cH]) {
      for (const z of [0, cW]) {
        addStructure(new THREE.BoxGeometry(cL, rail, rail), cL / 2, y, z);
      }
      for (const x of [0, cL]) {
        addStructure(new THREE.BoxGeometry(rail, rail, cW), x, y, cW / 2);
      }
    }

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(cL, 0.035, cW),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.86, metalness: 0.16 }),
    );
    floor.position.set(cL / 2, -0.015, cW / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.075,
      roughness: 0.42,
      metalness: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
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

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(cL, cW), wallMat.clone());
    (ceiling.material as THREE.MeshStandardMaterial).opacity = 0.045;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(cL / 2, cH, cW / 2);
    scene.add(ceiling);

    const doorX = cL;
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      transparent: true,
      opacity: 0.18,
      roughness: 0.42,
      metalness: 0.48,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (const z of [cW * 0.25, cW * 0.75]) {
      const doorPanel = new THREE.Mesh(new THREE.PlaneGeometry(cW * 0.49, cH * 0.98), doorMat);
      doorPanel.rotation.y = Math.PI / 2;
      doorPanel.position.set(doorX + 0.006, cH / 2, z);
      scene.add(doorPanel);
    }

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.74 });
    const hardwareMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.18, metalness: 0.92 });
    const addDoorFrame = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(geometry, frameMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      scene.add(mesh);
    };
    addDoorFrame(new THREE.BoxGeometry(0.045, cH, 0.035), doorX + 0.025, cH / 2, 0);
    addDoorFrame(new THREE.BoxGeometry(0.045, cH, 0.035), doorX + 0.025, cH / 2, cW / 2);
    addDoorFrame(new THREE.BoxGeometry(0.045, cH, 0.035), doorX + 0.025, cH / 2, cW);
    addDoorFrame(new THREE.BoxGeometry(0.045, 0.04, cW), doorX + 0.025, 0, cW / 2);
    addDoorFrame(new THREE.BoxGeometry(0.045, 0.04, cW), doorX + 0.025, cH, cW / 2);

    const rodGeometry = new THREE.CylinderGeometry(0.012, 0.012, cH * 0.78, 8);
    for (const z of [cW * 0.28, cW * 0.72]) {
      const rod = new THREE.Mesh(rodGeometry, hardwareMat);
      rod.position.set(doorX + 0.052, cH * 0.52, z);
      rod.castShadow = true;
      scene.add(rod);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, cW * 0.12), hardwareMat);
      handle.position.set(doorX + 0.07, cH * 0.42, z);
      handle.castShadow = true;
      scene.add(handle);
    }

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

      runningPiece[box.cargoId] = (runningPiece[box.cargoId] || 0) + 1;
      const pieceNo = runningPiece[box.cargoId];
      const dimF = unitSystem === "metric" ? IN_TO_CM : 1;
      const wtF = unitSystem === "metric" ? LB_TO_KG : 1;
      const dimU = unitSystem === "metric" ? "cm" : "in";
      const wtU = unitSystem === "metric" ? "kg" : "lb";

      const itemName = (box.cargoName || "Box").length > 16
        ? (box.cargoName || "Box").slice(0, 15) + "…"
        : (box.cargoName || "Box");
      const line1 = `${itemName} #${pieceNo}`;
      const line2 = `${(box.l * dimF).toFixed(0)}×${(box.w * dimF).toFixed(0)}×${(box.h * dimF).toFixed(0)} ${dimU}`;
      const line3 = `${(box.weight * wtF).toFixed(0)} ${wtU}`;

      const makeFaceLabel = (faceW: number, faceH: number): THREE.CanvasTexture => {
        const cw = 256;
        const ch = Math.round(256 * (faceH / faceW)) || 256;
        const c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        const ctx = c.getContext("2d")!;

        const gradient = ctx.createLinearGradient(0, 0, cw, ch);
        gradient.addColorStop(0, baseColor.clone().offsetHSL(0, -0.01, 0.075).getStyle());
        gradient.addColorStop(1, baseColor.clone().offsetHSL(0, -0.02, -0.055).getStyle());
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cw, ch);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, cw - 8, ch - 8);

        const fontSize = Math.max(16, Math.min(28, Math.round(ch * 0.18)));
        const subSize = Math.max(12, Math.round(fontSize * 0.72));
        const cy = ch / 2;
        ctx.textAlign = "center";

        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
        ctx.fillText(line1, cw / 2, cy - subSize * 0.6);

        ctx.font = `${subSize}px Inter, Arial, sans-serif`;
        ctx.fillText(line2, cw / 2, cy + fontSize * 0.5);
        ctx.fillText(line3, cw / 2, cy + fontSize * 0.5 + subSize * 1.15);

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
        tex.needsUpdate = true;
        return tex;
      };

      const texLR = makeFaceLabel(bW, bH);
      const texTB = makeFaceLabel(bL, bW);
      const texFB = makeFaceLabel(bL, bH);

      const faceMat = (tex: THREE.CanvasTexture) => {
        return new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.64,
          metalness: 0.015,
        });
      };

      const materials = [
        faceMat(texLR), faceMat(texLR),
        faceMat(texTB), faceMat(texTB),
        faceMat(texFB), faceMat(texFB),
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
        color: 0x0f172a,
        transparent: true,
        opacity: 0.42,
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(boxMesh.position);
      edges.userData = { linkedTo: idx };
      boxMesh.userData.linkedEdges = edges;
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

    const renderScene = () => {
      renderer.render(scene, camera);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragIntersection = new THREE.Vector3();
    type DragState = {
      pointerId: number;
      mesh: THREE.Mesh;
      index: number;
      startPosition: THREE.Vector3;
      offset: THREE.Vector3;
      plane: THREE.Plane;
      nextLayout: PlacedBox[] | null;
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

    const handlePointerDown = (event: PointerEvent) => {
      if (!arrangeMode || event.button !== 0) return;
      updatePointer(event);
      const intersection = raycaster.intersectObjects(cargoMeshes, false)[0];
      if (!intersection || !(intersection.object instanceof THREE.Mesh)) return;

      event.preventDefault();
      event.stopPropagation();
      const mesh = intersection.object;
      const index = mesh.userData.placedIndex as number;
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -mesh.position.y);
      if (!raycaster.ray.intersectPlane(plane, dragIntersection)) return;

      dragState = {
        pointerId: event.pointerId,
        mesh,
        index,
        startPosition: mesh.position.clone(),
        offset: dragIntersection.clone().sub(mesh.position),
        plane,
        nextLayout: null,
        valid: false,
      };
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
      controls.enabled = false;
      highlightMesh(mesh, 0x0ea5e9);
      setPlacementMessage("Drag horizontally — floor and supported stack levels snap automatically.");
      renderScene();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
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
      const nextX = Math.min(cL - halfLength, Math.max(halfLength, Math.round(unclampedX / snap) * snap));
      const nextZ = Math.min(cW - halfWidth, Math.max(halfWidth, Math.round(unclampedZ / snap) * snap));
      const current = placed[dragState.index];
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
      renderer.domElement.style.cursor = arrangeMode ? "grab" : "default";
      highlightMesh(completedDrag.mesh, null);

      const moved = completedDrag.startPosition.distanceTo(completedDrag.mesh.position) > 0.001;
      if (commit && moved && completedDrag.valid && completedDrag.nextLayout) {
        arrangementHistoryRef.current = [
          ...arrangementHistoryRef.current,
          placed.map((box) => ({ ...box })),
        ].slice(-20);
        setHistoryCount(arrangementHistoryRef.current.length);
        setPlacementMessage("Cargo placed safely. You can undo or continue adjusting.");
        onPlacedChange?.(completedDrag.nextLayout.map((box) => ({ ...box })));
      } else {
        moveMesh(completedDrag.mesh, completedDrag.startPosition);
        if (moved && !completedDrag.valid) {
          setPlacementMessage("Invalid move cancelled — the previous position was restored.");
        }
      }
      renderScene();
    };

    const handlePointerUp = (event: PointerEvent) => finishDrag(event, true);
    const handlePointerCancel = (event: PointerEvent) => finishDrag(event, false);

    renderer.domElement.style.cursor = arrangeMode ? "grab" : "default";
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerCancel);
    controls.addEventListener("change", renderScene);
    renderScene();

    sceneRef.current = { renderer, scene, camera, controls, render: renderScene };

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
        const sideA = capture(centerX, cH * 0.8, cW * 3);
        const front = capture(cL * 2.5, cH * 0.8, centerZ);

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
      renderScene();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cameraViewRef.current = {
        containerId: container.id,
        position: camera.position.toArray() as [number, number, number],
        target: controls.target.toArray() as [number, number, number],
      };
      sceneRef.current = null;
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerCancel);
      controls.removeEventListener("change", renderScene);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      controls.dispose();
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
  }, [placed, container, unitSystem, arrangeMode, rendererAttempt, webglError]);

  const fmt = (inches: number) => {
    if (unitSystem === "metric") return `${(inches * IN_TO_CM).toFixed(1)} cm`;
    return `${inches.toFixed(1)} in`;
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">L <span className="font-semibold text-slate-800">{fmt(container.lengthIn)}</span></span>
          <span className="bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">W <span className="font-semibold text-slate-800">{fmt(container.widthIn)}</span></span>
          <span className="bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">H <span className="font-semibold text-slate-800">{fmt(container.heightIn)}</span></span>
        </div>
      </div>
      {webglError ? (
        <ContainerFallback2D
          placed={placed}
          container={container}
          onRetry={() => {
            setWebglError(false);
            setRendererAttempt((attempt) => attempt + 1);
          }}
        />
      ) : (
        <div
          className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-slate-200/90 bg-[radial-gradient(ellipse_at_45%_0%,#ffffff_0%,#f3f6fa_48%,#e6ebf1_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_45px_-34px_rgba(15,23,42,0.45)]"
          data-testid="container-3d-viewer"
        >
          <div ref={mountRef} className="absolute inset-0" />
          <div className="absolute top-3 left-3 right-3 flex items-center gap-2 flex-wrap">
            <div className="h-8 px-2.5 rounded-lg border border-white/80 bg-white/75 backdrop-blur text-[11px] font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 pointer-events-none">
              <Box className="w-3.5 h-3.5 text-primary" />
              Interactive 3D
            </div>
            {onPlacedChange && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setArrangeMode((current) => !current);
                    setPlacementMessage("Select a cargo item and drag it to a new position.");
                  }}
                  className={`h-8 px-2.5 rounded-lg border backdrop-blur text-[11px] font-semibold shadow-sm transition-colors flex items-center gap-1.5 ${
                    arrangeMode
                      ? "border-sky-500 bg-sky-600 text-white"
                      : "border-white/80 bg-white/80 text-slate-700 hover:bg-white"
                  }`}
                  data-testid="button-arrange-cargo"
                  aria-pressed={arrangeMode}
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  {arrangeMode ? "Finish arranging" : "Adjust layout"}
                </button>
                {arrangeMode && (
                  <>
                    <button
                      type="button"
                      onClick={undoArrangement}
                      disabled={historyCount === 0}
                      className="h-8 px-2.5 rounded-lg border border-white/80 bg-white/80 backdrop-blur text-[11px] font-medium text-slate-700 shadow-sm hover:bg-white disabled:opacity-45 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                      data-testid="button-undo-cargo-move"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={resetArrangement}
                      className="h-8 px-2.5 rounded-lg border border-white/80 bg-white/80 backdrop-blur text-[11px] font-medium text-slate-700 shadow-sm hover:bg-white transition-colors flex items-center gap-1.5"
                      data-testid="button-reset-cargo-layout"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset plan
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <div className={`absolute bottom-3 right-3 left-3 sm:left-auto sm:max-w-[75%] rounded-md border px-2.5 py-1.5 text-[10px] font-medium shadow-sm backdrop-blur pointer-events-none ${
            arrangeMode
              ? placementMessage.includes("overlap") || placementMessage.includes("without enough") || placementMessage.includes("cancelled")
                ? "border-red-200 bg-red-50/90 text-red-700"
                : "border-sky-200 bg-white/90 text-slate-700"
              : "border-white/80 bg-white/75 text-slate-600"
          }`}>
            {arrangeMode ? placementMessage : "Drag to rotate · Scroll or pinch to zoom"}
          </div>
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
  const [snapshotExportFn, setSnapshotExportFn] = useState<SnapshotExportFn | null>(null);

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
    setRecommendation(null);
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
    if (field === "color") {
      setMultiResult((current) => current ? {
        ...current,
        containers: current.containers.map((entry) => ({
          ...entry,
          result: {
            ...entry.result,
            placed: entry.result.placed.map((box) => box.cargoId === id ? { ...box, color: value } : box),
          },
        })),
      } : current);
    }
  }, []);

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
    setMultiResult(null);
    setRecommendation(null);
    setShowImportModal(false);
    toast({
      title: `${importedCount} item${importedCount > 1 ? "s" : ""} filled in`,
      description: "The extracted cargo fields are ready for review in the calculator.",
    });
  }, [importItems, importUnits, bulkDefaults, toast]);

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
  }, [selectedIds]);

  const handleReset = useCallback(() => {
    setMultiResult(null);
    setRecommendation(null);
    setContainerId("20dc");
    setContainerSelectionMode("recommend");
    setCargoItems([defaultCargoItem(0), defaultCargoItem(1)]);
    setSelectedIds(new Set());
  }, [defaultCargoItem]);

  const handleExportPDF = useCallback(async () => {
    if (!multiResult || multiResult.containers.length === 0) return;
    toast({ title: "Generating PDF...", description: "Please wait while we create your report." });
    try {
      const cr = multiResult.containers[0];
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
                    <button
                      onClick={() => {
                        setContainerSelectionMode("recommend");
                        setMultiResult(null);
                        setRecommendation(null);
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
                            setMultiResult(null);
                          }}
                          className={`text-left p-2.5 rounded-lg border text-sm transition-all ${
                            containerSelectionMode === "manual" && containerId === ct.id
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
                        setContainerSelectionMode("manual");
                        setContainerId("custom");
                        setMultiResult(null);
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

                  <div className="mb-3 flex items-start gap-1.5 rounded-lg border border-blue-100 bg-blue-50/70 px-2.5 py-2 text-[11px] text-blue-800">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Enter the <strong>total gross weight for each row</strong>. The calculator divides it across the quantity automatically.
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
                  className="space-y-5"
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
                        {recommendation?.container.id === containerId ? " — best-fit container" : ""}
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
                                onPlacedChange={(nextPlaced) => {
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

        <section className="mt-16 border-t border-slate-200 bg-white/70 py-14" aria-labelledby="container-guide-heading">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="max-w-3xl mb-9">
              <h2 id="container-guide-heading" className="text-2xl md:text-3xl font-bold font-display text-slate-900 mb-3">
                How the 3D container loading calculator works
              </h2>
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
