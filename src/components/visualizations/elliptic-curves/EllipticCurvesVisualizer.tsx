"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { EC_TABS } from "./constants";
import type { ECTab } from "./types";
import TheCurve from "./components/TheCurve";
import PointAddition from "./components/PointAddition";
import ScalarMultiplication from "./components/ScalarMultiplication";
import KeyGeneration from "./components/KeyGeneration";

const TAB_COMPONENTS: Record<ECTab, React.ComponentType> = {
  curve: TheCurve,
  addition: PointAddition,
  scalar: ScalarMultiplication,
  keygen: KeyGeneration,
};

export default function EllipticCurvesVisualizer() {
  const [activeTab, setActiveTab] = useState<ECTab>("curve");
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
        {EC_TABS.map((tab) => (
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
        {EC_TABS.find((t) => t.id === activeTab)?.description}
      </p>

      {/* Tab Content */}
      <div ref={contentRef} key={activeTab}>
        <ActiveComponent />
      </div>
    </div>
  );
}
