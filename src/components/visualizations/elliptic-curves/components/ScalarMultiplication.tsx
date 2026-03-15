"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import CurveCanvas from "./CurveCanvas";
import { computeDoubleAndAddSteps, snapToCurve } from "../curve-math";
import { SCALAR_MIN, SCALAR_MAX, SCALAR_DEFAULT } from "../constants";
import type { CurvePoint2D, CanvasPoint } from "../types";

const BASE_POINT: CurvePoint2D = snapToCurve(1, true) ?? { x: 1, y: 2.828 };

export default function ScalarMultiplication() {
  const [scalar, setScalar] = useState(SCALAR_DEFAULT);
  const [isStepMode, setIsStepMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const computation = useMemo(
    () => computeDoubleAndAddSteps(BASE_POINT, scalar),
    [scalar]
  );

  const steps = computation?.steps ?? [];
  const finalResult = computation?.result;

  // Auto-play steps
  useEffect(() => {
    if (!isPlaying || !isStepMode) return;

    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isStepMode, steps.length]);

  // Reset step when scalar changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [scalar]);

  const togglePlay = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [currentStep, steps.length]);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  // Build canvas points
  const canvasPoints: CanvasPoint[] = [
    { point: BASE_POINT, color: "#22d3ee", label: "P" },
  ];

  if (isStepMode) {
    // Show intermediate steps up to currentStep
    for (let i = 1; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      const isLast = i === currentStep;
      canvasPoints.push({
        point: s.intermediate,
        color: s.operation === "double" ? "#f59e0b" : "#8b5cf6",
        label: isLast ? `${i}` : undefined,
        radius: isLast ? 6 : 4,
      });
    }
  } else if (finalResult) {
    canvasPoints.push({
      point: finalResult,
      color: "#10b981",
      label: `${scalar}P`,
      radius: 7,
    });
  }

  const binaryStr = scalar.toString(2);

  return (
    <div className="space-y-4">
      <CurveCanvas points={canvasPoints} />

      {/* Scalar slider */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
        <div className="flex items-center justify-between">
          <label className="font-display text-sm text-text-primary">
            n = {scalar}
          </label>
          <span className="font-mono text-xs text-text-muted">
            {scalar}P = P {"+P".repeat(scalar - 1)}
          </span>
        </div>
        <input
          type="range"
          min={SCALAR_MIN}
          max={SCALAR_MAX}
          value={scalar}
          onChange={(e) => setScalar(Number(e.target.value))}
          className="mt-2 w-full accent-accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-text-muted">
          <span>{SCALAR_MIN}</span>
          <span>{SCALAR_MAX}</span>
        </div>
      </div>

      {/* Step mode toggle + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={isStepMode}
            onChange={(e) => {
              setIsStepMode(e.target.checked);
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            className="accent-accent-primary"
          />
          Schritt für Schritt
        </label>

        {isStepMode && (
          <div className="flex gap-2">
            <button
              onClick={togglePlay}
              className="rounded-lg bg-accent-primary/15 px-3 py-1.5 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/25"
            >
              {isPlaying
                ? "Pause"
                : currentStep >= steps.length - 1
                  ? "Neu starten"
                  : "Play"}
            </button>
            <button
              onClick={stepForward}
              disabled={currentStep >= steps.length - 1}
              className="rounded-lg border border-border-subtle bg-bg-card px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card-hover disabled:opacity-40"
            >
              Schritt →
            </button>
          </div>
        )}
      </div>

      {/* Binary representation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Binärdarstellung von n = {scalar}
          </p>
          <div className="flex gap-1 font-mono text-lg">
            {binaryStr.split("").map((bit, i) => {
              const isActive =
                isStepMode &&
                i <=
                  steps.slice(0, currentStep + 1).filter((s) => s.operation === "double").length - 1;
              return (
                <span
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded ${
                    isActive
                      ? "bg-accent-primary/20 text-accent-primary"
                      : "bg-bg-primary text-text-muted"
                  }`}
                >
                  {bit}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            MSB → LSB, Double-and-Add verarbeitet Bit für Bit
          </p>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Trapdoor-Funktion
          </p>
          <p>
            <span className="text-text-primary">Einfach:</span> nP berechnen
            (O(log n) Schritte via Double-and-Add)
          </p>
          <p className="mt-2">
            <span className="text-text-primary">Unmöglich:</span> Aus dem
            Ergebnis nP und P das n zurückzurechnen (diskretes
            Logarithmusproblem auf elliptischen Kurven, ECDLP)
          </p>
          <p className="mt-2 text-accent-warning">
            → Diese Asymmetrie ist die Basis der Bitcoin-Sicherheit
          </p>
        </div>
      </div>

      {/* Step timeline */}
      {isStepMode && steps.length > 0 && (
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Schritte ({currentStep + 1}/{steps.length})
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1 ${
                  i === currentStep
                    ? "bg-accent-primary/10 text-accent-primary"
                    : i < currentStep
                      ? "text-text-secondary"
                      : "text-text-muted"
                }`}
              >
                <span
                  className={`mr-2 inline-block w-14 rounded px-1 text-center text-[10px] ${
                    s.operation === "double"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-violet-500/15 text-violet-400"
                  }`}
                >
                  {s.operation === "double" ? "DOUBLE" : "ADD"}
                </span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
