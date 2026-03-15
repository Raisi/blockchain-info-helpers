"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import type { TreeChild, MasterKey } from "../types";
import { toHex } from "../crypto";
import type { TooltipData } from "./TreeTooltip";

/* ── Layout constants ── */
const W = 760;
const H = 580;
const CX = W / 2;

const MASTER_POS = { x: CX, y: 58 };
const HMAC_POS = { x: CX, y: 158 };
const BARRIER_Y = 220;
const CHILD_Y = 295;
const BIP44_Y = 420;
const CHILD_XS = [110, 280, 450, 620];
const CHILD_COLORS = ["#f472b6", "#34d399", "#60a5fa", "#fbbf24"];
const CHILD_LABELS = ["Index 0", "Index 1", "Index 2", "Index 3"];

interface TreeSvgCanvasProps {
  masterKey: MasterKey | null;
  seed: Uint8Array | null;
  treeData: (TreeChild | null)[];
  treeLoading: boolean;
  highlightIdx: number | null;
  showIsolation: boolean;
  showOneWay: boolean;
  onHighlight: (idx: number | null) => void;
  onNodeHover: (data: TooltipData | null, e?: React.MouseEvent) => void;
}

function RoundRect({
  x,
  y,
  w,
  h,
  fill,
  stroke,
  rx = 10,
  opacity = 1,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  rx?: number;
  opacity?: number;
}) {
  return (
    <rect
      x={x - w / 2}
      y={y - h / 2}
      width={w}
      height={h}
      rx={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth="1.5"
      opacity={opacity}
    />
  );
}

export default function TreeSvgCanvas({
  masterKey,
  seed,
  treeData,
  treeLoading,
  highlightIdx,
  showIsolation,
  showOneWay,
  onHighlight,
  onNodeHover,
}: TreeSvgCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const masterHex = masterKey ? toHex(masterKey.priv) : null;
  const seedHex = seed ? toHex(seed) : null;

  /* GSAP stagger entrance */
  useEffect(() => {
    if (!svgRef.current || treeLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-tree-node]",
        { opacity: 0, scale: 0.85 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          onComplete: function () {
            gsap.set("[data-tree-node]", { clearProps: "opacity,transform" });
          },
        }
      );
      gsap.fromTo(
        "[data-tree-line]",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          delay: 0.3,
          stagger: 0.1,
          ease: "power2.out",
          onComplete: function () {
            gsap.set("[data-tree-line]", { clearProps: "opacity" });
          },
        }
      );
    }, svgRef);
    return () => ctx.revert();
  }, [treeLoading]);

  const handleChildHover = (i: number, child: TreeChild | null, e: React.MouseEvent) => {
    onHighlight(i);
    const entH = child?.childEntropy ? toHex(child.childEntropy) : null;
    const seedH = child?.childSeed ? toHex(child.childSeed) : null;
    const finalH = child?.finalKey ? toHex(child.finalKey.priv) : null;
    onNodeHover(
      {
        title: `🌱 Kind-Seed ${i} (BIP85 Index ${i})`,
        color: CHILD_COLORS[i],
        rows: [
          { label: "BIP85 Pfad", val: `m/83696968'/39'/0'/12'/${i}'` },
          { label: "Entropy (128b)", val: entH ? `${entH.slice(0, 24)}···` : "—" },
          { label: "Mnemonic", val: child?.childMnemonic ? child.childMnemonic.slice(0, 4).join(" ") + "…" : "—" },
          { label: "Seed (512b)", val: seedH ? `${seedH.slice(0, 24)}···` : "—" },
          { label: "Child Master", val: child?.childMaster ? `${toHex(child.childMaster.priv).slice(0, 24)}···` : "—" },
          { label: "BIP44 Final", val: finalH ? `${finalH.slice(0, 24)}···` : "—" },
          { label: "Isolation", val: "Kein Rückschluss auf Master möglich" },
        ],
      },
      e
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle">
      <div className="min-w-[760px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ background: "var(--bg-primary)", borderRadius: 12 }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="masterGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="hmacGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            {CHILD_COLORS.map((c, i) => (
              <radialGradient key={i} id={`childGrad${i}`} cx="50%" cy="30%">
                <stop offset="0%" stopColor={c} stopOpacity="0.25" />
                <stop offset="100%" stopColor={c} stopOpacity="0.05" />
              </radialGradient>
            ))}
            <radialGradient id="masterGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
            {/* Arrow markers */}
            <marker id="arrowPurple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#7c3aed" opacity="0.8" />
            </marker>
            {CHILD_COLORS.map((c, i) => (
              <marker key={i} id={`arrow${i}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={c} opacity="0.8" />
              </marker>
            ))}
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Grid Lines ── */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 30} x2={W} y2={i * 30} stroke="var(--border-subtle)" strokeWidth="0.5" opacity="0.5" />
          ))}
          {Array.from({ length: 26 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2={H} stroke="var(--border-subtle)" strokeWidth="0.5" opacity="0.5" />
          ))}

          {/* ── Master Glow ── */}
          <ellipse cx={MASTER_POS.x} cy={MASTER_POS.y} rx="120" ry="50" fill="url(#masterGlow)" />

          {/* ── Line: Master → HMAC ── */}
          <g data-tree-line>
            <line
              x1={MASTER_POS.x} y1={MASTER_POS.y + 30}
              x2={HMAC_POS.x} y2={HMAC_POS.y - 20}
              stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 3"
              markerEnd="url(#arrowPurple)" opacity="0.7"
            />
            <line
              x1={MASTER_POS.x} y1={MASTER_POS.y + 30}
              x2={HMAC_POS.x} y2={HMAC_POS.y - 20}
              stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 20" opacity="0.9"
            >
              <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.9s" repeatCount="indefinite" />
            </line>
          </g>

          {/* ── Lines: HMAC → Children ── */}
          {CHILD_XS.map((cx2, i) => {
            const highlighted = highlightIdx === null || highlightIdx === i;
            const op = highlighted ? 0.9 : 0.2;
            return (
              <g key={i} opacity={op} data-tree-line>
                <path
                  d={`M${HMAC_POS.x},${HMAC_POS.y + 22} C${HMAC_POS.x},${CHILD_Y - 40} ${cx2},${CHILD_Y - 60} ${cx2},${CHILD_Y - 32}`}
                  stroke={CHILD_COLORS[i]} strokeWidth="2" fill="none" strokeDasharray="6 3"
                  markerEnd={`url(#arrow${i})`}
                />
                <path
                  d={`M${HMAC_POS.x},${HMAC_POS.y + 22} C${HMAC_POS.x},${CHILD_Y - 40} ${cx2},${CHILD_Y - 60} ${cx2},${CHILD_Y - 32}`}
                  stroke={CHILD_COLORS[i]} strokeWidth="2.5" fill="none" strokeDasharray="4 30" opacity="0.8"
                >
                  <animate attributeName="stroke-dashoffset" from="34" to="0" dur={`${1.2 + i * 0.2}s`} repeatCount="indefinite" />
                </path>
              </g>
            );
          })}

          {/* ── Isolation Barrier ── */}
          {showIsolation && (
            <g>
              <line
                x1="20" y1={BARRIER_Y} x2={W - 20} y2={BARRIER_Y}
                stroke="#f472b6" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.6"
              />
              <rect
                x={CX - 75} y={BARRIER_Y - 10} width={150} height={20} rx="4"
                fill="var(--bg-primary)" stroke="#f472b6" strokeWidth="1" opacity="0.9"
              />
              <text
                x={CX} y={BARRIER_Y + 4} textAnchor="middle"
                fontSize="9" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#f472b6" letterSpacing="1.5"
              >
                EINWEG-BARRIERE
              </text>
              {[60, W - 60].map((lx, li) => (
                <g key={li}>
                  <circle cx={lx} cy={BARRIER_Y} r="10" fill="rgba(244,114,182,0.15)" stroke="#f472b6" strokeWidth="1" />
                  <text x={lx} y={BARRIER_Y + 4} textAnchor="middle" fontSize="11">🔒</text>
                </g>
              ))}
            </g>
          )}

          {/* ── Isolation Zones (per child) ── */}
          {showIsolation && CHILD_XS.map((cx2, i) => {
            const highlighted = highlightIdx === null || highlightIdx === i;
            const w = 155;
            const h = 175;
            return (
              <rect
                key={i} x={cx2 - w / 2} y={CHILD_Y - 38} width={w} height={h} rx="12"
                fill={`url(#childGrad${i})`}
                stroke={CHILD_COLORS[i]} strokeWidth="1" strokeDasharray="5 3"
                opacity={highlighted ? 0.9 : 0.15}
              />
            );
          })}

          {/* ── BIP44 Leaf Lines & Nodes ── */}
          {treeData.map((child, i) => {
            const cx2 = CHILD_XS[i];
            const highlighted = highlightIdx === null || highlightIdx === i;
            const op = highlighted ? 1 : 0.15;
            const leafXs = [cx2 - 35, cx2 + 35];
            const leafHex = child?.finalKey ? toHex(child.finalKey.priv) : null;
            const leafLabels = ["ext/0", "int/0"];

            return (
              <g key={i} opacity={op}>
                {leafXs.map((lx, li) => {
                  const isExt = li === 0;
                  const nodeOpacity = isExt ? 0.9 : 0.35;
                  const strokeCol = isExt ? CHILD_COLORS[i] : "#444468";
                  const lineOpacity = isExt ? 0.6 : 0.25;
                  return (
                    <g key={li}>
                      <line
                        x1={cx2} y1={CHILD_Y + 32} x2={lx} y2={BIP44_Y - 18}
                        stroke={strokeCol} strokeWidth="1.2" strokeDasharray="4 3" opacity={lineOpacity}
                      />
                      <rect
                        x={lx - 28} y={BIP44_Y - 18} width={56} height={36} rx="6"
                        fill="rgba(3,3,10,0.9)" stroke={strokeCol} strokeWidth="1" opacity={nodeOpacity}
                      />
                      <text
                        x={lx} y={BIP44_Y - 5} textAnchor="middle" fontSize="8"
                        fontFamily="var(--font-code, 'JetBrains Mono', monospace)"
                        fill={isExt ? CHILD_COLORS[i] : "#555580"} opacity={isExt ? 1 : 0.7}
                      >
                        {leafLabels[li]}
                      </text>
                      <text
                        x={lx} y={BIP44_Y + 8} textAnchor="middle" fontSize="7"
                        fontFamily="var(--font-code, 'JetBrains Mono', monospace)"
                        fill={isExt ? "#444468" : "#333350"}
                      >
                        {isExt ? (leafHex ? `${leafHex.slice(0, 6)}···` : "···") : "n. berechn."}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* ── Child Seed Nodes ── */}
          {CHILD_XS.map((cx2, i) => {
            const highlighted = highlightIdx === null || highlightIdx === i;
            const op = highlighted ? 1 : 0.2;
            const child = treeData[i];
            const hasKey = !!child?.childSeed;
            const seedH = child?.childSeed ? toHex(child.childSeed) : null;

            return (
              <g
                key={i}
                opacity={op}
                style={{ cursor: "pointer" }}
                data-tree-node
                onMouseEnter={(e) => handleChildHover(i, child, e)}
                onMouseLeave={() => {
                  onHighlight(null);
                  onNodeHover(null);
                }}
                aria-label={`Kind-Seed ${i}`}
              >
                <title>Kind-Seed {i} — BIP85 Index {i}</title>
                <RoundRect x={cx2} y={CHILD_Y} w={140} h={60} fill="var(--bg-primary)" stroke={CHILD_COLORS[i]} rx={10} />
                {/* Colored top bar */}
                <rect x={cx2 - 70} y={CHILD_Y - 30} width={140} height={16} rx="5" fill={CHILD_COLORS[i]} opacity="0.15" />
                <text
                  x={cx2} y={CHILD_Y - 19} textAnchor="middle" fontSize="8"
                  fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill={CHILD_COLORS[i]} letterSpacing="1"
                >
                  BIP85 {CHILD_LABELS[i].toUpperCase()}
                </text>
                {hasKey ? (
                  <>
                    <text x={cx2} y={CHILD_Y - 1} textAnchor="middle" fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#888899">
                      SEED
                    </text>
                    <text x={cx2} y={CHILD_Y + 12} textAnchor="middle" fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill={CHILD_COLORS[i]}>
                      {seedH ? `${seedH.slice(0, 10)}···` : "···"}
                    </text>
                    <text x={cx2} y={CHILD_Y + 26} textAnchor="middle" fontSize="7" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#444468">
                      512 Bit · deterministisch
                    </text>
                  </>
                ) : (
                  <text x={cx2} y={CHILD_Y + 8} textAnchor="middle" fontSize="9" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#444468">
                    {treeLoading ? "···" : "—"}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── One-Way Labels ── */}
          {showOneWay && CHILD_XS.map((cx2, i) => {
            const highlighted = highlightIdx === null || highlightIdx === i;
            const midX = (HMAC_POS.x + cx2) / 2;
            const midY = (HMAC_POS.y + CHILD_Y) / 2 + 10;
            return (
              <g key={i} opacity={highlighted ? 0.9 : 0.1}>
                <rect x={midX - 22} y={midY - 8} width={44} height={14} rx="3" fill="var(--bg-primary)" stroke={CHILD_COLORS[i]} strokeWidth="0.8" opacity="0.85" />
                <text x={midX} y={midY + 2} textAnchor="middle" fontSize="7" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill={CHILD_COLORS[i]} letterSpacing="0.5">
                  EINWEG ↓
                </text>
              </g>
            );
          })}

          {/* ── HMAC Box ── */}
          <g
            style={{ cursor: "pointer" }}
            data-tree-node
            onMouseEnter={(e) =>
              onNodeHover(
                {
                  title: "⚙️ BIP85 HMAC Transformation",
                  color: "#f472b6",
                  rows: [
                    { label: "Operation", val: 'HMAC-SHA512("bip-entropy-from-k")' },
                    { label: "Input", val: "Child Private Key (IL) aus BIP32 Ableitung" },
                    { label: "Output", val: "64 Bytes → erste N Bytes als Kind-Entropie" },
                    { label: "Eigenschaft", val: "Deterministische Einwegfunktion — kein Rückschluss" },
                  ],
                },
                e
              )
            }
            onMouseLeave={() => onNodeHover(null)}
            aria-label="BIP85 HMAC Transformation"
          >
            <title>BIP85 HMAC-SHA512 Transformation</title>
            <RoundRect x={HMAC_POS.x} y={HMAC_POS.y} w={200} h={42} fill="var(--bg-primary)" stroke="#f472b6" rx={8} />
            <rect x={HMAC_POS.x - 100} y={HMAC_POS.y - 21} width={200} height={12} rx="4" fill="rgba(244,114,182,0.12)" />
            <text x={HMAC_POS.x} y={HMAC_POS.y - 13} textAnchor="middle" fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#f472b6" letterSpacing="1">
              BIP85 TRANSFORMATION
            </text>
            <text x={HMAC_POS.x} y={HMAC_POS.y + 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-body, 'Outfit', sans-serif)" fontWeight="700" fill="#f472b6">
              HMAC-SHA512
            </text>
            <text x={HMAC_POS.x} y={HMAC_POS.y + 17} textAnchor="middle" fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#888899">
              &quot;bip-entropy-from-k&quot;
            </text>
          </g>

          {/* ── Master Node ── */}
          <g
            style={{ cursor: "pointer" }}
            data-tree-node
            onMouseEnter={(e) =>
              onNodeHover(
                {
                  title: "🌱 Master Seed (Root)",
                  color: "#a78bfa",
                  rows: [
                    { label: "Seed (512 Bit)", val: seedHex ? `${seedHex.slice(0, 32)}···` : "—" },
                    { label: "Master PrivKey", val: masterHex ? `${masterHex.slice(0, 32)}···` : "—" },
                    { label: "Erzeugt durch", val: "PBKDF2-HMAC-SHA512 aus Mnemonic" },
                    { label: "Eigenschaft", val: "Alle Kind-Wallets deterministisch ableitbar" },
                  ],
                },
                e
              )
            }
            onMouseLeave={() => onNodeHover(null)}
            aria-label="Master Seed"
          >
            <title>Master Seed — Root aller Ableitungen</title>
            <ellipse cx={MASTER_POS.x} cy={MASTER_POS.y} rx="100" ry="35" fill="url(#masterGlow)" />
            <RoundRect x={MASTER_POS.x} y={MASTER_POS.y} w={200} h={52} fill="url(#masterGrad)" stroke="#a78bfa" rx={12} />
            <text x={MASTER_POS.x} y={MASTER_POS.y - 9} textAnchor="middle" fontSize="12" fontFamily="var(--font-body, 'Outfit', sans-serif)" fontWeight="800" fill="white">
              🌱 MASTER SEED
            </text>
            <text x={MASTER_POS.x} y={MASTER_POS.y + 7} textAnchor="middle" fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="rgba(255,255,255,0.7)">
              {masterHex ? `${masterHex.slice(0, 22)}···` : "— kein Key berechnet —"}
            </text>
            <text x={MASTER_POS.x} y={MASTER_POS.y + 19} textAnchor="middle" fontSize="7" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="rgba(255,255,255,0.4)">
              BIP32 Master Private Key · 256 Bit
            </text>
          </g>

          {/* ── BIP32 Label on Master→HMAC ── */}
          <rect x={CX - 60} y={107} width={120} height={14} rx="3" fill="var(--bg-primary)" stroke="var(--border-subtle)" strokeWidth="0.8" opacity="0.9" />
          <text x={CX} y={118} textAnchor="middle" fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#7c3aed" letterSpacing="0.5">
            BIP32 Ableitung m/83696968&apos;/…
          </text>

          {/* ── Level Labels ── */}
          <text x="18" y={MASTER_POS.y + 5} fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="var(--border-subtle)" textAnchor="start">L0</text>
          <text x="18" y={HMAC_POS.y + 5} fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="var(--border-subtle)" textAnchor="start">L1</text>
          <text x="18" y={CHILD_Y + 5} fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="var(--border-subtle)" textAnchor="start">L2</text>
          <text x="18" y={BIP44_Y + 5} fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="var(--border-subtle)" textAnchor="start">L3</text>

          {/* ── No-Return X Marks ── */}
          {showOneWay && (
            <g opacity="0.5">
              {CHILD_XS.map((cx2, i) => (
                <g key={i}>
                  <line x1={cx2 - 8} y1={BARRIER_Y + 12} x2={cx2 + 8} y2={BARRIER_Y + 28} stroke="#ff3366" strokeWidth="2" opacity="0.7" />
                  <line x1={cx2 + 8} y1={BARRIER_Y + 12} x2={cx2 - 8} y2={BARRIER_Y + 28} stroke="#ff3366" strokeWidth="2" opacity="0.7" />
                </g>
              ))}
              <text x={CX + 160} y={BARRIER_Y + 24} textAnchor="middle" fontSize="8" fontFamily="var(--font-code, 'JetBrains Mono', monospace)" fill="#ff3366" opacity="0.7">
                ✗ kein Rückweg
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
