"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";

const TREE_BASE_Y = 1.7;
const LEVEL_HEIGHT = 0.65;
const NODE_SPREAD_FACTOR = 0.45; // wider spread for readability

// Fake short hashes for educational display
const LEAF_HASHES = ["a3f2", "7b01", "c8e4", "12dd", "f901", "5a3c", "e7b2", "8d4f"];
const LEVEL1_HASHES = ["h(a3+7b)", "h(c8+12)", "h(f9+5a)", "h(e7+8d)"];
const LEVEL2_HASHES = ["h(L1a+L1b)", "h(L1c+L1d)"];
const ROOT_HASH = "MerkleRoot";

const ALL_HASHES = [...LEAF_HASHES, ...LEVEL1_HASHES, ...LEVEL2_HASHES, ROOT_HASH];

interface TreeNode {
  position: THREE.Vector3;
  level: number;
  index: number;
  hash: string;
}

interface Props {
  stageRef: React.RefObject<MiningStage>;
  stageProgressRef: React.MutableRefObject<number>;
  pausedRef: React.RefObject<boolean>;
}

export default function MerkleTree({ stageRef, stageProgressRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const labelRefs = useRef<(THREE.Group | null)[]>([]);
  const lineGroupRef = useRef<THREE.Group>(null);
  const titleRef = useRef<THREE.Group>(null);
  const overallOpacity = useRef(0);

  // 8 leaves → 4 → 2 → 1 root
  const nodes = useMemo<TreeNode[]>(() => {
    const result: TreeNode[] = [];
    const levels = [8, 4, 2, 1];
    let hashIdx = 0;
    levels.forEach((count, level) => {
      const spread = NODE_SPREAD_FACTOR * count;
      for (let i = 0; i < count; i++) {
        const x = -spread / 2 + (i + 0.5) * (spread / count);
        const y = TREE_BASE_Y + level * LEVEL_HEIGHT;
        result.push({
          position: new THREE.Vector3(x, y, 0.4),
          level,
          index: i,
          hash: ALL_HASHES[hashIdx++],
        });
      }
    });
    return result;
  }, []);

  // Connection lines (child pairs → parent)
  const lineData = useMemo(() => {
    const result: { from: THREE.Vector3; to: THREE.Vector3; level: number }[] = [];
    const levels = [8, 4, 2, 1];
    let offset = 0;
    for (let level = 0; level < levels.length - 1; level++) {
      const parentOffset = offset + levels[level];
      for (let i = 0; i < levels[level]; i += 2) {
        const child1 = nodes[offset + i];
        const child2 = nodes[offset + i + 1];
        const parent = nodes[parentOffset + Math.floor(i / 2)];
        if (child1 && parent) result.push({ from: child1.position, to: parent.position, level: level + 1 });
        if (child2 && parent) result.push({ from: child2.position, to: parent.position, level: level + 1 });
      }
      offset += levels[level];
    }
    return result;
  }, [nodes]);

  // Create line objects imperatively
  const lineObjsRef = useRef<THREE.Line[]>([]);
  useEffect(() => {
    if (!lineGroupRef.current) return;
    lineObjsRef.current.forEach((l) => {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    lineObjsRef.current = [];

    lineData.forEach(({ from, to }) => {
      const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
      const mat = new THREE.LineBasicMaterial({
        color: THREE_COLORS.accentSuccess,
        transparent: true,
        opacity: 0,
        toneMapped: false,
      });
      const line = new THREE.Line(geom, mat);
      lineObjsRef.current.push(line);
      lineGroupRef.current!.add(line);
    });

    return () => {
      lineObjsRef.current.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
        lineGroupRef.current?.remove(l);
      });
    };
  }, [lineData]);

  const rootNodeIndex = nodes.length - 1;

  useFrame(() => {
    const stage = stageRef.current ?? "idle";
    const progress = stageProgressRef.current;

    const targetOpacity =
      stage === "assembly" || stage === "header"
        ? 1
        : stage === "nonce-search" || stage === "found"
          ? 0.5
          : stage === "chain-connect" || stage === "complete"
            ? 0.2
            : 0;

    overallOpacity.current += (targetOpacity - overallOpacity.current) * 0.04;

    if (!groupRef.current) return;
    groupRef.current.visible = overallOpacity.current > 0.01;
    if (!groupRef.current.visible) return;

    // Animate nodes level-by-level
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const node = nodes[i];
      const isRoot = i === rootNodeIndex;

      // Each level appears at a different time during assembly:
      // Level 0 (leaves): 0.1–0.3
      // Level 1: 0.3–0.5
      // Level 2: 0.5–0.7
      // Level 3 (root): 0.7–0.9
      const levelStart = 0.1 + node.level * 0.2;
      const levelEnd = levelStart + 0.2;

      let nodeScale: number;
      if (stage === "assembly") {
        const t = Math.max(0, Math.min(1, (progress - levelStart) / (levelEnd - levelStart)));
        // Overshoot effect
        nodeScale = t < 1 ? t * (2.2 - 1.2 * t) : 1;
      } else if (overallOpacity.current > 0.01) {
        nodeScale = 1;
      } else {
        nodeScale = 0;
      }

      const baseSize = isRoot ? 2.0 : node.level === 0 ? 0.8 : 1.2;
      mesh.scale.setScalar(nodeScale * baseSize);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isRoot && stage === "assembly" && progress > 0.85) {
        mat.emissiveIntensity = 0.7 + Math.sin(Date.now() * 0.006) * 0.3;
      } else if (isRoot) {
        mat.emissiveIntensity = 0.6;
      } else {
        mat.emissiveIntensity = nodeScale * 0.35;
      }
      mat.opacity = overallOpacity.current;
    });

    // Hash labels appear with their nodes
    labelRefs.current.forEach((group, i) => {
      if (!group) return;
      const node = nodes[i];
      const levelStart = 0.1 + node.level * 0.2;
      const levelEnd = levelStart + 0.2;

      if (stage === "assembly") {
        const t = Math.max(0, Math.min(1, (progress - levelStart - 0.05) / (levelEnd - levelStart)));
        group.visible = t > 0.3;
      } else {
        group.visible = overallOpacity.current > 0.3;
      }
    });

    // Animate lines
    lineObjsRef.current.forEach((line, i) => {
      const data = lineData[i];
      const levelStart = 0.1 + data.level * 0.2;
      const levelEnd = levelStart + 0.2;

      let lineOpacity: number;
      if (stage === "assembly") {
        const t = Math.max(0, Math.min(1, (progress - levelStart + 0.05) / (levelEnd - levelStart)));
        lineOpacity = t * 0.6;
      } else {
        lineOpacity = 0.5;
      }
      (line.material as THREE.LineBasicMaterial).opacity =
        lineOpacity * overallOpacity.current;
    });

    // Title
    if (titleRef.current) {
      titleRef.current.visible =
        (stage === "assembly" && progress > 0.15) ||
        stage === "header" ||
        stage === "nonce-search";
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Title */}
      <group ref={titleRef} visible={false}>
        <Text
          position={[-2.2, TREE_BASE_Y + 0.3, 0.4]}
          fontSize={0.13}
          color="#64748b"
          anchorX="right"
          anchorY="middle"
        >
          Merkle-Baum
        </Text>
      </group>

      {nodes.map((node, i) => {
        const isRoot = i === rootNodeIndex;
        const isLeaf = node.level === 0;
        return (
          <group key={i}>
            {/* Node sphere */}
            <mesh
              ref={(el) => { nodeRefs.current[i] = el; }}
              position={node.position}
            >
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial
                color={isRoot ? THREE_COLORS.accentSuccess : isLeaf ? THREE_COLORS.accentPrimary : THREE_COLORS.accentSecondary}
                emissive={new THREE.Color(isRoot ? THREE_COLORS.accentSuccess : isLeaf ? THREE_COLORS.accentPrimary : THREE_COLORS.accentSecondary)}
                emissiveIntensity={0.35}
                transparent
                opacity={1}
                toneMapped={false}
              />
            </mesh>

            {/* Hash label */}
            <group
              ref={(el) => { labelRefs.current[i] = el; }}
              visible={false}
              position={[node.position.x, node.position.y + (isRoot ? 0.2 : -0.12), node.position.z + 0.05]}
            >
              <Text
                fontSize={isRoot ? 0.1 : 0.065}
                color={isRoot ? "#10b981" : isLeaf ? "#22d3ee" : "#8b5cf6"}
                anchorX="center"
                anchorY={isRoot ? "bottom" : "top"}
              >
                {node.hash}
              </Text>
            </group>
          </group>
        );
      })}

      <group ref={lineGroupRef} />

      {/* "TX hashes" label for leaf level */}
      <Text
        position={[0, TREE_BASE_Y - 0.25, 0.4]}
        fontSize={0.08}
        color="#64748b"
        anchorX="center"
        anchorY="top"
      >
        TX-Hashes (Blätter)
      </Text>

      {/* Annotation: pairs get hashed together */}
      <Text
        position={[2.2, TREE_BASE_Y + LEVEL_HEIGHT * 0.5, 0.4]}
        fontSize={0.08}
        color="#64748b"
        anchorX="left"
        anchorY="middle"
      >
        {"← Paare werden\n   zusammen gehasht"}
      </Text>
    </group>
  );
}
