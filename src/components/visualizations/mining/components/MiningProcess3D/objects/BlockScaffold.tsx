"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";

const BLOCK_SIZE: [number, number, number] = [2, 1.5, 1.2];
const BLOCK_POSITION: [number, number, number] = [0, 0.75, 0];

interface Props {
  stageRef: React.RefObject<MiningStage>;
  stageProgressRef: React.MutableRefObject<number>;
}

export default function BlockScaffold({ stageRef, stageProgressRef }: Props) {
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const solidRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);
  const wireOpacity = useRef(0);
  const solidOpacity = useRef(0);
  const [labelText, setLabelText] = useState("Kandidaten-Block");

  const geometry = useMemo(() => new THREE.BoxGeometry(...BLOCK_SIZE), []);

  useFrame(() => {
    const stage = stageRef.current ?? "idle";
    const progress = stageProgressRef.current;

    // Wireframe: fades in during mempool, stays through mining and chain-connect
    const wireTarget =
      stage === "idle"
        ? 0
        : stage === "mempool"
          ? Math.min(progress * 3, 0.4)
          : stage === "assembly"
            ? 0.4 + progress * 0.5
            : stage === "header" || stage === "nonce-search"
              ? 0.8
              : stage === "found" || stage === "chain-connect" || stage === "complete"
                ? 0.6
                : 0;

    wireOpacity.current += (wireTarget - wireOpacity.current) * 0.05;

    if (wireframeRef.current) {
      wireframeRef.current.visible = wireOpacity.current > 0.01;
      const mat = wireframeRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = wireOpacity.current;
    }

    // Solid fill: fades in on "found", stays through chain-connect/complete
    const solidTarget =
      stage === "found"
        ? Math.min(progress * 2, 0.85)
        : stage === "chain-connect" || stage === "complete"
          ? 0.85
          : 0;

    solidOpacity.current += (solidTarget - solidOpacity.current) * 0.04;

    if (solidRef.current) {
      solidRef.current.visible = solidOpacity.current > 0.01;
      const mat = solidRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = solidOpacity.current;
      mat.emissiveIntensity = solidOpacity.current * 0.3;
    }

    // Glow pulse on found/chain-connect
    if (glowRef.current) {
      const showGlow = stage === "found" || stage === "chain-connect";
      const glowTarget = showGlow ? 0.1 : 0;
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity += (glowTarget - mat.opacity) * 0.05;
      glowRef.current.visible = mat.opacity > 0.005;
      if (showGlow) {
        const scale = 1 + Math.sin(Date.now() * 0.004) * 0.02;
        glowRef.current.scale.setScalar(scale);
      }
    }

    // Label: visible during assembly through complete, text changes for chain-connect
    if (labelRef.current) {
      const showLabel =
        stage === "assembly" ||
        stage === "header" ||
        stage === "nonce-search" ||
        stage === "found" ||
        stage === "chain-connect" ||
        stage === "complete";
      labelRef.current.visible = showLabel;
    }

    // Switch label text when entering chain-connect
    const newLabel =
      stage === "chain-connect" || stage === "complete"
        ? "#840,002 (NEU)"
        : "Kandidaten-Block";
    if (newLabel !== labelText) setLabelText(newLabel);
  });

  return (
    <group position={BLOCK_POSITION}>
      {/* Wireframe scaffold */}
      <lineSegments ref={wireframeRef} visible={false}>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial
          color={THREE_COLORS.accentPrimary}
          transparent
          opacity={0}
        />
      </lineSegments>

      {/* Solid fill */}
      <mesh ref={solidRef} visible={false}>
        <boxGeometry args={BLOCK_SIZE} />
        <meshStandardMaterial
          color={THREE_COLORS.bgCard}
          emissive={new THREE.Color(THREE_COLORS.accentPrimary)}
          emissiveIntensity={0}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} visible={false}>
        <boxGeometry args={[2.4, 1.8, 1.5]} />
        <meshBasicMaterial
          color={THREE_COLORS.accentPrimary}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>

      {/* Label */}
      <group ref={labelRef} visible={false}>
        <Text
          position={[0, -1.1, 0]}
          fontSize={0.15}
          color={labelText === "Kandidaten-Block" ? "#94a3b8" : "#22d3ee"}
          anchorX="center"
          anchorY="top"
        >
          {labelText}
        </Text>
      </group>
    </group>
  );
}
