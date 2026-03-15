"use client";

import type { Dispatch, SetStateAction } from "react";

interface TreeControlsProps {
  showOneWay: boolean;
  setShowOneWay: Dispatch<SetStateAction<boolean>>;
  showIsolation: boolean;
  setShowIsolation: Dispatch<SetStateAction<boolean>>;
  treeLoading: boolean;
  childCount: number;
}

export default function TreeControls({
  showOneWay,
  setShowOneWay,
  showIsolation,
  setShowIsolation,
  treeLoading,
  childCount,
}: TreeControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        className={`rounded-full border px-3 py-1.5 font-code text-[11px] transition-all ${
          showOneWay
            ? "border-accent-primary/50 bg-accent-primary/10 text-accent-primary"
            : "border-border-subtle bg-bg-card text-text-muted hover:border-border-active"
        }`}
        onClick={() => setShowOneWay((v) => !v)}
      >
        {showOneWay ? "✓ " : ""}Einweg-Pfeile
      </button>
      <button
        className={`rounded-full border px-3 py-1.5 font-code text-[11px] transition-all ${
          showIsolation
            ? "border-accent-primary/50 bg-accent-primary/10 text-accent-primary"
            : "border-border-subtle bg-bg-card text-text-muted hover:border-border-active"
        }`}
        onClick={() => setShowIsolation((v) => !v)}
      >
        {showIsolation ? "✓ " : ""}Isolation-Zonen
      </button>
      {treeLoading && (
        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-active border-t-accent-secondary" />
          Berechne {childCount}/4 Kinder…
        </div>
      )}
    </div>
  );
}
