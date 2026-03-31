"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";

const PLANE_Y = 2.9;

interface Props {
  stageRef: React.RefObject<MiningStage>;
}

export default function TargetPlane({ stageRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const opacity = useRef(0);

  useFrame(() => {
    const stage = stageRef.current ?? "idle";
    const targetOpacity = stage === "nonce-search" ? 0.12 : stage === "found" ? 0.2 : 0;
    opacity.current += (targetOpacity - opacity.current) * 0.04;

    if (!groupRef.current) return;
    groupRef.current.visible = opacity.current > 0.005;

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity.current;
      if (stage === "nonce-search") {
        mat.opacity = opacity.current + Math.sin(Date.now() * 0.002) * 0.03;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, PLANE_Y, 0]} visible={false}>
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial
          color={THREE_COLORS.accentSuccess}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Target label */}
      <Text
        position={[2.8, 0, 0]}
        fontSize={0.12}
        color="#10b981"
        anchorX="left"
        anchorY="middle"
      >
        ← Target
      </Text>

      {/* Explanation */}
      <Text
        position={[2.8, -0.2, 0]}
        fontSize={0.08}
        color="#64748b"
        anchorX="left"
        anchorY="middle"
      >
        Hash muss darunter liegen
      </Text>
    </group>
  );
}
