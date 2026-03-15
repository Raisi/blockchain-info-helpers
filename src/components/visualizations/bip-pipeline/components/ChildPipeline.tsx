"use client";

import { useState } from "react";
import type { TreeChild } from "../types";
import { toHex } from "../crypto";

const CHILD_COLORS = ["#f472b6", "#34d399", "#60a5fa", "#fbbf24"];

interface ChildPipelineProps {
  treeData: (TreeChild | null)[];
}

interface PipeStage {
  num: string;
  title: string;
  desc: string;
  data: string | null;
  dataColor: string;
  dataLabel: string;
}

function buildStages(child: TreeChild, i: number): PipeStage[] {
  const col = CHILD_COLORS[i];
  const entH = child.childEntropy ? toHex(child.childEntropy) : null;
  const seedH = child.childSeed ? toHex(child.childSeed) : null;
  const masterH = child.childMaster ? toHex(child.childMaster.priv) : null;
  const chainH = child.childMaster ? toHex(child.childMaster.chain) : null;

  return [
    {
      num: "①",
      title: "BIP32 Ableitung",
      desc: `m/83696968'/39'/0'/12'/${i}'`,
      data: null,
      dataColor: "",
      dataLabel: "",
    },
    {
      num: "②",
      title: 'HMAC-SHA512("bip-entropy-from-k")',
      desc: "Private Key → 64 Byte Entropie → erste 16 Byte extrahiert",
      data: entH,
      dataColor: "var(--accent-success)",
      dataLabel: "128-bit Entropy",
    },
    {
      num: "③",
      title: "Entropy → BIP39 Mnemonic",
      desc: "SHA256-Checksum + Wordlist → 12 Wörter",
      data: child.childMnemonic ? child.childMnemonic.join(" ") : null,
      dataColor: col,
      dataLabel: "Child Mnemonic",
    },
    {
      num: "④",
      title: "PBKDF2-HMAC-SHA512 → Seed",
      desc: "Mnemonic + Salt='mnemonic' · 2048 Iterationen → 512 Bit",
      data: seedH ? `${seedH.slice(0, 48)}···` : null,
      dataColor: "var(--accent-success)",
      dataLabel: "512-bit Seed",
    },
    {
      num: "⑤",
      title: 'HMAC-SHA512("Bitcoin seed") → Master Key',
      desc: "IL = Child Private Key · IR = Child Chain Code",
      data: masterH ? `Priv: ${masterH.slice(0, 24)}···  Chain: ${chainH?.slice(0, 24)}···` : null,
      dataColor: "var(--accent-primary)",
      dataLabel: "Child Master Key",
    },
  ];
}

function ChildCard({ child, index }: { child: TreeChild; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const col = CHILD_COLORS[index];
  const stages = buildStages(child, index);
  const finalH = child.finalKey ? toHex(child.finalKey.priv) : null;

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: `color-mix(in srgb, ${col} 27%, transparent)`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${col} 3%, transparent), transparent)`,
      }}
    >
      {/* Header — clickable to expand/collapse */}
      <button
        className="flex w-full items-center gap-2.5 border-b px-4 py-3 text-left transition-colors hover:brightness-110"
        style={{
          borderColor: `color-mix(in srgb, ${col} 20%, transparent)`,
          background: `color-mix(in srgb, ${col} 5%, transparent)`,
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border-2 font-code text-xs font-bold"
          style={{
            background: `color-mix(in srgb, ${col} 13%, transparent)`,
            borderColor: col,
            color: col,
          }}
        >
          {index}
        </div>
        <div className="flex-1">
          <div className="font-body text-sm font-extrabold" style={{ color: col }}>
            Child Seed Index {index}
          </div>
          <div className="text-[10px] text-text-secondary">
            m/83696968&apos;/39&apos;/0&apos;/12&apos;/{index}&apos; → BIP44 m/44&apos;/0&apos;/0&apos;/0/0
          </div>
        </div>
        {finalH && (
          <div className="font-code text-[9px] text-text-muted">
            Final: <span style={{ color: col }}>{finalH.slice(0, 12)}···</span>
          </div>
        )}
        <div
          className="ml-2 text-text-muted transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </div>
      </button>

      {/* Pipeline stages — collapsible */}
      {expanded && (
        <div className="flex flex-col gap-0 p-4">
          {stages.map((s, si) => (
            <div key={si} className="flex items-stretch gap-2.5">
              <div className="flex w-6 flex-shrink-0 flex-col items-center">
                <div className="text-sm leading-none">{s.num}</div>
                {si < stages.length - 1 && (
                  <div className="my-0.5 flex-1" style={{ width: 1, background: `color-mix(in srgb, ${col} 20%, transparent)` }} />
                )}
              </div>
              <div className={`min-w-0 flex-1 ${si < stages.length - 1 ? "mb-1.5" : ""}`}>
                <div className="font-body text-[11px] font-bold text-text-primary">
                  {s.title}
                </div>
                <div className={`text-[9px] text-text-muted ${s.data ? "mb-1" : ""}`}>
                  {s.desc}
                </div>
                {s.data && (
                  <div
                    className="mt-0.5 break-all rounded-md border border-border-subtle bg-bg-primary p-1.5 font-code text-[9px] leading-relaxed"
                    style={{ color: s.dataColor }}
                  >
                    <span className="text-[8px] tracking-wider text-text-muted">
                      {s.dataLabel}:{" "}
                    </span>
                    {s.data}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChildPipeline({ treeData }: ChildPipelineProps) {
  const hasChildren = treeData.some(Boolean);
  if (!hasChildren) return null;

  return (
    <div className="mt-7">
      <div className="mb-1 font-code text-[10px] tracking-widest text-text-muted">
        CHILD SEED PIPELINE — 5 SCHRITTE PRO CHILD SEED
      </div>
      <div className="mb-4 font-body text-xs leading-relaxed text-text-secondary">
        Jeder Child Seed durchläuft eine{" "}
        <strong className="text-[#fb7185]">vollständige Pipeline</strong> — von
        der BIP32-Ableitung bis zum fertigen BIP44-Schlüssel. Klicke auf ein
        Child Seed um die echten, berechneten Daten zu sehen.
      </div>

      <div className="flex flex-col gap-3.5">
        {treeData.map((child, i) => {
          if (!child) return null;
          return <ChildCard key={i} child={child} index={i} />;
        })}
      </div>

      <div className="mt-4 rounded-xl border border-[#fb7185]/25 bg-[#fb7185]/5 p-4 font-body text-sm leading-[1.8] text-text-secondary">
        <strong className="text-[#fb7185]">Beachte den Unterschied:</strong> Im
        alten (fehlerhaften) Code wurden die Entropy-Bytes <em>direkt</em> als
        Seed verwendet — ohne PBKDF2. Das ist{" "}
        <strong className="text-[#fb7185]">kryptografisch falsch</strong>. Der
        korrekte Weg ist: Entropy → Mnemonic-Wörter → PBKDF2 (2048 Runden) →
        512-Bit Seed. Erst dadurch sind die Child Seeds mit echten
        Hardware-Wallets kompatibel.
      </div>
    </div>
  );
}
