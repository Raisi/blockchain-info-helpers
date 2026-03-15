"use client";

export interface TooltipData {
  title: string;
  color: string;
  rows: { label: string; val: string }[];
}

interface TreeTooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number };
}

export default function TreeTooltip({ data, position }: TreeTooltipProps) {
  if (!data) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-xs rounded-lg border bg-bg-primary/95 px-3 py-2.5 shadow-lg backdrop-blur-sm"
      style={{
        left: Math.min(position.x + 14, window.innerWidth - 320),
        top: Math.min(position.y + 10, window.innerHeight - 200),
        borderColor: data.color,
      }}
    >
      <div
        className="mb-1 font-body text-xs font-bold"
        style={{ color: data.color }}
      >
        {data.title}
      </div>
      {data.rows.map((r, i) => (
        <div key={i} className="mt-0.5 flex gap-1.5">
          <span className="min-w-[90px] flex-shrink-0 font-code text-[10px] text-text-muted">
            {r.label}:
          </span>
          <span className="break-all font-code text-[10px] text-text-primary">
            {r.val}
          </span>
        </div>
      ))}
    </div>
  );
}
