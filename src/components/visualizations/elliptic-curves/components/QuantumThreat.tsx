"use client";

import { useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import { getCurvePoints } from "../curve-math";
import { CURVE_X_RANGE, CURVE_Y_RANGE } from "../constants";

interface QuantumThreatProps {
  scalar: number;
  footer?: React.ReactNode;
}

export default function QuantumThreat({ footer }: QuantumThreatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const animRanRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const drawScene = useCallback(
    (
      canvas: HTMLCanvasElement,
      progress: {
        dots: number;
        forwardArrow: number;
        reverseArrow: number;
        quantumPulse: number;
        labels: number;
      }
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Draw fragmented dots
      if (progress.dots > 0) {
        const curveData = getCurvePoints(
          CURVE_X_RANGE[0],
          CURVE_X_RANGE[1],
          200
        );
        const allPoints = [...curveData.upper, ...curveData.lower];
        const count = Math.floor(allPoints.length * progress.dots);

        for (let i = 0; i < count; i++) {
          const p = allPoints[i];
          const px =
            ((p.x - CURVE_X_RANGE[0]) /
              (CURVE_X_RANGE[1] - CURVE_X_RANGE[0])) *
            w;
          const py =
            ((CURVE_Y_RANGE[1] - p.y) /
              (CURVE_Y_RANGE[1] - CURVE_Y_RANGE[0])) *
            h;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${0.15 + Math.random() * 0.25})`;
          ctx.fill();
        }
      }

      // Fixed positions for G and K
      const gX = w * 0.25;
      const gY = h * 0.5;
      const kX = w * 0.75;
      const kY = h * 0.5;

      // Draw G point
      if (progress.dots > 0.5) {
        ctx.beginPath();
        ctx.arc(gX, gY, 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 211, 238, 0.3)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gX, gY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#22d3ee";
        ctx.fill();
        ctx.fillStyle = "#22d3ee";
        ctx.font = "bold 13px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("G", gX, gY - 18);
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Generator", gX, gY + 24);
      }

      // Draw K point
      if (progress.dots > 0.5) {
        ctx.beginPath();
        ctx.arc(kX, kY, 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(kX, kY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.fill();
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 13px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("K", kX, kY - 18);
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Public Key", kX, kY + 24);
      }

      // Forward arrow G → K (green, easy direction)
      if (progress.forwardArrow > 0) {
        const arrowEndX = gX + (kX - gX - 24) * progress.forwardArrow;
        const arrowY = gY - 40;

        ctx.beginPath();
        ctx.moveTo(gX + 12, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Arrowhead
        if (progress.forwardArrow > 0.9) {
          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowY);
          ctx.lineTo(arrowEndX - 8, arrowY - 5);
          ctx.lineTo(arrowEndX - 8, arrowY + 5);
          ctx.closePath();
          ctx.fillStyle = "#10b981";
          ctx.fill();
        }

        // Label
        if (progress.labels > 0) {
          ctx.globalAlpha = progress.labels;
          ctx.fillStyle = "#10b981";
          ctx.font = "bold 12px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText("k \u00d7 G", (gX + kX) / 2, arrowY - 10);
          ctx.font = "10px JetBrains Mono, monospace";
          ctx.fillStyle = "#64748b";
          ctx.fillText("einfach \u2192 O(log n)", (gX + kX) / 2, arrowY - 26);
          ctx.globalAlpha = 1;
        }
      }

      // Reverse arrow K → G (red, hard/quantum direction)
      if (progress.reverseArrow > 0) {
        const arrowY = gY + 40;
        const arrowEndX = kX - (kX - gX - 24) * progress.reverseArrow;

        ctx.beginPath();
        ctx.moveTo(kX - 12, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.strokeStyle =
          progress.quantumPulse > 0 ? "#f59e0b" : "#ef4444";
        ctx.lineWidth = 2.5;
        if (progress.quantumPulse === 0) {
          ctx.setLineDash([6, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        if (progress.reverseArrow > 0.9) {
          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowY);
          ctx.lineTo(arrowEndX + 8, arrowY - 5);
          ctx.lineTo(arrowEndX + 8, arrowY + 5);
          ctx.closePath();
          ctx.fillStyle =
            progress.quantumPulse > 0 ? "#f59e0b" : "#ef4444";
          ctx.fill();
        }

        // Label
        if (progress.labels > 0 && progress.quantumPulse === 0) {
          ctx.globalAlpha = progress.labels;
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 12px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText("k = ?", (gX + kX) / 2, arrowY + 22);
          ctx.font = "10px JetBrains Mono, monospace";
          ctx.fillStyle = "#64748b";
          ctx.fillText(
            "Klassisch: unm\u00f6glich \u2192 O(2\u207f\u00b2)",
            (gX + kX) / 2,
            arrowY + 38
          );
          ctx.globalAlpha = 1;
        }

        // Quantum label
        if (progress.quantumPulse > 0) {
          ctx.globalAlpha = progress.quantumPulse;

          // Glow effect around reverse arrow
          const glowIntensity =
            0.15 + 0.1 * Math.sin(Date.now() / 200);
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 20 * glowIntensity * 4;

          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 13px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            "Shor: k gefunden!",
            (gX + kX) / 2,
            arrowY + 22
          );
          ctx.shadowBlur = 0;
          ctx.font = "10px JetBrains Mono, monospace";
          ctx.fillStyle = "#94a3b8";
          ctx.fillText(
            "Quanten: O(n\u00b3)",
            (gX + kX) / 2,
            arrowY + 38
          );
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
    },
    []
  );

  const replay = useCallback(() => {
    const tl = tlRef.current;
    if (!tl) return;
    tl.restart();
  }, []);

  // Canvas sizing + animation (merged to avoid race condition where
  // animation reads canvas dimensions before ResizeObserver fires)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);
    resize(); // initial size

    // Start animation only once, now that canvas is sized
    if (animRanRef.current) return () => ro.disconnect();
    animRanRef.current = true;

    const progress = {
      dots: 0,
      forwardArrow: 0,
      reverseArrow: 0,
      quantumPulse: 0,
      labels: 0,
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tlRef.current = tl;

      // Phase 1: Dots fade in
      tl.to(progress, {
        dots: 1,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => drawScene(canvas, progress),
      });

      // Phase 2: Forward arrow draws
      tl.to(
        progress,
        {
          forwardArrow: 1,
          duration: 0.8,
          ease: "power2.inOut",
          onUpdate: () => drawScene(canvas, progress),
        },
        0.6
      );

      // Phase 2b: Labels fade in
      tl.to(
        progress,
        {
          labels: 1,
          duration: 0.4,
          ease: "power2.out",
          onUpdate: () => drawScene(canvas, progress),
        },
        1.2
      );

      // Phase 3: Reverse arrow draws (red, dashed)
      tl.to(
        progress,
        {
          reverseArrow: 1,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => drawScene(canvas, progress),
        },
        2.0
      );

      // Phase 4: Quantum effect — reverse arrow changes
      tl.to(
        progress,
        {
          quantumPulse: 1,
          duration: 0.8,
          ease: "power2.inOut",
          onUpdate: () => drawScene(canvas, progress),
        },
        3.5
      );

      // Phase 5: Stagger cards
      if (cardsRef.current) {
        tl.from(
          cardsRef.current.children,
          {
            opacity: 0,
            y: 16,
            duration: 0.5,
            stagger: 0.15,
            ease: "power3.out",
          },
          4.0
        );
      }
    }, containerRef);

    return () => {
      ro.disconnect();
      ctx.revert();
      animRanRef.current = false;
    };
  }, [drawScene]);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]"
    >
      {/* LEFT: Animated canvas */}
      <div className="relative self-start">
        <div className="aspect-4/3 w-full rounded-lg border border-border-subtle bg-bg-card">
          <canvas ref={canvasRef} className="absolute inset-0 rounded-lg" />
        </div>
        <button
          onClick={replay}
          className="absolute bottom-3 right-3 rounded-lg border border-border-subtle bg-bg-card/80 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
        >
          ↻ Wiederholen
        </button>
      </div>

      {/* RIGHT: Info cards */}
      <div ref={cardsRef} className="space-y-3">
        {/* Card 1: Classical Security */}
        <div className="rounded-lg border border-accent-success/30 bg-accent-success/5 p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-success">
            Klassische Sicherheit
          </p>
          <p className="text-sm text-text-secondary">
            Das ECDLP (Elliptic Curve Discrete Logarithm Problem) erfordert
            ~2<sup>128</sup> Operationen. Alle Computer der Erde zusammen
            br&auml;uchten Milliarden Jahre.
          </p>
          <p className="mt-2 text-xs text-text-muted">
            &rarr; Die Einwegfunktion aus Tab 3: k &times; G ist einfach, aber
            K &rarr; k praktisch unm&ouml;glich.
          </p>
        </div>

        {/* Card 2: Shor's Algorithm */}
        <div className="rounded-lg border border-accent-danger/30 bg-accent-danger/5 p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-danger">
            Shors Algorithmus
          </p>
          <p className="text-sm text-text-secondary">
            Quanten-Superposition erm&ouml;glicht eine polynomielle L&ouml;sung:{" "}
            <span className="font-mono text-text-primary">O(n&sup3;)</span>{" "}
            statt klassisch{" "}
            <span className="font-mono text-text-primary">
              O(2<sup>n/2</sup>)
            </span>
            .
          </p>
          <p className="mt-2 text-xs text-text-muted">
            Ein ausreichend gro&szlig;er Quantencomputer k&ouml;nnte k aus K und
            G in Stunden berechnen.
          </p>
        </div>

        {/* Card 3: Current Status */}
        <div className="rounded-lg border border-accent-warning/30 bg-accent-warning/5 p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-warning">
            Aktueller Stand
          </p>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>
              Heutige QCs: ~1.000&ndash;1.200{" "}
              <span className="italic">physische</span> Qubits,
              nahezu 0 fehlerkorrigierte <span className="italic">logische</span>.
              <br />
              F&uuml;r secp256k1: ~2.330 logische Qubits (13&ndash;317 Mio.
              physische) n&ouml;tig.
            </p>
            <p className="text-xs text-text-muted">
              Fehlerkorrektur-Overhead: ~1.000&ndash;10.000 physische pro
              logischem Qubit (polynomiell, nicht logarithmisch).
            </p>
            <p className="text-xs text-text-muted">
              Sch&auml;tzungen: 10&ndash;20+ Jahre bis zur Bedrohung
            </p>
          </div>
          {/* Threat meter */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>Sicher</span>
              <span>Kritisch</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bg-primary">
              <div
                className="h-full rounded-full"
                style={{
                  width: "18%",
                  background:
                    "linear-gradient(to right, #10b981, #f59e0b, #ef4444)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Countermeasures */}
        <div className="rounded-lg border border-accent-primary/30 bg-accent-primary/5 p-4">
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
            Gegenma&szlig;nahmen
          </p>
          <ul className="space-y-1.5 text-sm text-text-secondary">
            <li>
              <span className="text-accent-primary">&bull;</span>{" "}
              Post-Quantum-Kryptografie (Gitter-basiert, Hash-basierte
              Signaturen)
            </li>
            <li>
              <span className="text-accent-primary">&bull;</span>{" "}
              Bitcoins Teilschutz: Adressen nutzen{" "}
              <span className="font-mono text-xs text-text-primary">
                RIPEMD160(SHA256(pubkey))
              </span>{" "}
              &mdash; Public Key erst beim Ausgeben sichtbar
            </li>
            <li>
              <span className="text-accent-primary">&bull;</span> NIST
              PQC-Standards: CRYSTALS-Dilithium, SPHINCS+
            </li>
            <li>
              <span className="text-accent-primary">&bull;</span> Bitcoin
              Community diskutiert quantenresistente Upgrades
            </li>
          </ul>
        </div>

        {footer}
      </div>
    </div>
  );
}
