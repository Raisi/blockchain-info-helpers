"use client";

import type { MiningStage, MiningSequenceState } from "../../../types";

const STAGE_LABELS: Record<MiningStage, string> = {
  idle: "Bereit",
  mempool: "Mempool",
  assembly: "Block-Assembly",
  header: "Header",
  "nonce-search": "Nonce-Suche",
  found: "Gefunden!",
  "chain-connect": "Chain",
  complete: "Fertig",
};

const ACTIVE_STAGES: MiningStage[] = [
  "mempool",
  "assembly",
  "header",
  "nonce-search",
  "found",
  "chain-connect",
];

const SPEED_OPTIONS = [0.5, 1, 2, 5];

interface Props {
  state: MiningSequenceState;
  onStart: () => void;
  onReset: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function ControlPanel({
  state,
  onStart,
  onReset,
  onPause,
  onSpeedChange,
}: Props) {
  const isIdle = state.stage === "idle";
  const isComplete = state.stage === "complete";
  const isRunning = !isIdle && !isComplete;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-card/90 p-4 backdrop-blur-sm">
      {/* Stage Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ACTIVE_STAGES.map((stage, i) => {
          const currentIdx = ACTIVE_STAGES.indexOf(state.stage);
          const stageIdx = i;
          const isPast = currentIdx > stageIdx;
          const isCurrent = state.stage === stage;

          return (
            <div key={stage} className="flex items-center gap-1.5">
              <span
                className={`rounded-md px-2 py-0.5 font-display text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-accent-primary/20 text-accent-primary"
                    : isPast
                      ? "bg-accent-success/15 text-accent-success"
                      : "bg-bg-secondary text-text-muted"
                }`}
              >
                {STAGE_LABELS[stage]}
              </span>
              {i < ACTIVE_STAGES.length - 1 && (
                <span className="text-text-muted">›</span>
              )}
            </div>
          );
        })}
        {state.paused && (
          <span className="ml-2 rounded-md bg-accent-warning/20 px-2 py-0.5 font-display text-xs font-medium text-accent-warning">
            PAUSIERT
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Start / Reset */}
        {isIdle || isComplete ? (
          <button
            onClick={isComplete ? onReset : onStart}
            className="rounded-lg bg-accent-primary/15 px-5 py-2 font-display text-sm font-semibold text-accent-primary transition-colors hover:bg-accent-primary/25"
          >
            {isComplete ? "Nochmal" : "Mining starten"}
          </button>
        ) : (
          <>
            {/* Pause / Resume */}
            <button
              onClick={onPause}
              className={`rounded-lg px-4 py-2 font-display text-sm font-semibold transition-colors ${
                state.paused
                  ? "bg-accent-success/15 text-accent-success hover:bg-accent-success/25"
                  : "bg-accent-warning/15 text-accent-warning hover:bg-accent-warning/25"
              }`}
            >
              {state.paused ? "Fortsetzen" : "Pausieren"}
            </button>
            {/* Reset */}
            <button
              onClick={onReset}
              className="rounded-lg bg-bg-secondary px-4 py-2 font-display text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
            >
              Zurücksetzen
            </button>
          </>
        )}

        {/* Speed */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">Speed:</span>
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`rounded-md px-2 py-1 font-mono text-xs transition-colors ${
                state.speed === speed
                  ? "bg-accent-secondary/20 text-accent-secondary"
                  : "text-text-muted hover:bg-bg-secondary hover:text-text-secondary"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Pause hint */}
        {isRunning && (
          <span className="text-xs text-text-muted">
            {state.paused
              ? "Frei navigieren — Maus zum Drehen, Scroll zum Zoomen"
              : "Leertaste = Pause"}
          </span>
        )}

        {/* Stats */}
        {isRunning && state.stage === "nonce-search" && !state.paused && (
          <div className="ml-auto flex items-center gap-4 font-mono text-xs">
            <span className="text-text-muted">
              Nonce:{" "}
              <span className="text-text-primary">
                {state.nonce.toLocaleString("de-DE")}
              </span>
            </span>
          </div>
        )}

        {isComplete && state.foundHash && (
          <div className="ml-auto font-mono text-xs text-text-muted">
            Nonce: {state.nonce.toLocaleString("de-DE")} | Zeit:{" "}
            {(state.elapsed / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  );
}
