"use client";

import { toHex, fmtHex } from "../crypto-utils";
import { BYTE_FIELD_COLORS } from "../constants";
import type { SerializedKey } from "../types";

interface ByteFieldDisplayProps {
  serialized: SerializedKey;
}

export function ByteFieldDisplay({ serialized }: ByteFieldDisplayProps) {
  const fields = [
    {
      key: "version",
      bytes: serialized.version,
      offset: 0,
      size: 4,
      value: "0x" + toHex(serialized.version).toUpperCase(),
    },
    {
      key: "depth",
      bytes: new Uint8Array([serialized.depth]),
      offset: 4,
      size: 1,
      value: `0x${serialized.depth.toString(16).padStart(2, "0")} (${serialized.depth})`,
    },
    {
      key: "fingerprint",
      bytes: serialized.fingerprint,
      offset: 5,
      size: 4,
      value: toHex(serialized.fingerprint),
    },
    {
      key: "childIndex",
      bytes: (() => {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setUint32(0, serialized.childIndex, false);
        return b;
      })(),
      offset: 9,
      size: 4,
      value: `0x${serialized.childIndex.toString(16).padStart(8, "0")}`,
    },
    {
      key: "chainCode",
      bytes: serialized.chainCode,
      offset: 13,
      size: 32,
      value: fmtHex(toHex(serialized.chainCode), 16),
    },
    {
      key: "publicKey",
      bytes: serialized.publicKey,
      offset: 45,
      size: 33,
      value: fmtHex(toHex(serialized.publicKey), 16),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="mb-4 text-xs text-text-muted">
        78-Byte Rohdaten — farblich nach Feld markiert:
      </div>
      {fields.map((f) => {
        const style = BYTE_FIELD_COLORS[f.key];
        return (
          <div
            key={f.key}
            className={`flex items-start gap-3 rounded-lg border border-border-subtle p-3 ${style.bg}`}
          >
            <div className="w-[160px] flex-shrink-0">
              <div className={`font-code text-xs font-bold ${style.text}`}>
                {style.label}
              </div>
              <div className="mt-0.5 font-code text-[10px] text-text-muted">
                Offset: {f.offset} · {f.size} Bytes
              </div>
            </div>
            <div className={`flex-1 break-all font-code text-xs ${style.text}`}>
              {f.value}
            </div>
          </div>
        );
      })}

      {/* Checksum */}
      <div className="flex items-start gap-3 rounded-lg border border-accent-danger/30 bg-accent-danger/10 p-3">
        <div className="w-[160px] flex-shrink-0">
          <div className="font-code text-xs font-bold text-accent-danger">
            {BYTE_FIELD_COLORS.checksum.label}
          </div>
          <div className="mt-0.5 font-code text-[10px] text-text-muted">
            SHA256(SHA256(78B))[0:4]
          </div>
        </div>
        <div className="flex-1 break-all font-code text-xs text-accent-danger">
          {toHex(serialized.checksum)}
        </div>
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-active bg-bg-card-hover p-3">
        <span className="font-code text-xs font-bold text-text-primary">
          GESAMT: 82 Bytes
        </span>
        <span className="text-xs text-text-muted">
          (78 Rohdaten + 4 Checksum) → Base58Check
        </span>
      </div>
    </div>
  );
}
