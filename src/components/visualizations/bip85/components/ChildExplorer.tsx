"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  mnemonicToSeed,
  seedToMaster,
  childDerive,
  bip85ExtractEntropy,
  entropyToMnemonic,
  toHex,
  splitHex,
} from "@/components/visualizations/bip-pipeline/crypto";
import type { MasterKey, TreeChild } from "@/components/visualizations/bip-pipeline/types";
import TreeSvgCanvas from "@/components/visualizations/bip-pipeline/components/TreeSvgCanvas";
import TreeTooltip from "@/components/visualizations/bip-pipeline/components/TreeTooltip";
import type { TooltipData } from "@/components/visualizations/bip-pipeline/components/TreeTooltip";
import TreeLegend from "@/components/visualizations/bip-pipeline/components/TreeLegend";
import TreeControls from "@/components/visualizations/bip-pipeline/components/TreeControls";

interface ChildData {
  index: number;
  entropy: Uint8Array;
  mnemonic: string[];
  seed: Uint8Array;
  masterKey: MasterKey;
  finalKey: MasterKey;
}

interface ChildExplorerProps {
  mnemonic: string;
  wordlist: string[];
  masterKey: MasterKey | null;
  seed: Uint8Array | null;
}

function ChildCard({
  child,
  isSelected,
  onClick,
}: {
  child: ChildData;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full rounded-xl border p-4 text-left transition-all ${
        isSelected
          ? "border-[#fb7185] bg-[#fb7185]/10"
          : "border-border-subtle bg-bg-card hover:border-[#fb7185]/30 hover:bg-bg-card-hover"
      }`}
      onClick={onClick}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-code text-xs font-bold text-text-muted">
          Index {child.index}
        </span>
        <span className="text-lg">🌱</span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {child.mnemonic.slice(0, 4).map((w, i) => (
          <span
            key={i}
            className="rounded bg-[#fb7185]/10 px-1.5 py-0.5 font-code text-[10px] text-[#fb7185]"
          >
            {w}
          </span>
        ))}
        <span className="rounded bg-border-subtle px-1.5 py-0.5 font-code text-[10px] text-text-muted">
          +{child.mnemonic.length - 4}
        </span>
      </div>
      <div className="font-code text-[10px] text-text-muted truncate">
        {toHex(child.entropy).slice(0, 24)}...
      </div>
    </button>
  );
}

function ChildDetail({ child }: { child: ChildData }) {
  return (
    <div className="rounded-xl border border-[#fb7185]/25 bg-bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fb7185]/15 text-xl">
          🌱
        </div>
        <div>
          <div className="font-code text-sm font-bold text-text-primary">
            Child Seed #{child.index}
          </div>
          <div className="font-code text-[11px] text-text-muted">
            m/83696968&apos;/39&apos;/0&apos;/12&apos;/{child.index}&apos;
          </div>
        </div>
      </div>

      {/* Mnemonic */}
      <div className="mb-4">
        <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
          Child Mnemonic
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border-subtle bg-bg-primary p-3">
          {child.mnemonic.map((word, i) => (
            <span
              key={i}
              className="rounded-lg bg-[#fb7185]/12 px-2.5 py-1 font-code text-xs text-[#fb7185]"
            >
              <span className="mr-1 text-[9px] text-text-muted">{i + 1}</span>
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Entropy */}
      <div className="mb-4">
        <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
          Entropy ({child.entropy.length * 8} Bit)
        </div>
        <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-3 font-code text-sm leading-8">
          {splitHex(toHex(child.entropy), 8).map((c, i) => (
            <span
              key={i}
              className="mr-1.5 mb-1 inline-block rounded px-2 py-1 bg-accent-primary/12 text-[#22d3ee]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Seed */}
      <div className="mb-4">
        <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
          Child Seed (PBKDF2)
        </div>
        <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-3 font-code text-sm leading-8">
          {splitHex(toHex(child.seed), 8).map((c, i) => (
            <span
              key={i}
              className="mr-1.5 mb-1 inline-block rounded px-2 py-1 bg-accent-success/12 text-[#6ee7b7]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Master Key */}
      <div>
        <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
          Child Master Key
        </div>
        <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-3 font-code text-sm leading-8">
          {splitHex(toHex(child.masterKey.priv), 8).map((c, i) => (
            <span
              key={i}
              className="mr-1.5 mb-1 inline-block rounded px-2 py-1 bg-accent-secondary/12 text-[#a78bfa]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChildExplorer({
  mnemonic,
  wordlist,
  masterKey,
  seed,
}: ChildExplorerProps) {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<[number, number]>([0, 1]);
  const [maxIndex] = useState(7);
  const [computing, setComputing] = useState(false);

  // Tree state
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [showIsolation, setShowIsolation] = useState(true);
  const [showOneWay, setShowOneWay] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleNodeHover = useCallback(
    (data: TooltipData | null, e?: React.MouseEvent) => {
      setTooltipData(data);
      if (e) setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const deriveChildren = useCallback(async () => {
    if (!mnemonic.trim() || wordlist.length === 0) return;
    setComputing(true);
    try {
      const s = await mnemonicToSeed(mnemonic);
      const master = await seedToMaster(s);

      const results: ChildData[] = [];
      for (let idx = 0; idx <= maxIndex; idx++) {
        // Derive through m/83696968'/39'/0'/12'/{idx}'
        let current = master;
        for (const seg of [83696968, 39, 0, 12, idx]) {
          current = await childDerive(current.priv, current.chain, seg, true);
        }

        const rawEntropy = await bip85ExtractEntropy(current.priv);
        const entropy = rawEntropy.slice(0, 16); // 128 bits for 12 words
        const childMnemonic = await entropyToMnemonic(entropy, wordlist);

        // Derive child's own seed and master
        const childSeed = await mnemonicToSeed(childMnemonic.join(" "));
        const childMaster = await seedToMaster(childSeed);

        // Derive BIP44 final key: m/44'/0'/0'/0/0
        let finalCurrent = childMaster;
        const bip44Segs: [number, boolean][] = [
          [44, true],
          [0, true],
          [0, true],
          [0, false],
          [0, false],
        ];
        for (const [seg, hardened] of bip44Segs) {
          finalCurrent = await childDerive(
            finalCurrent.priv,
            finalCurrent.chain,
            seg,
            hardened
          );
        }

        results.push({
          index: idx,
          entropy,
          mnemonic: childMnemonic,
          seed: childSeed,
          masterKey: childMaster,
          finalKey: finalCurrent,
        });
      }

      setChildren(results);
    } catch (e) {
      console.error("Child derivation error:", e);
    } finally {
      setComputing(false);
    }
  }, [mnemonic, wordlist, maxIndex]);

  useEffect(() => {
    deriveChildren();
  }, [deriveChildren]);

  // Map first 4 children to TreeChild format for the SVG tree
  const treeData = useMemo<(TreeChild | null)[]>(() => {
    return [0, 1, 2, 3].map((i) => {
      const child = children[i];
      if (!child) return null;
      return {
        childEntropy: child.entropy,
        childMnemonic: child.mnemonic,
        childSeed: child.seed,
        childMaster: child.masterKey,
        finalKey: child.finalKey,
      };
    });
  }, [children]);

  const toggleSelected = (index: number) => {
    setSelectedIndices((prev) => {
      if (prev[0] === index) return prev;
      return [index, prev[0]];
    });
  };

  return (
    <div>
      {/* Explanation */}
      <div data-bip85-animate>
        <div className="mb-6 flex gap-5 rounded-[14px] border border-[#fb7185]/25 bg-[#fb7185]/[0.06] p-6 items-start">
          <span className="text-3xl flex-shrink-0">🔍</span>
          <div>
            <div className="mb-2 font-code text-[15px] font-bold text-[#fb7185]">
              Mehrere Children vergleichen
            </div>
            <div className="font-body text-sm leading-[1.8] text-text-secondary">
              Jeder Child-Index erzeugt einen <strong className="text-[#fb7185]">komplett unabhängigen Seed</strong>.
              Klicke auf verschiedene Children, um ihre vollständige Ableitung zu sehen.
              Beachte: Die Daten sind völlig unterschiedlich — es gibt keine erkennbare Verbindung.
            </div>
          </div>
        </div>
      </div>

      {computing && (
        <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-active border-t-[#fb7185]" />
          Berechne Children 0–{maxIndex}...
        </div>
      )}

      {/* Interactive SVG Tree */}
      {children.length >= 4 && (
        <div data-bip85-animate className="mb-6">
          <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
            BIP-85 Ableitungsbaum (Index 0–3)
          </div>
          <TreeControls
            showOneWay={showOneWay}
            setShowOneWay={setShowOneWay}
            showIsolation={showIsolation}
            setShowIsolation={setShowIsolation}
            treeLoading={computing}
            childCount={Math.min(children.length, 4)}
          />
          <TreeSvgCanvas
            masterKey={masterKey}
            seed={seed}
            treeData={treeData}
            treeLoading={computing}
            highlightIdx={highlightIdx}
            showIsolation={showIsolation}
            showOneWay={showOneWay}
            onHighlight={setHighlightIdx}
            onNodeHover={handleNodeHover}
          />
          <TreeLegend />
          <TreeTooltip data={tooltipData} position={tooltipPos} />
        </div>
      )}

      {/* Child Grid */}
      {children.length > 0 && (
        <>
          <div data-bip85-animate>
            <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
              Children (Index 0–{maxIndex}) — Klicke zum Vergleichen
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {children.map((child) => (
                <ChildCard
                  key={child.index}
                  child={child}
                  isSelected={selectedIndices.includes(child.index)}
                  onClick={() => toggleSelected(child.index)}
                />
              ))}
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div data-bip85-animate>
            <div className="mb-2 font-code text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
              Vergleich
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {selectedIndices.map((idx) => {
                const child = children.find((c) => c.index === idx);
                return child ? (
                  <ChildDetail key={`detail-${idx}`} child={child} />
                ) : null;
              })}
            </div>
          </div>

          {/* Independence highlight */}
          <div data-bip85-animate>
            <div className="mt-5 rounded-xl border border-accent-primary/25 bg-accent-primary/[0.06] p-4 text-center">
              <span className="font-code text-xs text-accent-primary">
                🔗 Jedes Child ist ein vollwertiger, unabhängiger BIP-39 Seed —
                importierbar in jede kompatible Wallet
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
