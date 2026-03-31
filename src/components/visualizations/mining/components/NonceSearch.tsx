"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { sha256 } from "../crypto-utils";
import {
  DIFFICULTY_DEFAULT,
  DIFFICULTY_MIN,
  DIFFICULTY_MAX,
  NONCES_PER_FRAME,
  SAMPLE_BLOCK_HEADER,
} from "../constants";
import type { HashAttempt } from "../types";
import HexBreakdown from "@/components/visualizations/hashing/components/HexBreakdown";

const MAX_WATERFALL = 20;

function countLeadingZeros(hash: string): number {
  let count = 0;
  for (const ch of hash) {
    if (ch === "0") count++;
    else break;
  }
  return count;
}

export default function NonceSearch() {
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [difficulty, setDifficulty] = useState(DIFFICULTY_DEFAULT);
  const [manualNonce, setManualNonce] = useState("0");
  const [manualHash, setManualHash] = useState("");
  const [manualMeetsTarget, setManualMeetsTarget] = useState(false);

  // Auto mode state
  const [isMining, setIsMining] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hashHistory, setHashHistory] = useState<HashAttempt[]>([]);
  const [foundResult, setFoundResult] = useState<HashAttempt | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const rafRef = useRef<number>(0);
  const nonceRef = useRef(0);
  const isMiningRef = useRef(false);
  const timerRef = useRef<number>(0);
  const waterfallRef = useRef<HTMLDivElement>(null);
  const foundRef = useRef<HTMLDivElement>(null);
  const prevHistoryLenRef = useRef(0);

  const blockDataPrefix =
    SAMPLE_BLOCK_HEADER.version +
    SAMPLE_BLOCK_HEADER.prevHash.slice(0, 16) +
    "...";

  const targetPrefix = "0".repeat(difficulty);
  const expectedAttempts = Math.pow(16, difficulty);

  // Manual mode: compute hash for entered nonce
  useEffect(() => {
    if (mode !== "manual" || manualNonce === "") return;
    const n = parseInt(manualNonce, 10);
    if (isNaN(n)) return;
    let cancelled = false;
    async function compute() {
      const input = blockDataPrefix + n.toString();
      const hex = await sha256(input);
      if (cancelled) return;
      setManualHash(hex);
      setManualMeetsTarget(hex.startsWith(targetPrefix));
    }
    compute();
    return () => { cancelled = true; };
  }, [mode, manualNonce, blockDataPrefix, targetPrefix]);

  // Auto mode mining loop
  const stopMining = useCallback(() => {
    isMiningRef.current = false;
    setIsMining(false);
    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
  }, []);

  const startMining = useCallback(() => {
    nonceRef.current = 0;
    setNonce(0);
    setAttempts(0);
    setHashHistory([]);
    setFoundResult(null);
    setElapsed(0);
    prevHistoryLenRef.current = 0;
    isMiningRef.current = true;
    setIsMining(true);

    const start = performance.now();
    setStartTime(start);

    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - start) / 1000));
    }, 1000);

    const target = "0".repeat(difficulty);

    const mineFrame = async () => {
      if (!isMiningRef.current) return;

      const newEntries: HashAttempt[] = [];

      for (let i = 0; i < NONCES_PER_FRAME; i++) {
        if (!isMiningRef.current) return;

        const input = blockDataPrefix + nonceRef.current.toString();
        const hex = await sha256(input);
        const meets = hex.startsWith(target);

        if (nonceRef.current % 50 === 0 || meets) {
          newEntries.push({
            nonce: nonceRef.current,
            hash: hex,
            meetsTarget: meets,
          });
        }

        if (meets) {
          isMiningRef.current = false;
          setIsMining(false);
          clearInterval(timerRef.current);
          const result = {
            nonce: nonceRef.current,
            hash: hex,
            meetsTarget: true,
          };
          setFoundResult(result);
          setNonce(nonceRef.current);
          setAttempts(nonceRef.current + 1);
          setHashHistory((prev) =>
            [...prev, ...newEntries].slice(-MAX_WATERFALL)
          );
          return;
        }

        nonceRef.current++;
      }

      setNonce(nonceRef.current);
      setAttempts(nonceRef.current);
      if (newEntries.length > 0) {
        setHashHistory((prev) =>
          [...prev, ...newEntries].slice(-MAX_WATERFALL)
        );
      }
      rafRef.current = requestAnimationFrame(mineFrame);
    };

    rafRef.current = requestAnimationFrame(mineFrame);
  }, [blockDataPrefix, difficulty]);

  // GSAP waterfall slide-in for new entries
  useEffect(() => {
    if (!waterfallRef.current) return;
    const entries = waterfallRef.current.querySelectorAll("[data-waterfall-entry]");
    const newCount = entries.length - prevHistoryLenRef.current;
    if (newCount > 0) {
      const newEntries = Array.from(entries).slice(-newCount);
      gsap.from(newEntries, {
        x: 20,
        opacity: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
      });
    }
    prevHistoryLenRef.current = entries.length;
  }, [hashHistory]);

  // Animate found result
  useEffect(() => {
    if (!foundResult || !foundRef.current) return;
    gsap.from(foundRef.current, {
      scale: 0.9,
      opacity: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
  }, [foundResult]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMiningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    stopMining();
    setHashHistory([]);
    setFoundResult(null);
    setAttempts(0);
    setNonce(0);
    setElapsed(0);
    prevHistoryLenRef.current = 0;
  }, [stopMining]);

  const hashesPerSecond =
    startTime && attempts > 0
      ? Math.round(attempts / Math.max(elapsed, 1))
      : 0;

  const progressPercent = Math.min((attempts / expectedAttempts) * 100, 100);
  const hashGaugePercent = Math.min((hashesPerSecond / 1000) * 100, 100);

  const manualLeadingZeros = manualHash ? countLeadingZeros(manualHash) : 0;

  /** Render hash with colored leading chars for manual mode */
  const renderManualHashColored = () => {
    if (!manualHash) return null;
    const chars = manualHash.split("");
    return (
      <p className="break-all font-code text-sm">
        {chars.map((ch, i) => {
          let className = "text-text-secondary";
          if (i < difficulty) {
            if (ch === "0") {
              className = "text-accent-success";
            } else {
              className = "text-accent-danger font-bold";
            }
          }
          return (
            <span key={i} className={className}>
              {ch}
            </span>
          );
        })}
      </p>
    );
  };

  /** Target zone visualization bar */
  const validZonePercent = (1 / Math.pow(16, difficulty)) * 100;

  return (
    <div className="space-y-5">
      {/* Mode Toggle */}
      <div className="flex gap-1 rounded-lg border border-border-subtle bg-bg-primary/50 p-1">
        <button
          onClick={() => {
            reset();
            setMode("manual");
          }}
          className={`flex-1 rounded-md px-3 py-2 font-display text-sm font-medium transition-colors ${
            mode === "manual"
              ? "bg-accent-primary/15 text-accent-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Manuell
        </button>
        <button
          onClick={() => {
            reset();
            setMode("auto");
          }}
          className={`flex-1 rounded-md px-3 py-2 font-display text-sm font-medium transition-colors ${
            mode === "auto"
              ? "bg-accent-primary/15 text-accent-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Auto-Mining
        </button>
      </div>

      {/* Difficulty Slider */}
      <div>
        <label className="mb-2 block font-display text-sm font-medium text-text-primary">
          Schwierigkeit: {difficulty} führende Null{difficulty > 1 ? "en" : ""}
        </label>
        <input
          type="range"
          min={DIFFICULTY_MIN}
          max={DIFFICULTY_MAX}
          value={difficulty}
          onChange={(e) => {
            setDifficulty(Number(e.target.value));
            reset();
          }}
          disabled={isMining}
          className="w-full accent-accent-primary"
        />
        <div className="mt-1 flex justify-between font-code text-xs text-text-muted">
          <span>Leicht ({DIFFICULTY_MIN})</span>
          <span>Schwer ({DIFFICULTY_MAX})</span>
        </div>
      </div>

      {/* Target Zone Visualization Bar */}
      <div className="space-y-1">
        <p className="font-code text-xs text-text-muted">
          Hash-Raum — gültiger Bereich
        </p>
        <div className="flex h-3 overflow-hidden rounded-full border border-border-subtle">
          <div
            className="bg-accent-success/40 transition-all duration-500"
            style={{ width: `${Math.max(validZonePercent, 0.5)}%` }}
          />
          <div className="flex-1 bg-accent-danger/10" />
        </div>
        <div className="flex justify-between font-code text-[10px] text-text-muted">
          <span className="text-accent-success">
            Gültig ({validZonePercent < 0.01 ? validZonePercent.toExponential(1) : validZonePercent.toFixed(2)}%)
          </span>
          <span className="text-accent-danger/60">Ungültig</span>
        </div>
      </div>

      {/* Target Display */}
      <div className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
        <p className="mb-1 font-code text-xs text-text-muted">
          Ziel: Hash muss beginnen mit
        </p>
        <p className="font-code text-sm">
          <span className="text-accent-success">{targetPrefix}</span>
          <span className="text-text-muted">
            {"x".repeat(64 - difficulty)}
          </span>
        </p>
      </div>

      {/* Manual Mode */}
      {mode === "manual" && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-display text-sm font-medium text-text-primary">
              Nonce eingeben
            </label>
            <input
              type="number"
              min="0"
              value={manualNonce}
              onChange={(e) => setManualNonce(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-primary/50 p-3 font-code text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30"
              placeholder="Nonce eingeben..."
            />
          </div>

          {manualHash && (
            <div
              className={`rounded-lg border p-3 ${
                manualMeetsTarget
                  ? "border-accent-success/30 bg-accent-success/5"
                  : "border-border-subtle bg-bg-primary/50"
              }`}
            >
              <p className="mb-1 font-code text-xs text-text-muted">
                Resultat-Hash
              </p>
              {renderManualHashColored()}

              {/* Distance indicator */}
              <div className="mt-2">
                {manualMeetsTarget ? (
                  <p className="font-display text-sm font-semibold text-accent-success">
                    ✓ Gültiger Hash — Target erreicht!
                  </p>
                ) : (
                  <p className="font-code text-xs">
                    <span className={manualLeadingZeros > 0 ? "text-accent-warning" : "text-text-muted"}>
                      {manualLeadingZeros}/{difficulty} Nullen
                      {manualLeadingZeros === 0
                        ? " — weit entfernt"
                        : manualLeadingZeros >= difficulty - 1
                          ? " — fast!"
                          : " — näher dran"}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border-subtle bg-bg-card p-3">
            <p className="text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-text-primary">Tipp:</span>{" "}
              Probiere verschiedene Nonce-Werte und beobachte, wie sich der Hash
              komplett verändert. Es gibt kein Muster — du kannst den richtigen
              Wert nur durch Ausprobieren finden.
            </p>
          </div>
        </div>
      )}

      {/* Auto Mode */}
      {mode === "auto" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={isMining ? stopMining : startMining}
              className={`rounded-lg px-5 py-2.5 font-display text-sm font-semibold transition-colors ${
                isMining
                  ? "bg-accent-danger/20 text-accent-danger hover:bg-accent-danger/30"
                  : "bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30"
              }`}
            >
              {isMining ? "Stop" : "Mining starten"}
            </button>
            {(isMining || attempts > 0) && (
              <div className="font-code text-sm text-text-secondary">
                Nonce:{" "}
                <span className="text-accent-primary">
                  {nonce.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Stats Panel */}
          {(isMining || attempts > 0) && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
                <p className="font-code text-xs text-text-muted">Versuche</p>
                <p className="font-code text-lg font-bold text-text-primary">
                  {attempts.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
                <p className="font-code text-xs text-text-muted">Zeit</p>
                <p className="font-code text-lg font-bold text-text-primary">
                  {elapsed}s
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
                <p className="font-code text-xs text-text-muted">Hash/s</p>
                <p className="font-code text-lg font-bold text-text-primary">
                  {hashesPerSecond.toLocaleString()}
                </p>
                {/* Hash/s gauge bar */}
                <div className="mx-auto mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-accent-primary/60 transition-all duration-300"
                    style={{ width: `${hashGaugePercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {(isMining || attempts > 0) && (
            <div className="space-y-1">
              <div className="flex justify-between font-code text-xs text-text-muted">
                <span>Fortschritt vs. Erwartungswert</span>
                <span>{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-primary/40 to-accent-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="font-code text-[10px] text-text-muted">
                {attempts.toLocaleString()} / {expectedAttempts.toLocaleString()} erwartete Versuche
              </p>
            </div>
          )}

          {/* Mining indicator */}
          {isMining && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent-warning" />
              <span className="font-code text-xs text-text-muted">
                Suche läuft...
              </span>
            </div>
          )}

          {/* Hash Waterfall */}
          {hashHistory.length > 0 && (
            <div className="space-y-1">
              <p className="font-display text-xs font-medium text-text-muted">
                Hash-Wasserfall (letzte Versuche)
              </p>
              <div
                ref={waterfallRef}
                className="max-h-64 overflow-y-auto rounded-lg border border-border-subtle bg-bg-primary/50 p-2"
              >
                {hashHistory.map((entry, i) => (
                  <div
                    key={`${entry.nonce}-${i}`}
                    data-waterfall-entry
                    className={`flex items-center gap-2 rounded px-2 py-0.5 font-code text-xs ${
                      entry.meetsTarget
                        ? "bg-accent-success/10 text-accent-success"
                        : "text-text-muted"
                    }`}
                  >
                    <span className="w-16 shrink-0 text-text-secondary">
                      #{entry.nonce}
                    </span>
                    <span className="truncate">
                      {entry.hash.split("").map((ch, ci) => {
                        if (ci < difficulty) {
                          return (
                            <span
                              key={ci}
                              className={
                                ch === "0"
                                  ? "text-accent-success"
                                  : "text-accent-danger font-bold"
                              }
                            >
                              {ch}
                            </span>
                          );
                        }
                        if (ci < 24) {
                          return (
                            <span
                              key={ci}
                              className={
                                entry.meetsTarget
                                  ? "text-accent-success"
                                  : "text-text-muted"
                              }
                            >
                              {ch}
                            </span>
                          );
                        }
                        return null;
                      })}
                      <span className={entry.meetsTarget ? "text-accent-success" : "text-text-muted"}>
                        ...
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Found Result */}
          {foundResult && (
            <div
              ref={foundRef}
              className="space-y-2 rounded-xl border border-accent-success/30 bg-accent-success/5 p-4"
            >
              <div className="flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent-success"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                <span className="font-display text-sm font-semibold text-accent-success">
                  Gültiger Hash gefunden!
                </span>
              </div>
              <p className="font-code text-xs text-text-secondary">
                Nonce: {foundResult.nonce.toLocaleString()} — nach{" "}
                {attempts.toLocaleString()} Versuchen ({elapsed}s)
              </p>
              <HexBreakdown hex={foundResult.hash} label="Gültiger Hash" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
