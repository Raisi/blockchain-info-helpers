"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import { sha256 } from "../crypto-utils";
import {
  DIFFICULTY_MIN,
  DIFFICULTY_MAX,
  DIFFICULTY_DEFAULT,
  DIFFICULTY_COMPARISON,
} from "../constants";

interface SampleHash {
  hash: string;
  input: string;
}

const SAMPLE_COUNT = 12;

/** Count leading hex zeros */
function leadingZeros(hash: string): number {
  const m = hash.match(/^0*/);
  return m ? m[0].length : 0;
}

/** Render a hash with colored prefix comparison against difficulty */
function HashDisplay({
  hash,
  difficulty,
  showFull,
}: {
  hash: string;
  difficulty: number;
  showFull?: boolean;
}) {
  const zeros = leadingZeros(hash);
  const valid = zeros >= difficulty;
  const chars = showFull ? 64 : 24;

  return (
    <span className="font-code text-[13px] leading-none sm:text-sm">
      {/* Leading zeros — always green */}
      <span className="text-accent-success font-semibold">
        {hash.slice(0, Math.min(zeros, difficulty))}
      </span>
      {/* Extra zeros beyond difficulty — still green but dimmer */}
      {zeros > difficulty && (
        <span className="text-accent-success/60">
          {hash.slice(difficulty, zeros)}
        </span>
      )}
      {/* The critical character — green if valid position, red if it breaks the rule */}
      {zeros < difficulty && (
        <span className="rounded bg-accent-danger/20 px-0.5 text-accent-danger font-bold">
          {hash[zeros]}
        </span>
      )}
      {/* Rest of the hash */}
      <span className={valid ? "text-accent-success/50" : "text-text-muted/50"}>
        {hash.slice(valid ? zeros : zeros + 1, chars)}
      </span>
      {!showFull && <span className="text-text-muted/30">...</span>}
    </span>
  );
}

export default function DifficultyTarget() {
  const [difficulty, setDifficulty] = useState(DIFFICULTY_DEFAULT);
  const [samples, setSamples] = useState<SampleHash[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const barsRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<HTMLDivElement>(null);

  const targetPrefix = "0".repeat(difficulty);
  const targetFull = targetPrefix + "f".repeat(64 - difficulty);
  const probability = 1 / Math.pow(16, difficulty);
  const expectedAttempts = Math.pow(16, difficulty);

  // Generate sample hashes
  const generateSamples = useCallback(async () => {
    setIsGenerating(true);
    setRevealedCount(0);
    const newSamples: SampleHash[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const input = `block-header-nonce-${Date.now()}-${i}-${Math.random()}`;
      const hash = await sha256(input);
      newSamples.push({ hash, input });
    }
    setSamples(newSamples);

    // Stagger reveal
    for (let i = 1; i <= newSamples.length; i++) {
      await new Promise((r) => setTimeout(r, 80));
      setRevealedCount(i);
    }
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const newSamples: SampleHash[] = [];
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const input = `block-header-nonce-${Date.now()}-${i}-${Math.random()}`;
        const hash = await sha256(input);
        if (cancelled) return;
        newSamples.push({ hash, input });
      }
      setSamples(newSamples);
      for (let i = 1; i <= newSamples.length; i++) {
        await new Promise((r) => setTimeout(r, 80));
        if (cancelled) return;
        setRevealedCount(i);
      }
      setIsGenerating(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Animate sample rows on reveal
  useEffect(() => {
    if (!samplesRef.current || revealedCount === 0) return;
    const rows = samplesRef.current.querySelectorAll("[data-hash-row]");
    const lastRow = rows[revealedCount - 1];
    if (lastRow) {
      gsap.fromTo(
        lastRow,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [revealedCount]);

  // Animate comparison bars on mount
  useEffect(() => {
    if (!barsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-diff-bar]", {
        scaleX: 0,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        transformOrigin: "left center",
      });
    }, barsRef);
    return () => ctx.revert();
  }, []);

  const validCount = samples.filter(
    (s) => leadingZeros(s.hash) >= difficulty
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Intro: What is the Target? ── */}
      <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/5 px-4 py-3">
        <p className="text-sm leading-relaxed text-text-secondary">
          <span className="font-semibold text-accent-primary">Was ist das Target?</span>{" "}
          Beim Mining wird der Block-Header immer wieder gehasht — jedes Mal mit einer anderen Nonce.
          Der resultierende Hash ist eine 64-stellige Hex-Zahl. Das{" "}
          <span className="font-semibold text-accent-primary">Target</span> ist ein Schwellenwert:
          der Hash muss <span className="font-semibold text-accent-success">numerisch kleiner</span> sein
          als das Target. In der Praxis bedeutet das: er muss mit einer bestimmten Anzahl{" "}
          <span className="font-semibold text-accent-success">führender Nullen</span> beginnen.
          Je höher die Difficulty, desto mehr Nullen sind nötig — und desto schwerer wird es.
        </p>
      </div>

      {/* ── Difficulty Slider ── */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
        <label className="mb-3 block font-display text-sm font-semibold text-text-primary">
          Difficulty einstellen
        </label>

        {/* Slider with step indicators */}
        <div className="mb-2 flex items-center gap-3">
          <span className="font-code text-xs text-text-muted">Leicht</span>
          <input
            type="range"
            min={DIFFICULTY_MIN}
            max={DIFFICULTY_MAX}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="flex-1 accent-accent-primary"
          />
          <span className="font-code text-xs text-text-muted">Schwer</span>
        </div>

        {/* Current difficulty display */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-xs text-text-muted">Difficulty: </span>
            <span className="font-code text-lg font-bold text-accent-primary">{difficulty}</span>
          </div>
          <div>
            <span className="text-xs text-text-muted">Nötige führende Nullen: </span>
            <span className="font-code text-lg font-bold text-accent-success">{difficulty}</span>
          </div>
          <div>
            <span className="text-xs text-text-muted">Erwartete Versuche: </span>
            <span className="font-code text-lg font-bold text-accent-secondary">
              ~{expectedAttempts.toLocaleString("de-DE")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Target Display ── */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
        <p className="mb-2 font-display text-sm font-semibold text-text-primary">
          Aktuelles Target
        </p>
        <p className="mb-1 text-xs text-text-muted">
          Jeder gültige Hash muss kleiner sein als dieser Wert:
        </p>
        <div className="overflow-x-auto rounded-md bg-bg-primary px-3 py-2">
          <span className="font-code text-sm sm:text-base">
            <span className="text-accent-success font-bold">{targetPrefix}</span>
            <span className="text-text-muted/40">{"f".repeat(64 - difficulty)}</span>
          </span>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {difficulty === 1 && "Ein Hash muss nur mit einer Null beginnen — 1 von 16 Hashes erfüllt das (6,25 %)."}
          {difficulty === 2 && "Zwei führende Nullen — nur 1 von 256 Hashes erfüllt das (0,39 %)."}
          {difficulty === 3 && "Drei führende Nullen — nur 1 von 4.096 Hashes. Schon deutlich schwerer."}
          {difficulty === 4 && "Vier führende Nullen — nur 1 von 65.536 Hashes. Spürbar mehr Rechenaufwand."}
          {difficulty === 5 && "Fünf führende Nullen — nur 1 von 1.048.576 Hashes. Über eine Million Versuche im Schnitt!"}
        </p>
      </div>

      {/* ── Hash Comparison Table ── */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-semibold text-text-primary">
              Hash vs. Target — Live-Vergleich
            </p>
            <p className="text-xs text-text-muted">
              {SAMPLE_COUNT} zufällige Hashes. Beginnt ein Hash mit mindestens{" "}
              <span className="font-semibold text-accent-success">{difficulty} Null{difficulty > 1 ? "en" : ""}</span>,
              ist er gültig.
            </p>
          </div>
          <button
            onClick={generateSamples}
            disabled={isGenerating}
            className="shrink-0 rounded-lg bg-accent-primary/20 px-4 py-2 font-display text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/30 disabled:opacity-50"
          >
            {isGenerating ? "..." : "Neue Hashes"}
          </button>
        </div>

        {/* Target reference row */}
        <div className="mb-2 flex items-center gap-2 rounded-md bg-accent-primary/5 px-3 py-1.5">
          <span className="w-14 shrink-0 font-code text-[10px] font-semibold text-accent-primary">
            TARGET
          </span>
          <span className="font-code text-[13px] sm:text-sm">
            <span className="text-accent-success font-bold">{targetPrefix}</span>
            <span className="text-text-muted/30">{"f".repeat(Math.min(24 - difficulty, 20))}...</span>
          </span>
          <span className="ml-auto shrink-0 font-code text-[10px] text-accent-primary">
            Schwelle
          </span>
        </div>

        {/* Hash rows */}
        <div ref={samplesRef} className="space-y-0.5">
          {samples.slice(0, revealedCount).map((sample, i) => {
            const zeros = leadingZeros(sample.hash);
            const valid = zeros >= difficulty;
            return (
              <div
                key={sample.hash}
                data-hash-row
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                  valid
                    ? "bg-accent-success/8 border border-accent-success/20"
                    : "bg-transparent border border-transparent"
                }`}
              >
                <span className={`w-14 shrink-0 font-code text-[10px] font-semibold ${
                  valid ? "text-accent-success" : "text-text-muted"
                }`}>
                  #{i + 1}
                </span>
                <HashDisplay hash={sample.hash} difficulty={difficulty} />
                <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 font-code text-[10px] font-semibold ${
                  valid
                    ? "bg-accent-success/20 text-accent-success"
                    : "bg-transparent text-text-muted/50"
                }`}>
                  {valid ? `${zeros} Nullen` : `${zeros}/${difficulty}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {revealedCount >= samples.length && samples.length > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
            <span className="text-xs text-text-muted">
              Ergebnis: <span className="font-semibold text-accent-success">{validCount}</span> von{" "}
              {samples.length} gültig ({((validCount / samples.length) * 100).toFixed(0)}%)
            </span>
            <span className="text-xs text-text-muted">
              Erwartet: ~{(probability * 100).toFixed(probability < 0.01 ? 2 : 1)}%
            </span>
          </div>
        )}
      </div>

      {/* ── Visual: How the target shrinks ── */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
        <p className="mb-3 font-display text-sm font-semibold text-text-primary">
          Wie das Target den gültigen Bereich verkleinert
        </p>
        <p className="mb-4 text-xs text-text-muted">
          Der grüne Bereich zeigt, wie viel Prozent aller möglichen Hashes gültig wären.
          Jede zusätzliche Null schrumpft den Bereich auf 1/16 der vorherigen Größe.
        </p>
        <div className="space-y-3">
          {DIFFICULTY_COMPARISON.map((item) => {
            const fraction = 1 / Math.pow(16, item.difficulty);
            const barPercent = Math.max(fraction * 100, 0.5); // min 0.5% for visibility
            const isActive = item.difficulty === difficulty;
            return (
              <div key={item.difficulty}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={`font-code text-xs ${isActive ? "font-bold text-accent-primary" : "text-text-muted"}`}>
                    Difficulty {item.difficulty} — {"0".repeat(item.difficulty)}{"x".repeat(3)}...
                  </span>
                  <span className={`font-code text-xs ${isActive ? "font-bold text-accent-primary" : "text-text-muted"}`}>
                    {item.label}
                  </span>
                </div>
                {/* Full hash space bar */}
                <div className={`relative h-6 overflow-hidden rounded-md bg-bg-secondary ${
                  isActive ? "ring-1 ring-accent-primary/50" : ""
                }`}>
                  {/* Green valid zone */}
                  <div
                    data-diff-bar
                    className="absolute left-0 top-0 h-full rounded-l-md bg-accent-success/30"
                    style={{ width: `${barPercent}%` }}
                  />
                  {/* Target line */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-accent-primary"
                    style={{ left: `${barPercent}%` }}
                  />
                  {/* Percentage label */}
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className={`font-code text-[10px] ${
                      barPercent > 15 ? "text-accent-success" : "text-text-muted"
                    }`}>
                      {fraction >= 0.01
                        ? `${(fraction * 100).toFixed(1)}%`
                        : `${(fraction * 100).toExponential(0)}`
                      } gültig
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Probability Stats ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">Wahrscheinlichkeit</p>
          <p className="font-code text-lg font-bold text-accent-primary">
            1/{expectedAttempts.toLocaleString("de-DE")}
          </p>
          <p className="font-code text-xs text-text-muted">
            pro Hash-Versuch
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">
            Erwartete Versuche
          </p>
          <p className="font-code text-lg font-bold text-accent-secondary">
            ~{expectedAttempts.toLocaleString("de-DE")}
          </p>
          <p className="font-code text-xs text-text-muted">
            = 16<sup>{difficulty}</sup>
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">
            Gültiger Hash-Raum
          </p>
          <p className="font-code text-lg font-bold text-accent-success">
            {probability >= 0.01
              ? `${(probability * 100).toFixed(2)}%`
              : (probability * 100).toExponential(1)
            }
          </p>
          <p className="font-code text-xs text-text-muted">
            aller möglichen Hashes
          </p>
        </div>
      </div>

      {/* ── Bitcoin Real-World Reference ── */}
      <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/5 p-4">
        <p className="mb-1 font-display text-xs font-semibold text-accent-primary">
          Bitcoin Real-World Vergleich
        </p>
        <p className="text-xs leading-relaxed text-text-secondary">
          Bitcoins aktuelle Mining-Difficulty erfordert ~19 führende Hex-Nullen
          (~74 führende Binär-Nullen). Das entspricht ~16¹⁹ ≈ 4,7 × 10²²
          erwarteten Hash-Versuchen pro Block. Hier oben nutzen wir {DIFFICULTY_MIN}–{DIFFICULTY_MAX} Nullen
          zur Veranschaulichung — in der Realität ist es millionenfach schwerer.
        </p>
      </div>
    </div>
  );
}
