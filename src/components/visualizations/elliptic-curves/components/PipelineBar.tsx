"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { EC_TABS } from "../constants";
import type { ECTab } from "../types";

const OPERATION_LABELS: Record<ECTab, string> = {
  curve: "y² = x³ + 7",
  addition: "P + Q = R",
  scalar: "n × G",
  keygen: "k → K",
  quantum: "K → k ?",
};

interface PipelineBarProps {
  activeTab: ECTab;
  unlockedTabs: Set<string>;
  completedTabs: Set<string>;
  onTabClick: (tab: ECTab) => void;
}

export default function PipelineBar({
  activeTab,
  unlockedTabs,
  completedTabs,
  onTabClick,
}: PipelineBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prevUnlockedRef = useRef<Set<string>>(new Set(unlockedTabs));

  // Scroll active tab into view on mobile
  useEffect(() => {
    const activeCard = cardRefs.current.get(activeTab);
    activeCard?.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [activeTab]);

  // GSAP unlock animation: pulse-glow on newly unlocked card
  useEffect(() => {
    const prev = prevUnlockedRef.current;
    for (const tabId of unlockedTabs) {
      if (!prev.has(tabId)) {
        const card = cardRefs.current.get(tabId);
        if (card) {
          gsap.fromTo(
            card,
            { boxShadow: "0 0 0px rgba(139,92,246,0)" },
            {
              boxShadow: "0 0 20px rgba(139,92,246,0.4)",
              scale: 1.04,
              duration: 0.4,
              ease: "power2.out",
              yoyo: true,
              repeat: 1,
            }
          );
        }
      }
    }
    prevUnlockedRef.current = new Set(unlockedTabs);
  }, [unlockedTabs]);

  return (
    <div
      ref={barRef}
      className="flex overflow-x-auto rounded-xl border border-border-subtle bg-bg-primary/50 scrollbar-none"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {EC_TABS.map((tab, i) => {
        const isActive = activeTab === tab.id;
        const isCompleted = completedTabs.has(tab.id);
        const isUnlocked = unlockedTabs.has(tab.id);
        const isLocked = !isUnlocked;

        let cardClass =
          "flex min-w-[120px] flex-1 flex-col items-center gap-1 border-r px-4 py-3 text-center transition-all";
        cardClass += " scroll-snap-align-center";

        // First/last card rounding
        if (i === 0) cardClass += " rounded-l-xl";
        if (i === EC_TABS.length - 1) {
          cardClass += " rounded-r-xl border-r-0";
        }

        if (isActive) {
          cardClass +=
            " bg-[rgba(139,92,246,0.15)] border-r-accent-secondary/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]";
        } else if (isCompleted) {
          cardClass +=
            " bg-[rgba(34,211,238,0.08)] border-r-accent-primary/20 cursor-pointer hover:bg-[rgba(34,211,238,0.12)]";
        } else if (isLocked) {
          cardClass +=
            " bg-[#111827] border-r-[#1e293b] opacity-50 cursor-not-allowed";
        } else {
          // Unlocked but not active/completed
          cardClass +=
            " bg-bg-card border-r-border-subtle cursor-pointer hover:bg-bg-card-hover";
        }

        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) cardRefs.current.set(tab.id, el);
            }}
            onClick={() => {
              if (!isLocked) onTabClick(tab.id);
            }}
            disabled={isLocked}
            className={cardClass}
            style={{ scrollSnapAlign: "center" }}
          >
            {/* Step indicator */}
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
              {isCompleted ? (
                <span className="text-accent-primary">✓</span>
              ) : isLocked ? (
                <span className="text-text-muted">🔒</span>
              ) : (
                <span
                  className={
                    isActive ? "text-accent-secondary" : "text-text-secondary"
                  }
                >
                  {i + 1}
                </span>
              )}
            </span>

            {/* Label */}
            <span
              className={`font-display text-xs font-medium ${
                isActive
                  ? "text-accent-secondary"
                  : isCompleted
                    ? "text-accent-primary"
                    : isLocked
                      ? "text-text-muted"
                      : "text-text-primary"
              }`}
            >
              {tab.label}
            </span>

            {/* Math operation */}
            <span
              className={`font-mono text-[10px] ${
                isActive
                  ? "text-accent-secondary/70"
                  : isCompleted
                    ? "text-accent-primary/60"
                    : "text-text-muted"
              }`}
            >
              {OPERATION_LABELS[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
