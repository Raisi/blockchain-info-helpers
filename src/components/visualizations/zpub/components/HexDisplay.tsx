"use client";

import { toHex, splitHex } from "../crypto-utils";

interface HexDisplayProps {
  bytes: Uint8Array;
  colorClass?: string;
  chunkSize?: number;
}

export function HexDisplay({
  bytes,
  colorClass = "bg-accent-success/12 text-[#6ee7b7]",
  chunkSize = 8,
}: HexDisplayProps) {
  return (
    <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm leading-8">
      {splitHex(toHex(bytes), chunkSize).map((c, i) => (
        <span
          key={i}
          className={`mr-1.5 mb-1 inline-block rounded px-2 py-1 transition-all hover:brightness-[1.4] ${colorClass}`}
        >
          {c}
        </span>
      ))}
    </div>
  );
}
