"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { gsap } from "@/lib/gsap";
import { MINING_TABS } from "./constants";
import type { MiningTab } from "./types";
import BlockAnatomy from "./components/BlockAnatomy";
import NonceSearch from "./components/NonceSearch";
import DifficultyTarget from "./components/DifficultyTarget";
import MiningRace from "./components/MiningRace";
import DifficultyAdjustment from "./components/DifficultyAdjustment";

const MiningProcess3D = dynamic(
  () => import("./components/MiningProcess3D"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-xl border border-border-subtle bg-bg-card">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <p className="font-display text-sm text-text-secondary">3D-Szene wird geladen...</p>
        </div>
      </div>
    ),
  }
);

const TAB_COMPONENTS: Record<MiningTab, React.ComponentType> = {
  anatomy: BlockAnatomy,
  "nonce-search": NonceSearch,
  difficulty: DifficultyTarget,
  race: MiningRace,
  adjustment: DifficultyAdjustment,
  "3d-process": MiningProcess3D,
};

export default function MiningVisualizer() {
  const [activeTab, setActiveTab] = useState<MiningTab>("anatomy");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.4,
        ease: "power2.out",
      });
    }, contentRef);
    return () => ctx.revert();
  }, [activeTab]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-bg-primary/50 p-1">
        {MINING_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 font-display text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent-primary/15 text-accent-primary"
                : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <p className="text-sm leading-relaxed text-text-secondary">
        {MINING_TABS.find((t) => t.id === activeTab)?.description}
      </p>

      {/* Tab Content */}
      <div ref={contentRef} key={activeTab}>
        <ActiveComponent />
      </div>
    </div>
  );
}
