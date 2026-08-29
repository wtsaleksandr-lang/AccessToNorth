import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Box, RefreshCw } from "lucide-react";
import type { BuiltPallet, PalletSpec } from "@/lib/palletPacking";
import { Button } from "@/components/ui/button";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function PalletTopView({ builtPallet, pallet }: { builtPallet: BuiltPallet; pallet: PalletSpec }) {
  const topLayer = builtPallet.layers[builtPallet.layers.length - 1];
  if (!topLayer) return null;
  const viewMinX = Math.min(0, ...topLayer.placements.map((box) => box.x));
  const viewMinY = Math.min(0, ...topLayer.placements.map((box) => box.y));
  const viewMaxX = Math.max(pallet.lengthIn, ...topLayer.placements.map((box) => box.x + box.lengthIn));
  const viewMaxY = Math.max(pallet.widthIn, ...topLayer.placements.map((box) => box.y + box.widthIn));
  const padding = 4;

  return (
    <svg
      className="w-full h-full min-h-[320px]"
      viewBox={`${viewMinX - padding} ${viewMinY - padding} ${viewMaxX - viewMinX + padding * 2} ${viewMaxY - viewMinY + padding * 2}`}
      role="img"
      aria-label="Top view of the highest pallet layer"
    >
      <defs>
        <filter id="pallet-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.16" />
        </filter>
      </defs>
      <rect x="0" y="0" width={pallet.lengthIn} height={pallet.widthIn} rx="1.5" fill="#d8b47c" stroke="#9a6b35" strokeWidth="0.65" />
      {topLayer.placements.map((box, index) => (
        <g key={`${box.cartonId}-${index}`} filter="url(#pallet-shadow)">
          <rect x={box.x} y={box.y} width={box.lengthIn} height={box.widthIn} rx="0.8" fill={box.color} fillOpacity="0.92" stroke="#ffffff" strokeWidth="0.55" />
        </g>
      ))}
    </svg>
  );
}

export function PalletPreview3D({
  builtPallet,
  pallet,
  visibleLayer,
}: {
  builtPallet: BuiltPallet;
  pallet: PalletSpec;
  visibleLayer: number | "all";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const visiblePlacements = useMemo(() => (
    visibleLayer === "all"
      ? builtPallet.layers.flatMap((layer) => layer.placements)
      : builtPallet.layers.find((layer) => layer.index === visibleLayer)?.placements || []
  ), [builtPallet, visibleLayer]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supportsWebGL()) {
      setFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let controls: OrbitControls | null = null;
    let disposed = false;

    try {
      setFailed(false);
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xf5f7fb, 145, 310);

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 600);
      const centerHeight = Math.max(pallet.heightIn, builtPallet.loadedHeightIn) / 2;
      const largestDimension = Math.max(builtPallet.loadedLengthIn, builtPallet.loadedWidthIn, builtPallet.loadedHeightIn);
      camera.position.set(largestDimension * 1.25, largestDimension * 0.9, largestDimension * 1.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0xffffff, 0);
      renderer.domElement.setAttribute("aria-label", "Interactive 3D pallet building preview");
      renderer.domElement.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        setFailed(true);
      });
      host.replaceChildren(renderer.domElement);

      const render = () => {
        if (!disposed && renderer) renderer.render(scene, camera);
      };

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, centerHeight, 0);
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.minDistance = Math.max(45, largestDimension * 0.8);
      controls.maxDistance = Math.max(220, largestDimension * 3.4);
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.addEventListener("change", render);

      scene.add(new THREE.HemisphereLight(0xf8fbff, 0x64748b, 2.3));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(80, 120, 70);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
      fillLight.position.set(-80, 60, -40);
      scene.add(fillLight);

      const loadGroup = new THREE.Group();
      loadGroup.position.set(-pallet.lengthIn / 2, 0, -pallet.widthIn / 2);
      scene.add(loadGroup);

      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xc89455, roughness: 0.76, metalness: 0.02 });
      const darkWoodMaterial = new THREE.MeshStandardMaterial({ color: 0x8a5b2c, roughness: 0.82, metalness: 0.01 });
      const deckThickness = Math.max(0.75, pallet.heightIn * 0.22);
      const boardWidth = pallet.lengthIn / 8.5;
      for (let board = 0; board < 7; board += 1) {
        const geometry = new THREE.BoxGeometry(boardWidth, deckThickness, pallet.widthIn);
        const mesh = new THREE.Mesh(geometry, woodMaterial);
        mesh.position.set(boardWidth / 2 + board * ((pallet.lengthIn - boardWidth) / 6), pallet.heightIn - deckThickness / 2, pallet.widthIn / 2);
        loadGroup.add(mesh);
      }
      for (let runner = 0; runner < 3; runner += 1) {
        const geometry = new THREE.BoxGeometry(pallet.lengthIn, pallet.heightIn - deckThickness * 1.35, Math.max(2.2, pallet.widthIn * 0.1));
        const mesh = new THREE.Mesh(geometry, darkWoodMaterial);
        mesh.position.set(pallet.lengthIn / 2, (pallet.heightIn - deckThickness * 1.35) / 2, pallet.widthIn * (0.12 + runner * 0.38));
        loadGroup.add(mesh);
      }

      const materialCache = new Map<string, THREE.MeshStandardMaterial>();
      for (const placement of visiblePlacements) {
        let material = materialCache.get(placement.color);
        if (!material) {
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(placement.color),
            roughness: 0.5,
            metalness: 0.03,
          });
          materialCache.set(placement.color, material);
        }
        const geometry = new THREE.BoxGeometry(
          Math.max(0.1, placement.lengthIn - 0.18),
          Math.max(0.1, placement.heightIn - 0.18),
          Math.max(0.1, placement.widthIn - 0.18),
        );
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          placement.x + placement.lengthIn / 2,
          placement.z + placement.heightIn / 2,
          placement.y + placement.widthIn / 2,
        );
        loadGroup.add(mesh);

        if (visiblePlacements.length <= 80) {
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry, 35),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.48 }),
          );
          edges.position.copy(mesh.position);
          loadGroup.add(edges);
        }
      }

      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(Math.max(100, largestDimension * 2.4), 64),
        new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.96, transparent: true, opacity: 0.68 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.15;
      scene.add(ground);
      const grid = new THREE.GridHelper(Math.max(180, largestDimension * 3), 18, 0xb6c4d6, 0xd8e0ea);
      grid.position.y = -0.05;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.45;
      scene.add(grid);

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || disposed) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        render();
      });
      resizeObserver.observe(host);
      controls.update();
      render();

      return () => {
        disposed = true;
        resizeObserver?.disconnect();
        controls?.dispose();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
            object.geometry?.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material?.dispose());
          }
        });
        renderer?.dispose();
        if (host.contains(renderer!.domElement)) host.removeChild(renderer!.domElement);
      };
    } catch (error) {
      console.warn("Pallet WebGL preview unavailable; showing the lightweight top view.", error);
      resizeObserver?.disconnect();
      controls?.dispose();
      renderer?.dispose();
      setFailed(true);
    }
  }, [builtPallet, pallet, retryKey, visiblePlacements]);

  return (
    <div className="relative min-h-[340px] sm:min-h-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_50%_20%,#ffffff_0%,#f1f5f9_62%,#e2e8f0_100%)]" data-testid="pallet-3d-preview">
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="absolute inset-4 opacity-80"><PalletTopView builtPallet={builtPallet} pallet={pallet} /></div>
          <div className="relative mt-auto flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
            <Box className="h-4 w-4 text-sky-600" /> Lightweight top view
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={() => { setFailed(false); setRetryKey((value) => value + 1); }}>
              <RefreshCw className="h-3 w-3" /> Retry 3D
            </Button>
          </div>
        </div>
      ) : (
        <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      )}
      {!failed && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur">
          Drag to rotate · Scroll to zoom
        </div>
      )}
    </div>
  );
}
