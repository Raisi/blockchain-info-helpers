"use client";

import { useRef, useEffect, useCallback } from "react";
import type { CurvePoint2D, CanvasLine, CanvasPoint } from "../types";
import { getCurvePoints } from "../curve-math";
import { CURVE_X_RANGE, CURVE_Y_RANGE } from "../constants";

interface CurveCanvasProps {
  points?: CanvasPoint[];
  lines?: CanvasLine[];
  xRange?: [number, number];
  yRange?: [number, number];
  onCanvasClick?: (mathPoint: CurvePoint2D) => void;
  onPointerDown?: (mathPoint: CurvePoint2D, e: PointerEvent) => void;
  onPointerMove?: (mathPoint: CurvePoint2D, e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  className?: string;
}

export default function CurveCanvas({
  points = [],
  lines = [],
  xRange = CURVE_X_RANGE,
  yRange = CURVE_Y_RANGE,
  onCanvasClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className = "",
}: CurveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  const toPixel = useCallback(
    (p: CurvePoint2D, w: number, h: number): { px: number; py: number } => {
      const px = ((p.x - xRange[0]) / (xRange[1] - xRange[0])) * w;
      const py = ((yRange[1] - p.y) / (yRange[1] - yRange[0])) * h;
      return { px, py };
    },
    [xRange, yRange]
  );

  const toMath = useCallback(
    (px: number, py: number, w: number, h: number): CurvePoint2D => {
      const x = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
      const y = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
      return { x, y };
    },
    [xRange, yRange]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = sizeRef.current.width;
    const h = sizeRef.current.height;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (
      let x = Math.ceil(xRange[0]);
      x <= Math.floor(xRange[1]);
      x++
    ) {
      const { px } = toPixel({ x, y: 0 }, w, h);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
    for (
      let y = Math.ceil(yRange[0]);
      y <= Math.floor(yRange[1]);
      y++
    ) {
      const { py } = toPixel({ x: 0, y }, w, h);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    const origin = toPixel({ x: 0, y: 0 }, w, h);
    // x-axis
    ctx.beginPath();
    ctx.moveTo(0, origin.py);
    ctx.lineTo(w, origin.py);
    ctx.stroke();
    // y-axis
    ctx.beginPath();
    ctx.moveTo(origin.px, 0);
    ctx.lineTo(origin.px, h);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    for (
      let x = Math.ceil(xRange[0]);
      x <= Math.floor(xRange[1]);
      x++
    ) {
      if (x === 0) continue;
      const { px } = toPixel({ x, y: 0 }, w, h);
      ctx.fillText(x.toString(), px, origin.py + 14);
    }
    ctx.textAlign = "right";
    for (
      let y = Math.ceil(yRange[0]);
      y <= Math.floor(yRange[1]);
      y += 2
    ) {
      if (y === 0) continue;
      const { py } = toPixel({ x: 0, y }, w, h);
      ctx.fillText(y.toString(), origin.px - 6, py + 4);
    }

    // Curve: y² = x³ + 7
    const curveData = getCurvePoints(xRange[0], xRange[1], 800);

    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(34, 211, 238, 0.3)";
    ctx.shadowBlur = 6;

    // Upper branch
    ctx.beginPath();
    let started = false;
    for (const p of curveData.upper) {
      const { px, py } = toPixel(p, w, h);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Lower branch
    ctx.beginPath();
    started = false;
    for (const p of curveData.lower) {
      const { px, py } = toPixel(p, w, h);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Lines
    for (const line of lines) {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width ?? 1.5;
      if (line.dashed) {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      const from = toPixel(line.from, w, h);
      const to = toPixel(line.to, w, h);
      ctx.beginPath();
      ctx.moveTo(from.px, from.py);
      ctx.lineTo(to.px, to.py);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Points
    for (const pt of points) {
      const { px, py } = toPixel(pt.point, w, h);
      const r = pt.radius ?? 6;

      if (pt.pulse) {
        ctx.beginPath();
        ctx.arc(px, py, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = pt.color + "33";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
      ctx.strokeStyle = "#0a0e17";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (pt.label) {
        ctx.fillStyle = pt.color;
        ctx.font = "bold 13px JetBrains Mono, monospace";
        ctx.textAlign = "left";
        ctx.fillText(pt.label, px + r + 4, py - r);
      }
    }

    ctx.restore();
  }, [points, lines, xRange, yRange, toPixel]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        sizeRef.current = { width, height };
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        draw();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  // Redraw when props change
  useEffect(() => {
    draw();
  }, [draw]);

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): CurvePoint2D => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      return toMath(px, py, sizeRef.current.width, sizeRef.current.height);
    },
    [toMath]
  );

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square w-full overflow-hidden rounded-lg border border-border-subtle bg-bg-primary ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={(e) => {
          if (onCanvasClick) {
            onCanvasClick(getCanvasPoint(e as unknown as React.PointerEvent<HTMLCanvasElement>));
          }
        }}
        onPointerDown={(e) => {
          if (onPointerDown) {
            onPointerDown(
              getCanvasPoint(e),
              e.nativeEvent
            );
          }
        }}
        onPointerMove={(e) => {
          if (onPointerMove) {
            onPointerMove(
              getCanvasPoint(e),
              e.nativeEvent
            );
          }
        }}
        onPointerUp={(e) => {
          if (onPointerUp) {
            onPointerUp(e.nativeEvent);
          }
        }}
      />
    </div>
  );
}
