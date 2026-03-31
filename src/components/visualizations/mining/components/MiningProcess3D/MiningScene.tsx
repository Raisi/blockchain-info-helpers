"use client";

import { useRef, useCallback, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { THREE_COLORS } from "../../constants";
import { useMiningSequence } from "./hooks/useMiningSequence";
import { useHashWorker } from "./hooks/useHashWorker";
import ControlPanel from "./ui/ControlPanel";
import MempoolCloud from "./objects/MempoolCloud";
import BlockScaffold from "./objects/BlockScaffold";
import HeaderBar from "./objects/HeaderBar";
import HashMachine from "./objects/HashMachine";
import HashParticles from "./objects/HashParticles";
import TargetPlane from "./objects/TargetPlane";
import BlockChain from "./objects/BlockChain";
import MerkleTree from "./objects/MerkleTree";
import NonceSearchPanel from "./ui/NonceSearchPanel";
import type { MiningStage } from "../../types";

/* ── Camera positions per stage ── */
const CAMERA_POSITIONS: Record<
  MiningStage,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  idle: { pos: [0, 5, 16], target: [0, 2, 0] },
  mempool: { pos: [1, 6, 11], target: [0, 4, 0] },
  assembly: { pos: [3, 3.5, 9], target: [0, 2, 0] },
  header: { pos: [0, 4.5, 8], target: [0, 3.5, 0] },
  "nonce-search": { pos: [-1, 4, 9], target: [0, 2.5, 0] },
  found: { pos: [0, 4, 10], target: [0, 2, 0] },
  "chain-connect": { pos: [2, 4, 18], target: [-3, 1, 0] },
  complete: { pos: [3, 5, 20], target: [-3, 1, 0] },
};

/* ── Stage durations in seconds (before speed multiplier) ── */
const STAGE_DURATIONS: Partial<Record<MiningStage, number>> = {
  mempool: 4,
  assembly: 6,
  header: 3.5,
  found: 3,
  "chain-connect": 5,
};

/* ── Scene orchestrator (inside Canvas) ── */
function SceneContent({
  stageRef,
  speedRef,
  pausedRef,
  stageProgressRef,
  lastHashRef,
  onStageComplete,
  onNonceUpdate,
  onFound,
}: {
  stageRef: React.RefObject<MiningStage>;
  speedRef: React.RefObject<number>;
  pausedRef: React.RefObject<boolean>;
  stageProgressRef: React.MutableRefObject<number>;
  lastHashRef: React.RefObject<string | null>;
  onStageComplete: () => void;
  onNonceUpdate: (nonce: number, attempts: number, lastHash: string | null) => void;
  onFound: (hash: string, nonce: number) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const stageTimeRef = useRef(0);
  const prevStageRef = useRef<MiningStage>("idle");
  const cameraTargetPos = useRef(new THREE.Vector3(...CAMERA_POSITIONS.idle.pos));
  const cameraTargetLookAt = useRef(new THREE.Vector3(...CAMERA_POSITIONS.idle.target));
  const lookAtVec = useRef(new THREE.Vector3(...CAMERA_POSITIONS.idle.target));

  const hashWorker = useHashWorker({
    onBatchResult: (result) => {
      if (pausedRef.current) return;
      const last = result.hashes.length > 0 ? result.hashes[result.hashes.length - 1] : null;
      onNonceUpdate(result.endNonce, result.endNonce, last?.hash ?? null);
      if (result.foundNonce !== null && result.foundHash) {
        onFound(result.foundHash, result.foundNonce);
      }
    },
  });

  useFrame((_, delta) => {
    const stage = stageRef.current ?? "idle";
    const speed = speedRef.current ?? 1;
    const paused = pausedRef.current ?? false;

    // Detect stage change
    if (stage !== prevStageRef.current) {
      prevStageRef.current = stage;
      stageTimeRef.current = 0;
      stageProgressRef.current = 0;

      const cam = CAMERA_POSITIONS[stage];
      cameraTargetPos.current.set(...cam.pos);
      cameraTargetLookAt.current.set(...cam.target);

      if (stage === "nonce-search") {
        hashWorker.start(1);
      } else {
        hashWorker.stop();
      }
    }

    // When paused: don't advance timers, don't move camera — let user explore freely
    if (paused) {
      // Pause the hash worker too
      if (stage === "nonce-search" && hashWorker.isRunning) {
        hashWorker.stop();
      }
      return;
    }

    // Resume hash worker if unpaused during nonce-search
    if (stage === "nonce-search" && !hashWorker.isRunning) {
      hashWorker.start(1);
    }

    // Advance stage timer
    const duration = STAGE_DURATIONS[stage];
    if (duration && stage !== "nonce-search") {
      stageTimeRef.current += delta * speed;
      stageProgressRef.current = Math.min(stageTimeRef.current / duration, 1);
      if (stageProgressRef.current >= 1) {
        onStageComplete();
      }
    }

    // Smooth camera follow
    camera.position.lerp(cameraTargetPos.current, 0.012);
    lookAtVec.current.lerp(cameraTargetLookAt.current, 0.012);
    camera.lookAt(lookAtVec.current);

    if (controlsRef.current) {
      (controlsRef.current as unknown as { target: THREE.Vector3 }).target.copy(
        lookAtVec.current
      );
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 10, 5]} intensity={1.2} color={THREE_COLORS.accentPrimary} distance={30} />
      <pointLight position={[-5, 8, -3]} intensity={0.6} color={THREE_COLORS.accentSecondary} distance={25} />
      <directionalLight position={[0, 10, 5]} intensity={0.3} />
      <fog attach="fog" args={[0x0a0e17, 18, 40]} />

      <OrbitControls
        ref={controlsRef}
        enablePan
        minDistance={2}
        maxDistance={35}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.05}
      />

      <gridHelper args={[50, 50, THREE_COLORS.borderSubtle, THREE_COLORS.borderSubtle]} position={[0, -0.5, 0]} />

      <MempoolCloud stageRef={stageRef} speedRef={speedRef} stageProgressRef={stageProgressRef} pausedRef={pausedRef} />
      <BlockScaffold stageRef={stageRef} stageProgressRef={stageProgressRef} />
      <MerkleTree stageRef={stageRef} stageProgressRef={stageProgressRef} pausedRef={pausedRef} />
      <HeaderBar stageRef={stageRef} stageProgressRef={stageProgressRef} />
      <HashMachine stageRef={stageRef} pausedRef={pausedRef} lastHashRef={lastHashRef} />
      <HashParticles stageRef={stageRef} hashWorker={hashWorker} pausedRef={pausedRef} />
      <TargetPlane stageRef={stageRef} />
      <BlockChain stageRef={stageRef} stageProgressRef={stageProgressRef} />
    </>
  );
}

/* ── Educational stage descriptions ── */
const STAGE_INFO: Record<string, { title: string; desc: string }> = {
  mempool: {
    title: "1 — Mempool",
    desc: "Transaktionen warten im Mempool. Der Miner wählt die mit den höchsten Gebühren aus.",
  },
  assembly: {
    title: "2 — Block-Assembly",
    desc: "Die ausgewählten Transaktionen werden in einen Kandidaten-Block gepackt. Ein Merkle-Baum fasst alle TXs zusammen.",
  },
  header: {
    title: "3 — Header-Konstruktion",
    desc: "Der 80-Byte Block-Header wird aus 6 Feldern zusammengesetzt: Version, Previous Hash, Merkle Root, Zeitstempel, Bits und Nonce.",
  },
  "nonce-search": {
    title: "4 — Nonce-Suche (Proof of Work)",
    desc: "Ziel: Finde eine Nonce, sodass SHA-256(Header + Nonce) einen Hash ergibt, der kleiner als das Target ist. Das Target bestimmt, wie viele führende Nullen der Hash haben muss. Jede Nonce ergibt einen völlig anderen Hash — es gibt keine Abkürzung, nur Ausprobieren.",
  },
  found: {
    title: "Gültiger Hash gefunden!",
    desc: "Der Hash beginnt mit genügend Nullen und liegt damit numerisch unter dem Target. Der Proof of Work ist erbracht — dieser Block darf an die Chain.",
  },
  "chain-connect": {
    title: "5 — Neuer Block",
    desc: "Der neue Block wird über den Previous Hash an die bestehende Blockchain angehängt.",
  },
};

/* ── Main exported component ── */
export default function MiningScene() {
  const {
    state,
    stateRef,
    start,
    nextStage,
    setSpeed,
    togglePause,
    updateNonce,
    found,
    updateElapsed,
    reset,
  } = useMiningSequence();

  const stageRef = useRef<MiningStage>(state.stage);
  const speedRef = useRef(state.speed);
  const pausedRef = useRef(state.paused);
  const lastHashRef = useRef<string | null>(state.lastHash);
  const stageProgressRef = useRef(0);

  useEffect(() => { stageRef.current = state.stage; }, [state.stage]);
  useEffect(() => { speedRef.current = state.speed; }, [state.speed]);
  useEffect(() => { pausedRef.current = state.paused; }, [state.paused]);
  useEffect(() => { lastHashRef.current = state.lastHash; }, [state.lastHash]);

  // Elapsed timer — pauses when paused
  useEffect(() => {
    if (state.stage === "idle" || state.stage === "complete" || state.paused) return;
    const interval = setInterval(() => {
      if (state.startTime) updateElapsed(Date.now() - state.startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [state.stage, state.startTime, state.paused, updateElapsed]);

  // Auto-advance timers — skip when paused
  useEffect(() => {
    if (state.paused) return;
    if (state.stage === "found") {
      const timer = setTimeout(() => nextStage(), 3000 / state.speed);
      return () => clearTimeout(timer);
    }
  }, [state.stage, state.speed, state.paused, nextStage]);

  useEffect(() => {
    if (state.paused) return;
    if (state.stage === "chain-connect") {
      const timer = setTimeout(() => nextStage(), 5000 / state.speed);
      return () => clearTimeout(timer);
    }
  }, [state.stage, state.speed, state.paused, nextStage]);

  const handleStageComplete = useCallback(() => {
    const s = stateRef.current;
    if (s.paused) return;
    if (s.stage === "chain-connect" || s.stage === "complete" || s.stage === "idle") return;
    nextStage();
  }, [nextStage, stateRef]);

  const handleFound = useCallback(
    (hash: string, nonce: number) => found(hash, nonce),
    [found]
  );

  // Keyboard: Space = pause/resume (or start), R = reset
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (state.stage === "idle") start();
        else if (state.stage === "complete") reset();
        else togglePause();
      }
      if (e.code === "KeyR") reset();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.stage, start, reset, togglePause]);

  const stageInfo = STAGE_INFO[state.stage];
  const isRunning = state.stage !== "idle" && state.stage !== "complete";

  return (
    <div className="space-y-4">
      <ControlPanel
        state={state}
        onStart={start}
        onReset={reset}
        onPause={togglePause}
        onSpeedChange={setSpeed}
      />
      <div className="relative overflow-hidden rounded-xl border border-border-subtle">
        <Canvas
          camera={{ position: [0, 5, 16], fov: 50, near: 0.1, far: 100 }}
          style={{ height: 600, background: "#0a0e17" }}
          dpr={[1, 2]}
        >
          <SceneContent
            stageRef={stageRef}
            speedRef={speedRef}
            pausedRef={pausedRef}
            stageProgressRef={stageProgressRef}
            lastHashRef={lastHashRef}
            onStageComplete={handleStageComplete}
            onNonceUpdate={updateNonce}
            onFound={handleFound}
          />
        </Canvas>

        {/* Educational overlay — top left */}
        {stageInfo && (
          <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg bg-bg-primary/85 px-4 py-3 backdrop-blur-sm transition-opacity duration-500">
            <p className="mb-1 font-display text-sm font-semibold text-accent-primary">
              {stageInfo.title}
            </p>
            <p className="text-xs leading-relaxed text-text-secondary">
              {stageInfo.desc}
            </p>
          </div>
        )}

        {/* Nonce search comparison panel — top right */}
        {(state.stage === "nonce-search" || state.stage === "found") && (
          <NonceSearchPanel
            nonce={state.nonce}
            lastHash={state.lastHash}
            foundHash={state.foundHash}
            hashAttempts={state.hashAttempts}
          />
        )}

        {/* Pause overlay */}
        {state.paused && isRunning && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center">
            <span className="inline-block rounded-lg bg-accent-warning/20 px-4 py-2 font-display text-sm text-accent-warning backdrop-blur-sm">
              Pausiert — Maus zum Navigieren, Scroll zum Zoomen, Leertaste zum Fortsetzen
            </span>
          </div>
        )}

        {/* Completion overlay */}
        {state.stage === "complete" && state.foundHash && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-primary/90 to-transparent p-6 pt-16">
            <div className="text-center">
              <p className="mb-2 font-display text-xl text-accent-success">
                Block erfolgreich gemined!
              </p>
              <p className="font-mono text-xs text-text-muted">
                Hash: <span className="text-accent-primary">{state.foundHash.slice(0, 20)}...{state.foundHash.slice(-8)}</span>
              </p>
              <p className="mt-1 font-mono text-xs text-text-muted">
                {state.hashAttempts.toLocaleString("de-DE")} Versuche in{" "}
                {(state.elapsed / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {stageInfo && `${stageInfo.title}: ${stageInfo.desc}`}
        {state.paused && "Animation pausiert. Frei navigieren möglich."}
        {state.stage === "complete" && "Mining abgeschlossen."}
      </div>
    </div>
  );
}
