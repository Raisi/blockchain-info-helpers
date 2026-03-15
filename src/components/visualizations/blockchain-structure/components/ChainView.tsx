"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import type { Block } from "../types";
import BlockCard from "./BlockCard";

interface ChainViewProps {
  chain: Block[];
  onTamperTransaction: (blockIndex: number, txIndex: number, newAmount: string) => void;
}

export default function ChainView({ chain, onTamperTransaction }: ChainViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const arrowsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [chain.length]);

  useEffect(() => {
    if (!arrowsRef.current) return;
    const ctx = gsap.context(() => {
      const arrows = arrowsRef.current?.querySelectorAll("[data-chain-arrow]");
      if (!arrows) return;
      gsap.from(arrows, {
        opacity: 0,
        scaleX: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, arrowsRef);
    return () => ctx.revert();
  }, [chain.length]);

  return (
    <div ref={arrowsRef}>
      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto pb-4"
      >
        {chain.map((block, i) => (
          <div key={block.index} className="flex items-center">
            {i > 0 && (
              <div data-chain-arrow className="flex shrink-0 flex-col items-center px-2">
                <svg width="40" height="24" viewBox="0 0 40 24" className="text-text-muted">
                  <line x1="0" y1="12" x2="30" y2="12" stroke="currentColor" strokeWidth="2" />
                  <polygon points="30,6 40,12 30,18" fill="currentColor" />
                </svg>
                <span className="mt-0.5 font-code text-[8px] text-text-muted">prev_hash</span>
              </div>
            )}
            <BlockCard
              block={block}
              onTamperTransaction={onTamperTransaction}
              isLatest={i === chain.length - 1 && chain.length > 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
