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
  valid: boolean;
  x: number;
}

const MAX_SAMPLES = 60;

export default function DifficultyTarget() {
  const [difficulty, setDifficulty] = useState(DIFFICULTY_DEFAULT);
  const [samples, setSamples] = useState<SampleHash[]>([]);
  const [displayedSamples, setDisplayedSamples] = useState<SampleHash[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const animatedDiffRef = useRef(DIFFICULTY_DEFAULT);
  const animFrameRef = useRef(0);

  const targetPrefix = "0".repeat(difficulty);
  const probability = 1 / Math.pow(16, difficulty);
  const expectedAttempts = Math.pow(16, difficulty);
  const validZonePercent = probability * 100;

  // Generate sample hashes
  const generateSamples = useCallback(async () => {
    setIsGenerating(true);
    const newSamples: SampleHash[] = [];
    for (let i = 0; i < MAX_SAMPLES; i++) {
      const input = `sample-${Date.now()}-${i}-${Math.random()}`;
      const hash = await sha256(input);
      const valid = hash.startsWith(targetPrefix);
      const pos = parseInt(hash.slice(0, 8), 16) / 0xffffffff;
      newSamples.push({ hash, valid, x: pos });
    }
    setSamples(newSamples);

    // Stagger reveal: add dots one by one
    setDisplayedSamples([]);
    for (let i = 0; i < newSamples.length; i++) {
      await new Promise((r) => setTimeout(r, 25));
      setDisplayedSamples(newSamples.slice(0, i + 1));
    }
    setIsGenerating(false);
  }, [targetPrefix]);

  useEffect(() => {
    generateSamples();
  }, [generateSamples]);

  // Canvas drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    if (width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, width, height);

    // Hash space bar
    const barY = 30;
    const barH = 40;
    ctx.fillStyle = "#1a1f2e";
    ctx.fillRect(0, barY, width, barH);

    // Valid zone (green) — use animated difficulty for smooth transition
    const animDiff = animatedDiffRef.current;
    const targetX = width * (1 / Math.pow(16, animDiff));
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    ctx.fillRect(0, barY, Math.max(targetX, 2), barH);

    // Target threshold line
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.max(targetX, 1), barY - 5);
    ctx.lineTo(Math.max(targetX, 1), barY + barH + 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = "#22d3ee";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      "Target",
      Math.min(Math.max(targetX, 1) + 6, width - 40),
      barY - 8
    );

    // Labels for hash space
    ctx.fillStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("0x00...00", 4, barY + barH + 16);
    ctx.textAlign = "right";
    ctx.fillText("0xFF...FF", width - 4, barY + barH + 16);

    // Plot sample hashes as dots
    const dotY = barY + barH + 35;
    const currentSamples = displayedSamples;
    currentSamples.forEach((sample) => {
      const x = sample.x * width;
      ctx.beginPath();
      ctx.arc(x, dotY + Math.random() * 20, 3, 0, Math.PI * 2);
      ctx.fillStyle = sample.valid
        ? "rgba(16, 185, 129, 0.8)"
        : "rgba(239, 68, 68, 0.4)";
      ctx.fill();
    });

    // Legend
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    const legendY = dotY + 35;
    ctx.beginPath();
    ctx.arc(10, legendY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
    ctx.fill();
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Gültig (< Target)", 20, legendY + 3);

    ctx.beginPath();
    ctx.arc(130, legendY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
    ctx.fill();
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Ungültig (≥ Target)", 140, legendY + 3);
  }, [displayedSamples]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        sizeRef.current = { width, height: 140 };
        draw();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Animate difficulty change with GSAP tween
  const prevDiffRef = useRef(difficulty);
  useEffect(() => {
    if (prevDiffRef.current !== difficulty) {
      const startVal = prevDiffRef.current;
      prevDiffRef.current = difficulty;

      // Tween animated difficulty
      const obj = { val: startVal };
      gsap.to(obj, {
        val: difficulty,
        duration: 0.6,
        ease: "power2.inOut",
        onUpdate: () => {
          animatedDiffRef.current = obj.val;
          draw();
        },
      });
    }
  }, [difficulty, draw]);

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

  const validCount = samples.filter((s) => s.valid).length;

  return (
    <div className="space-y-5">
      {/* Difficulty Slider */}
      <div>
        <label className="mb-2 block font-display text-sm font-medium text-text-primary">
          Difficulty: {difficulty} führende Null{difficulty > 1 ? "en" : ""}
        </label>
        <input
          type="range"
          min={DIFFICULTY_MIN}
          max={DIFFICULTY_MAX}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full accent-accent-primary"
        />
      </div>

      {/* Canvas Target Bar */}
      <div
        ref={containerRef}
        className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3"
      >
        <canvas
          ref={canvasRef}
          className="h-[140px] w-full"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* Zoom indicator for high difficulties */}
      {validZonePercent < 5 && (
        <div className="flex items-center gap-2 rounded-lg border border-accent-warning/20 bg-accent-warning/5 px-3 py-2">
          <span className="text-sm">🔍</span>
          <span className="font-code text-xs text-accent-warning">
            Gültiger Bereich: {validZonePercent < 0.01 ? validZonePercent.toExponential(1) : validZonePercent.toFixed(4)}% des Hash-Raums — winzig!
          </span>
        </div>
      )}

      {/* Probability Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">Wahrscheinlichkeit</p>
          <p className="font-code text-lg font-bold text-accent-primary">
            1/{expectedAttempts.toLocaleString()}
          </p>
          <p className="font-code text-xs text-text-muted">
            = {(probability * 100).toExponential(2)}%
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">
            Erwartete Versuche
          </p>
          <p className="font-code text-lg font-bold text-accent-secondary">
            {expectedAttempts.toLocaleString()}
          </p>
          <p className="font-code text-xs text-text-muted">
            = 16^{difficulty}
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">
            Stichprobe ({MAX_SAMPLES})
          </p>
          <p className="font-code text-lg font-bold text-accent-success">
            {validCount} gültig
          </p>
          <p className="font-code text-xs text-text-muted">
            {((validCount / MAX_SAMPLES) * 100).toFixed(1)}% (erwartet:{" "}
            {(probability * 100).toFixed(4)}%)
          </p>
        </div>
      </div>

      {/* Regenerate Button */}
      <button
        onClick={generateSamples}
        disabled={isGenerating}
        className="rounded-lg bg-accent-primary/20 px-5 py-2.5 font-display text-sm font-semibold text-accent-primary transition-colors hover:bg-accent-primary/30 disabled:opacity-50"
      >
        {isGenerating ? "Generiere..." : "Neue Stichprobe generieren"}
      </button>

      {/* Difficulty Comparison Bar Chart */}
      <div ref={barsRef} className="space-y-2">
        <p className="font-display text-xs font-semibold text-text-primary">
          Schwierigkeit im Vergleich
        </p>
        <div className="space-y-1.5">
          {DIFFICULTY_COMPARISON.map((item) => {
            const maxLog = Math.log10(DIFFICULTY_COMPARISON[DIFFICULTY_COMPARISON.length - 1].expectedAttempts);
            const barWidth = (Math.log10(item.expectedAttempts) / maxLog) * 100;
            const isActive = item.difficulty === difficulty;
            return (
              <div key={item.difficulty} className="flex items-center gap-2">
                <span className={`w-4 font-code text-xs ${isActive ? "font-bold text-accent-primary" : "text-text-muted"}`}>
                  {item.difficulty}
                </span>
                <div className="flex-1">
                  <div
                    data-diff-bar
                    className={`h-5 rounded transition-all duration-300 ${
                      isActive
                        ? "bg-accent-primary/40 ring-1 ring-accent-primary/60"
                        : "bg-white/5"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`w-24 text-right font-code text-xs ${isActive ? "font-bold text-accent-primary" : "text-text-muted"}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-world Reference Card */}
      <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/5 p-3">
        <p className="mb-1 font-display text-xs font-semibold text-accent-primary">
          Bitcoin Real-World Vergleich
        </p>
        <p className="text-xs leading-relaxed text-text-secondary">
          Bitcoins aktuelle Mining-Difficulty erfordert ~19 führende Hex-Nullen
          (~74 führende Binär-Nullen). Das entspricht ~16¹⁹ ≈ 4,7 × 10²²
          erwarteten Hash-Versuchen pro Block. Spezialisierte ASIC-Miner
          berechnen über 100 TH/s (10¹⁴ Hashes pro Sekunde).
        </p>
      </div>

      {/* Scaling Info */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-3">
        <p className="text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">
            Exponentielles Wachstum:
          </span>{" "}
          Jede zusätzliche führende Null ver-16-facht die Anzahl nötiger
          Versuche. Bei Difficulty 1 braucht man ~16 Versuche, bei 4 schon
          ~65.536 und bei 6 über 16 Millionen.
        </p>
      </div>
    </div>
  );
}
