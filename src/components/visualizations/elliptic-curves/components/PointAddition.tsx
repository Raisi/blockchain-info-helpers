"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import CurveCanvas from "./CurveCanvas";
import { addPoints, snapToCurve, lineExtendedPoints } from "../curve-math";
import { DEFAULT_P, DEFAULT_Q, CURVE_X_RANGE, CURVE_X_MIN_REAL } from "../constants";
import type { CurvePoint2D, CanvasPoint, CanvasLine, AnimStep } from "../types";

export default function PointAddition() {
  const [P, setP] = useState<CurvePoint2D>(DEFAULT_P);
  const [Q, setQ] = useState<CurvePoint2D>(DEFAULT_Q);
  const [animStep, setAnimStep] = useState<AnimStep>("idle");
  const [dragging, setDragging] = useState<"P" | "Q" | null>(null);
  const animRef = useRef<gsap.core.Timeline | null>(null);

  // Snap initial points
  useEffect(() => {
    const sp = snapToCurve(DEFAULT_P.x, DEFAULT_P.y >= 0);
    const sq = snapToCurve(DEFAULT_Q.x, DEFAULT_Q.y >= 0);
    if (sp) setP(sp);
    if (sq) setQ(sq);
  }, []);

  const result = addPoints(P, Q);

  const handlePointerDown = useCallback(
    (mathPoint: CurvePoint2D) => {
      // Check proximity to P or Q
      const distP = Math.hypot(mathPoint.x - P.x, mathPoint.y - P.y);
      const distQ = Math.hypot(mathPoint.x - Q.x, mathPoint.y - Q.y);
      const threshold = 0.8;

      if (distP < threshold && distP < distQ) {
        setDragging("P");
      } else if (distQ < threshold) {
        setDragging("Q");
      }
    },
    [P, Q]
  );

  const handlePointerMove = useCallback(
    (mathPoint: CurvePoint2D) => {
      if (!dragging) return;

      const clampedX = Math.max(CURVE_X_MIN_REAL + 0.05, Math.min(mathPoint.x, CURVE_X_RANGE[1] - 0.5));
      const preferPositive = mathPoint.y >= 0;
      const snapped = snapToCurve(clampedX, preferPositive);
      if (!snapped) return;

      if (dragging === "P") setP(snapped);
      else setQ(snapped);

      // Reset animation when dragging
      if (animStep !== "idle") {
        setAnimStep("idle");
        if (animRef.current) animRef.current.kill();
      }
    },
    [dragging, animStep]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const runAnimation = useCallback(() => {
    if (!result) return;
    if (animRef.current) animRef.current.kill();

    const tl = gsap.timeline();
    animRef.current = tl;

    tl.call(() => setAnimStep("line"), [], 0);
    tl.call(() => setAnimStep("intersect"), [], 0.8);
    tl.call(() => setAnimStep("reflect"), [], 1.6);
    tl.call(() => setAnimStep("done"), [], 2.4);
  }, [result]);

  const reset = useCallback(() => {
    setAnimStep("idle");
    if (animRef.current) animRef.current.kill();
  }, []);

  // Build canvas elements
  const canvasPoints: CanvasPoint[] = [
    { point: P, color: "#22d3ee", label: "P" },
    { point: Q, color: "#8b5cf6", label: "Q" },
  ];

  const canvasLines: CanvasLine[] = [];

  if (result && animStep !== "idle") {
    // Line through P and Q
    if (animStep === "line" || animStep === "intersect" || animStep === "reflect" || animStep === "done") {
      const extended = lineExtendedPoints(P, Q, CURVE_X_RANGE[0], CURVE_X_RANGE[1]);
      canvasLines.push({
        from: extended.from,
        to: extended.to,
        color: "#f59e0b",
        width: 1.5,
      });
    }

    // Third intersection point (before reflection)
    if (animStep === "intersect" || animStep === "reflect" || animStep === "done") {
      canvasPoints.push({
        point: result.thirdIntersection,
        color: "#ef4444",
        label: "R'",
        pulse: true,
      });
    }

    // Reflection line
    if (animStep === "reflect" || animStep === "done") {
      canvasLines.push({
        from: result.thirdIntersection,
        to: result.result,
        color: "#ef4444",
        dashed: true,
        width: 1,
      });
    }

    // Final result
    if (animStep === "done") {
      canvasPoints.push({
        point: result.result,
        color: "#10b981",
        label: "P+Q",
        radius: 7,
      });
    }
  }

  const isPointAtInfinity = !result;

  return (
    <div className="space-y-4">
      <CurveCanvas
        points={canvasPoints}
        lines={canvasLines}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={dragging ? "cursor-grabbing" : ""}
      />

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={runAnimation}
          disabled={isPointAtInfinity}
          className="rounded-lg bg-accent-primary/15 px-4 py-2 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/25 disabled:opacity-40"
        >
          Konstruktion zeigen
        </button>
        <button
          onClick={reset}
          disabled={animStep === "idle"}
          className="rounded-lg border border-border-subtle bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary disabled:opacity-40"
        >
          Zurücksetzen
        </button>
      </div>

      {/* Formulas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Punkte
          </p>
          <div className="space-y-1 font-mono text-sm text-text-secondary">
            <p>
              <span className="text-[#22d3ee]">P</span> = ({P.x.toFixed(4)},{" "}
              {P.y.toFixed(4)})
            </p>
            <p>
              <span className="text-[#8b5cf6]">Q</span> = ({Q.x.toFixed(4)},{" "}
              {Q.y.toFixed(4)})
            </p>
            {result && (
              <>
                <hr className="border-border-subtle" />
                <p>
                  slope ={" "}
                  <span className="text-text-primary">
                    {result.slope.toFixed(4)}
                  </span>
                </p>
                <p>
                  <span className="text-[#10b981]">P+Q</span> = (
                  {result.result.x.toFixed(4)}, {result.result.y.toFixed(4)})
                </p>
              </>
            )}
            {isPointAtInfinity && (
              <>
                <hr className="border-border-subtle" />
                <p className="text-accent-warning">
                  → Punkt im Unendlichen (𝒪)
                </p>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Anleitung
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Ziehe <span className="text-[#22d3ee]">P</span> und{" "}
              <span className="text-[#8b5cf6]">Q</span> entlang der Kurve
            </li>
            <li>Klicke &quot;Konstruktion zeigen&quot; für die Animation</li>
            <li>P = Q → Tangente (Point Doubling)</li>
            <li>Gleiche x, entgegengesetzte y → Punkt im Unendlichen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
