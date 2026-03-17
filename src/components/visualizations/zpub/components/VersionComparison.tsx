"use client";

import { useState } from "react";
import { VERSION_BYTES } from "../crypto-utils";

export function VersionComparison() {
  const [selectedVersion, setSelectedVersion] = useState("zpub");

  return (
    <div className="mt-6">
      <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-text-muted">
        VERSION-BYTE VERGLEICH
      </div>
      <div className="mb-3 flex gap-1.5">
        {VERSION_BYTES.map((v) => (
          <button
            key={v.prefix}
            className={`flex-1 rounded-lg border px-3 py-2 font-code text-xs transition-all ${
              selectedVersion === v.prefix
                ? "border-[#fb7185] bg-[#fb7185]/12 text-[#fb7185]"
                : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-active"
            }`}
            onClick={() => setSelectedVersion(v.prefix)}
          >
            {v.prefix}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-border-subtle bg-bg-primary p-4">
        {VERSION_BYTES.map((v) => (
          <div
            key={v.prefix}
            className={`mb-2 last:mb-0 flex items-center gap-3 rounded-lg p-2.5 transition-all ${
              selectedVersion === v.prefix
                ? "border border-[#fb7185]/30 bg-[#fb7185]/5"
                : "opacity-40"
            }`}
          >
            <span className="w-12 font-code text-sm font-bold text-text-primary">
              {v.prefix}
            </span>
            <span className="font-code text-xs text-accent-primary">
              0x{v.versionHex}
            </span>
            <span className="flex-1 text-right text-xs text-text-secondary">
              {v.addressType}
            </span>
          </div>
        ))}
        <div className="mt-3 rounded-lg border border-border-subtle bg-bg-card-hover p-2.5 text-[11px] text-text-muted">
          Technisch identische Struktur — nur die 4 Version-Bytes unterscheiden
          sich. Das bestimmt downstream welcher Adresstyp generiert wird.
        </div>
      </div>
    </div>
  );
}
