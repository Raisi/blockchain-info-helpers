"use client";

const LEGEND_ITEMS = [
  { color: "#a78bfa", label: "Master Seed (Root)" },
  { color: "#f472b6", label: "BIP85 HMAC Transformation" },
  { color: "#f472b6", label: "Kind-Seed 0" },
  { color: "#34d399", label: "Kind-Seed 1" },
  { color: "#60a5fa", label: "Kind-Seed 2" },
  { color: "#fbbf24", label: "Kind-Seed 3" },
  { color: "#ff3366", label: "Einweg-Sperre (kein Rückschluss)" },
];

export default function TreeLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-border-subtle bg-bg-card/50 px-4 py-2.5">
      {LEGEND_ITEMS.map((l, i) => (
        <div key={i} className="flex items-center gap-1.5 font-code text-[10px] text-text-secondary">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: l.color }}
          />
          {l.label}
        </div>
      ))}
    </div>
  );
}
