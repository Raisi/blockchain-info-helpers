"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { THREE_COLORS } from "../../../constants";
import type { MiningStage } from "../../../types";
import type { HashWorkerHandle } from "../hooks/useHashWorker";

const MAX_PARTICLES = 400;
const PARTICLE_LIFETIME = 2.5;
const EMITTER_POS = new THREE.Vector3(0, 2.2, 0);

interface Particle {
  alive: boolean;
  age: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  meetsTarget: boolean;
}

interface Props {
  stageRef: React.RefObject<MiningStage>;
  hashWorker: HashWorkerHandle;
  pausedRef: React.RefObject<boolean>;
}

export default function HashParticles({ stageRef, pausedRef }: Props) {
  const pointsRef = useRef<THREE.Points>(null);

  const particlesRef = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      alive: false,
      age: 0,
      position: new THREE.Vector3(0, -100, 0),
      velocity: new THREE.Vector3(),
      meetsTarget: false,
    }))
  );

  const positionsRef = useRef(new Float32Array(MAX_PARTICLES * 3));
  const colorsRef = useRef(new Float32Array(MAX_PARTICLES * 3));
  const sizesRef = useRef(new Float32Array(MAX_PARTICLES));
  const geomRef = useRef<THREE.BufferGeometry>(null);

  // Set up buffer attributes imperatively to avoid ref access during render
  useEffect(() => {
    if (!geomRef.current) return;
    geomRef.current.setAttribute("position", new THREE.BufferAttribute(positionsRef.current, 3));
    geomRef.current.setAttribute("color", new THREE.BufferAttribute(colorsRef.current, 3));
    geomRef.current.setAttribute("size", new THREE.BufferAttribute(sizesRef.current, 1));
  }, []);

  const spawnTimer = useRef(0);
  const nextIdx = useRef(0);
  const foundBurstDone = useRef(false);

  const colorSuccess = useMemo(() => new THREE.Color(THREE_COLORS.accentSuccess), []);
  const colorFail = useMemo(() => new THREE.Color(THREE_COLORS.accentDanger), []);
  const colorCyan = useMemo(() => new THREE.Color(THREE_COLORS.accentPrimary), []);
  const colorPurple = useMemo(() => new THREE.Color(THREE_COLORS.accentSecondary), []);

  function spawn(count: number, success: boolean) {
    const particles = particlesRef.current;
    for (let j = 0; j < count; j++) {
      const p = particles[nextIdx.current % MAX_PARTICLES];
      p.alive = true;
      p.age = 0;
      p.meetsTarget = success;
      p.position.copy(EMITTER_POS);
      // Add slight random offset around emitter
      p.position.x += (Math.random() - 0.5) * 0.3;
      p.position.z += (Math.random() - 0.5) * 0.3;

      const theta = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.5;

      if (success) {
        // Explode in all directions for celebration
        const phi = Math.acos(2 * Math.random() - 1);
        p.velocity.set(
          Math.sin(phi) * Math.cos(theta) * speed * 1.5,
          Math.sin(phi) * Math.sin(theta) * speed * 1.5,
          Math.cos(phi) * speed * 1.5
        );
      } else {
        // Misses fly upward past target plane
        p.velocity.set(
          Math.cos(theta) * speed * 0.3,
          1 + Math.random() * 2.5,
          Math.sin(theta) * speed * 0.3
        );
      }

      nextIdx.current++;
    }
  }

  useFrame((_, delta) => {
    const stage = stageRef.current ?? "idle";
    const isSearching = stage === "nonce-search";
    const isFound = stage === "found";

    if (!pointsRef.current) return;
    const paused = pausedRef.current ?? false;

    // Reset found burst flag when entering new search
    if (isSearching) foundBurstDone.current = false;

    // Don't spawn new particles when paused (but still render existing ones)
    // Spawn miss particles during search
    if (isSearching && !paused) {
      spawnTimer.current += delta;
      if (spawnTimer.current > 0.06) {
        spawn(4, false);
        spawnTimer.current = 0;
      }
    }

    // Big success burst on found — once
    if (isFound && !foundBurstDone.current) {
      spawn(80, true);
      foundBurstDone.current = true;
    }

    // Check if any particles are alive
    let anyAlive = false;
    const particles = particlesRef.current;
    const positions = positionsRef.current;
    const colors = colorsRef.current;
    const sizes = sizesRef.current;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (!p.alive) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -100;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
        continue;
      }

      anyAlive = true;
      if (!paused) p.age += delta;
      if (p.age > PARTICLE_LIFETIME) {
        p.alive = false;
        sizes[i] = 0;
        continue;
      }

      // Physics — freeze when paused
      if (!paused) {
        p.position.x += p.velocity.x * delta;
        p.position.y += p.velocity.y * delta;
        p.position.z += p.velocity.z * delta;
        p.velocity.multiplyScalar(0.98);
        if (!p.meetsTarget) {
          p.velocity.y -= delta * 0.3;
        }
      }

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;

      const life = 1 - p.age / PARTICLE_LIFETIME;
      const lifeSq = life * life; // Faster fade

      if (p.meetsTarget) {
        // Success: mix cyan, green, purple for celebration
        const mixColor = Math.random() > 0.5 ? colorCyan : Math.random() > 0.5 ? colorSuccess : colorPurple;
        colors[i * 3] = mixColor.r * lifeSq;
        colors[i * 3 + 1] = mixColor.g * lifeSq;
        colors[i * 3 + 2] = mixColor.b * lifeSq;
        sizes[i] = (3 + Math.random() * 3) * lifeSq;
      } else {
        colors[i * 3] = colorFail.r * lifeSq * 0.6;
        colors[i * 3 + 1] = colorFail.g * lifeSq * 0.2;
        colors[i * 3 + 2] = colorFail.b * lifeSq * 0.1;
        sizes[i] = (1.5 + Math.random()) * lifeSq;
      }
    }

    pointsRef.current.visible = isSearching || isFound || anyAlive;

    const geom = pointsRef.current.geometry;
    geom.attributes.position.needsUpdate = true;
    geom.attributes.color.needsUpdate = true;
    geom.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} visible={false}>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial
        size={3}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        toneMapped={false}
        depthWrite={false}
      />
    </points>
  );
}
