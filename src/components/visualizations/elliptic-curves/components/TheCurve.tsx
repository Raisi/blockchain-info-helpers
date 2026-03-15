"use client";

import { useState, useCallback } from "react";
import CurveCanvas from "./CurveCanvas";
import { snapToCurve } from "../curve-math";
import { POINT_COLORS, MAX_PLACED_POINTS, CURVE_X_MIN_REAL } from "../constants";
import type { CurvePoint2D, CanvasPoint } from "../types";

export default function TheCurve() {
  const [placedPoints, setPlacedPoints] = useState<CurvePoint2D[]>([]);

  const handleClick = useCallback(
    (mathPoint: CurvePoint2D) => {
      if (placedPoints.length >= MAX_PLACED_POINTS) return;

      // Only snap if x is in range where curve exists
      if (mathPoint.x < CURVE_X_MIN_REAL) return;

      const preferPositive = mathPoint.y >= 0;
      const snapped = snapToCurve(mathPoint.x, preferPositive);
      if (!snapped) return;

      setPlacedPoints((prev) => [...prev, snapped]);
    },
    [placedPoints.length]
  );

  const canvasPoints: CanvasPoint[] = placedPoints.map((p, i) => ({
    point: p,
    color: POINT_COLORS[i % POINT_COLORS.length],
    label: `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`,
  }));

  return (
    <div className="space-y-4">
      <CurveCanvas points={canvasPoints} onCanvasClick={handleClick} />

      {/* Equation */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-center">
        <p className="font-display text-lg text-accent-primary">
          y² = x³ + 7
        </p>
        <p className="mt-1 text-xs text-text-muted">
          secp256k1 — die elliptische Kurve hinter Bitcoin
        </p>
      </div>

      {/* Info + Reset */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary sm:flex-1">
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

        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-text-muted">
            {placedPoints.length}/{MAX_PLACED_POINTS} Punkte gesetzt
          </p>
          <button
            onClick={() => setPlacedPoints([])}
            disabled={placedPoints.length === 0}
            className="rounded-lg border border-border-subtle bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary disabled:opacity-40 disabled:hover:bg-bg-card"
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}
