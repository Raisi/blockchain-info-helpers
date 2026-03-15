"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import type { Block } from "../types";

interface TamperDetectorProps {
  chain: Block[];
  tamperedBlockIndex: number | null;
}

export default function TamperDetector({ chain, tamperedBlockIndex }: TamperDetectorProps) {
  const alertRef = useRef<HTMLDivElement>(null);

  const invalidBlocks = chain.filter((b) => !b.isValid);

  useEffect(() => {
    if (!alertRef.current || invalidBlocks.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(alertRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        ease: "power2.out",
      });
    }, alertRef);
    return () => ctx.revert();
  }, [invalidBlocks.length, tamperedBlockIndex]);

  if (invalidBlocks.length === 0) {
    return (
      <div className="rounded-lg border border-accent-success/20 bg-accent-success/5 p-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-success">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <span className="font-display text-xs font-semibold text-accent-success">
            Blockchain intakt — alle Hashes stimmen überein
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={alertRef} className="space-y-2 rounded-lg border border-accent-danger/30 bg-accent-danger/5 p-3">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-danger">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <span className="font-display text-xs font-semibold text-accent-danger">
          Manipulation erkannt!
        </span>
      </div>
      <p className="text-xs text-text-secondary">
        {tamperedBlockIndex !== null && (
          <>Block #{tamperedBlockIndex} wurde manipuliert. </>
        )}
        {invalidBlocks.length} Block{invalidBlocks.length > 1 ? "s" : ""} ungültig:{" "}
        {invalidBlocks.map((b) => `#${b.index}`).join(", ")}.
        Die Kette ist gebrochen — jeder nachfolgende Block hat einen falschen prev_hash.
      </p>
      <p className="font-code text-[10px] text-text-muted">
        Tipp: In einer echten Blockchain müssten alle betroffenen Blöcke neu gemint werden.
      </p>
    </div>
  );
}
