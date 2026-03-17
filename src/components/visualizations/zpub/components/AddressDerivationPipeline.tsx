"use client";

import { toHex, fmtHex } from "../crypto-utils";
import type { DerivedAddress } from "../types";

interface AddressDerivationPipelineProps {
  address: DerivedAddress;
}

function DerivationStage({
  label,
  derivation,
  colorClass,
  borderClass,
  bgClass,
}: {
  label: string;
  derivation: DerivedAddress["chainDerivation"];
  colorClass: string;
  borderClass: string;
  bgClass: string;
}) {
  return (
    <div
      data-flow-animate
      className={`rounded-xl border ${borderClass} ${bgClass} p-3`}
    >
      <div
        className={`mb-2 font-code text-xs font-bold uppercase tracking-wider ${colorClass}`}
      >
        {label}
      </div>

      {/* Input row */}
      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-bg-card p-2">
          <div className="text-[11px] text-text-muted">Parent PubKey (33B)</div>
          <div
            data-value-animate
            className="font-code text-xs text-accent-primary"
          >
            {fmtHex(toHex(derivation.parentPubKey), 10)}
          </div>
        </div>
        <div className="rounded-lg bg-bg-card p-2">
          <div className="text-[11px] text-text-muted">Chain Code (32B)</div>
          <div
            data-value-animate
            className="font-code text-xs text-[#c4b5fd]"
          >
            {fmtHex(toHex(derivation.parentChainCode), 10)}
          </div>
        </div>
        <div className="rounded-lg bg-bg-card p-2">
          <div className="text-[11px] text-text-muted">Index</div>
          <div
            data-value-animate
            className={`font-code text-xs ${colorClass}`}
          >
            {derivation.index}
          </div>
        </div>
      </div>

      {/* HMAC result */}
      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-accent-secondary/20 bg-bg-primary p-2">
          <div className="text-[11px] text-text-muted">IL — Tweak (32B)</div>
          <div
            data-value-animate
            className="font-code text-xs text-[#c4b5fd]"
          >
            {fmtHex(toHex(derivation.IL), 10)}
          </div>
        </div>
        <div className="rounded-lg border border-accent-primary/20 bg-bg-primary p-2">
          <div className="text-[11px] text-text-muted">
            IR — Child Chain Code (32B)
          </div>
          <div
            data-value-animate
            className="font-code text-xs text-accent-primary"
          >
            {fmtHex(toHex(derivation.IR), 10)}
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-lg border border-[#34d399]/20 bg-bg-primary p-2">
        <div className="text-[11px] text-text-muted">
          → Child Public Key (33B)
        </div>
        <div
          data-value-animate
          className="font-code text-xs text-[#34d399]"
        >
          {fmtHex(toHex(derivation.childPubKey), 16)}
        </div>
      </div>
    </div>
  );
}

export function AddressDerivationPipeline({
  address,
}: AddressDerivationPipelineProps) {
  return (
    <div className="space-y-0">
      {/* Stage 1: Account → Chain */}
      <DerivationStage
        label={`1. Ableitung: Account → Chain ${address.isChange ? "1" : "0"}`}
        derivation={address.chainDerivation}
        colorClass="text-accent-primary"
        borderClass="border-accent-primary/30"
        bgClass="bg-accent-primary/5"
      />

      {/* Arrow */}
      <div data-flow-animate className="flex justify-center py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border-active bg-bg-card text-text-muted">
          ↓
        </div>
      </div>

      {/* Stage 2: Chain → Address Index */}
      <DerivationStage
        label={`2. Ableitung: Chain → Index ${address.index}`}
        derivation={address.addressDerivation}
        colorClass="text-[#34d399]"
        borderClass="border-[#34d399]/30"
        bgClass="bg-[#34d399]/5"
      />
    </div>
  );
}
