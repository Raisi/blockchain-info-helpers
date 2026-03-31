"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";

const TX_COUNT = 40;
const SELECTED_COUNT = 8;
const CLOUD_CENTER = new THREE.Vector3(0, 5, 0);
const BLOCK_TARGET = new THREE.Vector3(0, 1, 0);

interface TxData {
  initialPos: THREE.Vector3;
  fee: number;
  selected: boolean;
  selectedIndex: number; // -1 if not selected, 0-7 for stagger timing
}

interface Props {
  stageRef: React.RefObject<MiningStage>;
  speedRef: React.RefObject<number>;
  stageProgressRef: React.MutableRefObject<number>;
  pausedRef: React.RefObject<boolean>;
}

export default function MempoolCloud({ stageRef, speedRef, stageProgressRef, pausedRef }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyMatrixRef = useRef(new THREE.Matrix4());
  const tempVecRef = useRef(new THREE.Vector3());
  const tempColorRef = useRef(new THREE.Color());
  const tempScaleRef = useRef(new THREE.Vector3());

  const [txData] = useState<TxData[]>(() => {
    const data: TxData[] = [];
    for (let i = 0; i < TX_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 2.5;
      data.push({
        initialPos: new THREE.Vector3(
          CLOUD_CENTER.x + r * Math.sin(phi) * Math.cos(theta),
          CLOUD_CENTER.y + r * Math.sin(phi) * Math.sin(theta) * 0.6,
          CLOUD_CENTER.z + r * Math.cos(phi)
        ),
        fee: Math.random(),
        selected: false,
        selectedIndex: -1,
      });
    }
    data.sort((a, b) => b.fee - a.fee);
    for (let i = 0; i < SELECTED_COUNT; i++) {
      data[i].selected = true;
      data[i].selectedIndex = i;
    }
    return data;
  });

  // Grid positions inside block for selected TXs
  const gridPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < SELECTED_COUNT; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      positions.push(new THREE.Vector3(-0.45 + col * 0.3, 0.4 + row * 0.4, 0));
    }
    return positions;
  }, []);

  const fadeRef = useRef(1); // overall fade for non-selected during mempool

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const stage = stageRef.current ?? "idle";
    const speed = speedRef.current ?? 1;
    const progress = stageProgressRef.current;
    const time = Date.now() * 0.001;
    const tempVec = tempVecRef.current;
    const tempColor = tempColorRef.current;
    const tempScale = tempScaleRef.current;
    const dummyMatrix = dummyMatrixRef.current;

    for (let i = 0; i < TX_COUNT; i++) {
      const tx = txData[i];
      const baseSize = 0.1 + tx.fee * 0.14;
      let opacity = 1;
      let size = baseSize;

      if (stage === "idle") {
        // All floating gently
        tempVec.copy(tx.initialPos);
        tempVec.x += Math.sin(time * 0.4 + i * 1.3) * 0.15;
        tempVec.y += Math.sin(time * 0.6 + i * 0.9) * 0.12;
        tempVec.z += Math.cos(time * 0.3 + i * 1.1) * 0.15;
      } else if (stage === "mempool") {
        if (tx.selected) {
          // Phase 1 (0-0.3): Highlight — grow and glow
          // Phase 2 (0.3-1.0): Fly toward block one-by-one with stagger
          const highlightEnd = 0.3;
          const flyStart = highlightEnd + tx.selectedIndex * 0.07; // staggered
          const flyEnd = Math.min(flyStart + 0.25, 1);

          if (progress < highlightEnd) {
            // Pulsing highlight
            const p = progress / highlightEnd;
            size = baseSize * (1 + p * 0.5);
            tempVec.copy(tx.initialPos);
            tempVec.x += Math.sin(time * 0.4 + i * 1.3) * 0.15;
            tempVec.y += Math.sin(time * 0.6 + i * 0.9) * 0.12;
            tempVec.z += Math.cos(time * 0.3 + i * 1.1) * 0.15;
          } else if (progress < flyStart) {
            // Waiting to fly — still highlighted
            size = baseSize * 1.5;
            tempVec.copy(tx.initialPos);
          } else {
            // Flying toward block with arc
            const t = Math.min((progress - flyStart) / (flyEnd - flyStart), 1);
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
            const target = gridPositions[tx.selectedIndex];
            tempVec.lerpVectors(tx.initialPos, target, eased);
            // Arc upward in the middle
            tempVec.y += Math.sin(eased * Math.PI) * 1.5;
            size = baseSize * (1.5 - eased * 0.5); // shrink slightly as it arrives
          }
        } else {
          // Non-selected: fade out gradually
          opacity = Math.max(0, 1 - progress * 2);
          size = baseSize * opacity;
          tempVec.copy(tx.initialPos);
          tempVec.x += Math.sin(time * 0.4 + i * 1.3) * 0.15;
          tempVec.y += Math.sin(time * 0.6 + i * 0.9) * 0.12 - progress * 0.5;
          tempVec.z += Math.cos(time * 0.3 + i * 1.1) * 0.15;
        }
      } else if (stage === "assembly" && tx.selected) {
        // Settled in block, gentle bob
        const target = gridPositions[tx.selectedIndex];
        tempVec.copy(target);
        tempVec.y += Math.sin(time * 2 + tx.selectedIndex * 0.5) * 0.02;
        size = baseSize;
      } else if (
        (stage === "header" || stage === "nonce-search" || stage === "found") &&
        tx.selected
      ) {
        // Still visible inside block, dimmed
        const target = gridPositions[tx.selectedIndex];
        tempVec.copy(target);
        opacity = 0.4;
        size = baseSize * 0.8;
      } else {
        // Hidden
        opacity = 0;
        size = 0;
        tempVec.set(0, -100, 0);
      }

      // Apply matrix
      if (size > 0.001) {
        dummyMatrix.makeTranslation(tempVec.x, tempVec.y, tempVec.z);
        tempScale.set(size, size, size);
        dummyMatrix.scale(tempScale);
      } else {
        dummyMatrix.makeScale(0, 0, 0);
      }
      mesh.setMatrixAt(i, dummyMatrix);

      // Color
      if (stage === "mempool" && tx.selected && progress > 0.1) {
        tempColor.setHex(THREE_COLORS.accentWarning); // Gold highlight for selected
      } else {
        tempColor.setHex(THREE_COLORS.accentPrimary).multiplyScalar(0.2 + tx.fee * 0.5);
      }
      // Apply opacity via color brightness
      tempColor.multiplyScalar(Math.max(opacity, 0.05));
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TX_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        transparent
        opacity={0.8}
        emissive={new THREE.Color(THREE_COLORS.accentPrimary)}
        emissiveIntensity={0.4}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
