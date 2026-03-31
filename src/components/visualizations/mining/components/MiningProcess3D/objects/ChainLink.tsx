"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";

interface Props {
  from: THREE.Vector3;
  to: THREE.Vector3;
  visible: boolean;
  animated?: boolean;
  stageRef?: React.RefObject<MiningStage>;
}

export default function ChainLink({
  from,
  to,
  visible,
  animated,
  stageRef,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const lineObjRef = useRef<THREE.Line | null>(null);
  const progressRef = useRef(0);
  const prevStage = useRef<MiningStage>("idle");

  // Create line object imperatively to avoid JSX <line> -> SVG conflict
  useEffect(() => {
    const points = new Float32Array([
      from.x, from.y, from.z,
      to.x, to.y, to.z,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(points, 3)
    );
    const material = new THREE.LineBasicMaterial({
      color: THREE_COLORS.accentPrimary,
      transparent: true,
      opacity: 0.6,
      toneMapped: false,
    });
    const line = new THREE.Line(geometry, material);
    lineObjRef.current = line;

    if (groupRef.current) {
      groupRef.current.add(line);
    }

    return () => {
      geometry.dispose();
      material.dispose();
      if (groupRef.current) {
        groupRef.current.remove(line);
      }
    };
  }, [from, to]);

  useFrame((_, delta) => {
    const line = lineObjRef.current;
    if (!line) return;

    if (animated && stageRef) {
      const stage = stageRef.current ?? "idle";

      if (stage !== prevStage.current) {
        if (stage === "chain-connect") progressRef.current = 0;
        prevStage.current = stage;
      }

      if (stage === "chain-connect") {
        progressRef.current = Math.min(
          progressRef.current + delta * 0.5,
          1
        );
      }

      line.visible = stage === "chain-connect" || stage === "complete";

      const mat = line.material as THREE.LineBasicMaterial;
      mat.opacity = animated ? progressRef.current * 0.6 : 0.6;

      if (stage === "complete") {
        mat.opacity = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    } else {
      line.visible = visible;
    }
  });

  return <group ref={groupRef} />;
}
