"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { FIELD_HEX_COLORS } from "../../../constants";
import { THREE_COLORS } from "../../../constants";
import type { BlockHeaderData, MiningStage } from "../../../types";

const HEADER_FIELDS: (keyof BlockHeaderData)[] = [
  "version",
  "prevHash",
  "merkleRoot",
  "timestamp",
  "bits",
  "nonce",
];

const FIELD_LABELS: Record<keyof BlockHeaderData, string> = {
  version: "Version",
  prevHash: "Prev Hash",
  merkleRoot: "Merkle Root",
  timestamp: "Timestamp",
  bits: "Bits",
  nonce: "Nonce",
};

const FIELD_WIDTHS: Record<keyof BlockHeaderData, number> = {
  version: 0.55,
  prevHash: 1.3,
  merkleRoot: 1.3,
  timestamp: 0.55,
  bits: 0.55,
  nonce: 0.65,
};

const BAR_Y = 3.8;
const BAR_HEIGHT = 0.45;

interface Props {
  stageRef: React.RefObject<MiningStage>;
  stageProgressRef: React.MutableRefObject<number>;
}

export default function HeaderBar({ stageRef, stageProgressRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const connectionLineRef = useRef<THREE.Group>(null);
  const overallOpacity = useRef(0);
  const nonceTextRef = useRef<THREE.Group>(null);

  // Connection line from Merkle Root (tree) to header
  useEffect(() => {
    if (!connectionLineRef.current) return;
    const from = new THREE.Vector3(0, 3.5, 0.3); // Merkle root position
    const to = new THREE.Vector3(0.05, BAR_Y - BAR_HEIGHT / 2, 0); // Merkle root segment
    const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineDashedMaterial({
      color: THREE_COLORS.accentSuccess,
      transparent: true,
      opacity: 0.5,
      dashSize: 0.1,
      gapSize: 0.05,
      toneMapped: false,
    });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    connectionLineRef.current.add(line);
    return () => {
      geom.dispose();
      mat.dispose();
      connectionLineRef.current?.remove(line);
    };
  }, []);

  const segments = useMemo(() => {
    const totalWidth =
      HEADER_FIELDS.reduce((acc, f) => acc + FIELD_WIDTHS[f], 0) +
      (HEADER_FIELDS.length - 1) * 0.06;
    const startX = -totalWidth / 2;
    // Compute cumulative x positions without mutation
    return HEADER_FIELDS.reduce<{ field: keyof BlockHeaderData; width: number; x: number }[]>((acc, field, i) => {
      const width = FIELD_WIDTHS[field];
      const prevEnd = i === 0 ? startX : acc[i - 1].x + acc[i - 1].width / 2 + 0.06;
      const pos = prevEnd + width / 2;
      acc.push({ field, width, x: pos });
      return acc;
    }, []);
  }, []);

  useFrame(() => {
    const stage = stageRef.current ?? "idle";
    const progress = stageProgressRef.current;

    // Smooth fade
    const targetOpacity =
      stage === "header" || stage === "nonce-search" || stage === "found"
        ? 1
        : stage === "chain-connect" || stage === "complete"
          ? 0.3
          : 0;

    overallOpacity.current += (targetOpacity - overallOpacity.current) * 0.04;

    if (!groupRef.current) return;
    groupRef.current.visible = overallOpacity.current > 0.01;
    if (!groupRef.current.visible) return;

    // Connection line visibility
    if (connectionLineRef.current) {
      connectionLineRef.current.visible =
        stage === "header" && progress > 0.2 && progress < 0.9;
    }

    // Animate each segment left-to-right during header stage
    materialsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const segStart = i / segments.length;
      const segEnd = (i + 1) / segments.length;

      let segOpacity: number;
      if (stage === "header") {
        // Staggered fill — each segment fills over its window
        const t = Math.max(0, Math.min(1, (progress - segStart) / (segEnd - segStart)));
        segOpacity = t;
      } else {
        segOpacity = 1;
      }

      mat.opacity = segOpacity * overallOpacity.current;

      // Emissive effects
      const isNonce = i === segments.length - 1;
      if (stage === "nonce-search" && isNonce) {
        // Nonce segment pulses rapidly during search
        mat.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.015) * 0.3;
      } else if (stage === "found" && isNonce) {
        mat.emissiveIntensity = 0.8;
        mat.emissive.setHex(THREE_COLORS.accentSuccess);
      } else {
        mat.emissiveIntensity = segOpacity * 0.35;
      }
    });

    // Nonce counter label visibility
    if (nonceTextRef.current) {
      nonceTextRef.current.visible = stage === "nonce-search" || stage === "found";
    }
  });

  return (
    <group ref={groupRef} position={[0, BAR_Y, 0]} visible={false}>
      {/* Title */}
      <Text
        position={[0, BAR_HEIGHT / 2 + 0.35, 0]}
        fontSize={0.13}
        color="#e2e8f0"
        anchorX="center"
        anchorY="bottom"
      >
        Block Header (80 Bytes)
      </Text>

      {segments.map(({ field, width, x }, i) => (
        <group key={field} position={[x, 0, 0]}>
          {/* Segment box */}
          <mesh
            ref={(el) => {
              if (el) materialsRef.current[i] = el.material as THREE.MeshStandardMaterial;
            }}
          >
            <boxGeometry args={[width, BAR_HEIGHT, 0.15]} />
            <meshStandardMaterial
              color={FIELD_HEX_COLORS[field]}
              emissive={new THREE.Color(FIELD_HEX_COLORS[field])}
              emissiveIntensity={0}
              transparent
              opacity={0}
              toneMapped={false}
            />
          </mesh>
          {/* Field label above */}
          <Text
            position={[0, BAR_HEIGHT / 2 + 0.1, 0.1]}
            fontSize={0.08}
            color="#94a3b8"
            anchorX="center"
            anchorY="bottom"
          >
            {FIELD_LABELS[field]}
          </Text>
        </group>
      ))}

      {/* Connection line from Merkle tree */}
      <group ref={connectionLineRef} />

      {/* Nonce counter during search */}
      <group ref={nonceTextRef} visible={false} />
    </group>
  );
}
