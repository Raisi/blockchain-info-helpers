"use client";

import { useMemo } from "react";
import { sha256 } from "@noble/hashes/sha256";
import { toHex, fmtHex } from "../crypto-utils";

interface HashToBech32PipelineProps {
  childPubKey: Uint8Array;
  hash160: Uint8Array;
  address: string;
}

export function HashToBech32Pipeline({
  childPubKey,
  hash160,
  address,
}: HashToBech32PipelineProps) {
  const sha256Hash = useMemo(() => sha256(childPubKey), [childPubKey]);

  return (
    <div className="space-y-0">
      {/* Stage 1: Child PubKey */}
      <div
        data-flow-animate
        className="rounded-xl border border-[#34d399]/30 bg-[#34d399]/5 p-3"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="font-code text-xs font-bold uppercase tracking-wider text-[#34d399]">
            Child Public Key
          </span>
          <span className="rounded bg-[#34d399]/10 px-1.5 py-0.5 font-code text-[10px] text-[#34d399]">
            33 Bytes
          </span>
        </div>
        <div
          data-value-animate
          className="break-all font-code text-xs leading-relaxed text-[#6ee7b7]"
        >
          {toHex(childPubKey)}
        </div>
      </div>

      {/* Arrow: SHA-256 */}
      <div data-flow-animate className="flex items-center justify-center py-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent-warning/30 bg-accent-warning/10 font-code text-[10px] text-accent-warning">
          ↓
        </div>
        <span className="ml-2 font-code text-[11px] font-bold text-accent-warning">
          SHA-256
        </span>
      </div>

      {/* Stage 2: SHA-256 */}
      <div
        data-flow-animate
        className="rounded-xl border border-accent-warning/30 bg-accent-warning/5 p-3"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="font-code text-xs font-bold uppercase tracking-wider text-accent-warning">
            SHA-256 Hash
          </span>
          <span className="rounded bg-accent-warning/10 px-1.5 py-0.5 font-code text-[10px] text-accent-warning">
            32 Bytes
          </span>
        </div>
        <div
          data-value-animate
          className="break-all font-code text-xs leading-relaxed text-amber-300/80"
        >
          {toHex(sha256Hash)}
        </div>
      </div>

      {/* Arrow: RIPEMD-160 */}
      <div data-flow-animate className="flex items-center justify-center py-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent-secondary/30 bg-accent-secondary/10 font-code text-[10px] text-accent-secondary">
          ↓
        </div>
        <span className="ml-2 font-code text-[11px] font-bold text-accent-secondary">
          RIPEMD-160
        </span>
      </div>

      {/* Stage 3: RIPEMD-160 */}
      <div
        data-flow-animate
        className="rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 p-3"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="font-code text-xs font-bold uppercase tracking-wider text-accent-secondary">
            HASH160
          </span>
          <span className="rounded bg-accent-secondary/10 px-1.5 py-0.5 font-code text-[10px] text-accent-secondary">
            20 Bytes
          </span>
        </div>
        <div
          data-value-animate
          className="break-all font-code text-xs leading-relaxed text-[#c4b5fd]"
        >
          {toHex(hash160)}
        </div>
        <div className="mt-1 font-code text-[10px] text-text-muted">
          = RIPEMD-160( SHA-256( pubkey ) )
        </div>
      </div>

      {/* Arrow: Bech32 */}
      <div data-flow-animate className="flex items-center justify-center py-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 font-code text-[10px] text-accent-primary">
          ↓
        </div>
        <span className="ml-2 font-code text-[11px] font-bold text-accent-primary">
          Bech32 Encode
        </span>
      </div>

      {/* Stage 4: Bech32 Address */}
      <div
        data-flow-animate
        className="rounded-xl border border-accent-primary/30 bg-accent-primary/5 p-3"
      >
        <div className="mb-2 font-code text-xs font-bold uppercase tracking-wider text-accent-primary">
          Bech32 Address
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-bg-card p-2 text-center">
            <div className="text-[10px] text-text-muted">HRP</div>
            <div className="font-code text-xs font-bold text-accent-primary">
              bc
            </div>
          </div>
          <div className="rounded-lg bg-bg-card p-2 text-center">
            <div className="text-[10px] text-text-muted">Separator</div>
            <div className="font-code text-xs font-bold text-text-secondary">
              1
            </div>
          </div>
          <div className="rounded-lg bg-bg-card p-2 text-center">
            <div className="text-[10px] text-text-muted">Witness v0</div>
            <div className="font-code text-xs font-bold text-accent-secondary">
              q
            </div>
          </div>
          <div className="rounded-lg bg-bg-card p-2 text-center">
            <div className="text-[10px] text-text-muted">Data</div>
            <div className="font-code text-[11px] text-text-secondary">
              {address.slice(4, 12)}...
            </div>
          </div>
        </div>
        <div
          data-value-animate
          className="mt-3 text-center font-code text-sm font-bold text-accent-primary"
          style={{ textShadow: "0 0 20px rgba(34, 211, 238, 0.3)" }}
        >
          {address}
        </div>
      </div>
    </div>
  );
}
