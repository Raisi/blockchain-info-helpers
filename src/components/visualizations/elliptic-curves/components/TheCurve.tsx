"use client";

import { useCallback } from "react";
import CurveCanvas from "./CurveCanvas";
import { snapToCurve } from "../curve-math";
import { POINT_COLORS, MAX_PLACED_POINTS, CURVE_X_MIN_REAL } from "../constants";
import type { CurvePoint2D, CanvasPoint } from "../types";

interface TheCurveProps {
  placedPoints: CurvePoint2D[];
  onPointsChange: (points: CurvePoint2D[]) => void;
  footer?: React.ReactNode;
}

export default function TheCurve({ placedPoints, onPointsChange, footer }: TheCurveProps) {

  const handleClick = useCallback(
    (mathPoint: CurvePoint2D) => {
      if (placedPoints.length >= MAX_PLACED_POINTS) return;

      // Only snap if x is in range where curve exists
      if (mathPoint.x < CURVE_X_MIN_REAL) return;

      const preferPositive = mathPoint.y >= 0;
      const snapped = snapToCurve(mathPoint.x, preferPositive);
      if (!snapped) return;

      onPointsChange([...placedPoints, snapped]);
    },
    [placedPoints, onPointsChange]
  );

  const canvasPoints: CanvasPoint[] = placedPoints.map((p, i) => ({
    point: p,
    color: POINT_COLORS[i % POINT_COLORS.length],
    label: `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <CurveCanvas points={canvasPoints} onCanvasClick={handleClick} />

      <div className="space-y-4 max-lg:contents">
        {/* Equation */}
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-center">
          <p className="font-display text-lg text-accent-primary">
            y² = x³ + 7
          </p>
          <p className="mt-1 text-xs text-text-muted">
            secp256k1 — die elliptische Kurve hinter Bitcoin
          </p>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Hinweis
          </p>
          <p>
            Bitcoin verwendet dieselbe Gleichung y² = x³ + 7, aber nicht über
            den reellen Zahlen, sondern über einem{" "}
            <span className="text-text-primary">endlichen Körper</span> (mod p).
            Dadurch wird die glatte Kurve zu einem Muster diskreter Punkte —
            die mathematischen Operationen (Addition, Multiplikation) bleiben
            aber identisch.
          </p>
        </div>

        {/* Points + Reset */}
        <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-card p-4">
          <p className="text-xs text-text-muted">
            {placedPoints.length}/{MAX_PLACED_POINTS} Punkte gesetzt
          </p>
          <button
            onClick={() => onPointsChange([])}
            disabled={placedPoints.length === 0}
            className="rounded-lg border border-border-subtle bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary disabled:opacity-40 disabled:hover:bg-bg-card"
          >
            Zurücksetzen
          </button>
        </div>

        {footer}
      </div>
    </div>
  );
}
