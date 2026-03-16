"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import {
  EC_TABS,
  INITIAL_COMPLETION,
  COMPLETION_CHECKS,
  TAB_ORDER,
  SCALAR_DEFAULT,
} from "./constants";
import type { ECTab, CurvePoint2D, CompletionState } from "./types";
import PipelineBar from "./components/PipelineBar";
import TheCurve from "./components/TheCurve";
import PointAddition from "./components/PointAddition";
import ScalarMultiplication from "./components/ScalarMultiplication";
import KeyGeneration from "./components/KeyGeneration";
import QuantumThreat from "./components/QuantumThreat";

export default function EllipticCurvesVisualizer() {
  const [activeTab, setActiveTab] = useState<ECTab>("curve");
  const contentRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  // Shared pipeline state
  const [placedPoints, setPlacedPoints] = useState<CurvePoint2D[]>([]);
  const [additionResultPoint, setAdditionResultPoint] =
    useState<CurvePoint2D | null>(null);
  const [scalar, setScalar] = useState<number>(SCALAR_DEFAULT);
  const [unlockedTabs, setUnlockedTabs] = useState<Set<string>>(
    new Set(["curve"])
  );
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());
  const [completion, setCompletion] =
    useState<CompletionState>(INITIAL_COMPLETION);
  const [hasSeenWorldSwitch, setHasSeenWorldSwitch] = useState(false);

  // Downstream change hints: track what upstream data each tab last saw
  const [lastSeenUpstream, setLastSeenUpstream] = useState<{
    addition: CurvePoint2D[] | null;
    scalar: CurvePoint2D | null;
    keygen: number | null;
    quantum: number | null;
  }>({
    addition: null,
    scalar: null,
    keygen: null,
    quantum: null,
  });

  // Completion effect: unlock next tab when criteria met
  useEffect(() => {
    for (let i = 0; i < TAB_ORDER.length - 1; i++) {
      const tabId = TAB_ORDER[i];
      const check = COMPLETION_CHECKS[tabId];
      if (check && check(completion) && !completedTabs.has(tabId)) {
        setCompletedTabs((prev) => new Set(prev).add(tabId));
        const nextTab = TAB_ORDER[i + 1];
        setUnlockedTabs((prev) => new Set(prev).add(nextTab));
      }
    }
  }, [completion, completedTabs]);

  // Tab switch animation
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

  // Snapshot upstream data when entering a tab
  useEffect(() => {
    if (activeTab === "addition") {
      setLastSeenUpstream((prev) => ({ ...prev, addition: [...placedPoints] }));
    } else if (activeTab === "scalar") {
      setLastSeenUpstream((prev) => ({
        ...prev,
        scalar: additionResultPoint,
      }));
    } else if (activeTab === "keygen") {
      setLastSeenUpstream((prev) => ({ ...prev, keygen: scalar }));
    } else if (activeTab === "quantum") {
      setLastSeenUpstream((prev) => ({ ...prev, quantum: scalar }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Check if upstream has changed since last visit
  const getUpstreamChanged = useCallback((): boolean => {
    if (activeTab === "addition" && lastSeenUpstream.addition !== null) {
      const prev = lastSeenUpstream.addition;
      return (
        prev.length !== placedPoints.length ||
        prev.some(
          (p, i) =>
            p.x !== placedPoints[i]?.x || p.y !== placedPoints[i]?.y
        )
      );
    }
    if (activeTab === "scalar" && lastSeenUpstream.scalar !== null) {
      return (
        lastSeenUpstream.scalar?.x !== additionResultPoint?.x ||
        lastSeenUpstream.scalar?.y !== additionResultPoint?.y
      );
    }
    if (activeTab === "keygen" && lastSeenUpstream.keygen !== null) {
      return lastSeenUpstream.keygen !== scalar;
    }
    if (activeTab === "quantum" && lastSeenUpstream.quantum !== null) {
      return lastSeenUpstream.quantum !== scalar;
    }
    return false;
  }, [activeTab, lastSeenUpstream, placedPoints, additionResultPoint, scalar]);

  const upstreamChanged = getUpstreamChanged();

  const handleUpdateUpstream = useCallback(() => {
    if (activeTab === "addition") {
      setLastSeenUpstream((prev) => ({ ...prev, addition: [...placedPoints] }));
    } else if (activeTab === "scalar") {
      setLastSeenUpstream((prev) => ({
        ...prev,
        scalar: additionResultPoint,
      }));
    } else if (activeTab === "keygen") {
      setLastSeenUpstream((prev) => ({ ...prev, keygen: scalar }));
    } else if (activeTab === "quantum") {
      setLastSeenUpstream((prev) => ({ ...prev, quantum: scalar }));
    }
  }, [activeTab, placedPoints, additionResultPoint, scalar]);

  // "Weiter" button logic
  const currentTabIndex = TAB_ORDER.indexOf(activeTab);
  const nextTab =
    currentTabIndex < TAB_ORDER.length - 1
      ? TAB_ORDER[currentTabIndex + 1]
      : null;
  const showNextButton = completedTabs.has(activeTab) && nextTab !== null;

  // Animate "Weiter" button entrance
  useEffect(() => {
    if (showNextButton && nextBtnRef.current) {
      gsap.from(nextBtnRef.current, {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [showNextButton]);

  const handleTabClick = useCallback(
    (tab: ECTab) => {
      if (unlockedTabs.has(tab)) setActiveTab(tab);
    },
    [unlockedTabs]
  );

  const nextButton = showNextButton && nextTab ? (
    <button
      ref={nextBtnRef}
      onClick={() => setActiveTab(nextTab)}
      className="w-full rounded-lg bg-accent-secondary/15 px-6 py-3 text-sm font-medium text-accent-secondary transition-colors hover:bg-accent-secondary/25"
    >
      Weiter → {EC_TABS.find((t) => t.id === nextTab)?.label}
    </button>
  ) : null;

  const renderActiveTab = () => {
    switch (activeTab) {
      case "curve":
        return (
          <TheCurve
            placedPoints={placedPoints}
            onPointsChange={(points) => {
              setPlacedPoints(points);
              setCompletion((prev) => ({
                ...prev,
                tab1: { pointsPlaced: points.length },
              }));
            }}
            footer={nextButton}
          />
        );
      case "addition":
        return (
          <PointAddition
            key={
              upstreamChanged
                ? undefined
                : `addition-${lastSeenUpstream.addition?.length}`
            }
            initialPoints={placedPoints}
            onResultChange={setAdditionResultPoint}
            onConstructionComplete={() =>
              setCompletion((prev) => ({
                ...prev,
                tab2: { ...prev.tab2, constructionCompleted: true },
              }))
            }
            footer={nextButton}
          />
        );
      case "scalar":
        return (
          <ScalarMultiplication
            basePoint={additionResultPoint ?? undefined}
            onScalarChange={(n) => {
              setScalar(n);
              setCompletion((prev) => ({
                ...prev,
                tab3: { ...prev.tab3, sliderMoved: true },
              }));
            }}
            footer={nextButton}
          />
        );
      case "keygen":
        return (
          <KeyGeneration
            scalar={scalar}
            showWorldSwitch={!hasSeenWorldSwitch}
            onWorldSwitchComplete={() => setHasSeenWorldSwitch(true)}
            onKeyGenerated={() =>
              setCompletion((prev) => ({
                ...prev,
                tab4: { keyGenerated: true },
              }))
            }
            footer={nextButton}
          />
        );
      case "quantum":
        return <QuantumThreat scalar={scalar} footer={nextButton} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Bar */}
      <PipelineBar
        activeTab={activeTab}
        unlockedTabs={unlockedTabs}
        completedTabs={completedTabs}
        onTabClick={handleTabClick}
      />

      {/* Tab Description */}
      <p className="text-sm leading-relaxed text-text-secondary">
        {EC_TABS.find((t) => t.id === activeTab)?.description}
      </p>

      {/* Upstream change hint */}
      {upstreamChanged && (
        <div className="rounded-lg border border-accent-warning/30 bg-accent-warning/5 px-4 py-2 text-sm text-accent-warning">
          Die Basisdaten haben sich ge&auml;ndert.{" "}
          <button
            onClick={handleUpdateUpstream}
            className="underline hover:no-underline"
          >
            Aktualisieren
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div ref={contentRef} key={activeTab}>
        {renderActiveTab()}
      </div>
    </div>
  );
}
