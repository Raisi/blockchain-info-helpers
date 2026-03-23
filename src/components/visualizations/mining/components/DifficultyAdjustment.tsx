"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import { TARGET_BLOCK_TIME, BLOCKS_PER_EPOCH } from "../constants";
import type { EpochData } from "../types";

const INITIAL_DIFFICULTY = 1;
const INITIAL_HASHRATE = 100;
const MAX_ADJUSTMENT_FACTOR = 4;

function simulateEpoch(
  hashrate: number,
  difficulty: number
): { actualTime: number; adjustment: number; newDifficulty: number } {
  const baseDifficulty = 1;
  const baseHashrate = 100;
  const avgBlockTime =
    TARGET_BLOCK_TIME * (difficulty / baseDifficulty) * (baseHashrate / hashrate);

  const jitter = 0.8 + Math.random() * 0.4;
  const actualAvgTime = avgBlockTime * jitter;

  const ratio = actualAvgTime / TARGET_BLOCK_TIME;
  const clampedRatio = Math.max(
    1 / MAX_ADJUSTMENT_FACTOR,
    Math.min(MAX_ADJUSTMENT_FACTOR, ratio)
  );
  const newDifficulty = Math.max(0.1, difficulty * clampedRatio);
  const adjustmentPercent = (clampedRatio - 1) * 100;

  return {
    actualTime: Math.round(actualAvgTime),
    adjustment: adjustmentPercent,
    newDifficulty,
  };
}

export default function DifficultyAdjustment() {
  const [hashrate, setHashrate] = useState(INITIAL_HASHRATE);
  const [currentDifficulty, setCurrentDifficulty] = useState(INITIAL_DIFFICULTY);
  const [epochs, setEpochs] = useState<EpochData[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const epochsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const convergenceBadgeRef = useRef<HTMLDivElement>(null);

  const expectedBlockTime =
    TARGET_BLOCK_TIME * (currentDifficulty / 1) * (100 / hashrate);

  const simulateNextEpoch = useCallback(() => {
    const diff =
      epochs.length > 0
        ? epochs[epochs.length - 1].difficulty
        : currentDifficulty;

    const result = simulateEpoch(hashrate, diff);
    const newEpoch: EpochData = {
      epoch: epochs.length + 1,
      difficulty: result.newDifficulty,
      targetTime: TARGET_BLOCK_TIME,
      actualTime: result.actualTime,
      adjustment: result.adjustment,
      hashrate,
    };

    setEpochs((prev) => [...prev, newEpoch]);
    setCurrentDifficulty(result.newDifficulty);
  }, [epochs, currentDifficulty, hashrate]);

  const fastForward = useCallback(() => {
    setIsSimulating(true);
    let diff =
      epochs.length > 0
        ? epochs[epochs.length - 1].difficulty
        : currentDifficulty;
    const newEpochs: EpochData[] = [];

    for (let i = 0; i < 5; i++) {
      const result = simulateEpoch(hashrate, diff);
      newEpochs.push({
        epoch: epochs.length + i + 1,
        difficulty: result.newDifficulty,
        targetTime: TARGET_BLOCK_TIME,
        actualTime: result.actualTime,
        adjustment: result.adjustment,
        hashrate,
      });
      diff = result.newDifficulty;
    }

    setEpochs((prev) => [...prev, ...newEpochs]);
    setCurrentDifficulty(diff);
    setIsSimulating(false);
  }, [epochs, currentDifficulty, hashrate]);

  const reset = useCallback(() => {
    setEpochs([]);
    setCurrentDifficulty(INITIAL_DIFFICULTY);
  }, []);

  // Animate new epoch in timeline + scroll right
  useEffect(() => {
    if (!timelineRef.current || epochs.length === 0) return;
    const lastCard = timelineRef.current.lastElementChild;
    if (lastCard) {
      gsap.from(lastCard, {
        x: 30,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      });
    }
    // Auto-scroll to right
    timelineRef.current.scrollTo({
      left: timelineRef.current.scrollWidth,
      behavior: "smooth",
    });
  }, [epochs.length]);

  // Animate convergence badge
  useEffect(() => {
    if (!convergenceBadgeRef.current || epochs.length === 0) return;
    gsap.from(convergenceBadgeRef.current, {
      scale: 0.8,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [epochs.length]);

  // Draw chart with dual Y-axis
  const drawChart = useCallback(() => {
    const canvas = chartRef.current;
    if (!canvas || epochs.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    if (width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 55, bottom: 25, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, width, height);

    if (epochs.length < 2) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Simuliere mindestens 2 Epochen für das Diagramm",
        width / 2,
        height / 2
      );
      return;
    }

    // Data ranges
    const times = epochs.map((e) => e.actualTime);
    const diffs = epochs.map((e) => e.difficulty);
    const maxTime = Math.max(TARGET_BLOCK_TIME * 2, ...times);
    const minTime = Math.min(TARGET_BLOCK_TIME / 2, ...times);
    const maxDiff = Math.max(...diffs) * 1.2;
    const minDiff = Math.min(...diffs) * 0.8;

    const xStep = chartW / (epochs.length - 1);

    // Target line (600s)
    const targetY =
      padding.top +
      chartH * (1 - (TARGET_BLOCK_TIME - minTime) / (maxTime - minTime));
    ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, targetY);
    ctx.lineTo(width - padding.right, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Left Y-axis label (block time)
    ctx.fillStyle = "#8b5cf6";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText("600s", padding.left - 5, targetY + 3);

    // Block time line (violet)
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    epochs.forEach((epoch, i) => {
      const x = padding.left + i * xStep;
      const y =
        padding.top +
        chartH * (1 - (epoch.actualTime - minTime) / (maxTime - minTime));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Difficulty line (cyan)
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    epochs.forEach((epoch, i) => {
      const x = padding.left + i * xStep;
      const y =
        padding.top +
        chartH * (1 - (epoch.difficulty - minDiff) / (maxDiff - minDiff));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Dots on block time line
    epochs.forEach((epoch, i) => {
      const x = padding.left + i * xStep;
      const y =
        padding.top +
        chartH * (1 - (epoch.actualTime - minTime) / (maxTime - minTime));
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle =
        epoch.actualTime > TARGET_BLOCK_TIME * 1.1
          ? "#ef4444"
          : epoch.actualTime < TARGET_BLOCK_TIME * 0.9
            ? "#10b981"
            : "#8b5cf6";
      ctx.fill();
    });

    // X-axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    epochs.forEach((epoch, i) => {
      if (i % Math.max(1, Math.floor(epochs.length / 8)) === 0) {
        const x = padding.left + i * xStep;
        ctx.fillText(`E${epoch.epoch}`, x, height - 5);
      }
    });

    // Right Y-axis label (difficulty)
    ctx.fillStyle = "#22d3ee";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `${diffs[diffs.length - 1].toFixed(2)}`,
      width - padding.right + 5,
      padding.top +
        chartH *
          (1 -
            (diffs[diffs.length - 1] - minDiff) / (maxDiff - minDiff)) +
        3
    );

    // Legend
    const legendX = padding.left + 5;
    const legendY = padding.top + 5;

    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(legendX, legendY, 12, 2);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Blockzeit", legendX + 16, legendY + 4);

    ctx.fillStyle = "#22d3ee";
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 14);
    ctx.lineTo(legendX + 12, legendY + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Difficulty", legendX + 16, legendY + 18);
  }, [epochs]);

  // ResizeObserver for chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        sizeRef.current = {
          width: entry.contentRect.width,
          height: 200,
        };
        drawChart();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [drawChart]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Hashrate zone info
  const hashrateZone =
    hashrate <= 60
      ? { label: "Langsam", color: "text-accent-danger" }
      : hashrate <= 150
        ? { label: "Normal", color: "text-accent-success" }
        : { label: "Schnell", color: "text-accent-warning" };

  // Convergence calculation
  const latestEpoch = epochs.length > 0 ? epochs[epochs.length - 1] : null;
  const convergence = latestEpoch
    ? Math.max(
        0,
        100 - Math.abs((latestEpoch.actualTime - TARGET_BLOCK_TIME) / TARGET_BLOCK_TIME) * 100
      )
    : null;
  const convergenceColor =
    convergence !== null
      ? convergence > 90
        ? "text-accent-success border-accent-success/30 bg-accent-success/10"
        : convergence > 50
          ? "text-accent-warning border-accent-warning/30 bg-accent-warning/10"
          : "text-accent-danger border-accent-danger/30 bg-accent-danger/10"
      : "";

  return (
    <div className="space-y-5">
      {/* Hashrate Control with gauge */}
      <div>
        <label className="mb-2 block font-display text-sm font-medium text-text-primary">
          Netzwerk-Hashrate: {hashrate}%{" "}
          <span className={`ml-1 font-code text-xs ${hashrateZone.color}`}>
            ({hashrateZone.label})
          </span>
        </label>
        <input
          type="range"
          min="20"
          max="400"
          value={hashrate}
          onChange={(e) => setHashrate(Number(e.target.value))}
          className="w-full accent-accent-primary"
        />
        {/* Zone indicators */}
        <div className="mt-1 flex font-code text-[10px]">
          <span className="flex-[40] text-left text-accent-danger/60">Langsam</span>
          <span className="flex-[90] text-center text-accent-success/60">Normal</span>
          <span className="flex-[250] text-right text-accent-warning/60">Schnell</span>
        </div>
        <p className="mt-1 font-code text-xs text-text-muted">
          Erwartete Blockzeit: {Math.round(expectedBlockTime)}s
          {expectedBlockTime > TARGET_BLOCK_TIME * 1.1 && (
            <span className="ml-1 text-accent-danger">(zu langsam)</span>
          )}
          {expectedBlockTime < TARGET_BLOCK_TIME * 0.9 && (
            <span className="ml-1 text-accent-success">(zu schnell)</span>
          )}
        </p>
      </div>

      {/* Current State + Convergence */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">
            Aktuelle Difficulty
          </p>
          <p className="font-code text-lg font-bold text-accent-primary">
            {currentDifficulty.toFixed(3)}
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-center">
          <p className="font-code text-xs text-text-muted">Epochen simuliert</p>
          <p className="font-code text-lg font-bold text-accent-secondary">
            {epochs.length}
          </p>
        </div>
        {convergence !== null && (
          <div
            ref={convergenceBadgeRef}
            className={`col-span-2 rounded-lg border p-3 text-center sm:col-span-1 ${convergenceColor}`}
          >
            <p className="font-code text-xs opacity-70">Konvergenz</p>
            <p className="font-code text-lg font-bold">
              {convergence.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={simulateNextEpoch}
          disabled={isSimulating}
          className="rounded-lg bg-accent-primary/20 px-5 py-2.5 font-display text-sm font-semibold text-accent-primary transition-colors hover:bg-accent-primary/30 disabled:opacity-50"
        >
          Nächste Epoche
        </button>
        <button
          onClick={fastForward}
          disabled={isSimulating}
          className="rounded-lg bg-accent-secondary/20 px-5 py-2.5 font-display text-sm font-semibold text-accent-secondary transition-colors hover:bg-accent-secondary/30 disabled:opacity-50"
        >
          5 Epochen vorspulen
        </button>
        <button
          onClick={reset}
          className="rounded-lg bg-bg-card px-5 py-2.5 font-display text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
        >
          Zurücksetzen
        </button>
      </div>

      {/* Chart */}
      <div
        ref={chartContainerRef}
        className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3"
      >
        <p className="mb-2 font-display text-xs font-medium text-text-muted">
          Block-Zeit & Difficulty pro Epoche
        </p>
        <canvas
          ref={chartRef}
          className="h-[200px] w-full"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* Epoch Timeline (horizontal scrollable) */}
      {epochs.length > 0 && (
        <div className="space-y-2">
          <p className="font-display text-xs font-medium text-text-muted">
            Epochen-Timeline
          </p>
          <div
            ref={timelineRef}
            className="flex gap-1 overflow-x-auto pb-2"
          >
            {epochs.map((epoch, i) => {
              const isSlow = epoch.actualTime > TARGET_BLOCK_TIME * 1.1;
              const isFast = epoch.actualTime < TARGET_BLOCK_TIME * 0.9;
              const bgColor = isSlow
                ? "border-accent-danger/30 bg-accent-danger/10"
                : isFast
                  ? "border-accent-success/30 bg-accent-success/10"
                  : "border-accent-primary/30 bg-accent-primary/10";
              const nextEpoch = epochs[i + 1];
              const arrow = nextEpoch
                ? nextEpoch.difficulty > epoch.difficulty
                  ? { symbol: "↑", color: "text-accent-danger" }
                  : nextEpoch.difficulty < epoch.difficulty
                    ? { symbol: "↓", color: "text-accent-success" }
                    : { symbol: "→", color: "text-text-muted" }
                : null;

              return (
                <div key={epoch.epoch} className="flex shrink-0 items-center">
                  <div
                    className={`w-24 rounded-lg border p-2 text-center ${bgColor}`}
                  >
                    <p className="font-code text-[10px] font-bold text-text-primary">
                      E{epoch.epoch}
                    </p>
                    <p
                      className={`font-code text-xs ${
                        isSlow
                          ? "text-accent-danger"
                          : isFast
                            ? "text-accent-success"
                            : "text-accent-primary"
                      }`}
                    >
                      {epoch.actualTime}s
                    </p>
                    <p className="font-code text-[10px] text-text-muted">
                      D: {epoch.difficulty.toFixed(2)}
                    </p>
                  </div>
                  {arrow && (
                    <span className={`mx-0.5 font-code text-sm font-bold ${arrow.color}`}>
                      {arrow.symbol}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adjustment Formula with live numbers */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-3">
        <p className="mb-2 font-display text-xs font-semibold text-text-primary">
          Anpassungsformel
        </p>
        {latestEpoch && epochs.length >= 2 ? (
          <div className="space-y-2">
            <p className="font-code text-xs leading-relaxed">
              <span className="text-text-muted">neue_diff = </span>
              <span className="text-accent-primary">
                {epochs.length >= 2
                  ? epochs[epochs.length - 2].difficulty.toFixed(3)
                  : INITIAL_DIFFICULTY.toFixed(3)}
              </span>
              <span className="text-text-muted"> × (</span>
              <span
                className={
                  latestEpoch.actualTime > TARGET_BLOCK_TIME
                    ? "text-accent-danger"
                    : "text-accent-success"
                }
              >
                {latestEpoch.actualTime}s
              </span>
              <span className="text-text-muted"> / </span>
              <span className="text-accent-primary">{TARGET_BLOCK_TIME}s</span>
              <span className="text-text-muted">) = </span>
              <span className="font-bold text-accent-primary">
                {latestEpoch.difficulty.toFixed(3)}
              </span>
              <span
                className={`ml-1 font-bold ${
                  latestEpoch.adjustment > 0
                    ? "text-accent-danger"
                    : "text-accent-success"
                }`}
              >
                {latestEpoch.adjustment > 0 ? "↑" : "↓"}
              </span>
            </p>
          </div>
        ) : (
          <p className="font-code text-xs leading-relaxed text-accent-secondary">
            neue_difficulty = alte_difficulty × (tatsächliche_zeit / ziel_zeit)
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
          Alle {BLOCKS_PER_EPOCH.toLocaleString()} Blöcke (≈2 Wochen) vergleicht
          Bitcoin die tatsächliche Epochendauer mit der Zielzeit. War die Epoche
          schneller als erwartet, steigt die Difficulty — war sie langsamer, sinkt
          sie. Die Anpassung ist auf Faktor 4 begrenzt.
        </p>
      </div>
    </div>
  );
}
