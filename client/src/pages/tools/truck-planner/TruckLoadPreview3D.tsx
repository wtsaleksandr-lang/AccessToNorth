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
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, trailer.lengthIn * 5);

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
      controls.enableDamping = false;
      controls.enablePan = false;
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

      const floorY = Math.min(15, Math.max(10, trailer.widthIn * 0.125));
      const deckThickness = 2.4;
      const deckMaterial = new THREE.MeshStandardMaterial({ color: trailer.hasDeck ? 0x334155 : 0xd7dee8, roughness: 0.7, metalness: 0.24 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(trailer.lengthIn, deckThickness, trailer.widthIn), deckMaterial);
      deck.position.set(trailer.lengthIn / 2, floorY, trailer.widthIn / 2);
      group.add(deck);

      const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.42, metalness: 0.62 });
      const hardwareMaterial = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.36, metalness: 0.7 });
      const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88, metalness: 0.05 });
      const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.82 });
      const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6, roughness: 0.3 });

      for (const side of [trailer.widthIn * 0.24, trailer.widthIn * 0.76]) {
        const frameRail = new THREE.Mesh(new THREE.BoxGeometry(trailer.lengthIn * 0.9, 3.2, 2.2), chassisMaterial);
        frameRail.position.set(trailer.lengthIn * 0.51, floorY - 3.5, side);
        group.add(frameRail);
      }

      const wheelRadius = Math.min(10.5, floorY * 0.78);
      const wheelWidth = 5.2;
      const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 18);
      wheelGeometry.rotateX(Math.PI / 2);
      const hubGeometry = new THREE.CylinderGeometry(wheelRadius * 0.34, wheelRadius * 0.34, wheelWidth + 0.3, 16);
      hubGeometry.rotateX(Math.PI / 2);
      for (const axleX of [trailer.lengthIn * 0.72, trailer.lengthIn * 0.81]) {
        const axle = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, trailer.widthIn + 6, 10), hardwareMaterial);
        axle.rotation.x = Math.PI / 2;
        axle.position.set(axleX, wheelRadius, trailer.widthIn / 2);
        group.add(axle);
        for (const sideZ of [-wheelWidth * 0.25, trailer.widthIn + wheelWidth * 0.25]) {
          const wheel = new THREE.Mesh(wheelGeometry, tireMaterial);
          wheel.position.set(axleX, wheelRadius, sideZ);
          group.add(wheel);
          const hub = new THREE.Mesh(hubGeometry, hubMaterial);
          hub.position.copy(wheel.position);
          group.add(hub);
        }
      }

      for (const sideZ of [trailer.widthIn * 0.34, trailer.widthIn * 0.66]) {
        const landingLeg = new THREE.Mesh(new THREE.BoxGeometry(2.4, floorY - 1.5, 2.4), hardwareMaterial);
        landingLeg.position.set(trailer.lengthIn * 0.17, (floorY - 1.5) / 2, sideZ);
        group.add(landingLeg);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 5), hardwareMaterial);
        foot.position.set(trailer.lengthIn * 0.17, 0.6, sideZ);
        group.add(foot);
      }

      const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, trailer.widthIn * 0.88), hardwareMaterial);
      rearBumper.position.set(trailer.lengthIn + 2.2, 4.8, trailer.widthIn / 2);
      group.add(rearBumper);
      for (const sideZ of [trailer.widthIn * 0.08, trailer.widthIn * 0.92]) {
        const bumperPost = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), hardwareMaterial);
        bumperPost.position.set(trailer.lengthIn + 1.5, 8, sideZ);
        group.add(bumperPost);
      }

      for (const sideZ of [-0.8, trailer.widthIn + 0.8]) {
        for (const markerX of [trailer.lengthIn * 0.2, trailer.lengthIn * 0.48, trailer.lengthIn * 0.9]) {
          const marker = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 0.8), lightMaterial);
          marker.position.set(markerX, floorY - 0.2, sideZ);
          group.add(marker);
        }
      }

      if (!trailer.hasDeck) {
        const wallMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe7edf5, transparent: true, opacity: 0.2, roughness: 0.3, metalness: 0.04, side: THREE.DoubleSide, depthWrite: false });
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(trailer.lengthIn, trailer.heightIn), wallMaterial);
        leftWall.position.set(trailer.lengthIn / 2, floorY + trailer.heightIn / 2, 0);
        group.add(leftWall);
        const rightWall = leftWall.clone();
        rightWall.position.z = trailer.widthIn;
        group.add(rightWall);
        const roof = new THREE.Mesh(new THREE.PlaneGeometry(trailer.lengthIn, trailer.widthIn), wallMaterial);
        roof.rotation.x = Math.PI / 2;
        roof.position.set(trailer.lengthIn / 2, floorY + trailer.heightIn, trailer.widthIn / 2);
        group.add(roof);
        const nose = new THREE.Mesh(new THREE.PlaneGeometry(trailer.widthIn, trailer.heightIn), wallMaterial);
        nose.rotation.y = Math.PI / 2;
        nose.position.set(0, floorY + trailer.heightIn / 2, trailer.widthIn / 2);
        group.add(nose);

        const doorMaterial = new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.25, roughness: 0.28, metalness: 0.12, side: THREE.DoubleSide, depthWrite: false });
        for (const sideZ of [trailer.widthIn * 0.25, trailer.widthIn * 0.75]) {
          const rearDoor = new THREE.Mesh(new THREE.PlaneGeometry(trailer.widthIn / 2 - 1.2, trailer.heightIn - 2), doorMaterial);
          rearDoor.rotation.y = Math.PI / 2;
          rearDoor.position.set(trailer.lengthIn, floorY + trailer.heightIn / 2, sideZ);
          group.add(rearDoor);
          const lockingBar = new THREE.Mesh(new THREE.BoxGeometry(1.1, trailer.heightIn * 0.72, 1.1), hardwareMaterial);
          lockingBar.position.set(trailer.lengthIn + 0.8, floorY + trailer.heightIn * 0.5, sideZ);
          group.add(lockingBar);
        }

        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.8 });
        const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(trailer.lengthIn, trailer.heightIn, trailer.widthIn)), frameMaterial);
        frame.position.set(trailer.lengthIn / 2, floorY + trailer.heightIn / 2, trailer.widthIn / 2);
        group.add(frame);
      } else {
        const railMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.48, metalness: 0.48 });
        for (const side of [0, trailer.widthIn]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(trailer.lengthIn, 1.3, 1.3), railMaterial);
          rail.position.set(trailer.lengthIn / 2, floorY + 2.1, side);
          group.add(rail);
        }
        const frontApron = new THREE.Mesh(new THREE.BoxGeometry(trailer.lengthIn * 0.16, 1.4, trailer.widthIn * 0.62), hardwareMaterial);
        frontApron.position.set(trailer.lengthIn * 0.08, floorY - 2, trailer.widthIn / 2);
        group.add(frontApron);
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
        mesh.position.set(cargo.x + cargo.l / 2, cargo.y + cargo.h / 2 + floorY + deckThickness / 2, cargo.z + cargo.w / 2);
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
      ground.position.y = -0.35;
      scene.add(ground);

      const bounds = new THREE.Box3().setFromObject(group);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      let cameraFitted = false;

      const fitCamera = (width: number, height: number) => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (cameraFitted) return;
        const verticalFov = THREE.MathUtils.degToRad(camera.fov);
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
        const widthDistance = size.x / (2 * Math.tan(horizontalFov / 2));
        const heightDistance = Math.max(size.y * 1.2, size.z * 0.95) / (2 * Math.tan(verticalFov / 2));
        const distance = Math.max(widthDistance, heightDistance) * 1.08;
        const direction = new THREE.Vector3(0.42, 0.42, 0.9).normalize();
        controls!.target.copy(center).add(new THREE.Vector3(0, size.y * 0.03, 0));
        camera.position.copy(controls!.target).add(direction.multiplyScalar(distance));
        controls!.minDistance = Math.max(trailer.widthIn * 0.8, distance * 0.42);
        controls!.maxDistance = distance * 2.4;
        cameraFitted = true;
        controls!.update();
      };

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || disposed) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        fitCamera(width, height);
        render();
      });
      resizeObserver.observe(host);
      fitCamera(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
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
