"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";

const MACHINE_POS: [number, number, number] = [0, 2.2, 0];

interface Props {
  stageRef: React.RefObject<MiningStage>;
  pausedRef: React.RefObject<boolean>;
  lastHashRef: React.RefObject<string | null>;
}

export default function HashMachine({ stageRef, pausedRef, lastHashRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const rotationSpeed = useRef(0);
  const opacity = useRef(0);
  const [displayHash, setDisplayHash] = useState<string | null>(null);
  const hashUpdateTimer = useRef(0);

  // Arrow line from header bar to hash machine
  const arrowGroupRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!arrowGroupRef.current) return;
    const from = new THREE.Vector3(0, 3.55, 0);
    const to = new THREE.Vector3(0, 2.9, 0);
    const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({
      color: THREE_COLORS.accentPrimary,
      transparent: true,
      opacity: 0.4,
      toneMapped: false,
    });
    const line = new THREE.Line(geom, mat);
    arrowGroupRef.current.add(line);

    const arrowGeom = new THREE.ConeGeometry(0.06, 0.12, 6);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: THREE_COLORS.accentPrimary,
      transparent: true,
      opacity: 0.5,
      toneMapped: false,
    });
    const arrowMesh = new THREE.Mesh(arrowGeom, arrowMat);
    arrowMesh.position.copy(to);
    arrowMesh.rotation.x = Math.PI;
    arrowGroupRef.current.add(arrowMesh);

    return () => {
      geom.dispose(); mat.dispose(); arrowGeom.dispose(); arrowMat.dispose();
      arrowGroupRef.current?.remove(line);
      arrowGroupRef.current?.remove(arrowMesh);
    };
  }, []);

  useFrame((_, delta) => {
    const stage = stageRef.current ?? "idle";
    const paused = pausedRef.current ?? false;
    const isSearching = stage === "nonce-search";
    const isFound = stage === "found";

    const targetOpacity = isSearching ? 1 : isFound ? 0.8 : stage === "header" ? 0.3 : 0;
    opacity.current += (targetOpacity - opacity.current) * 0.04;

    if (!groupRef.current) return;
    groupRef.current.visible = opacity.current > 0.01;
    if (!groupRef.current.visible) return;

    if (arrowGroupRef.current) {
      arrowGroupRef.current.visible = isSearching || stage === "header";
    }

    // Update displayed hash periodically (not every frame — too fast to read)
    if (isSearching && !paused) {
      hashUpdateTimer.current += delta;
      if (hashUpdateTimer.current > 0.15) {
        hashUpdateTimer.current = 0;
        const h = lastHashRef.current;
        if (h) setDisplayHash(h);
      }
    } else if (isFound) {
      const h = lastHashRef.current;
      if (h && displayHash !== h) setDisplayHash(h);
    }

    // Rotation — freeze when paused
    if (!paused) {
      if (isSearching) {
        rotationSpeed.current = Math.min(rotationSpeed.current + delta * 1.5, 3);
      } else if (isFound) {
        rotationSpeed.current *= 0.96;
      } else {
        rotationSpeed.current = Math.max(rotationSpeed.current * 0.95, 0.15);
      }
    }

    if (meshRef.current) {
      if (!paused) {
        meshRef.current.rotation.x += delta * rotationSpeed.current;
        meshRef.current.rotation.y += delta * rotationSpeed.current * 0.6;
      }

      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity.current * 0.7;
      if (isFound) {
        mat.emissive.setHex(THREE_COLORS.accentSuccess);
        mat.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.2;
      } else if (isSearching) {
        mat.emissive.setHex(THREE_COLORS.accentPrimary);
        mat.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.008) * 0.15;
      } else {
        mat.emissive.setHex(THREE_COLORS.accentPrimary);
        mat.emissiveIntensity = 0.15;
      }
    }

    if (innerRef.current && !paused) {
      innerRef.current.rotation.x -= delta * rotationSpeed.current * 1.2;
      innerRef.current.rotation.z += delta * rotationSpeed.current * 0.4;
      const mat = innerRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity.current * 0.5;
    }
  });

  // Track stage in state for render, updated from useFrame
  const [renderStage, setRenderStage] = useState<MiningStage>("idle");

  // Sync renderStage from the ref inside useFrame (already happening above via stageRef)
  // We update renderStage in a separate effect-like approach inside useFrame
  const prevStageRef = useRef<MiningStage>("idle");
  useFrame(() => {
    const currentStage = stageRef.current ?? "idle";
    if (currentStage !== prevStageRef.current) {
      prevStageRef.current = currentStage;
      setRenderStage(currentStage);
    }
  });

  const isSearching = renderStage === "nonce-search";
  const isFound = renderStage === "found";

  return (
    <group ref={groupRef} position={MACHINE_POS} visible={false}>
      {/* "SHA-256d" label */}
      <Text position={[0, -0.9, 0]} fontSize={0.14} color="#8b5cf6" anchorX="center" anchorY="top" fontWeight="bold">
        SHA-256d
      </Text>

      {/* Input label */}
      <Text position={[0.8, 0.7, 0]} fontSize={0.08} color="#64748b" anchorX="left" anchorY="middle">
        {"Input: Header\nmit aktueller Nonce"}
      </Text>

      {/* Output: Hash display — shown as HTML overlay for readability */}
      {(isSearching || isFound) && displayHash && (
        <Html position={[-0.3, -1.3, 0]} center style={{ pointerEvents: "none", width: 280 }}>
          <div style={{
            background: "rgba(10, 14, 23, 0.9)",
            border: "1px solid rgba(30, 41, 59, 0.8)",
            borderRadius: 8,
            padding: "8px 12px",
            fontFamily: "monospace",
            fontSize: 11,
            backdropFilter: "blur(4px)",
          }}>
            <div style={{ color: "#64748b", marginBottom: 4 }}>Output:</div>
            <div style={{
              color: isFound ? "#10b981" : "#ef4444",
              wordBreak: "break-all",
              lineHeight: 1.4,
            }}>
              <span style={{ color: "#10b981" }}>
                {displayHash.match(/^0*/)?.[0] ?? ""}
              </span>
              <span style={{ color: isFound ? "#10b981" : "#94a3b8" }}>
                {displayHash.slice(displayHash.match(/^0*/)?.[0]?.length ?? 0)}
              </span>
            </div>
            <div style={{
              color: isFound ? "#10b981" : "#ef4444",
              fontSize: 10,
              marginTop: 4,
              fontWeight: 600,
            }}>
              {isFound ? "< Target — gültig!" : "> Target — ungültig, nächste Nonce..."}
            </div>
          </div>
        </Html>
      )}

      {/* Arrow from header */}
      <group ref={arrowGroupRef} />

      {/* Outer torus knot */}
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[0.55, 0.12, 128, 16]} />
        <meshStandardMaterial
          color={THREE_COLORS.accentPrimary}
          emissive={new THREE.Color(THREE_COLORS.accentPrimary)}
          emissiveIntensity={0.2}
          wireframe
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>

      {/* Inner icosahedron */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshStandardMaterial
          color={THREE_COLORS.accentSecondary}
          emissive={new THREE.Color(THREE_COLORS.accentSecondary)}
          emissiveIntensity={0.3}
          wireframe
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
