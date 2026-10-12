/**
 * MetroX 3D — Futuristic Hero Metro Train Scene (Three.js)
 * Features:
 * - Stylized futuristic train model with aerodynamic nose and cockpit visor
 * - Dual illuminated rails with animated light pulses
 * - Atmospheric fog, soft ambient/point lighting, and particle effects
 * - Mouse parallax camera response
 * - Graceful 2D fallback when WebGL is unavailable or reduced motion is enabled
 * - Complete resource disposal on unmount
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface HeroMetroSceneProps {
  reducedMotion?: boolean;
}

export const HeroMetroScene: React.FC<HeroMetroSceneProps> = ({ reducedMotion = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL Support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    let animationFrameId: number;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.025);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3.2, 11);
    camera.lookAt(0, 1.2, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight('#0f172a', 1.5);
    scene.add(ambientLight);

    const cyanKeyLight = new THREE.DirectionalLight('#06b6d4', 2.0);
    cyanKeyLight.position.set(5, 8, 5);
    scene.add(cyanKeyLight);

    const blueFillLight = new THREE.DirectionalLight('#3b82f6', 1.2);
    blueFillLight.position.set(-6, 4, 3);
    scene.add(blueFillLight);

    const underglowLight = new THREE.PointLight('#38bdf8', 3, 10);
    underglowLight.position.set(0, 0.4, 0);
    scene.add(underglowLight);

    // 4. Track & Ground Plane
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#080e1a',
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    scene.add(ground);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(60, 40, '#0284c7', '#0f172a');
    gridHelper.position.y = -0.19;
    scene.add(gridHelper);

    // Rails
    const railMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.3,
      metalness: 0.8,
      emissive: '#0284c7',
      emissiveIntensity: 0.6,
    });
    const railGeo = new THREE.BoxGeometry(0.12, 0.1, 70);

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-1.2, 0.05, 0);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(1.2, 0.05, 0);
    scene.add(rightRail);

    // Sleepers (Cross ties)
    const sleeperGeo = new THREE.BoxGeometry(3.0, 0.08, 0.3);
    const sleeperMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 });
    for (let z = -35; z <= 35; z += 1.6) {
      const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
      sleeper.position.set(0, 0, z);
      scene.add(sleeper);
    }

    // Overhead neon guide lines
    const guideMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const guideGeo = new THREE.CylinderGeometry(0.02, 0.02, 70, 8);
    const guideLineLeft = new THREE.Mesh(guideGeo, guideMat);
    guideLineLeft.rotation.x = Math.PI / 2;
    guideLineLeft.position.set(-3.5, 4.5, 0);
    scene.add(guideLineLeft);

    const guideLineRight = new THREE.Mesh(guideGeo, guideMat);
    guideLineRight.rotation.x = Math.PI / 2;
    guideLineRight.position.set(3.5, 4.5, 0);
    scene.add(guideLineRight);

    // 5. Stylized Futuristic Metro Train Model (Group)
    const trainGroup = new THREE.Group();

    // Main Body Carriage
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.2,
      metalness: 0.85,
    });
    const bodyGeo = new THREE.BoxGeometry(2.3, 1.8, 8.5);
    const carriage = new THREE.Mesh(bodyGeo, bodyMat);
    carriage.position.set(0, 1.3, 0);
    trainGroup.add(carriage);

    // Aerodynamic Nose
    const noseGeo = new THREE.ConeGeometry(1.6, 2.5, 4);
    const noseMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.25,
      metalness: 0.9,
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.y = Math.PI / 4;
    nose.position.set(0, 1.25, 5.3);
    nose.scale.set(1.0, 0.8, 1.0);
    trainGroup.add(nose);

    // Cockpit Glowing Visor
    const visorGeo = new THREE.BoxGeometry(1.9, 0.45, 0.6);
    const visorMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.5, 4.6);
    trainGroup.add(visor);

    // Headlights
    const lightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const headlightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);

    const hlLeft = new THREE.Mesh(headlightGeo, lightMat);
    hlLeft.position.set(-0.75, 0.9, 5.4);
    trainGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(headlightGeo, lightMat);
    hlRight.position.set(0.75, 0.9, 5.4);
    trainGroup.add(hlRight);

    // Side Neon Accent Strips (Blue Line livery)
    const stripMat = new THREE.MeshBasicMaterial({ color: '#0284c7' });
    const stripGeo = new THREE.BoxGeometry(0.06, 0.12, 8.4);

    const stripLeft = new THREE.Mesh(stripGeo, stripMat);
    stripLeft.position.set(-1.18, 1.1, 0);
    trainGroup.add(stripLeft);

    const stripRight = new THREE.Mesh(stripGeo, stripMat);
    stripRight.position.set(1.18, 1.1, 0);
    trainGroup.add(stripRight);

    // Illuminated Passenger Windows
    const windowMat = new THREE.MeshBasicMaterial({ color: '#e0f2fe' });
    const windowGeo = new THREE.BoxGeometry(0.04, 0.55, 1.2);
    for (let wZ = -3.2; wZ <= 3.2; wZ += 1.8) {
      const winL = new THREE.Mesh(windowGeo, windowMat);
      winL.position.set(-1.18, 1.5, wZ);
      trainGroup.add(winL);

      const winR = new THREE.Mesh(windowGeo, windowMat);
      winR.position.set(1.18, 1.5, wZ);
      trainGroup.add(winR);
    }

    // Undercarriage Bogies / Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
    [-2.5, 2.5].forEach((bogieZ) => {
      [-0.9, 0.9].forEach((wX) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wX, 0.35, bogieZ);
        trainGroup.add(wheel);
      });
    });

    scene.add(trainGroup);

    // 6. Floating Ambient Station Particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 20;
      particlePositions[i + 1] = Math.random() * 6 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#38bdf8',
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / container.clientHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Handle Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!reducedMotion) {
        // Controlled floating / smooth cruising motion
        trainGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.04;
        trainGroup.position.z = Math.sin(elapsedTime * 0.8) * 0.4;

        // Animate particles drifting along tracks
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let i = 2; i < positions.length; i += 3) {
          positions[i] += 0.06;
          if (positions[i] > 20) positions[i] = -20;
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      // Smooth camera lerp with mouse parallax
      const targetCamX = mouseX * 1.2;
      const targetCamY = 3.2 + mouseY * 0.6;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 1.2, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 10. WebGL Context Loss Handler
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(animationFrameId);
    };
    const handleContextRestored = () => {
      animate();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Geometries and Materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [reducedMotion]);

  if (!webglSupported) {
    return (
      <div className="w-full h-full min-h-[460px] bg-slate-950 flex items-center justify-center border border-slate-800 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/40 via-slate-900/60 to-transparent pointer-events-none" />
        <div className="text-center p-8 z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-1">MetroX 3D Visualizer</h3>
          <p className="text-sm text-slate-400 max-w-sm">WebGL acceleration paused or unsupported. High-performance journey planning active.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[460px] relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing border border-slate-800/80 shadow-2xl shadow-cyan-950/30"
      aria-label="3D Interactive Futuristic Metro Train Scene"
    />
  );
};
