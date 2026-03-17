"use client";

import { useState, useEffect } from "react";
import { deriveAddressFromZpub, toHex, fmtHex } from "../crypto-utils";
import type { DerivedAddress } from "../types";

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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    setComputing(true);
    const isChange = tab === "change";
    const promises = Array.from({ length: maxIndex }, (_, i) =>
      deriveAddressFromZpub(accountPubKey, accountChainCode, isChange, i)
    );
    Promise.all(promises).then((results) => {
      setAddresses(results);
      setComputing(false);
    });
  }, [accountPubKey, accountChainCode, tab, maxIndex]);

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
      <div className="space-y-1.5">
        {addresses.map((addr) => (
          <div key={`${addr.isChange}-${addr.index}`}>
            <button
              className="flex w-full items-center gap-3 rounded-lg border border-border-subtle bg-bg-primary p-3 text-left transition-all hover:border-border-active"
              onClick={() =>
                setExpandedIndex(
                  expandedIndex === addr.index ? null : addr.index
                )
              }
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-accent-primary/10 font-code text-[10px] font-bold text-accent-primary">
                {addr.index}
              </span>
              <span className="font-code text-[10px] text-text-muted">
                {addr.path}
              </span>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-code text-xs text-accent-primary">
                {addr.address}
              </span>
              <span className="text-xs text-text-muted">
                {expandedIndex === addr.index ? "▲" : "▼"}
              </span>
            </button>

            {expandedIndex === addr.index && (
              <div className="mt-1 mb-2 rounded-lg border border-border-active bg-bg-card p-3 space-y-2">
                <div>
                  <div className="text-[10px] text-text-muted">Child Public Key</div>
                  <div className="font-code text-[11px] text-[#34d399]">
                    {toHex(addr.childPubKey)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted">HASH160 (RIPEMD160(SHA256(pubkey)))</div>
                  <div className="font-code text-[11px] text-accent-secondary">
                    {toHex(addr.hash160)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted">Bech32 Address</div>
                  <div className="font-code text-[11px] text-accent-primary">
                    {addr.address}
                  </div>
                </div>
                <div className="rounded-lg bg-bg-primary p-2 text-[10px] text-text-muted">
                  zpub → Account PubKey + Chain Code → Child PubKey → HASH160 → Bech32 → bc1q...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
