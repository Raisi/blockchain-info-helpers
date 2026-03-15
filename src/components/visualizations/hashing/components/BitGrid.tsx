"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

interface BitGridProps {
  binary: string;
  diffs?: boolean[];
  label?: string;
}

export default function BitGrid({ binary, diffs, label }: BitGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || !diffs) return;

    const changedCells = gridRef.current.querySelectorAll("[data-changed='true']");
    if (changedCells.length === 0) return;

    gsap.from(changedCells, {
      scale: 1.6,
      duration: 0.4,
      stagger: 0.002,
      ease: "elastic.out(1, 0.5)",
    });
  }, [diffs]);

  const bits = binary.slice(0, 256).split("");

  return (
    <div>
      {label && (
        <p className="mb-2 font-code text-xs text-text-muted">{label}</p>
      )}
      <div
        ref={gridRef}
        className="grid gap-[1px] rounded-lg border border-border-subtle bg-bg-primary/50 p-2"
        style={{ gridTemplateColumns: "repeat(16, 1fr)" }}
      >
        {bits.map((bit, i) => {
          const isChanged = diffs?.[i] ?? false;
          return (
            <div
              key={i}
              data-changed={isChanged}
              className={`flex aspect-square items-center justify-center rounded-sm font-code text-[8px] leading-none transition-colors sm:text-[9px] ${
                isChanged
                  ? "bg-accent-danger/30 text-accent-danger"
                  : bit === "1"
                    ? "bg-accent-primary/15 text-accent-primary/80"
                    : "bg-bg-secondary text-text-muted/50"
              }`}
            >
              {bit}
            </div>
          );
        })}
      </div>
    </div>
  );
}
