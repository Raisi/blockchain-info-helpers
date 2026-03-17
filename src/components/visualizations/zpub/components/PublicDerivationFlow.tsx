"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { childDerivePublic, toHex, fmtHex } from "../crypto-utils";
import { InfoCard } from "./InfoCard";
import type { PublicChildDerivation } from "../types";

interface PublicDerivationFlowProps {
  accountPubKey: Uint8Array;
  accountChainCode: Uint8Array;
}

export function PublicDerivationFlow({
  accountPubKey,
  accountChainCode,
}: PublicDerivationFlowProps) {
  const [derivation, setDerivation] = useState<PublicChildDerivation | null>(null);
  const [childIndex, setChildIndex] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    childDerivePublic(accountPubKey, accountChainCode, childIndex).then(
      setDerivation
    );
  }, [accountPubKey, accountChainCode, childIndex]);

  // Entrance animation — runs ONCE on first render with data
  useEffect(() => {
    if (!flowRef.current || !derivation || hasAnimated.current) return;
    hasAnimated.current = true;
    const ctx = gsap.context(() => {
      gsap.from("[data-flow-animate]", {
        y: 15,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
      });
    }, flowRef);
    return () => ctx.revert();
  }, [derivation]);

  // Value change animation — lightweight pulse on slider change
  useEffect(() => {
    if (!flowRef.current || !hasAnimated.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-value-animate]",
        { opacity: 0.4 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }, flowRef);
    return () => ctx.revert();
  }, [childIndex]);

  return (
    <div ref={flowRef}>
      <div data-flow-animate className="mb-4">
        <div className="mb-2 font-code text-[10px] font-bold uppercase tracking-[2px] text-text-muted">
          CHILD INDEX
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={19}
            value={childIndex}
            onChange={(e) => setChildIndex(Number(e.target.value))}
            className="flex-1 accent-accent-secondary"
          />
          <span className="w-8 text-center font-code text-sm font-bold text-accent-secondary">
            {childIndex}
          </span>
        </div>
      </div>

      {derivation && (
        <>
          {/* Input */}
          <div data-flow-animate className="rounded-xl border border-accent-primary/30 bg-bg-primary p-4">
            <div className="mb-1 font-code text-[10px] font-bold uppercase tracking-wider text-accent-primary">
              INPUT: Parent Public Key + Index
            </div>
            <div className="font-code text-xs text-text-secondary">
              HMAC-SHA512( key=chainCode, data=parentPubKey ∥ index )
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-bg-card p-2">
                <div className="text-[10px] text-text-muted">Parent Public Key (33B)</div>
                <div className="font-code text-[11px] text-accent-primary">
                  {fmtHex(toHex(derivation.parentPubKey), 14)}
                </div>
              </div>
              <div className="rounded-lg bg-bg-card p-2">
                <div className="text-[10px] text-text-muted">Index</div>
                <div data-value-animate className="font-code text-[11px] text-accent-secondary">
                  {derivation.index} (non-hardened)
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div data-flow-animate className="flex justify-center py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-active bg-bg-card text-text-muted">
              ↓
            </div>
          </div>

          {/* HMAC-SHA512 */}
          <div data-flow-animate className="rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 p-4">
            <div className="mb-1 font-code text-[10px] font-bold uppercase tracking-wider text-accent-secondary">
              HMAC-SHA512 OUTPUT (64 Bytes)
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-accent-secondary/20 bg-bg-primary p-2">
                <div className="text-[10px] text-text-muted">IL — Tweak (32B)</div>
                <div data-value-animate className="font-code text-[11px] text-[#c4b5fd]">
                  {fmtHex(toHex(derivation.IL), 14)}
                </div>
              </div>
              <div className="rounded-lg border border-accent-primary/20 bg-bg-primary p-2">
                <div className="text-[10px] text-text-muted">IR — Child Chain Code (32B)</div>
                <div data-value-animate className="font-code text-[11px] text-accent-primary">
                  {fmtHex(toHex(derivation.IR), 14)}
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div data-flow-animate className="flex justify-center py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-active bg-bg-card text-text-muted">
              ↓
            </div>
          </div>

          {/* Point Addition */}
          <div data-flow-animate className="rounded-xl border border-[#34d399]/30 bg-[#34d399]/5 p-4">
            <div className="mb-3 font-code text-[10px] font-bold uppercase tracking-wider text-[#34d399]">
              EC POINT ADDITION
            </div>

            {/* 3-row breakdown */}
            <div className="space-y-2">
              <div className="rounded-lg border border-[#c4b5fd]/20 bg-bg-primary p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded bg-[#c4b5fd]/10 px-2 py-0.5 font-code text-[10px] font-bold text-[#c4b5fd]">
                    point(IL)
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-text-muted">
                      IL-Skalar × Generator G → EC-Punkt
                    </div>
                    <div data-value-animate className="mt-1 font-code text-[11px] text-[#c4b5fd]">
                      {fmtHex(toHex(derivation.IL), 14)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-0.5 font-code text-xs font-bold text-[#34d399]">
                  +
                </div>
              </div>

              <div className="rounded-lg border border-accent-primary/20 bg-bg-primary p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded bg-accent-primary/10 px-2 py-0.5 font-code text-[10px] font-bold text-accent-primary">
                    parentPub
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-text-muted">
                      Parent Public Key — Punkt auf der Kurve
                    </div>
                    <div className="mt-1 font-code text-[11px] text-accent-primary">
                      {fmtHex(toHex(derivation.parentPubKey), 14)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-0.5 font-code text-xs font-bold text-[#34d399]">
                  =
                </div>
              </div>

              <div className="rounded-lg border border-[#34d399]/30 bg-bg-primary p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded bg-[#34d399]/10 px-2 py-0.5 font-code text-[10px] font-bold text-[#34d399]">
                    childPub
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-text-muted">
                      Child Public Key — komprimiert (33 Bytes)
                    </div>
                    <div data-value-animate className="mt-1 font-code text-[11px] text-[#34d399]">
                      {toHex(derivation.childPubKey)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border-subtle bg-bg-card p-3 text-xs leading-[1.7] text-text-secondary">
              EC Point Addition addiert zwei Punkte auf der elliptischen Kurve —
              geometrisch wird eine Linie durch beide Punkte gezogen und der
              Schnittpunkt mit der Kurve reflektiert. Eine mathematische
              Einweg-Operation, die den Child Public Key erzeugt,{" "}
              <strong className="text-white">ohne den Private Key zu benötigen</strong>.
            </div>
          </div>
        </>
      )}

      <div data-flow-animate>
        <InfoCard color="var(--accent-secondary)">
          <strong>Das ist der Kern:</strong> Der Child Public Key wird durch EC Point
          Addition berechnet — <em>ohne</em> den Private Key zu kennen. Der Chain Code
          sorgt dafür, dass die Ableitung deterministisch bleibt.
        </InfoCard>
      </div>
    </div>
  );
}
