"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

interface HexBreakdownProps {
  hex: string;
  label?: string;
  animate?: boolean;
}

export default function HexBreakdown({ hex, label, animate = true }: HexBreakdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevHexRef = useRef(hex);

  useEffect(() => {
    if (!animate || !containerRef.current || hex === prevHexRef.current) return;
    prevHexRef.current = hex;

    const chars = containerRef.current.querySelectorAll("[data-hex-char]");
    gsap.from(chars, {
      opacity: 0.3,
      y: -4,
      duration: 0.25,
      stagger: 0.008,
      ease: "power2.out",
    });
  }, [hex, animate]);

  const groups: string[] = [];
  for (let i = 0; i < hex.length; i += 8) {
    groups.push(hex.slice(i, i + 8));
  }

  return (
    <div>
      {label && (
        <p className="mb-2 font-code text-xs text-text-muted">{label}</p>
      )}
      <div
        ref={containerRef}
        className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-border-subtle bg-bg-primary/50 p-3 font-code text-sm"
      >
        {groups.map((group, gi) => (
          <span key={gi} className="inline-flex">
            {group.split("").map((char, ci) => (
              <span
                key={ci}
                data-hex-char
                className="text-accent-primary"
              >
                {char}
              </span>
            ))}
          </span>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-code text-xs text-text-muted">
        <span>64 Hex-Zeichen</span>
        <span>= 256 Bit</span>
      </div>
    </div>
  );
}
