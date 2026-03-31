"use client";

import { Suspense, useSyncExternalStore } from "react";
import MiningScene from "./MiningScene";
import WebGLFallback from "./WebGLFallback";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

// Check WebGL support using useSyncExternalStore for SSR-safe client detection
const subscribe = () => () => {};
function useWebGLSupported(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => detectWebGL(),
    () => null, // server snapshot
  );
}

export default function MiningProcess3D() {
  const webglSupported = useWebGLSupported();

  if (webglSupported === null) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border border-border-subtle bg-bg-card">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  if (!webglSupported) {
    return <WebGLFallback />;
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-[600px] items-center justify-center rounded-xl border border-border-subtle bg-bg-card">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
            <p className="font-display text-sm text-text-secondary">
              3D-Szene wird geladen...
            </p>
          </div>
        </div>
      }
    >
      <MiningScene />
    </Suspense>
  );
}
