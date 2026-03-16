"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import CurveCanvas from "./CurveCanvas";
import { computeDoubleAndAddSteps, snapToCurve } from "../curve-math";
import { SCALAR_MIN, SCALAR_MAX, SCALAR_DEFAULT } from "../constants";
import type { CurvePoint2D, CanvasPoint, CanvasLine } from "../types";

const FALLBACK_BASE: CurvePoint2D = snapToCurve(1, true) ?? { x: 1, y: 2.828 };

interface ScalarMultiplicationProps {
  basePoint?: CurvePoint2D;
  onScalarChange: (n: number) => void;
  footer?: React.ReactNode;
}

export default function ScalarMultiplication({
  basePoint,
  onScalarChange,
  footer,
}: ScalarMultiplicationProps) {
  const [scalar, setScalar] = useState(SCALAR_DEFAULT);
  const effectiveBase = basePoint ?? FALLBACK_BASE;
  const [hasMovedSlider, setHasMovedSlider] = useState(false);
  const [isStepMode, setIsStepMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const computation = useMemo(
    () => computeDoubleAndAddSteps(effectiveBase, scalar),
    [effectiveBase, scalar]
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

  // Build canvas points and lines
  const canvasPoints: CanvasPoint[] = [
    { point: effectiveBase, color: "#22d3ee", label: "P" },
  ];
  const canvasLines: CanvasLine[] = [];

  if (isStepMode) {
    // Show intermediate steps up to currentStep
    for (let i = 1; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      const isLast = i === currentStep;

      // Connect consecutive points with colored lines
      const prev = i === 1 ? effectiveBase : steps[i - 1].intermediate;
      canvasLines.push({
        from: prev,
        to: s.intermediate,
        color: s.operation === "double" ? "#f59e0b55" : "#8b5cf655",
        dashed: s.operation === "double",
        width: 1,
      });

      canvasPoints.push({
        point: s.intermediate,
        color: s.operation === "double" ? "#f59e0b" : "#8b5cf6",
        label: isLast
          ? `${s.operation === "double" ? "D" : "A"}${i}`
          : undefined,
        radius: isLast ? 6 : 4,
        pulse: isLast,
      });
    }
  } else if (finalResult) {
    // Dashed line from P to nP in normal mode
    canvasLines.push({
      from: effectiveBase,
      to: finalResult,
      color: "#22d3ee33",
      dashed: true,
      width: 1,
    });

    canvasPoints.push({
      point: finalResult,
      color: "#10b981",
      label: `${scalar}P`,
      radius: 7,
      pulse: true,
    });
  }

  const binaryStr = scalar.toString(2);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <CurveCanvas points={canvasPoints} lines={canvasLines} />

      <div className="space-y-4 max-lg:contents">
        {/* Connection to Tab 2 explainer */}
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Von Addition zu Multiplikation
          </p>
          <p>
            In Tab 2 hast du gelernt:{" "}
            <span className="text-text-primary">P + Q = R</span> (Addition zweier Punkte).
          </p>
          <p className="mt-2">
            Hier wiederholen wir diese Addition{" "}
            <span className="text-text-primary">mit sich selbst</span>:
          </p>
          <p className="mt-1 font-mono text-text-primary">
            n &times; P = P + P + P + &hellip; (n mal)
          </p>
          <p className="mt-2 text-text-muted">
            Der Slider steuert n. Jeder Schritt verwendet dieselbe Punkt-Addition aus Tab 2.
          </p>
        </div>

        {/* Base point hint */}
        {basePoint && (
          <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/5 px-4 py-3 text-sm">
            <p className="text-accent-primary">
              Basispunkt P ={" "}
              <span className="font-mono">
                ({basePoint.x.toFixed(2)}, {basePoint.y.toFixed(2)})
              </span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              = R aus Tab 2 (Ergebnis deiner Punkt-Addition P + Q)
            </p>
          </div>
        )}

        {/* Scalar slider */}
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <label className="font-display text-sm text-text-primary">
              n = {scalar}
            </label>
            <span className="font-display text-sm text-accent-primary">
              {scalar} &times; P
            </span>
          </div>
          <input
            type="range"
            min={SCALAR_MIN}
            max={SCALAR_MAX}
            value={scalar}
            onChange={(e) => {
              const n = Number(e.target.value);
              setScalar(n);
              setHasMovedSlider(true);
              onScalarChange(n);
            }}
            className="mt-2 w-full accent-accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            <span>{SCALAR_MIN}</span>
            <span>{SCALAR_MAX}</span>
          </div>

          {/* Visual addition chain */}
          <div className="mt-3 flex flex-wrap items-center gap-1 font-mono text-xs">
            {Array.from({ length: Math.min(scalar, 8) }, (_, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-text-muted">+</span>}
                <span className="text-accent-primary">P</span>
              </span>
            ))}
            {scalar > 8 && <span className="text-text-muted">&hellip; +P</span>}
            <span className="text-text-muted">=</span>
            <span className="text-accent-success font-semibold">{scalar}P</span>
          </div>

          {!hasMovedSlider && (
            <p className="mt-2 text-xs text-accent-warning animate-pulse">
              &uarr; Bewege den Slider, um fortzufahren
            </p>
          )}
        </div>

        {/* Result coordinates in normal mode */}
        {!isStepMode && finalResult && hasMovedSlider && (
          <div className="rounded-lg border border-accent-success/20 bg-accent-success/5 px-4 py-3">
            <p className="font-mono text-xs text-accent-success">
              {scalar} &times; P = {scalar} &times; ({effectiveBase.x.toFixed(2)}, {effectiveBase.y.toFixed(2)})
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-accent-success">
              = ({finalResult.x.toFixed(3)}, {finalResult.y.toFixed(3)})
            </p>
          </div>
        )}

        {/* Step mode toggle + controls */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-bg-card p-4">
          <div>
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
              Double-and-Add Schrittmodus
            </label>
            <p className="mt-1 ml-6 text-xs text-text-muted">
              Zeigt jeden einzelnen Double- und Add-Schritt der Berechnung
            </p>
          </div>

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
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Binärdarstellung von n = {scalar}
          </p>
          <div className="flex flex-wrap gap-1 font-mono text-lg">
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

        {/* Trapdoor info */}
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

        {/* Step timeline */}
        {isStepMode && steps.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
            <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
              Schritte ({currentStep + 1}/{steps.length})
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto font-mono text-xs">
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

        {footer}
      </div>
    </div>
  );
}
