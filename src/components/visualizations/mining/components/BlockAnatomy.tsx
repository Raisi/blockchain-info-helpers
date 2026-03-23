"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import {
  BLOCK_HEADER_FIELDS,
  SAMPLE_BLOCK_HEADER,
  FIELD_COLORS,
  FIELD_BYTES,
} from "../constants";
import { serializeBlockHeader, hashBlockHeader } from "../crypto-utils";
import type { BlockHeaderData, BlockHeaderField } from "../types";
import HexBreakdown from "@/components/visualizations/hashing/components/HexBreakdown";

const TOTAL_BYTES = 80;

/** Character offsets for each field in the serialized hex string */
const FIELD_OFFSETS: { key: keyof BlockHeaderData; start: number; length: number }[] = [
  { key: "version", start: 0, length: 8 },
  { key: "prevHash", start: 8, length: 64 },
  { key: "merkleRoot", start: 72, length: 64 },
  { key: "timestamp", start: 136, length: 8 },
  { key: "bits", start: 144, length: 8 },
  { key: "nonce", start: 152, length: 8 },
];

const PIPELINE_STAGES = [
  { id: "mempool", title: "Mempool", icon: "\u{1F4E6}", short: "Unbestätigte TXs warten", detail: "Tausende Transaktionen warten im Mempool darauf, in einen Block aufgenommen zu werden. Jede TX enthält eine Gebühr als Anreiz für Miner." },
  { id: "selection", title: "TX-Auswahl", icon: "\u{1F4CA}", short: "Gebühren-Ranking", detail: "Der Miner wählt die profitabelsten Transaktionen aus — höhere Gebühren zuerst. Ein Block fasst ca. 1-4 MB an Transaktionen." },
  { id: "coinbase", title: "Coinbase TX", icon: "\u{1FA99}", short: "Block-Belohnung", detail: "Die erste Transaktion in jedem Block ist die Coinbase TX — sie erzeugt neue Bitcoins (aktuell 3.125 BTC) plus alle TX-Gebühren als Belohnung." },
  { id: "merkle", title: "Merkle Tree", icon: "\u{1F333}", short: "TXs \u2192 32 Bytes", detail: "Alle Transaktionen werden paarweise gehasht und zu einem Baum zusammengefasst. Die Wurzel (Merkle Root) repräsentiert alle TXs in nur 32 Bytes." },
  { id: "header", title: "Header bauen", icon: "\u{1F9E9}", short: "80 Bytes assemblieren", detail: "Die 6 Header-Felder werden zusammengesetzt: Version, Previous Hash, Merkle Root, Zeitstempel, Bits und Nonce — insgesamt exakt 80 Bytes." },
] as const;

const CHAIN_BLOCKS = [
  { label: "Block N-2", hash: "0000…a3f2" },
  { label: "Block N-1", hash: "0000…3a21" },
  { label: "Block N", hash: null },
] as const;

const EXAMPLE_TXS = [
  { label: "TX 0: Coinbase (3.125 BTC)", coinbase: true },
  { label: "TX 1: Alice \u2192 Bob  0.5 BTC", coinbase: false },
  { label: "TX 2: Carol \u2192 Dave  1.2 BTC", coinbase: false },
] as const;

/** Chevron icon for collapsible sections */
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** SVG arrow connector between pipeline stages */
function StageArrow() {
  return (
    <svg className="hidden h-4 w-6 shrink-0 text-text-muted lg:block" viewBox="0 0 24 16" fill="none">
      <path d="M0 8h20m0 0l-5-4m5 4l-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Reusable collapsible section wrapper */
function CollapsibleSection({
  id,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      });
    }, contentRef);
    return () => ctx.revert();
  }, [isOpen]);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-bg-card-hover"
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
      >
        <div>
          <h4 className="font-display text-sm font-semibold text-text-primary">{title}</h4>
          <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
        </div>
        <ChevronDown className={`shrink-0 text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div ref={contentRef} id={`section-${id}`} className="border-t border-border-subtle p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Section 1: Pipeline ──────────────────────────────────────────────────────

function PipelineSection({ activeStage, setActiveStage }: { activeStage: number | null; setActiveStage: (i: number | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-pipeline-stage]", {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="space-y-4">
      {/* Pipeline flow */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:justify-center lg:gap-2">
        {PIPELINE_STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            {i > 0 && <StageArrow />}
            <button
              data-pipeline-stage
              onClick={() => setActiveStage(activeStage === i ? null : i)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                activeStage === i
                  ? "border-accent-primary/40 bg-accent-primary/10 shadow-[var(--glow-primary)]"
                  : "border-border-subtle bg-bg-primary/50 hover:border-border-active hover:bg-bg-card-hover"
              }`}
            >
              <span className="text-xl leading-none">{stage.icon}</span>
              <span className="font-display text-xs font-semibold text-text-primary">{stage.title}</span>
              <span className="text-[10px] text-text-muted">{stage.short}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Detail panel */}
      {activeStage !== null && (
        <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/5 p-3">
          <p className="text-sm leading-relaxed text-text-secondary">
            <span className="mr-1.5 text-base">{PIPELINE_STAGES[activeStage].icon}</span>
            <span className="font-semibold text-text-primary">{PIPELINE_STAGES[activeStage].title}:</span>{" "}
            {PIPELINE_STAGES[activeStage].detail}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Section 2: Block Structure ───────────────────────────────────────────────

function BlockStructureSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-block-header]", { y: -15, opacity: 0, duration: 0.5, ease: "power3.out" });
      gsap.from("[data-block-connector]", { scaleY: 0, opacity: 0, duration: 0.4, delay: 0.3, ease: "power3.out", transformOrigin: "top center" });
      gsap.from("[data-block-txs]", { y: 15, opacity: 0, duration: 0.5, delay: 0.5, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-0">
      {/* Header portion */}
      <div data-block-header className="w-full rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
        <p className="mb-2 font-display text-xs font-semibold text-text-primary">Block Header (80 Bytes)</p>
        {/* Thin color stripe bar */}
        <div className="flex overflow-hidden rounded-md">
          {BLOCK_HEADER_FIELDS.map((field) => {
            const bytes = FIELD_BYTES[field.key];
            const widthPercent = (bytes / TOTAL_BYTES) * 100;
            const colors = FIELD_COLORS[field.key];
            return (
              <div
                key={field.key}
                className={`h-3 ${colors.bg}`}
                style={{ width: `${widthPercent}%` }}
                title={`${field.label} (${bytes}B)`}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {BLOCK_HEADER_FIELDS.map((field) => {
            const colors = FIELD_COLORS[field.key];
            return (
              <span key={field.key} className="flex items-center gap-1">
                <span className={`inline-block h-1.5 w-1.5 rounded-sm ${colors.bg}`} />
                <span className="font-code text-[10px] text-text-muted">{field.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Connector */}
      <div data-block-connector className="flex flex-col items-center py-1">
        <svg width="2" height="28" className="text-accent-success">
          <line x1="1" y1="0" x2="1" y2="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
        <span className="mt-0.5 text-center font-code text-[10px] text-accent-success">
          Merkle Root fasst alle TXs zusammen
        </span>
        <svg width="2" height="12" className="text-accent-success">
          <line x1="1" y1="0" x2="1" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      </div>

      {/* TX list */}
      <div data-block-txs className="w-full rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
        <p className="mb-2 font-display text-xs font-semibold text-text-primary">Transaktionen</p>
        <div className="space-y-1.5">
          {EXAMPLE_TXS.map((tx, i) => (
            <div
              key={i}
              className={`rounded-md border px-3 py-2 font-code text-xs ${
                tx.coinbase
                  ? "border-accent-warning/40 bg-accent-warning/5 text-accent-warning"
                  : "border-border-subtle bg-bg-card text-text-secondary"
              }`}
            >
              {tx.label}
              {tx.coinbase && <span className="ml-2 text-[10px] opacity-70">(Block-Belohnung)</span>}
            </div>
          ))}
          {/* Ellipsis row */}
          <div className="rounded-md border border-dashed border-border-subtle px-3 py-2 font-code text-xs text-text-muted">
            ... ~3000 weitere Transaktionen
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Chain View ────────────────────────────────────────────────────

function ChainSection() {
  const ref = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-chain-block]", {
        x: -30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: "power3.out",
      });
      gsap.from("[data-chain-arrow]", {
        scaleX: 0,
        opacity: 0,
        duration: 0.3,
        stagger: 0.15,
        delay: 0.3,
        ease: "power3.out",
        transformOrigin: "left center",
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!pulseRef.current) return;
    const tween = gsap.to(pulseRef.current, {
      opacity: 0.3,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    return () => { tween.kill(); };
  }, []);

  return (
    <div ref={ref} className="overflow-x-auto">
      <div className="flex items-center justify-center gap-0 py-2" style={{ minWidth: "28rem" }}>
        {CHAIN_BLOCKS.map((block, i) => (
          <div key={i} className="contents">
            {i > 0 && (
              <div data-chain-arrow className="flex flex-col items-center px-1">
                <svg className="text-text-muted" width="48" height="24" viewBox="0 0 48 24" fill="none">
                  <path d="M0 12h40m0 0l-5-4m5 4l-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-code text-[9px] text-accent-secondary">prev_hash</span>
              </div>
            )}
            <div
              data-chain-block
              className={`flex w-36 flex-col gap-1 rounded-lg border p-3 ${
                block.hash === null
                  ? "border-accent-primary/40 bg-accent-primary/5"
                  : "border-border-subtle bg-bg-card"
              }`}
            >
              <span className="font-display text-xs font-semibold text-text-primary">{block.label}</span>
              <div className="flex items-center gap-1">
                <span className="font-code text-[10px] text-text-muted">Hash:</span>
                {block.hash !== null ? (
                  <span className="font-code text-[10px] text-accent-primary">{block.hash}</span>
                ) : (
                  <span ref={pulseRef} className="font-code text-[10px] text-accent-warning">??? (mining)</span>
                )}
              </div>
              {/* Show prevHash link for blocks after first */}
              {i > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-code text-[10px] text-text-muted">Prev:</span>
                  <span className="font-code text-[10px] text-accent-secondary">
                    {CHAIN_BLOCKS[i - 1].hash ?? "???"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlockAnatomy() {
  const [selectedField, setSelectedField] = useState<keyof BlockHeaderData | null>(null);
  const [headerData] = useState<BlockHeaderData>(SAMPLE_BLOCK_HEADER);
  const [serialized, setSerialized] = useState("");
  const [hash, setHash] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["pipeline"]));
  const [activeStage, setActiveStage] = useState<number | null>(null);

  const fieldsRef = useRef<HTMLDivElement>(null);
  const serializedRef = useRef<HTMLDivElement>(null);
  const hashRef = useRef<HTMLDivElement>(null);
  const byteBarRef = useRef<HTMLDivElement>(null);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!fieldsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-field-card]", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, fieldsRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!byteBarRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-byte-seg]",
        { opacity: 0, y: 4 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" }
      );
    }, byteBarRef);
    return () => ctx.revert();
  }, []);

  const handleSerialize = useCallback(async () => {
    setIsHashing(true);
    setHash("");

    const hex = serializeBlockHeader(headerData);

    // Animate serialization character by character
    for (let i = 0; i < hex.length; i += 4) {
      setSerialized(hex.slice(0, i + 4));
      await new Promise((r) => setTimeout(r, 8));
    }
    setSerialized(hex);

    if (serializedRef.current) {
      gsap.from(serializedRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    // Now hash it
    const result = await hashBlockHeader(headerData);

    // Reveal hash character by character
    for (let i = 0; i <= result.length; i += 2) {
      setHash(result.slice(0, i));
      await new Promise((r) => setTimeout(r, 20));
    }
    setHash(result);

    if (hashRef.current) {
      gsap.from(hashRef.current, {
        scale: 0.95,
        duration: 0.4,
        ease: "elastic.out(1, 0.6)",
      });
    }

    setIsHashing(false);
  }, [headerData]);

  const getFieldValue = (field: BlockHeaderField): string => {
    const val = headerData[field.key];
    if (field.key === "timestamp") return val.toString();
    if (field.key === "nonce") return val.toString();
    return val as string;
  };

  const getDisplayValue = (field: BlockHeaderField): string => {
    const val = getFieldValue(field);
    if (val.length > 20) {
      return val.slice(0, 12) + "\u2026" + val.slice(-4);
    }
    return val;
  };

  const selectedFieldInfo = BLOCK_HEADER_FIELDS.find(
    (f) => f.key === selectedField
  );

  /** Render color-coded serialized hex */
  const renderColoredSerialized = () => {
    if (!serialized) return null;
    return (
      <div className="flex flex-wrap font-code text-xs leading-relaxed">
        {FIELD_OFFSETS.map(({ key, start, length }) => {
          const segment = serialized.slice(start, start + length);
          if (!segment) return null;
          const colors = FIELD_COLORS[key];
          return (
            <span
              key={key}
              className={`${colors.text} cursor-pointer transition-opacity hover:opacity-80`}
              onClick={() => setSelectedField(selectedField === key ? null : key)}
              title={BLOCK_HEADER_FIELDS.find((f) => f.key === key)?.label}
            >
              {segment}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Section 1: Pipeline */}
      <CollapsibleSection
        id="pipeline"
        title="Vom Mempool zum Block"
        subtitle="Wie ein Miner einen neuen Block zusammenbaut"
        isOpen={expandedSections.has("pipeline")}
        onToggle={() => toggleSection("pipeline")}
      >
        <PipelineSection activeStage={activeStage} setActiveStage={setActiveStage} />
      </CollapsibleSection>

      {/* Section 2: Block Structure */}
      <CollapsibleSection
        id="structure"
        title="Block = Header + Transaktionen"
        subtitle="Die zwei Bestandteile eines Bitcoin-Blocks"
        isOpen={expandedSections.has("structure")}
        onToggle={() => toggleSection("structure")}
      >
        <BlockStructureSection />
      </CollapsibleSection>

      {/* Section 3: Chain */}
      <CollapsibleSection
        id="chain"
        title="Die Kette"
        subtitle="Wie Blöcke über den Previous Hash verkettet werden"
        isOpen={expandedSections.has("chain")}
        onToggle={() => toggleSection("chain")}
      >
        <ChainSection />
      </CollapsibleSection>

      {/* Divider */}
      <div className="border-t border-border-subtle" />

      {/* 80-Byte Layout Diagram */}
      <div ref={byteBarRef}>
        <p className="mb-2 font-display text-xs font-medium text-text-muted">
          80-Byte Block-Header Struktur
        </p>
        <div className="flex overflow-hidden rounded-lg border border-border-subtle">
          {BLOCK_HEADER_FIELDS.map((field) => {
            const bytes = FIELD_BYTES[field.key];
            const widthPercent = (bytes / TOTAL_BYTES) * 100;
            const colors = FIELD_COLORS[field.key];
            const isSelected = selectedField === field.key;
            return (
              <button
                key={field.key}
                data-byte-seg
                onClick={() =>
                  setSelectedField(selectedField === field.key ? null : field.key)
                }
                className={`relative flex flex-col items-center justify-center py-2.5 text-center transition-colors ${colors.bg} ${
                  isSelected ? "brightness-150 ring-1 ring-inset ring-white/20" : "hover:brightness-125"
                }`}
                style={{ width: `${widthPercent}%` }}
              >
                <span className={`font-display text-[10px] font-semibold leading-tight ${colors.text} hidden sm:block`}>
                  {field.label}
                </span>
                <span className={`font-code text-[10px] ${colors.text} mt-0.5 opacity-70`}>
                  {bytes}B
                </span>
              </button>
            );
          })}
        </div>
        {/* Color legend */}
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {BLOCK_HEADER_FIELDS.map((field) => {
            const colors = FIELD_COLORS[field.key];
            return (
              <span key={field.key} className="flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-sm ${colors.bg}`} />
                <span className="font-code text-[10px] text-text-muted">
                  {field.label}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Field Cards Grid */}
      <div ref={fieldsRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BLOCK_HEADER_FIELDS.map((field) => {
          const colors = FIELD_COLORS[field.key];
          const bytes = FIELD_BYTES[field.key];
          return (
            <button
              key={field.key}
              data-field-card
              onClick={() =>
                setSelectedField(
                  selectedField === field.key ? null : field.key
                )
              }
              className={`rounded-lg border-l-4 border p-3 text-left transition-colors ${
                selectedField === field.key
                  ? `${colors.border} border-l-current bg-opacity-10 shadow-[var(--glow-primary)] ${colors.bg}`
                  : `border-border-subtle ${colors.border.replace("/40", "/20")} bg-bg-card hover:border-border-active hover:bg-bg-card-hover`
              }`}
            >
              <div className="flex items-start justify-between">
                <p className={`font-display text-xs font-semibold ${colors.text}`}>
                  {field.label}
                </p>
                <span className="rounded-full bg-white/5 px-1.5 py-0.5 font-code text-[10px] text-text-muted">
                  {bytes}B
                </span>
              </div>
              <p className="mt-1 truncate font-code text-xs text-text-secondary">
                {getDisplayValue(field)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Field Detail */}
      {selectedFieldInfo && (
        <div className={`rounded-lg border p-4 ${FIELD_COLORS[selectedFieldInfo.key].border} ${FIELD_COLORS[selectedFieldInfo.key].bg}`}>
          <h4 className={`font-display text-sm font-semibold ${FIELD_COLORS[selectedFieldInfo.key].text}`}>
            {selectedFieldInfo.label}
            <span className="ml-2 font-code text-xs font-normal text-text-muted">
              {FIELD_BYTES[selectedFieldInfo.key]} Bytes
            </span>
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {selectedFieldInfo.description}
          </p>
          <div className="mt-2 rounded-md bg-bg-primary/50 p-2">
            <p className="font-code text-xs text-text-muted">Wert:</p>
            <p className={`break-all font-code text-xs ${FIELD_COLORS[selectedFieldInfo.key].text}`}>
              {getFieldValue(selectedFieldInfo)}
            </p>
          </div>
        </div>
      )}

      {/* Serialize Button */}
      <button
        onClick={handleSerialize}
        disabled={isHashing}
        className="rounded-lg bg-accent-primary/20 px-5 py-2.5 font-display text-sm font-semibold text-accent-primary transition-colors hover:bg-accent-primary/30 disabled:opacity-50"
      >
        {isHashing ? "Berechne..." : "Serialisieren & Hashen"}
      </button>

      {/* Color-coded Serialized Output */}
      {serialized && (
        <div ref={serializedRef} className="space-y-2">
          <p className="font-display text-xs font-medium text-text-muted">
            Serialisierter Header ({serialized.length / 2} Bytes Hex)
          </p>
          <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
            {renderColoredSerialized()}
          </div>
          {/* Inline color legend for serialized output */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {FIELD_OFFSETS.map(({ key }) => {
              const colors = FIELD_COLORS[key];
              const field = BLOCK_HEADER_FIELDS.find((f) => f.key === key);
              return (
                <span key={key} className="flex items-center gap-1">
                  <span className={`inline-block h-1.5 w-3 rounded-sm ${colors.bg}`} />
                  <span className="font-code text-[10px] text-text-muted">
                    {field?.label}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Hash Output via HexBreakdown */}
      {hash && (
        <div ref={hashRef}>
          <HexBreakdown
            hex={hash}
            label={hash.length < 64 ? "SHA-256d Hash (berechne...)" : "SHA-256d Hash"}
            animate
          />
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-3">
        <p className="text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">
            Block-Header:
          </span>{" "}
          Genau 80 Bytes — Version (4B), Previous Hash (32B), Merkle Root (32B),
          Timestamp (4B), Bits (4B), Nonce (4B). Dieser kompakte Header wird
          zweifach gehasht (SHA-256d), um die Block-ID zu erhalten.
        </p>
      </div>
    </div>
  );
}
