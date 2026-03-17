"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { deriveAddressFromZpub, toHex } from "../crypto-utils";
import type { DerivedAddress } from "../types";
import { AddressDerivationPipeline } from "./AddressDerivationPipeline";
import { HashToBech32Pipeline } from "./HashToBech32Pipeline";

interface AddressExplorerProps {
  accountPubKey: Uint8Array;
  accountChainCode: Uint8Array;
}

export function AddressExplorer({
  accountPubKey,
  accountChainCode,
}: AddressExplorerProps) {
  const [tab, setTab] = useState<"receive" | "change">("receive");
  const [maxIndex, setMaxIndex] = useState(5);
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [computing, setComputing] = useState(false);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    setComputing(true);
    const isChange = tab === "change";
    const promises = Array.from({ length: maxIndex }, (_, i) =>
      deriveAddressFromZpub(accountPubKey, accountChainCode, isChange, i)
    );
    Promise.all(promises).then((results) => {
      setAddresses(results);
      setComputing(false);
      if (selectedIndex >= results.length) {
        setSelectedIndex(0);
      }
    });
  }, [accountPubKey, accountChainCode, tab, maxIndex]);

  // Entrance animation — once when pipeline first appears
  useEffect(() => {
    if (!pipelineRef.current || addresses.length === 0 || hasAnimated.current)
      return;
    hasAnimated.current = true;
    const ctx = gsap.context(() => {
      gsap.from("[data-flow-animate]", {
        y: 15,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
      });
    }, pipelineRef);
    return () => ctx.revert();
  }, [addresses]);

  // Value change animation when selected address changes
  useEffect(() => {
    if (!pipelineRef.current || !hasAnimated.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-value-animate]",
        { opacity: 0.4 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }, pipelineRef);
    return () => ctx.revert();
  }, [selectedIndex]);

  const selectedAddress = addresses[selectedIndex] ?? null;

  return (
    <div>
      {/* Tab Switch */}
      <div className="mb-4 flex gap-1.5">
        <button
          className={`flex-1 rounded-lg border px-3 py-2.5 font-code text-sm transition-all ${
            tab === "receive"
              ? "border-accent-success bg-accent-success/15 text-accent-success"
              : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-active"
          }`}
          onClick={() => setTab("receive")}
        >
          Empfangsadressen (0/i)
        </button>
        <button
          className={`flex-1 rounded-lg border px-3 py-2.5 font-code text-sm transition-all ${
            tab === "change"
              ? "border-accent-warning bg-accent-warning/15 text-accent-warning"
              : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-active"
          }`}
          onClick={() => setTab("change")}
        >
          Wechseladressen (1/i)
        </button>
      </div>

      {/* Index Slider */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs text-text-muted">Anzahl:</span>
        <input
          type="range"
          min={1}
          max={20}
          value={maxIndex}
          onChange={(e) => setMaxIndex(Number(e.target.value))}
          className="flex-1 accent-accent-success"
        />
        <span className="w-8 text-center font-code text-sm font-bold text-accent-success">
          {maxIndex}
        </span>
      </div>

      {computing && (
        <div className="mb-3 flex items-center gap-2 text-sm text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-active border-t-accent-success" />
          Leite Adressen ab...
        </div>
      )}

      {/* Address List */}
      <div className="mb-4 space-y-1.5">
        {addresses.map((addr) => {
          const isSelected = selectedIndex === addr.index;
          return (
            <button
              key={`${addr.isChange}-${addr.index}`}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? "border-accent-primary bg-accent-primary/10 shadow-[0_0_12px_rgba(34,211,238,0.1)]"
                  : "border-border-subtle bg-bg-primary hover:border-border-active"
              }`}
              onClick={() => setSelectedIndex(addr.index)}
            >
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded font-code text-[10px] font-bold ${
                  isSelected
                    ? "bg-accent-primary/20 text-accent-primary"
                    : "bg-accent-primary/10 text-accent-primary/60"
                }`}
              >
                {addr.index}
              </span>
              <span className="font-code text-[10px] text-text-muted">
                {addr.path}
              </span>
              <span
                className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-code text-xs ${
                  isSelected ? "text-accent-primary" : "text-text-secondary"
                }`}
              >
                {addr.address}
              </span>
              {isSelected && (
                <span className="rounded bg-accent-primary/15 px-1.5 py-0.5 font-code text-[9px] text-accent-primary">
                  selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pipeline for selected address */}
      {selectedAddress && (
        <div ref={pipelineRef} className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-card p-3">
            <span className="font-code text-[10px] text-text-muted">Startpunkt:</span>
            <span className="font-code text-[10px] font-bold text-[#34d399]">
              PubKey 0x{toHex(accountPubKey).slice(0, 10)}...
            </span>
            <span className="text-text-muted">+</span>
            <span className="font-code text-[10px] font-bold text-accent-primary">
              ChainCode 0x{toHex(accountChainCode).slice(0, 10)}...
            </span>
            <span className="font-code text-[10px] text-text-muted">(aus zpub)</span>
          </div>

          <div className="font-code text-[10px] font-bold uppercase tracking-[2px] text-text-muted">
            Ableitungspipeline für Index {selectedAddress.index} (
            {selectedAddress.path})
          </div>

          <AddressDerivationPipeline address={selectedAddress} />

          {/* Arrow between pipelines */}
          <div className="flex justify-center py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-active bg-bg-card text-text-muted">
              ↓
            </div>
          </div>

          <div className="font-code text-[10px] font-bold uppercase tracking-[2px] text-text-muted">
            PubKey → Adresse
          </div>

          <HashToBech32Pipeline
            childPubKey={selectedAddress.childPubKey}
            hash160={selectedAddress.hash160}
            address={selectedAddress.address}
          />
        </div>
      )}
    </div>
  );
}
