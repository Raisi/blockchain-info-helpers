"use client";

import { useState, useEffect, useMemo } from "react";
import { sha256, hexToBinary } from "../crypto-utils";
import { DEFAULT_INPUT } from "../constants";
import HexBreakdown from "./HexBreakdown";

export default function LiveHashInput() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [hex, setHex] = useState("");

  const byteLength = useMemo(() => {
    return new TextEncoder().encode(input).length;
  }, [input]);

  useEffect(() => {
    sha256(input).then(setHex);
  }, [input]);

  const binary = hex ? hexToBinary(hex) : "";

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block font-display text-sm font-medium text-text-primary">
          Eingabe
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border-subtle bg-bg-primary/50 p-3 font-code text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30"
          placeholder="Text eingeben..."
        />
        <p className="mt-1 font-code text-xs text-text-muted">
          {byteLength} Bytes Eingabe
        </p>
      </div>

      <div className="flex items-center gap-2 text-text-muted">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="font-display text-xs font-medium uppercase tracking-wider">SHA-256</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>

      {hex && (
        <>
          <HexBreakdown hex={hex} label="SHA-256 Hash (Hexadezimal)" />

          <div className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
            <p className="mb-2 font-code text-xs text-text-muted">Binär (erste 64 Bit)</p>
            <p className="break-all font-code text-xs text-accent-secondary/80">
              {binary.slice(0, 64).replace(/(.{8})/g, "$1 ")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
