"use client";

import { useState, useEffect, useCallback } from "react";
import {
  mnemonicToSeed,
  seedToMaster,
  childDerive,
  bip85ExtractEntropy,
  entropyToMnemonic,
  toHex,
  splitHex,
} from "@/components/visualizations/bip-pipeline/crypto";
import type { MasterKey } from "@/components/visualizations/bip-pipeline/types";
import { BIP85_APPS } from "../constants";

interface IntermediateKey {
  key: MasterKey;
  segment: number;
  label: string;
  cumulativePath: string;
}

interface DerivationState {
  masterKey: MasterKey | null;
  derivedKey: MasterKey | null;
  rawEntropy: Uint8Array | null;
  entropyBytes: Uint8Array | null;
  childMnemonic: string[] | null;
  path: string;
  intermediateKeys: IntermediateKey[];
}

interface DerivationPipelineProps {
  mnemonic: string;
  onMnemonicChange: (m: string) => void;
  wordlist: string[];
}

/* ─── Local Sub-Components ─── */

function StageGroup({
  color,
  label,
  stageNumber,
  children,
}: {
  color: string;
  label: string;
  stageNumber: number;
  children: React.ReactNode;
}) {
  const stageColors: Record<number, string> = {
    1: "text-[#a78bfa]",
    2: "text-[#fbbf24]",
    3: "text-[#fb7185]",
    4: "text-[#6ee7b7]",
  };

  return (
    <div
      className="relative rounded-lg p-4"
      style={{
        borderLeft: `3px solid ${color}`,
        backgroundColor: `color-mix(in srgb, ${color} 3%, transparent)`,
      }}
    >
      <div
        className="mb-3 inline-block rounded px-2 py-0.5 font-code text-[11px] font-bold uppercase tracking-wider"
        style={{
          color,
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        }}
      >
        <span className={stageColors[stageNumber] ?? "text-text-muted"}>
          {stageNumber}
        </span>
        <span className="mx-1 text-text-muted">·</span>
        {label}
      </div>
      {children}
    </div>
  );
}

function HexBlock({
  label,
  hex,
  colorClass,
}: {
  label: string;
  hex: string;
  colorClass: string;
}) {
  return (
    <div>
      <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
        {label}
      </div>
      <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-3 font-code text-sm leading-8">
        {splitHex(hex, 8).map((c, i) => (
          <span
            key={i}
            className={`mr-1.5 mb-1 inline-block rounded px-2 py-1 transition-all hover:brightness-[1.4] ${colorClass}`}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function PipelineArrow({
  label,
  detail,
  children,
}: {
  label: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-5">
      <div className="border-t border-border-subtle" />
      <div className="flex flex-col items-center gap-2 py-3">
        <div className="font-code text-xs font-bold uppercase tracking-widest text-[#fb7185]">
          {label}
        </div>
        {detail && (
          <div className="rounded-md bg-bg-primary px-3 py-1.5 font-code text-sm text-text-secondary">
            {detail}
          </div>
        )}
        {children}
        <div className="text-2xl text-[#fb7185]">⬇</div>
      </div>
      <div className="border-t border-border-subtle" />
    </div>
  );
}

function StageInfo({ text, color }: { text: string; color: string }) {
  return (
    <div
      className="mt-3 mb-1 flex items-start gap-2 rounded-r-md border-l-2 py-1.5 pl-3 font-body text-[13px] leading-relaxed text-text-secondary"
      style={{ borderColor: color }}
    >
      <span
        className="mt-[7px] block h-[6px] w-[6px] flex-shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{text}</span>
    </div>
  );
}

interface PathSegment {
  value: string;
  label: string;
  colorClass: string;
}

function PathBreakdown({
  app,
  wordCount,
  childIndex,
}: {
  app: "bip39" | "wif" | "hex";
  wordCount: 12 | 18 | 24;
  childIndex: number;
}) {
  const purposeMap = { bip39: 39, wif: 2, hex: 128169 };
  const segments: PathSegment[] = [
    { value: "m", label: "Root", colorClass: "border-text-muted text-text-muted" },
    { value: "83696968'", label: "BIP-85", colorClass: "border-[#fb7185] text-[#fb7185]" },
    {
      value: `${purposeMap[app]}'`,
      label: app === "bip39" ? "BIP-39" : app === "wif" ? "WIF" : "HEX",
      colorClass: "border-accent-primary text-accent-primary",
    },
  ];

  if (app === "bip39") {
    segments.push(
      { value: "0'", label: "English", colorClass: "border-accent-primary text-accent-primary" },
      {
        value: `${wordCount}'`,
        label: `${wordCount} Words`,
        colorClass: "border-accent-primary text-accent-primary",
      },
    );
  }

  segments.push({
    value: `${childIndex}'`,
    label: "Index",
    colorClass: "border-[#fbbf24] text-[#fbbf24]",
  });

  return (
    <div className="mt-3 mb-1 flex flex-wrap items-center gap-2">
      {segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className={`flex flex-col items-center rounded border px-3 py-1.5 font-code text-xs leading-tight ${seg.colorClass} bg-bg-primary`}
          >
            <span className="font-bold">{seg.value}</span>
            <span className="mt-0.5 text-[10px] text-text-muted">{seg.label}</span>
          </span>
          {i < segments.length - 1 && (
            <span className="text-sm text-text-muted">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

function buildSegmentLabels(
  app: "bip39" | "wif" | "hex",
  wordCount: 12 | 18 | 24,
  childIndex: number,
  segments: number[],
): string[] {
  if (app === "bip39") {
    return [
      "BIP-85 Purpose",
      "BIP-39",
      "Language: English",
      `Word Count: ${wordCount}`,
      `Child Index: ${childIndex}`,
    ].slice(0, segments.length);
  }
  return [
    "BIP-85 Purpose",
    app === "wif" ? "WIF" : "HEX",
    `Child Index: ${childIndex}`,
  ].slice(0, segments.length);
}

function IntermediateSteps({ steps }: { steps: IntermediateKey[] }) {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="mt-3 mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary px-4 py-2.5 font-code text-sm text-text-secondary transition-all hover:border-border-active hover:text-text-primary"
      >
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <span>
          Zwischenschritte der Ableitung anzeigen ({steps.length})
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
        <div className="mt-2 space-y-0 rounded-lg border border-border-subtle bg-bg-primary p-4">
          {steps.map((step, i) => {
            const privHex = toHex(step.key.priv);
            const chainHex = toHex(step.key.chain);
            const isLast = i === steps.length - 1;

            return (
              <div key={i}>
                <div
                  className={`rounded-md px-4 py-3.5 ${
                    isLast
                      ? "border border-[#fbbf24]/25 bg-[#fbbf24]/[0.06]"
                      : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="rounded bg-border-subtle px-1.5 py-0.5 font-code text-[11px] text-text-muted">
                      {i + 1}/{steps.length}
                    </span>
                    <span className="font-code text-sm text-text-primary">
                      {step.cumulativePath}
                    </span>
                    <span className="text-[11px] text-text-muted">—</span>
                    <span className="font-code text-xs text-accent-primary">
                      {step.label}
                    </span>
                    {isLast && (
                      <span className="ml-auto rounded bg-[#fbbf24]/15 px-1.5 py-0.5 font-code text-[11px] text-[#fbbf24]">
                        = Derived Key
                      </span>
                    )}
                  </div>
                  <div className="mt-2 rounded border border-border-subtle bg-bg-secondary/50 px-2.5 py-1.5 font-code text-[11px] leading-relaxed text-text-muted">
                    <span className="text-[#fb7185]">HMAC-SHA512</span>
                    <span className="mx-1">←</span>
                    key: <span className="text-[#94a3b8]">parent chain code</span>
                    <span className="mx-1">|</span>
                    data: <span className="text-[#a78bfa]">0x00 ‖ parent priv</span>
                    {" ‖ "}
                    <span className="text-[#fbbf24]">{step.segment} (index)</span>
                    <br />
                    → left 32B = <span className="text-[#a78bfa]">child key</span> (+ parent mod n)
                    <span className="mx-1">|</span>
                    right 32B = <span className="text-[#94a3b8]">child chain code</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-code text-xs">
                    <span className="text-text-muted">
                      priv:{" "}
                      <span className="text-[#a78bfa]">
                        {privHex.slice(0, 32)}…
                      </span>
                    </span>
                    <span className="text-text-muted">
                      chain:{" "}
                      <span className="text-[#94a3b8]">
                        {chainHex.slice(0, 16)}…
                      </span>
                    </span>
                  </div>
                </div>
                {!isLast && (
                  <div className="flex justify-center py-1.5 text-sm text-border-active">
                    ↓
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function DerivationPipeline({
  mnemonic,
  onMnemonicChange,
  wordlist,
}: DerivationPipelineProps) {
  const [app, setApp] = useState<"bip39" | "wif" | "hex">("bip39");
  const [wordCount, setWordCount] = useState<12 | 18 | 24>(12);
  const [childIndex, setChildIndex] = useState(0);
  const [computing, setComputing] = useState(false);
  const [state, setState] = useState<DerivationState>({
    masterKey: null,
    derivedKey: null,
    rawEntropy: null,
    entropyBytes: null,
    childMnemonic: null,
    path: "",
    intermediateKeys: [],
  });

  const derive = useCallback(async () => {
    if (!mnemonic.trim() || wordlist.length === 0) return;
    setComputing(true);
    try {
      // Step 1: Mnemonic → Seed → Master Key
      const seed = await mnemonicToSeed(mnemonic);
      const master = await seedToMaster(seed);

      // Step 2: Build BIP-85 derivation path
      const purpose = BIP85_APPS[app].purpose;
      const entropyBits = wordCount === 12 ? 128 : wordCount === 18 ? 192 : 256;

      // m/83696968'/{purpose}'/{lang}'/{words}'/{index}'
      const pathSegments =
        app === "bip39"
          ? [83696968, purpose, 0, wordCount, childIndex]
          : [83696968, purpose, childIndex];

      const path = `m/${pathSegments.map((s) => `${s}'`).join("/")}`;

      // Step 3: Derive through the path, collecting intermediate keys
      const segmentLabels = buildSegmentLabels(app, wordCount, childIndex, pathSegments);
      let current = master;
      const intermediateKeys: IntermediateKey[] = [];
      let cumPath = "m";
      for (let i = 0; i < pathSegments.length; i++) {
        const seg = pathSegments[i];
        current = await childDerive(current.priv, current.chain, seg, true);
        cumPath += `/${seg}'`;
        intermediateKeys.push({
          key: { priv: current.priv, chain: current.chain },
          segment: seg,
          label: segmentLabels[i],
          cumulativePath: cumPath,
        });
      }

      // Step 4: HMAC-SHA512 with "bip-entropy-from-k"
      const rawEntropy = await bip85ExtractEntropy(current.priv);

      // Step 5: Truncate to needed bytes
      const numBytes = app === "bip39" ? entropyBits / 8 : 32;
      const entropyBytes = rawEntropy.slice(0, numBytes);

      // Step 6: Convert to output format
      let childMnemonic: string[] | null = null;
      if (app === "bip39") {
        childMnemonic = await entropyToMnemonic(entropyBytes, wordlist);
      }

      setState({
        masterKey: master,
        derivedKey: current,
        rawEntropy,
        entropyBytes,
        childMnemonic,
        path,
        intermediateKeys,
      });
    } catch (e) {
      console.error("BIP-85 derivation error:", e);
    } finally {
      setComputing(false);
    }
  }, [mnemonic, app, wordCount, childIndex, wordlist]);

  useEffect(() => {
    derive();
  }, [derive]);

  return (
    <div>
      {/* Explanation */}
      <div data-bip85-animate>
        <div className="mb-6 flex gap-5 rounded-[14px] border border-[#fb7185]/25 bg-[#fb7185]/[0.06] p-6 items-start">
          <span className="text-3xl flex-shrink-0">⚙️</span>
          <div>
            <div className="mb-2 font-code text-[15px] font-bold text-[#fb7185]">
              3-Stufen Ableitung: BIP-32 → HMAC → Encoding
            </div>
            <div className="font-body text-sm leading-[1.8] text-text-secondary">
              <strong className="text-text-primary">Stufe 1 — BIP-32 Derivation:</strong> Vom Master Private Key wird über einen
              speziellen Pfad (<strong className="text-[#fb7185]">m/83696968&apos;/...</strong>) ein Child Key abgeleitet.{" "}
              <strong className="text-text-primary">Stufe 2 — HMAC-SHA512:</strong> Der Child Key wird mit dem festen
              Schlüssel <code className="rounded bg-bg-primary px-1.5 py-0.5 text-[#fb7185]">&quot;bip-entropy-from-k&quot;</code> gehasht
              — das erzeugt 64 Bytes frische, unabhängige Entropy.{" "}
              <strong className="text-text-primary">Stufe 3 — Truncation + Encoding:</strong> Die ersten N Bytes werden
              entnommen und ins Zielformat (Mnemonic, WIF, HEX) konvertiert.
            </div>
          </div>
        </div>
      </div>

      {/* Config */}
      <div data-bip85-animate>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {/* Output Format */}
          <div>
            <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
              Output Format
            </div>
            <div className="flex gap-2">
              {(Object.keys(BIP85_APPS) as Array<keyof typeof BIP85_APPS>).map((key) => (
                <button
                  key={key}
                  className={`flex-1 rounded-lg border px-3 py-2 font-code text-xs transition-all ${
                    app === key
                      ? "border-[#fb7185] bg-[#fb7185]/15 text-white"
                      : "border-border-subtle bg-bg-card text-text-muted hover:border-border-active"
                  }`}
                  onClick={() => setApp(key)}
                >
                  {BIP85_APPS[key].icon} {BIP85_APPS[key].label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Word Count (only for bip39) */}
          {app === "bip39" && (
            <div>
              <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                Wörter
              </div>
              <div className="flex gap-2">
                {([12, 18, 24] as const).map((wc) => (
                  <button
                    key={wc}
                    className={`flex-1 rounded-lg border px-3 py-2 font-code text-xs transition-all ${
                      wordCount === wc
                        ? "border-[#fb7185] bg-[#fb7185]/15 text-white"
                        : "border-border-subtle bg-bg-card text-text-muted hover:border-border-active"
                    }`}
                    onClick={() => setWordCount(wc)}
                  >
                    {wc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Child Index */}
          <div>
            <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
              Child Index
            </div>
            <input
              type="number"
              min={0}
              max={2147483647}
              value={childIndex}
              onChange={(e) => setChildIndex(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 font-code text-sm text-text-primary outline-none transition-all focus:border-[#fb7185]"
            />
          </div>
        </div>
      </div>

      {/* Mnemonic Input */}
      <div data-bip85-animate>
        <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
          Master Mnemonic
        </div>
        <textarea
          className="mb-6 w-full rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm text-text-primary outline-none transition-all focus:border-[#fb7185] resize-none"
          rows={2}
          value={mnemonic}
          onChange={(e) => onMnemonicChange(e.target.value)}
          placeholder="12 oder 24 Wörter eingeben..."
        />
      </div>

      {computing && (
        <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-active border-t-[#fb7185]" />
          Berechne BIP-85 Ableitung...
        </div>
      )}

      {/* Pipeline Visualization */}
      {state.masterKey && state.derivedKey && state.rawEntropy && state.entropyBytes && (
        <div data-bip85-animate>
          <div className="space-y-0 rounded-xl border border-border-subtle bg-bg-card p-5">
            {/* Stage 1: Master Key */}
            <StageGroup color="#a78bfa" label="Master Key" stageNumber={1}>
              <HexBlock
                label="Master Private Key"
                hex={toHex(state.masterKey.priv)}
                colorClass="bg-accent-secondary/12 text-[#a78bfa]"
              />
              <StageInfo
                color="#a78bfa"
                text="Der Root Private Key, abgeleitet aus deiner Mnemonic via PBKDF2 (2048 Runden). Startpunkt für ALLE Ableitungen in BIP-32/44/85 — deine gesamte Wallet-Hierarchie geht von diesem einen Schlüssel aus."
              />
            </StageGroup>

            <PipelineArrow label="BIP-32 Hardened Derivation" detail={state.path}>
              <PathBreakdown app={app} wordCount={wordCount} childIndex={childIndex} />
              <IntermediateSteps steps={state.intermediateKeys} />
            </PipelineArrow>

            {/* Stage 2: Derived Key */}
            <StageGroup color="#fbbf24" label="Derived Key" stageNumber={2}>
              <HexBlock
                label="Derived Private Key (am Pfad-Ende)"
                hex={toHex(state.derivedKey.priv)}
                colorClass="bg-accent-warning/12 text-[#fbbf24]"
              />
              <StageInfo
                color="#fbbf24"
                text="Der Private Key am Ende des BIP-32 Pfades. Bis hier: Standard BIP-32. Der nächste Schritt ist was BIP-85 besonders macht."
              />
            </StageGroup>

            <PipelineArrow label='HMAC-SHA512' detail='"bip-entropy-from-k"'>
              <StageInfo
                color="#fb7185"
                text='Der Derived Key wird in HMAC-SHA512 mit dem festen String "bip-entropy-from-k" als Schlüssel eingespeist. Das verwandelt einen BIP-32 Private Key in frische, unabhängige Entropy — die Kerninnovation von BIP-85.'
              />
            </PipelineArrow>

            {/* Stage 3: Raw Entropy with used/discarded coloring */}
            <StageGroup color="#fb7185" label="HMAC Entropy" stageNumber={3}>
              {(() => {
                const usedBytes = state.entropyBytes.length;
                const rawHex = toHex(state.rawEntropy);
                const chunks = splitHex(rawHex, 8);
                const usedChunks = Math.ceil((usedBytes * 2) / 8);
                return (
                  <div>
                    <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                      Raw Entropy (64 Bytes) — {usedBytes}B verwendet · {64 - usedBytes}B verworfen
                    </div>
                    <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-3 font-code text-sm leading-8">
                      {chunks.map((c, i) => (
                        <span
                          key={i}
                          className={`mr-1.5 mb-1 inline-block rounded px-2 py-1 transition-all hover:brightness-[1.4] ${
                            i < usedChunks
                              ? "bg-[#fb7185]/12 text-[#fb7185]"
                              : "bg-border-subtle/50 text-text-muted line-through"
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <StageInfo
                color="#fb7185"
                text={`64 Bytes HMAC-Output. ${
                  app === "bip39"
                    ? `Für ${wordCount} Wörter → ${wordCount === 12 ? 16 : wordCount === 18 ? 24 : 32} Bytes (${wordCount === 12 ? 128 : wordCount === 18 ? 192 : 256} Bit) verwendet, der Rest wird kryptografisch sicher verworfen.`
                    : "32 Bytes werden verwendet, der Rest wird kryptografisch sicher verworfen."
                }`}
              />
            </StageGroup>

            {/* Output */}
            {app === "bip39" && state.childMnemonic && (
              <>
                <PipelineArrow label="BIP-39 Encoding" />

                <StageGroup color="#6ee7b7" label="Output" stageNumber={4}>
                  <div>
                    <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                      Child Mnemonic ({state.childMnemonic.length} Wörter)
                    </div>
                    <div className="flex flex-wrap gap-2 rounded-xl border border-border-subtle bg-bg-primary p-4">
                      {state.childMnemonic.map((word, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-[#fb7185]/12 px-3 py-1.5 font-code text-sm text-[#fb7185]"
                        >
                          <span className="mr-1.5 text-[10px] text-text-muted">
                            {i + 1}
                          </span>
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                  <StageInfo
                    color="#6ee7b7"
                    text="Die gekürzte Entropy bekommt eine SHA-256 Checksumme und wird auf Wörter der BIP-39 Wortliste abgebildet — ein vollständig unabhängiger Seed."
                  />
                </StageGroup>
              </>
            )}

            {app !== "bip39" && (
              <>
                <PipelineArrow label={app === "wif" ? "WIF Encoding" : "HEX Output"} />

                <StageGroup color="#6ee7b7" label="Output" stageNumber={4}>
                  <HexBlock
                    label={app === "wif" ? "Private Key (Raw)" : "HEX Entropy"}
                    hex={toHex(state.entropyBytes)}
                    colorClass="bg-accent-success/12 text-[#6ee7b7]"
                  />
                  <StageInfo
                    color="#6ee7b7"
                    text={app === "wif" ? "32 Bytes Raw Entropy, bereit zur WIF-Kodierung als Bitcoin Private Key." : "Rohe Hex-Entropy für beliebige Anwendungen."}
                  />
                </StageGroup>
              </>
            )}

            {/* One-way highlight */}
            <div className="mt-5 rounded-lg border border-accent-warning/25 bg-accent-warning/[0.06] p-3 text-center">
              <span className="font-code text-xs text-accent-warning">
                ⚠️ Einbahnstraße: Aus dem Child Seed kann der Master NICHT rekonstruiert werden
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
