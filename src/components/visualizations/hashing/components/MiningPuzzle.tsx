"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { sha256 } from "../crypto-utils";
import { DIFFICULTY_DEFAULT, DIFFICULTY_MIN, DIFFICULTY_MAX, NONCES_PER_FRAME } from "../constants";
import HexBreakdown from "./HexBreakdown";

export default function MiningPuzzle() {
  const [difficulty, setDifficulty] = useState(DIFFICULTY_DEFAULT);
  const [blockData, setBlockData] = useState("Block #1 — Transaktion: Alice → Bob 0.5 BTC");
  const [isMining, setIsMining] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [foundHash, setFoundHash] = useState("");
  const [foundNonce, setFoundNonce] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const rafRef = useRef<number>(0);
  const nonceRef = useRef(0);
  const isMiningRef = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);

  const stopMining = useCallback(() => {
    isMiningRef.current = false;
    setIsMining(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const startMining = useCallback((data: string, diff: number) => {
    nonceRef.current = 0;
    setNonce(0);
    setFoundHash("");
    setFoundNonce(null);
    setAttempts(0);
    isMiningRef.current = true;
    setIsMining(true);

    const targetPrefix = "0".repeat(diff);

    const mineFrame = async () => {
      if (!isMiningRef.current) return;

      for (let i = 0; i < NONCES_PER_FRAME; i++) {
        if (!isMiningRef.current) return;

        const input = data + nonceRef.current.toString();
        const hex = await sha256(input);

        if (hex.startsWith(targetPrefix)) {
          isMiningRef.current = false;
          setIsMining(false);
          setFoundHash(hex);
          setFoundNonce(nonceRef.current);
          setNonce(nonceRef.current);
          setAttempts(nonceRef.current);
          return;
        }

        nonceRef.current++;
      }

      setNonce(nonceRef.current);
      setAttempts(nonceRef.current);
      rafRef.current = requestAnimationFrame(mineFrame);
    };

    rafRef.current = requestAnimationFrame(mineFrame);
  }, []);

  // Animate success result
  useEffect(() => {
    if (!foundHash || !successRef.current) return;
    gsap.from(successRef.current, {
      scale: 0.9,
      opacity: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
  }, [foundHash]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMiningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const resetResults = useCallback(() => {
    setFoundHash("");
    setFoundNonce(null);
    setAttempts(0);
    setNonce(0);
    stopMining();
  }, [stopMining]);

  const handleBlockDataChange = useCallback((value: string) => {
    setBlockData(value);
    resetResults();
  }, [resetResults]);

  const handleDifficultyChange = useCallback((value: number) => {
    setDifficulty(value);
    resetResults();
  }, [resetResults]);

  const targetPrefix = "0".repeat(difficulty);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block font-display text-sm font-medium text-text-primary">
          Block-Daten
        </label>
        <input
          type="text"
          value={blockData}
          onChange={(e) => handleBlockDataChange(e.target.value)}
          disabled={isMining}
          className="w-full rounded-lg border border-border-subtle bg-bg-primary/50 p-3 font-code text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="mb-2 block font-display text-sm font-medium text-text-primary">
          Schwierigkeit: {difficulty} führende Null{difficulty > 1 ? "en" : ""}
        </label>
        <input
          type="range"
          min={DIFFICULTY_MIN}
          max={DIFFICULTY_MAX}
          value={difficulty}
          onChange={(e) => handleDifficultyChange(Number(e.target.value))}
          disabled={isMining}
          className="w-full accent-accent-primary"
        />
        <div className="mt-1 flex justify-between font-code text-xs text-text-muted">
          <span>Leicht ({DIFFICULTY_MIN})</span>
          <span>Schwer ({DIFFICULTY_MAX})</span>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
        <p className="mb-1 font-code text-xs text-text-muted">Ziel: Hash muss beginnen mit</p>
        <p className="font-code text-sm">
          <span className="text-accent-success">{targetPrefix}</span>
          <span className="text-text-muted">{"x".repeat(64 - difficulty)}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={isMining ? stopMining : () => startMining(blockData, difficulty)}
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
            Nonce: <span className="text-accent-primary">{nonce.toLocaleString()}</span>
          </div>
        )}
      </div>

      {isMining && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent-warning" />
          <span className="font-code text-xs text-text-muted">
            Suche... {attempts.toLocaleString()} Versuche
          </span>
        </div>
      )}

      {foundHash && foundNonce !== null && (
        <div ref={successRef} className="space-y-3 rounded-xl border border-accent-success/30 bg-accent-success/5 p-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
            <span className="font-display text-sm font-semibold text-accent-success">
              Gültiger Hash gefunden!
            </span>
          </div>
          <p className="font-code text-xs text-text-secondary">
            Nonce: {foundNonce.toLocaleString()} — nach {attempts.toLocaleString()} Versuchen
          </p>
          <HexBreakdown hex={foundHash} label="Gefundener Hash" />
        </div>
      )}

      <div className="rounded-lg border border-border-subtle bg-bg-card p-3">
        <p className="text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">So funktioniert Mining:</span>{" "}
          Der Miner variiert die Nonce (Zufallszahl), bis der SHA-256-Hash des Blocks
          mit der geforderten Anzahl Nullen beginnt. Je mehr Nullen, desto schwieriger —
          im Durchschnitt werden 16ˣ Versuche benötigt (x = Anzahl Hex-Nullen).
        </p>
      </div>
    </div>
  );
}
