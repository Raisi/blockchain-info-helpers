"use client";

import type { MiningProgress } from "../types";

interface MineButtonProps {
  onMine: () => void;
  onStop: () => void;
  mining: MiningProgress;
  hasPendingTxs: boolean;
}

export default function MineButton({ onMine, onStop, mining, hasPendingTxs }: MineButtonProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={mining.isMining ? onStop : onMine}
        disabled={!hasPendingTxs && !mining.isMining}
        className={`rounded-lg px-5 py-2.5 font-display text-sm font-semibold transition-colors ${
          mining.isMining
            ? "bg-accent-danger/20 text-accent-danger hover:bg-accent-danger/30"
            : "bg-accent-success/20 text-accent-success hover:bg-accent-success/30 disabled:opacity-40"
        }`}
      >
        {mining.isMining ? "Stop Mining" : "Block minen"}
      </button>

      {mining.isMining && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent-warning" />
          <span className="font-code text-xs text-text-muted">
            Nonce: {mining.nonce.toLocaleString()} — {mining.attempts.toLocaleString()} Versuche
          </span>
        </div>
      )}

      {!hasPendingTxs && !mining.isMining && (
        <span className="font-code text-xs text-text-muted">
          Füge Transaktionen hinzu, um einen Block zu minen
        </span>
      )}
    </div>
  );
}
