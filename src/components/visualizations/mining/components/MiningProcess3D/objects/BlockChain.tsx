"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";

const BLOCK_SIZE: [number, number, number] = [2, 1.5, 1.2];
const BLOCK_SPACING = 3.5;
const CHAIN_Y = 0.75;

const PREV_BLOCK_POSITIONS = [
  new THREE.Vector3(-BLOCK_SPACING * 2, CHAIN_Y, 0),
  new THREE.Vector3(-BLOCK_SPACING, CHAIN_Y, 0),
];

interface Props {
  stageRef: React.RefObject<MiningStage>;
  stageProgressRef: React.MutableRefObject<number>;
}

export default function BlockChain({ stageRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const prevBlockRefs = useRef<(THREE.Group | null)[]>([]);
  const prevBlockOpacity = useRef(0);
  const chainLinkGroupRef = useRef<THREE.Group>(null);
  const newLinkGroupRef = useRef<THREE.Group>(null);
  const newLinkProgress = useRef(0);
  const prevStageRef = useRef<MiningStage>("idle");

  // Create chain link lines imperatively (between prev blocks)
  useEffect(() => {
    if (!chainLinkGroupRef.current) return;
    const lines: THREE.Line[] = [];

    const geom1 = new THREE.BufferGeometry().setFromPoints([
      PREV_BLOCK_POSITIONS[0],
      PREV_BLOCK_POSITIONS[1],
    ]);
    const mat1 = new THREE.LineBasicMaterial({
      color: THREE_COLORS.accentPrimary,
      transparent: true,
      opacity: 0.5,
      toneMapped: false,
    });
    const line1 = new THREE.Line(geom1, mat1);
    chainLinkGroupRef.current.add(line1);
    lines.push(line1);

    return () => {
      lines.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
        chainLinkGroupRef.current?.remove(l);
      });
    };
  }, []);

  // Create animated link from last prev block to the candidate block at [0, CHAIN_Y, 0]
  useEffect(() => {
    if (!newLinkGroupRef.current) return;

    const from = PREV_BLOCK_POSITIONS[1];
    const to = new THREE.Vector3(0, CHAIN_Y, 0);
    const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({
      color: THREE_COLORS.accentSuccess,
      transparent: true,
      opacity: 0,
      toneMapped: false,
      linewidth: 2,
    });
    const line = new THREE.Line(geom, mat);
    newLinkGroupRef.current.add(line);

    return () => {
      geom.dispose();
      mat.dispose();
      newLinkGroupRef.current?.remove(line);
    };
  }, []);

  useFrame((_, delta) => {
    const stage = stageRef.current ?? "idle";

    if (stage !== prevStageRef.current) {
      if (stage === "chain-connect") newLinkProgress.current = 0;
      prevStageRef.current = stage;
    }

    if (!groupRef.current) return;

    // Only visible during chain-connect and complete
    const prevTarget =
      stage === "chain-connect" || stage === "complete" ? 0.7 : 0;

    prevBlockOpacity.current += (prevTarget - prevBlockOpacity.current) * 0.03;

    groupRef.current.visible = prevBlockOpacity.current > 0.005;
    if (!groupRef.current.visible) return;

    // Update prev block materials
    prevBlockRefs.current.forEach((group) => {
      if (!group) return;
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.opacity = prevBlockOpacity.current;
        }
        if (child instanceof THREE.LineSegments) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.opacity = prevBlockOpacity.current * 0.5;
        }
      });
    });

    // Chain link between prev blocks
    if (chainLinkGroupRef.current) {
      chainLinkGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Line) {
          (child.material as THREE.LineBasicMaterial).opacity =
            prevBlockOpacity.current * 0.6;
        }
      });
    }

    // Animated link from last prev block to candidate block (BlockScaffold)
    if (newLinkGroupRef.current) {
      if (stage === "chain-connect") {
        newLinkProgress.current = Math.min(newLinkProgress.current + delta * 0.25, 1);
      }
      newLinkGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Line) {
          const mat = child.material as THREE.LineBasicMaterial;
          if (stage === "chain-connect") {
            mat.opacity = Math.min(newLinkProgress.current * 1.5, 0.7);
          } else if (stage === "complete") {
            mat.opacity = 0.5 + Math.sin(Date.now() * 0.003) * 0.15;
          } else {
            mat.opacity = 0;
          }
        }
      });
    }
  });

  const blockLabels = ["#840,000", "#840,001"];

  return (
    <group ref={groupRef} visible={false}>
      {/* Previous blocks */}
      {PREV_BLOCK_POSITIONS.map((pos, i) => (
        <group
          key={i}
          ref={(el) => { prevBlockRefs.current[i] = el; }}
          position={pos.toArray()}
        >
          <mesh>
            <boxGeometry args={BLOCK_SIZE} />
            <meshStandardMaterial
              color={THREE_COLORS.bgCard}
              emissive={new THREE.Color(THREE_COLORS.accentPrimary)}
              emissiveIntensity={0.05}
              transparent
              opacity={0}
              toneMapped={false}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...BLOCK_SIZE)]} />
            <lineBasicMaterial
              color={THREE_COLORS.accentPrimary}
              transparent
              opacity={0}
            />
          </lineSegments>
          <Text
            position={[0, -1.1, 0]}
            fontSize={0.12}
            color="#64748b"
            anchorX="center"
            anchorY="top"
          >
            {blockLabels[i]}
          </Text>
        </group>
      ))}

      {/* Chain links between prev blocks */}
      <group ref={chainLinkGroupRef} />

      {/* Animated link from last prev to candidate block */}
      <group ref={newLinkGroupRef} />

      {/* "Blockchain" label */}
      <Text
        position={[-BLOCK_SPACING, -1.6, 0]}
        fontSize={0.15}
        color="#64748b"
        anchorX="center"
        anchorY="top"
      >
        ← Blockchain
      </Text>
    </group>
  );
}
