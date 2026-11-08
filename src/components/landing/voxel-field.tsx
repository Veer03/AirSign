"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useInView } from "motion/react";
import * as THREE from "three";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { flags } from "@/lib/flags";
import { VoxelFallback } from "./voxel-fallback";

const COUNT = 49;
const SPACING = 0.62;

function baseHeights(): number[] {
  return Array.from({ length: COUNT }, (_, index) => 0.35 + ((index * 3) % 5) * 0.22);
}

function VoxelGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [heights, setHeights] = useState<number[]>(baseHeights);
  const target = useRef<number[]>(baseHeights());
  const current = useRef<number[]>(baseHeights());
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.5, 0.5, 0.5), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.32,
        metalness: 0.18,
        emissive: new THREE.Color("#071318"),
        emissiveIntensity: 0.6,
      }),
    [],
  );

  useEffect(() => {
    target.current = heights;
  }, [heights]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    for (let index = 0; index < COUNT; index += 1) {
      if (index % 11 === 0) {
        color.set("#f5a524");
      } else {
        color.setHSL(0.5 + (index % 7) * 0.008, 0.82, 0.58);
      }
      mesh.setColorAt(index, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = state.clock.elapsedTime;
    const blend = Math.min(1, delta * 7);

    for (let index = 0; index < COUNT; index += 1) {
      current.current[index] += (target.current[index] - current.current[index]) * blend;
      const column = index % 7;
      const row = Math.floor(index / 7);
      const height = Math.max(0.08, current.current[index]);

      dummy.position.set(
        (column - 3) * SPACING,
        height / 2 - 0.85 + Math.sin(time * 1.1 + index * 0.7) * 0.018,
        (row - 3) * SPACING,
      );
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  function bump(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    const index = event.instanceId;
    if (index === undefined) return;
    setHeights((previous) =>
      previous.map((height, currentIndex) => {
        if (currentIndex !== index) return height;
        return height > 1.55 ? 0.35 : Math.min(2.3, height + 0.34);
      }),
    );
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, COUNT]}
      onClick={bump}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    />
  );
}

export function VoxelField() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { margin: "180px" });

  if (!flags.landing3d || reduced) {
    return (
      <div ref={containerRef} className="h-full w-full">
        <VoxelFallback />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [4.4, 4.6, 5.4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={inView ? "always" : "never"}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 8, 4]} intensity={2.4} color="#22d3ee" />
        <directionalLight position={[-6, 4, -5]} intensity={1.2} color="#2dd4bf" />
        <directionalLight position={[0, 6, 0]} intensity={0.5} color="#ffffff" />
        <VoxelGrid />
        <ContactShadows
          position={[0, -0.92, 0]}
          opacity={0.4}
          scale={11}
          blur={2.4}
          far={4}
          resolution={256}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.65}
          minPolarAngle={0.55}
          maxPolarAngle={1.45}
        />
      </Canvas>
    </div>
  );
}
