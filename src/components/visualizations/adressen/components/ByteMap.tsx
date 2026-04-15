export interface ByteMapSegment {
  label: string;
  hex: string;
  colorBg: string;
  colorText: string;
  chipLabel: string;
}

export function ByteMap({ segments }: { segments: ByteMapSegment[] }) {
  return (
    <div className="space-y-3">
      {/* Hex row */}
      <div className="flex flex-wrap items-center gap-0 overflow-hidden rounded-lg border border-[var(--border-subtle)]">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={`${seg.colorBg} ${seg.colorText} break-all px-1.5 py-1 font-mono text-[11px] leading-[1.6]`}
          >
            {seg.hex}
          </span>
        ))}
      </div>
      {/* Chip labels */}
      <div className="flex flex-wrap gap-2">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ${seg.colorBg} ${seg.colorText}`}
          >
            <span className="font-mono">{seg.label}</span>
            <span className="opacity-70">{seg.chipLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
