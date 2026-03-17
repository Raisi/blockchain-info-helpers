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
import {  BIP85_APPS } from "../constants";

interface DerivationState {
  masterKey: MasterKey | null;
  derivedKey: MasterKey | null;
  rawEntropy: Uint8Array | null;
  entropyBytes: Uint8Array | null;
  childMnemonic: string[] | null;
  path: string;
}

interface DerivationPipelineProps {
  mnemonic: string;
  onMnemonicChange: (m: string) => void;
  wordlist: string[];
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

function PipelineArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="font-code text-[10px] font-bold uppercase tracking-widest text-[#fb7185]">
        {label}
      </div>
      <div className="text-xl text-text-muted">↓</div>
    </div>
  );
}

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

      // Step 3: Derive through the path
      let current = master;
      for (const seg of pathSegments) {
        current = await childDerive(current.priv, current.chain, seg, true);
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
              3-Stufen Ableitung
            </div>
            <div className="font-body text-sm leading-[1.8] text-text-secondary">
              BIP-85 nutzt den bestehenden BIP-32 Derivation-Mechanismus mit einem speziellen
              Pfad (<strong className="text-[#fb7185]">m/83696968&apos;/...</strong>), gefolgt von einem
              HMAC-SHA512 Schritt, der die Entropy extrahiert. Das Ergebnis ist ein vollständig
              unabhängiger Seed.
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
          <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
            {/* Stage 1: Master Key */}
            <HexBlock
              label="1 · Master Private Key"
              hex={toHex(state.masterKey.priv)}
              colorClass="bg-accent-secondary/12 text-[#a78bfa]"
            />

            <PipelineArrow label={`BIP-32 Hardened Path: ${state.path}`} />

            {/* Stage 2: Derived Key */}
            <HexBlock
              label="2 · Derived Private Key (am Pfad-Ende)"
              hex={toHex(state.derivedKey.priv)}
              colorClass="bg-accent-warning/12 text-[#fbbf24]"
            />

            <PipelineArrow label='HMAC-SHA512("bip-entropy-from-k")' />

            {/* Stage 3: Raw Entropy with used/discarded coloring */}
            {(() => {
              const usedBytes = state.entropyBytes.length;
              const rawHex = toHex(state.rawEntropy);
              const chunks = splitHex(rawHex, 8);
              const usedChunks = Math.ceil((usedBytes * 2) / 8);
              return (
                <div>
                  <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                    3 · Raw Entropy (64 Bytes) — {usedBytes}B verwendet · {64 - usedBytes}B verworfen
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

            {/* Output */}
            {app === "bip39" && state.childMnemonic && (
              <>
                <PipelineArrow label="BIP-39 Encoding" />
                <div>
                  <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                    5 · Child Mnemonic ({state.childMnemonic.length} Wörter)
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
              </>
            )}

            {app !== "bip39" && (
              <>
                <PipelineArrow label={app === "wif" ? "WIF Encoding" : "HEX Output"} />
                <HexBlock
                  label={`5 · ${app === "wif" ? "Private Key (Raw)" : "HEX Entropy"}`}
                  hex={toHex(state.entropyBytes)}
                  colorClass="bg-accent-success/12 text-[#6ee7b7]"
                />
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
