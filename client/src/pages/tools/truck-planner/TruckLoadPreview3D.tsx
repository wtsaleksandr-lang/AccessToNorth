import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Box, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlacedBox } from "@/lib/containerPacking";
import type { TruckLoadingStep, TruckTrailerLike } from "@/lib/truckPacking";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function TruckTopView({ placed, trailer }: { placed: PlacedBox[]; trailer: TruckTrailerLike }) {
  const pad = Math.max(8, trailer.widthIn * 0.12);
  return (
    <svg className="h-full w-full min-h-[290px]" viewBox={`${-pad} ${-pad} ${trailer.lengthIn + pad * 2} ${trailer.widthIn + pad * 2}`} role="img" aria-label="Top view of the calculated trailer loading plan">
      <defs>
        <linearGradient id="truck-deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fafc" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient>
      </defs>
      <rect x="0" y="0" width={trailer.lengthIn} height={trailer.widthIn} rx="4" fill="url(#truck-deck)" stroke="#64748b" strokeWidth="2" />
      {placed.map((cargo, index) => (
        <g key={`${cargo.cargoId}-${index}`}>
          <rect x={cargo.x} y={cargo.z} width={cargo.l} height={cargo.w} rx="1.5" fill={cargo.color} fillOpacity="0.9" stroke="#ffffff" strokeWidth="1" />
          {cargo.l > 28 && cargo.w > 20 && <text x={cargo.x + cargo.l / 2} y={cargo.z + cargo.w / 2} dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="700">{index + 1}</text>}
        </g>
      ))}
      <line x1={trailer.lengthIn} y1="0" x2={trailer.lengthIn} y2={trailer.widthIn} stroke="#0284c7" strokeWidth="4" strokeDasharray="7 5" />
      <text x={trailer.lengthIn - 8} y={trailer.widthIn + pad * 0.65} textAnchor="end" fill="#0369a1" fontSize="8" fontWeight="700">REAR DOORS</text>
      <text x="8" y={trailer.widthIn + pad * 0.65} fill="#475569" fontSize="8" fontWeight="700">NOSE</text>
    </svg>
  );
}

export function TruckLoadPreview3D({
  placed,
  trailer,
  loadingSequence,
  visibleSteps,
}: {
  placed: PlacedBox[];
  trailer: TruckTrailerLike;
  loadingSequence: TruckLoadingStep[];
  visibleSteps: number | "all";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const visiblePlaced = useMemo(() => {
    if (visibleSteps === "all") return placed;
    const indexes = new Set(loadingSequence.slice(0, visibleSteps).map((step) => step.boxIndex));
    return placed.filter((_, index) => indexes.has(index));
  }, [loadingSequence, placed, visibleSteps]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supportsWebGL()) {
      setFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;

    try {
      setFailed(false);
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xf4f7fb, trailer.lengthIn * 1.3, trailer.lengthIn * 2.4);
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, trailer.lengthIn * 4);
      camera.position.set(trailer.lengthIn * 0.82, trailer.heightIn * 1.35, trailer.widthIn * 2.25);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      renderer.setClearColor(0xffffff, 0);
      renderer.domElement.setAttribute("aria-label", "Interactive 3D truck loading plan");
      renderer.domElement.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        setFailed(true);
      });
      host.replaceChildren(renderer.domElement);

      const render = () => {
        if (!disposed && renderer) renderer.render(scene, camera);
      };
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, trailer.heightIn * 0.35, 0);
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.minDistance = Math.max(180, trailer.widthIn * 1.3);
      controls.maxDistance = trailer.lengthIn * 2;
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.addEventListener("change", render);

      scene.add(new THREE.HemisphereLight(0xf8fbff, 0x64748b, 2.4));
      const key = new THREE.DirectionalLight(0xffffff, 3.2);
      key.position.set(220, 260, 180);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x7dd3fc, 1.3);
      fill.position.set(-220, 110, -120);
      scene.add(fill);

      const group = new THREE.Group();
      group.position.set(-trailer.lengthIn / 2, 0, -trailer.widthIn / 2);
      scene.add(group);

      const deckMaterial = new THREE.MeshStandardMaterial({ color: trailer.hasDeck ? 0x334155 : 0xd7dee8, roughness: 0.7, metalness: 0.24 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(trailer.lengthIn, 2.2, trailer.widthIn), deckMaterial);
      deck.position.set(trailer.lengthIn / 2, 1.1, trailer.widthIn / 2);
      group.add(deck);

      if (!trailer.hasDeck) {
        const wallMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe7edf5, transparent: true, opacity: 0.2, roughness: 0.3, metalness: 0.04, side: THREE.DoubleSide, depthWrite: false });
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(trailer.lengthIn, trailer.heightIn), wallMaterial);
        leftWall.position.set(trailer.lengthIn / 2, trailer.heightIn / 2, 0);
        group.add(leftWall);
        const rightWall = leftWall.clone();
        rightWall.position.z = trailer.widthIn;
        group.add(rightWall);
        const roof = new THREE.Mesh(new THREE.PlaneGeometry(trailer.lengthIn, trailer.widthIn), wallMaterial);
        roof.rotation.x = Math.PI / 2;
        roof.position.set(trailer.lengthIn / 2, trailer.heightIn, trailer.widthIn / 2);
        group.add(roof);
        const nose = new THREE.Mesh(new THREE.PlaneGeometry(trailer.widthIn, trailer.heightIn), wallMaterial);
        nose.rotation.y = Math.PI / 2;
        nose.position.set(0, trailer.heightIn / 2, trailer.widthIn / 2);
        group.add(nose);

        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.8 });
        const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(trailer.lengthIn, trailer.heightIn, trailer.widthIn)), frameMaterial);
        frame.position.set(trailer.lengthIn / 2, trailer.heightIn / 2, trailer.widthIn / 2);
        group.add(frame);
      } else {
        const railMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.48, metalness: 0.48 });
        for (const side of [0, trailer.widthIn]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(trailer.lengthIn, 1.3, 1.3), railMaterial);
          rail.position.set(trailer.lengthIn / 2, 3.2, side);
          group.add(rail);
        }
      }

      const materialCache = new Map<string, THREE.MeshStandardMaterial>();
      for (const cargo of visiblePlaced) {
        let material = materialCache.get(cargo.color);
        if (!material) {
          material = new THREE.MeshStandardMaterial({ color: new THREE.Color(cargo.color), roughness: 0.48, metalness: 0.035 });
          materialCache.set(cargo.color, material);
        }
        const geometry = new THREE.BoxGeometry(Math.max(0.2, cargo.l - 0.24), Math.max(0.2, cargo.h - 0.24), Math.max(0.2, cargo.w - 0.24));
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(cargo.x + cargo.l / 2, cargo.y + cargo.h / 2 + 2.2, cargo.z + cargo.w / 2);
        group.add(mesh);
        if (visiblePlaced.length <= 90) {
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
          edges.position.copy(mesh.position);
          group.add(edges);
        }
      }

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(trailer.lengthIn * 1.7, trailer.lengthIn * 0.72),
        new THREE.MeshStandardMaterial({ color: 0xe8edf3, roughness: 0.96, transparent: true, opacity: 0.72 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.2;
      scene.add(ground);

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
        if (renderer && host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
      };
    } catch (error) {
      console.warn("Truck WebGL preview unavailable; showing the top view.", error);
      resizeObserver?.disconnect();
      controls?.dispose();
      renderer?.dispose();
      setFailed(true);
    }
  }, [retryKey, trailer, visiblePlaced]);

  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_50%_16%,#ffffff_0%,#f1f5f9_62%,#e2e8f0_100%)] sm:min-h-[450px]" data-testid="truck-3d-preview">
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-5">
          <div className="absolute inset-4 opacity-90"><TruckTopView placed={visiblePlaced} trailer={trailer} /></div>
          <div className="relative mt-auto flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
            <Box className="h-4 w-4 text-sky-600" /> Universal top view
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={() => { setFailed(false); setRetryKey((value) => value + 1); }}><RefreshCw className="h-3 w-3" /> Retry 3D</Button>
          </div>
        </div>
      ) : <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />}
      {!failed && <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur">Drag to rotate · Scroll to zoom</div>}
    </div>
  );
}
