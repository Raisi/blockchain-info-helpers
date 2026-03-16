"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import CurveCanvas from "./CurveCanvas";
import { getCurvePoints } from "../curve-math";
import { CURVE_X_RANGE, CURVE_Y_RANGE } from "../constants";
import {
  generatePrivateKey,
  getPublicKey,
  bytesToHex,
  SECP256K1_PARAMS,
} from "../crypto-utils";
import { secp256k1 } from "@noble/curves/secp256k1";

type Phase = "animating" | "done";

interface KeyGenerationProps {
  scalar: number;
  showWorldSwitch: boolean;
  onWorldSwitchComplete: () => void;
  footer?: React.ReactNode;
}

export default function KeyGeneration({
  scalar,
  showWorldSwitch,
  onWorldSwitchComplete,
  footer,
}: KeyGenerationProps) {
  const [privateKeyHex, setPrivateKeyHex] = useState("");
  const [publicKeyHex, setPublicKeyHex] = useState("");
  const [publicKeyX, setPublicKeyX] = useState("");
  const [publicKeyY, setPublicKeyY] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [pubKeyPoint, setPubKeyPoint] = useState<{ x: number; y: number } | null>(null);

  const [phase, setPhase] = useState<Phase>(
    showWorldSwitch ? "animating" : "done"
  );

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const curveWrapperRef = useRef<HTMLDivElement>(null);
  const fragmentCanvasRef = useRef<HTMLCanvasElement>(null);
  const sidebarExplainRef = useRef<HTMLDivElement>(null);
  const mainUIRef = useRef<HTMLDivElement>(null);
  const progressiveRafRef = useRef<number>(0);
  const privRef = useRef<HTMLDivElement>(null);
  const pubRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  // Scalar × G computation for conceptual comparison
  const scalarPublicKey = (() => {
    try {
      const scalarBigInt = BigInt(scalar);
      const point = secp256k1.ProjectivePoint.BASE.multiply(scalarBigInt).toAffine();
      return {
        x: point.x.toString(16).padStart(64, "0").slice(0, 8) + "…",
        y: point.y.toString(16).padStart(64, "0").slice(0, 8) + "…",
      };
    } catch {
      return null;
    }
  })();

  // Draw highlighted public key point on canvas
  const drawHighlightedPoint = useCallback(
    (canvas: HTMLCanvasElement, point: { x: number; y: number }) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const px = ((point.x - CURVE_X_RANGE[0]) / (CURVE_X_RANGE[1] - CURVE_X_RANGE[0])) * w;
      const py = ((CURVE_Y_RANGE[1] - point.y) / (CURVE_Y_RANGE[1] - CURVE_Y_RANGE[0])) * h;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fill();

      // Middle ring
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#0a0e17";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("k × G", px + 16, py - 4);
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Public Key", px + 16, py + 10);

      ctx.restore();
    },
    []
  );

  // Draw fragmented dots on a canvas
  const drawFragmentedDots = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const curveData = getCurvePoints(CURVE_X_RANGE[0], CURVE_X_RANGE[1], 200);
      const allPoints = [...curveData.upper, ...curveData.lower];

      for (const p of allPoints) {
        const px =
          ((p.x - CURVE_X_RANGE[0]) / (CURVE_X_RANGE[1] - CURVE_X_RANGE[0])) * w;
        const py =
          ((CURVE_Y_RANGE[1] - p.y) / (CURVE_Y_RANGE[1] - CURVE_Y_RANGE[0])) * h;
        const scatter = Math.random() * 6 - 3;
        ctx.beginPath();
        ctx.arc(px + scatter, py + scatter, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${0.3 + Math.random() * 0.5})`;
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  // Fragment canvas sizing via ResizeObserver
  useEffect(() => {
    const canvas = fragmentCanvasRef.current;
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
      if (phase === "done") {
        drawFragmentedDots(canvas);
        if (pubKeyPoint) drawHighlightedPoint(canvas, pubKeyPoint);
      }
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);
    resize();
    if (phase === "done") {
      drawFragmentedDots(canvas);
      if (pubKeyPoint) drawHighlightedPoint(canvas, pubKeyPoint);
    }

    return () => ro.disconnect();
  }, [phase, drawFragmentedDots, pubKeyPoint, drawHighlightedPoint]);

  // Animation timeline (~4s)
  const runAnimation = useCallback(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // t=0: Progressive dot reveal on fragmentCanvasRef
      tl.call(
        () => {
          const canvas = fragmentCanvasRef.current;
          if (!canvas) return;
          const canvasCtx = canvas.getContext("2d");
          if (!canvasCtx) return;

          const dpr = window.devicePixelRatio || 1;
          const w = canvas.width / dpr;
          const h = canvas.height / dpr;

          const curveData = getCurvePoints(CURVE_X_RANGE[0], CURVE_X_RANGE[1], 200);
          const allPoints = [...curveData.upper, ...curveData.lower];
          const shuffled = allPoints.sort(() => Math.random() - 0.5);

          let drawn = 0;
          const batchSize = 5;
          const draw = () => {
            if (drawn >= shuffled.length) return;
            canvasCtx.save();
            canvasCtx.scale(dpr, dpr);
            const end = Math.min(drawn + batchSize, shuffled.length);
            for (let i = drawn; i < end; i++) {
              const p = shuffled[i];
              const px =
                ((p.x - CURVE_X_RANGE[0]) / (CURVE_X_RANGE[1] - CURVE_X_RANGE[0])) * w;
              const py =
                ((CURVE_Y_RANGE[1] - p.y) / (CURVE_Y_RANGE[1] - CURVE_Y_RANGE[0])) * h;
              const scatter = Math.random() * 6 - 3;
              canvasCtx.beginPath();
              canvasCtx.arc(px + scatter, py + scatter, 2, 0, Math.PI * 2);
              canvasCtx.fillStyle = `rgba(34, 211, 238, ${0.3 + Math.random() * 0.5})`;
              canvasCtx.fill();
            }
            canvasCtx.restore();
            drawn = end;
            progressiveRafRef.current = requestAnimationFrame(draw);
          };
          progressiveRafRef.current = requestAnimationFrame(draw);
        },
        [],
        0
      );

      // t=0.3: Fade out CurveCanvas smooth curve over 1.5s
      tl.to(
        curveWrapperRef.current,
        { opacity: 0, duration: 1.5, ease: "power2.inOut" },
        0.3
      );

      // t=0.5: Stagger-fade the sidebar explanation cards
      if (sidebarExplainRef.current) {
        tl.from(
          sidebarExplainRef.current.children,
          { opacity: 0, y: 12, duration: 0.5, stagger: 0.8, ease: "power2.out" },
          0.5
        );
      }

      // t=3.2: Fade out explanation
      if (sidebarExplainRef.current) {
        tl.to(
          sidebarExplainRef.current,
          { opacity: 0, duration: 0.3, ease: "power2.in" },
          3.2
        );
      }

      // t=3.5: Switch to done phase
      tl.call(
        () => {
          setPhase("done");
          onWorldSwitchComplete();
        },
        [],
        3.5
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onWorldSwitchComplete, drawFragmentedDots]);

  // Launch animation on mount
  useEffect(() => {
    if (!showWorldSwitch || phase !== "animating") return;
    const timer = setTimeout(() => runAnimation(), 400);
    return () => {
      clearTimeout(timer);
      if (progressiveRafRef.current) {
        cancelAnimationFrame(progressiveRafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate mainUI entrance when phase becomes "done" after animation
  useEffect(() => {
    if (phase !== "done" || !showWorldSwitch) return;
    requestAnimationFrame(() => {
      if (mainUIRef.current) {
        gsap.from(mainUIRef.current, {
          opacity: 0,
          y: 10,
          duration: 0.5,
          ease: "power3.out",
        });
      }
    });
  }, [phase, showWorldSwitch]);

  const generate = useCallback(() => {
    setIsGenerating(true);
    setPubKeyPoint(null);

    setTimeout(() => {
      const privKey = generatePrivateKey();
      const pubKey = getPublicKey(privKey);

      setPrivateKeyHex(bytesToHex(privKey));
      setPublicKeyHex(bytesToHex(pubKey.compressed));
      setPublicKeyX(pubKey.x);
      setPublicKeyY(pubKey.y);
      setIsGenerating(false);

      // Pick a random curve point as visual representative for the public key
      const curveData = getCurvePoints(CURVE_X_RANGE[0], CURVE_X_RANGE[1], 200);
      const allPoints = [...curveData.upper, ...curveData.lower];
      const randomPoint = allPoints[Math.floor(Math.random() * allPoints.length)];
      setPubKeyPoint(randomPoint);

      const ctx = gsap.context(() => {
        if (privRef.current) {
          gsap.from(privRef.current, {
            opacity: 0,
            x: -20,
            duration: 0.5,
            ease: "power3.out",
          });
        }
        if (arrowRef.current) {
          gsap.from(arrowRef.current, {
            opacity: 0,
            scale: 0.5,
            duration: 0.4,
            delay: 0.2,
            ease: "back.out(1.7)",
          });
        }
        if (pubRef.current) {
          gsap.from(pubRef.current, {
            opacity: 0,
            x: 20,
            duration: 0.5,
            delay: 0.4,
            ease: "power3.out",
          });
        }
      });

      return () => ctx.revert();
    }, 100);
  }, []);

  // Redraw canvas with highlight when pubKeyPoint changes
  useEffect(() => {
    if (!pubKeyPoint || phase !== "done") return;
    const canvas = fragmentCanvasRef.current;
    if (!canvas) return;

    drawFragmentedDots(canvas);
    drawHighlightedPoint(canvas, pubKeyPoint);

    gsap.fromTo(
      canvas,
      { filter: "brightness(1)" },
      {
        filter: "brightness(1.2)",
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      }
    );
  }, [pubKeyPoint, phase, drawFragmentedDots, drawHighlightedPoint]);

  // Hex cascade animation for private key display
  const [displayHex, setDisplayHex] = useState("");
  useEffect(() => {
    if (!privateKeyHex) return;
    let frame = 0;
    const total = privateKeyHex.length;
    const interval = setInterval(() => {
      frame++;
      if (frame >= total) {
        setDisplayHex(privateKeyHex);
        clearInterval(interval);
        return;
      }
      const revealed = privateKeyHex.slice(0, frame);
      const scrambled = Array.from({ length: total - frame }, () =>
        "0123456789abcdef"[Math.floor(Math.random() * 16)]
      ).join("");
      setDisplayHex(revealed + scrambled);
    }, 15);
    return () => clearInterval(interval);
  }, [privateKeyHex]);

  const mainUI = (
    <div ref={mainUIRef} className="space-y-4">
      {/* Context banner */}
      <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/5 p-3">
        <p className="text-sm text-text-primary">
          Reelle Kurve &rarr;{" "}
          <span className="text-accent-primary">Endlicher K&ouml;rper</span>{" "}
          (mod p)
        </p>
        <p className="text-xs text-text-muted">
          Gleiche Mathematik, &uuml;ber diskreten Punkten. Skalar n ={" "}
          {scalar} &rarr; Private Key k.
        </p>
      </div>

      {/* Generate button */}
      <div className="flex justify-center">
        <button
          onClick={generate}
          disabled={isGenerating}
          className="rounded-xl bg-accent-primary/15 px-6 py-3 font-display text-sm font-semibold text-accent-primary transition-all hover:bg-accent-primary/25 hover:shadow-[var(--glow-primary)] disabled:opacity-50"
        >
          {isGenerating ? "Generiere\u2026" : "\uD83C\uDFB2 Schl\u00FCssel generieren"}
        </button>
      </div>

      {/* Key display */}
      {privateKeyHex && (
        <div className="space-y-3">
          {/* Private Key */}
          <div
            ref={privRef}
            className="rounded-lg border border-border-subtle bg-bg-card p-4"
          >
            <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-warning">
              Private Key (256 Bit)
            </p>
            <p className="break-all font-mono text-xs leading-relaxed text-text-primary">
              {displayHex}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Zuf&auml;llige Zahl zwischen 1 und n-1
            </p>
          </div>

          {/* Arrow */}
          <div
            ref={arrowRef}
            className="flex items-center justify-center"
          >
            <div className="rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-center">
              <p className="font-display text-lg text-accent-primary">k &times; G</p>
              <p className="text-[10px] text-text-muted">k &times; Generator</p>
            </div>
          </div>

          {/* Public Key */}
          <div
            ref={pubRef}
            className="rounded-lg border border-border-subtle bg-bg-card p-4"
          >
            <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-success">
              Public Key (komprimiert)
            </p>
            <p className="break-all font-mono text-xs leading-relaxed text-text-primary">
              {publicKeyHex}
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-text-muted">
                <span className="text-text-secondary">x:</span>{" "}
                <span className="font-mono">{publicKeyX.slice(0, 16)}&hellip;</span>
              </p>
              <p className="text-xs text-text-muted">
                <span className="text-text-secondary">y:</span>{" "}
                <span className="font-mono">{publicKeyY.slice(0, 16)}&hellip;</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conceptual comparison */}
      <div className="rounded-lg border border-accent-secondary/20 bg-accent-secondary/5 p-4">
        <p className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-accent-secondary">
          Vergleich: Dein Skalar vs. echter Key
        </p>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex flex-wrap gap-x-4">
            <span className="text-text-muted">Dein Skalar (Tab 3):</span>
            <span className="text-text-primary">
              n = {scalar} &times; G
              {scalarPublicKey && (
                <span className="text-text-secondary">
                  {" "}= ({scalarPublicKey.x})
                </span>
              )}
            </span>
          </div>
          {privateKeyHex && (
            <div className="flex flex-wrap gap-x-4">
              <span className="text-text-muted">Echter Private Key:</span>
              <span className="text-text-primary">
                k = {privateKeyHex.slice(0, 8)}&hellip; &times; G = (
                {publicKeyX.slice(0, 8)}&hellip;)
              </span>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          In Tab 3 hast du gesehen: <strong className="text-text-primary">n = {scalar} &times; P</strong> &uuml;ber
          reellen Zahlen. Bei Bitcoin ist n eine 256-Bit-Zufallszahl und P der
          Generator G &mdash; aber das Prinzip ist identisch.
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary">
        <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
          Von Public Key zur Bitcoin-Adresse
        </p>
        <p>
          Der Public Key wird gehasht:{" "}
          <span className="font-mono text-text-primary">
            RIPEMD160(SHA256(pubkey))
          </span>{" "}
          &rarr; 20 Bytes. Diese werden mit Bech32 oder Base58Check kodiert und
          ergeben die Bitcoin-Adresse (z.B. bc1q&hellip;).
        </p>
      </div>

      {/* secp256k1 parameters toggle */}
      <div>
        <button
          onClick={() => setShowParams((p) => !p)}
          className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <span
            className={`inline-block transition-transform ${showParams ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          secp256k1 Parameter anzeigen
        </button>

        {showParams && (
          <div className="mt-3 rounded-lg border border-border-subtle bg-bg-card p-4">
            <div className="space-y-2 font-mono text-xs">
              <div>
                <span className="text-text-muted">p = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.p}
                </span>
              </div>
              <div>
                <span className="text-text-muted">n = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.n}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Gx = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.Gx}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Gy = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.Gy}
                </span>
              </div>
              <div>
                <span className="text-text-muted">a = </span>
                <span className="text-text-secondary">
                  {SECP256K1_PARAMS.a}
                </span>
                <span className="text-text-muted ml-4">b = </span>
                <span className="text-text-secondary">
                  {SECP256K1_PARAMS.b}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-muted">
              p ist die Primzahl des endlichen K&ouml;rpers, n die Ordnung der Kurve,
              G der Generator-Punkt.
            </p>
          </div>
        )}
      </div>

      {footer}
    </div>
  );

  return (
    <div ref={containerRef} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      {/* LEFT: Canvas with fragment overlay */}
      <div className="relative self-start">
        <div
          ref={curveWrapperRef}
          style={phase === "done" ? { opacity: 0 } : undefined}
        >
          <CurveCanvas />
        </div>
        <canvas
          ref={fragmentCanvasRef}
          className="absolute inset-0 z-10 pointer-events-none rounded-lg"
        />
      </div>

      {/* RIGHT: Sidebar */}
      <div className="space-y-4">
        {/* Explanation text — visible during animation */}
        {phase === "animating" && (
          <div ref={sidebarExplainRef} className="space-y-3">
            <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/5 p-4">
              <p className="text-sm text-text-primary">
                Die glatte Kurve wird zu diskreten Punkten &mdash;
                genau so arbeitet Bitcoin &uuml;ber einem endlichen K&ouml;rper.
              </p>
            </div>
            <div className="rounded-lg border border-accent-secondary/20 bg-accent-secondary/5 p-4">
              <p className="font-mono text-sm text-accent-secondary">
                n = {scalar} &times; G
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Dein Skalar wird zum Private Key.
                Gleiche Gleichung &mdash; aber &uuml;ber diskreten Punkten (mod p).
              </p>
            </div>
          </div>
        )}

        {/* Key generation UI — visible after animation */}
        {phase === "done" && mainUI}
      </div>
    </div>
  );
}
