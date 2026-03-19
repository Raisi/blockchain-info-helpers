"use client";

import { useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import { getCurvePoints } from "../curve-math";
import { CURVE_X_RANGE, CURVE_Y_RANGE } from "../constants";

interface QuantumThreatProps {
  scalar: number;
  footer?: React.ReactNode;
}

/** Simple hex RGB lerp for canvas color transitions */
function lerpColor(a: string, b: string, t: number): string {
  const pa = [
    parseInt(a.slice(1, 3), 16),
    parseInt(a.slice(3, 5), 16),
    parseInt(a.slice(5, 7), 16),
  ];
  const pb = [
    parseInt(b.slice(1, 3), 16),
    parseInt(b.slice(3, 5), 16),
    parseInt(b.slice(5, 7), 16),
  ];
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
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
        quantumSearch: number;
        quantumPulse: number;
        labels: number;
        classicalEmphasis: number;
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
        if (progress.quantumPulse > 0) {
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2.5;
        } else if (progress.quantumSearch > 0) {
          ctx.strokeStyle = lerpColor("#ef4444", "#f59e0b", progress.quantumSearch);
          ctx.lineWidth = 2.5;
          const dashGap = 4 * (1 - progress.quantumSearch);
          ctx.setLineDash([6, Math.max(0.5, dashGap)]);
        } else {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2.5;
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
            progress.quantumPulse > 0
              ? "#f59e0b"
              : progress.quantumSearch > 0
                ? lerpColor("#ef4444", "#f59e0b", progress.quantumSearch)
                : "#ef4444";
          ctx.fill();
        }

        // Label: classical (before quantum search)
        if (progress.labels > 0 && progress.quantumSearch === 0) {
          ctx.globalAlpha = progress.labels;
          const midX = (gX + kX) / 2;

          // Classical emphasis: pulsing red glow + larger font + extra line
          if (progress.classicalEmphasis > 0) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 12 + 8 * pulse * progress.classicalEmphasis;
            const fontSize = 12 + 2 * progress.classicalEmphasis;
            ctx.fillStyle = "#ef4444";
            ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
            ctx.textAlign = "center";
            ctx.fillText("k = ?", midX, arrowY + 22);
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 12px JetBrains Mono, monospace";
            ctx.textAlign = "center";
            ctx.fillText("k = ?", midX, arrowY + 22);
          }

          ctx.font = "10px JetBrains Mono, monospace";
          ctx.fillStyle = "#64748b";
          ctx.fillText(
            "Klassisch: unm\u00f6glich \u2192 O(2\u207f\u00b2)",
            midX,
            arrowY + 38
          );

          // Extra emphasis line
          if (progress.classicalEmphasis > 0) {
            ctx.globalAlpha = progress.labels * progress.classicalEmphasis;
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 10px JetBrains Mono, monospace";
            ctx.fillText("~2\u00b9\u00b2\u2078 Operationen n\u00f6tig", midX, arrowY + 54);
          }

          ctx.globalAlpha = 1;
        }

        // Label: quantum search in progress
        if (progress.quantumSearch > 0 && progress.quantumPulse === 0) {
          ctx.globalAlpha = progress.quantumSearch;
          const searchColor = lerpColor("#ef4444", "#f59e0b", progress.quantumSearch);
          ctx.fillStyle = searchColor;
          ctx.font = "bold 12px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText("Shor-Algorithmus...", (gX + kX) / 2, arrowY + 22);
          ctx.font = "10px JetBrains Mono, monospace";
          ctx.fillStyle = "#94a3b8";
          ctx.fillText("Quanten-Suche nach k", (gX + kX) / 2, arrowY + 38);

          // Animated particles along the arrow path
          const now = Date.now();
          const particleCount = 5;
          for (let i = 0; i < particleCount; i++) {
            const phase = ((now / 600 + i / particleCount) % 1);
            const px = kX - 12 - (kX - gX - 24) * phase;
            const particleAlpha = Math.sin(phase * Math.PI) * progress.quantumSearch;
            ctx.beginPath();
            ctx.arc(px, arrowY, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 158, 11, ${particleAlpha * 0.8})`;
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }

        // Label: quantum result
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
            "Shor: k aus K berechnet!",
            (gX + kX) / 2,
            arrowY + 22
          );
          ctx.shadowBlur = 0;
          ctx.font = "10px JetBrains Mono, monospace";
          ctx.fillStyle = "#94a3b8";
          ctx.fillText(
            "Quanten: O(n\u00b3) \u2014 ECDLP gel\u00f6st",
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
      quantumSearch: 0,
      quantumPulse: 0,
      labels: 0,
      classicalEmphasis: 0,
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tlRef.current = tl;

      // Phase 1: Dots fade in (0.0s, 1.5s)
      tl.to(progress, {
        dots: 1,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => drawScene(canvas, progress),
      });

      // Phase 2: Forward arrow draws (1.0s, 1.2s)
      tl.to(
        progress,
        {
          forwardArrow: 1,
          duration: 1.2,
          ease: "power2.inOut",
          onUpdate: () => drawScene(canvas, progress),
        },
        1.0
      );

      // Phase 2b: Labels fade in (2.0s, 0.6s)
      tl.to(
        progress,
        {
          labels: 1,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: () => drawScene(canvas, progress),
        },
        2.0
      );

      // Phase 3: Reverse arrow draws (4.0s, 1.5s)
      tl.to(
        progress,
        {
          reverseArrow: 1,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => drawScene(canvas, progress),
        },
        4.0
      );

      // Phase 3a: Classical emphasis — pulsing red glow on "k = ?" (5.5s, 0.8s)
      tl.to(
        progress,
        {
          classicalEmphasis: 1,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => drawScene(canvas, progress),
        },
        5.5
      );

      // Phase 3b: Quantum search — Shor running (7.5s, 2.0s)
      tl.to(
        progress,
        {
          quantumSearch: 1,
          duration: 2.0,
          ease: "power2.inOut",
          onUpdate: () => drawScene(canvas, progress),
        },
        7.5
      );

      // Phase 4: Quantum effect — result glow (9.8s, 1.0s)
      tl.to(
        progress,
        {
          quantumPulse: 1,
          duration: 1.0,
          ease: "power2.inOut",
          onUpdate: () => drawScene(canvas, progress),
        },
        9.8
      );

      // Phase 5: Stagger cards (10.5s)
      if (cardsRef.current) {
        tl.from(
          cardsRef.current.children,
          {
            opacity: 0,
            y: 16,
            duration: 0.6,
            stagger: 0.15,
            ease: "power3.out",
          },
          10.5
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
          <div className="space-y-2 text-sm text-text-secondary">
            <p>
              <span className="text-text-primary font-medium">Das Problem:</span>{" "}
              Gegeben: Public Key K und Generator G. Gesucht: der Private Key k,
              sodass k &times; G = K. Klassisch ist dieses &bdquo;diskrete
              Logarithmus-Problem&ldquo; (ECDLP) praktisch unl&ouml;sbar.
            </p>
            <p>
              <span className="text-text-primary font-medium">Quantenangriff:</span>{" "}
              Shors Algorithmus nutzt Quanten-Superpositionen, um viele Werte
              gleichzeitig zu testen. Er wandelt das ECDLP in ein
              Periodenfindungs-Problem um: In einer speziell konstruierten Funktion
              versteckt sich k als Periode. Ein Quantencomputer kann diese Periode
              effizient mithilfe der Quanten-Fourier-Transformation (QFT) extrahieren.
            </p>
            <p>
              <span className="text-text-primary font-medium">Ergebnis:</span>{" "}
              Statt ~2<sup>128</sup> Operationen ben&ouml;tigt Shor nur{" "}
              <span className="font-mono text-text-primary">O(n&sup3;)</span>{" "}
              Schritte &mdash; polynomiell statt exponentiell. Ein ausreichend
              gro&szlig;er Quantencomputer k&ouml;nnte k in Stunden finden.
            </p>
          </div>
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
