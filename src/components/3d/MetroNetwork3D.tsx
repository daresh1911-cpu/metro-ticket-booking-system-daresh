/**
 * MetroX 3D — Interactive 3D Metro Network Map (Three.js)
 * Visualizes lines, interchange hubs, live animated train markers, and route paths.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext.js';

export interface NetworkStation {
  station_id: number;
  station_name: string;
  station_code: string;
  latitude: number;
  longitude: number;
  is_interchange: boolean;
  status: string;
  lines?: Array<{ line_id: number; line_name: string; line_color: string; line_code: string }>;
}

export interface NetworkConnection {
  connection_id: number;
  from_station_id: number;
  to_station_id: number;
  travel_minutes: number;
  distance_km: number;
  line_id: number;
  line_color: string;
}

interface MetroNetwork3DProps {
  stations: NetworkStation[];
  connections: NetworkConnection[];
  highlightStationIds?: number[];
  onSelectStation?: (station: NetworkStation, type: 'source' | 'destination') => void;
  selectedSourceId?: number | null;
  selectedDestId?: number | null;
}

export const MetroNetwork3D: React.FC<MetroNetwork3DProps> = ({
  stations,
  connections,
  highlightStationIds = [],
  onSelectStation,
  selectedSourceId,
  selectedDestId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStation, setActiveStation] = useState<NetworkStation | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Map Chennai geographic coordinates to 3D spatial world plane (-15 to 15)
  // Extended bounds to cover Poonamallee Bypass (lng 80.076) westward to Wimco Nagar (lng 80.306) eastward
  const mapCoordsTo3D = (lat: number, lng: number): [number, number, number] => {
    const latMin = 12.96, latMax = 13.20;
    const lngMin = 80.05, lngMax = 80.33;
    const x = ((lng - lngMin) / (lngMax - lngMin) - 0.5) * 30;
    const z = -((lat - latMin) / (latMax - latMin) - 0.5) * 30;
    return [x, 0, z];
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || viewMode === '2d' || stations.length === 0) return;

    let animationFrameId: number;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? '#030712' : '#f8fafc');
    scene.fog = new THREE.FogExp2(isDark ? '#030712' : '#f8fafc', 0.012);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 24, 24);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(isDark ? '#ffffff' : '#ffffff', isDark ? 0.8 : 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#38bdf8', isDark ? 1.5 : 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Grid Floor
    const grid = new THREE.GridHelper(36, 36, isDark ? '#0f2744' : '#94a3b8', isDark ? '#091528' : '#e2e8f0');
    grid.position.y = -0.05;
    scene.add(grid);

    // Station Mesh Map for Raycasting
    const stationMeshes: Map<THREE.Mesh, NetworkStation> = new Map();
    const stationPositionsMap = new Map<number, THREE.Vector3>();

    // 1. Draw Stations
    stations.forEach((st) => {
      const [x, y, z] = mapCoordsTo3D(st.latitude, st.longitude);
      const pos = new THREE.Vector3(x, y, z);
      stationPositionsMap.set(st.station_id, pos);

      const isHighlight = highlightStationIds.includes(st.station_id);
      const isSource = selectedSourceId === st.station_id;
      const isDest = selectedDestId === st.station_id;

      let color = st.is_interchange ? '#38bdf8' : '#94a3b8';
      if (isSource) color = '#10b981';
      if (isDest) color = '#f43f5e';
      if (isHighlight && !isSource && !isDest) color = '#fbbf24';

      const radius = st.is_interchange ? 0.65 : 0.45;
      const geo = new THREE.CylinderGeometry(radius, radius, 0.3, 16);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: isHighlight || isSource || isDest ? 0.9 : 0.3,
        roughness: 0.3,
        metalness: 0.7,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.y = 0.15;
      scene.add(mesh);
      stationMeshes.set(mesh, st);

      // Ring for interchange
      if (st.is_interchange || isSource || isDest) {
        const ringGeo = new THREE.RingGeometry(radius + 0.15, radius + 0.35, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isSource ? '#10b981' : isDest ? '#f43f5e' : '#38bdf8',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.05, z);
        scene.add(ring);
      }
    });

    // 2. Draw Connection Lines
    const drawnPairs = new Set<string>();
    connections.forEach((c) => {
      const key = [Math.min(c.from_station_id, c.to_station_id), Math.max(c.from_station_id, c.to_station_id)].join('-');
      if (drawnPairs.has(key)) return;
      drawnPairs.add(key);

      const p1 = stationPositionsMap.get(c.from_station_id);
      const p2 = stationPositionsMap.get(c.to_station_id);
      if (!p1 || !p2) return;

      const isRouteSegment =
        highlightStationIds.includes(c.from_station_id) &&
        highlightStationIds.includes(c.to_station_id);

      const curve = new THREE.LineCurve3(
        new THREE.Vector3(p1.x, 0.1, p1.z),
        new THREE.Vector3(p2.x, 0.1, p2.z)
      );

      const tubeGeo = new THREE.TubeGeometry(curve, 12, isRouteSegment ? 0.18 : 0.09, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: isRouteSegment ? '#fbbf24' : c.line_color,
        emissive: isRouteSegment ? '#fbbf24' : c.line_color,
        emissiveIntensity: isRouteSegment ? 0.9 : 0.4,
        roughness: 0.2,
        metalness: 0.8,
      });

      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tube);
    });

    // 3. Animated Train Marker
    const trainGeo = new THREE.BoxGeometry(0.7, 0.4, 0.4);
    const trainMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    const movingTrain = new THREE.Mesh(trainGeo, trainMat);
    scene.add(movingTrain);

    // 4. Raycaster for clicking stations
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / container.clientHeight) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(stationMeshes.keys()));

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const st = stationMeshes.get(clickedMesh);
        if (st) {
          setActiveStation(st);
        }
      }
    };
    container.addEventListener('click', handleClick);

    // 5. Mouse Orbit / Drag Control
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraAngle = 0;
    let cameraRadius = 30;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      cameraAngle += deltaX * 0.005;

      camera.position.x = Math.sin(cameraAngle) * cameraRadius;
      camera.position.z = Math.cos(cameraAngle) * cameraRadius;
      camera.lookAt(0, 0, 0);
    };
    const handleMouseUp = () => {
      isDragging = false;
    };
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Wheel zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRadius = Math.max(15, Math.min(45, cameraRadius + e.deltaY * 0.02));
      camera.position.x = Math.sin(cameraAngle) * cameraRadius;
      camera.position.z = Math.cos(cameraAngle) * cameraRadius;
      camera.lookAt(0, 0, 0);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Move train marker continuously along Blue Line endpoints (Central MAS to Airport MAA)
      const pA = stationPositionsMap.get(4) || new THREE.Vector3(-4, 0.2, 4);
      const pB = stationPositionsMap.get(16) || new THREE.Vector3(4, 0.2, -6);
      const t = (Math.sin(elapsed * 0.6) + 1) / 2;
      movingTrain.position.lerpVectors(pA, pB, t);
      movingTrain.position.y = 0.35;
      movingTrain.lookAt(pB.x, 0.35, pB.z);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [stations, connections, highlightStationIds, selectedSourceId, selectedDestId, viewMode, theme]);

  return (
    <div className={`relative w-full h-[520px] rounded-2xl overflow-hidden border transition-colors ${
      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300 shadow-inner'
    }`}>
      {/* View Controls Overlay */}
      <div className={`absolute top-4 left-4 z-20 flex items-center gap-2 backdrop-blur-md px-3 py-2 rounded-xl border text-xs shadow-md ${
        isDark ? 'bg-slate-900/80 border-slate-700/60 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-800'
      }`}>
        <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>View:</span>
        <button
          onClick={() => setViewMode('3d')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            viewMode === '3d'
              ? 'bg-cyan-600 text-white font-semibold shadow-xs'
              : (isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100')
          }`}
        >
          3D Spatial Network
        </button>
        <button
          onClick={() => setViewMode('2d')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            viewMode === '2d'
              ? 'bg-cyan-600 text-white font-semibold shadow-xs'
              : (isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100')
          }`}
        >
          2D Schematic Map
        </button>
      </div>

      <div className={`absolute top-4 right-4 z-20 hidden sm:flex flex-wrap items-center gap-3 backdrop-blur-md px-4 py-2 rounded-xl border text-xs shadow-md ${
        isDark ? 'bg-slate-900/80 border-slate-700/60 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
          <span>Blue Line</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span>Green Line</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
          <span className="font-semibold text-orange-500">Orange Line (Poonamallee)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] ring-1 ring-cyan-400" />
          <span>Interchanges (Central, Alandur, Vadapalani)</span>
        </div>
      </div>

      {viewMode === '3d' ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* 2D Schematic Fallback Map */
        <div className={`w-full h-full p-6 flex flex-col justify-between overflow-y-auto ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-cyan-800/40' : 'bg-white border-blue-200 shadow-xs'
            }`}>
              <h4 className="text-xs font-bold text-blue-500 mb-1">Corridor 1 · Blue Line (26 Stations)</h4>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Wimco Nagar Depot ↔ High Court ↔ Central MAS ↔ Alandur ↔ Airport
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-emerald-800/40' : 'bg-white border-emerald-200 shadow-xs'
            }`}>
              <h4 className="text-xs font-bold text-emerald-500 mb-1">Corridor 2 · Green Line (17 Stations)</h4>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Central MAS ↔ Shenoy Nagar ↔ CMBT ↔ Vadapalani ↔ St. Thomas Mount
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-orange-800/40' : 'bg-white border-orange-200 shadow-xs'
            }`}>
              <h4 className="text-xs font-bold text-orange-500 mb-1">Corridor 4 · Orange Line (10 Stations)</h4>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Poonamallee Bypass ↔ Kumananchavadi ↔ Porur ↔ Vadapalani Interchange
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stations.map((st) => (
              <button
                key={st.station_id}
                onClick={() => setActiveStation(st)}
                className={`p-2.5 rounded-lg text-left text-xs transition-colors border ${
                  activeStation?.station_id === st.station_id
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-500 font-bold'
                    : (isDark
                        ? 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 shadow-xs')
                }`}
              >
                <div className="font-semibold truncate">{st.station_name}</div>
                <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {st.station_code} {st.is_interchange ? '· Interchange' : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Station Inspection Card */}
      {activeStation && (
        <div className={`absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-30 p-4 rounded-xl backdrop-blur-md border shadow-2xl transition-all ${
          isDark
            ? 'bg-slate-900/95 border-cyan-500/40 text-slate-100 shadow-black'
            : 'bg-white/95 border-cyan-500/40 text-slate-900 shadow-slate-300'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-cyan-500">{activeStation.station_code}</span>
                {activeStation.is_interchange && (
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                    isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                  }`}>
                    Interchange Hub
                  </span>
                )}
              </div>
              <h4 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {activeStation.station_name}
              </h4>
            </div>
            <button
              onClick={() => setActiveStation(null)}
              className={`text-sm p-1 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              aria-label="Close station details"
            >
              ✕
            </button>
          </div>

          <div className={`text-xs mb-3 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <p><span className="text-slate-400">Coordinates:</span> {activeStation.latitude.toFixed(4)}°N, {activeStation.longitude.toFixed(4)}°E</p>
            <p><span className="text-slate-400">Status:</span> <span className="text-emerald-500 font-semibold">Operational CMRL</span></p>
          </div>

          <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={() => {
                onSelectStation?.(activeStation, 'source');
                setActiveStation(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs text-center transition-colors shadow-xs"
            >
              Set Origin
            </button>
            <button
              onClick={() => {
                onSelectStation?.(activeStation, 'destination');
                setActiveStation(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs text-center transition-colors shadow-xs"
            >
              Set Destination
            </button>
          </div>
        </div>
      )}

      {/* Helper hint */}
      <div className={`absolute bottom-3 left-4 z-10 text-[11px] hidden md:block pointer-events-none ${
        isDark ? 'text-slate-500' : 'text-slate-600'
      }`}>
        Tip: Click any station node to inspect details or set journey endpoints. Drag to rotate 3D camera.
      </div>
    </div>
  );
};
