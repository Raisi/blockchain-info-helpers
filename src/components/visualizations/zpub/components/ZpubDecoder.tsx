"use client";

import { useState } from "react";
import { decodeZpub } from "../crypto-utils";
import { ByteFieldDisplay } from "./ByteFieldDisplay";
import type { SerializedKey } from "../types";

interface ZpubDecoderProps {
  onDecoded: (serialized: SerializedKey) => void;
}

export function ZpubDecoder({ onDecoded }: ZpubDecoderProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<SerializedKey | null>(null);

  const handleDecode = () => {
    setError(null);
    try {
      const result = decodeZpub(input.trim());
      setDecoded(result);
      onDecoded(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decode fehlgeschlagen");
      setDecoded(null);
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-text-muted">
        EIGENEN ZPUB DECODIEREN
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border-subtle bg-bg-primary px-4 py-2.5 font-code text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-primary"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="zpub6r..."
        />
        <button
          className="flex-shrink-0 rounded-lg border border-accent-primary bg-accent-primary/15 px-4 py-2.5 font-code text-sm text-accent-primary transition-all hover:bg-accent-primary/25"
          onClick={handleDecode}
        >
          Decode
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-accent-danger">{error}</div>
      )}
      {decoded && (
        <div className="mt-4">
          <ByteFieldDisplay serialized={decoded} />
        </div>
      )}
    </div>
  );
}
