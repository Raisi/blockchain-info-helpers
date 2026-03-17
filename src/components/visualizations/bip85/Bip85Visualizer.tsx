"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import { BIP85_STEPS, DEFAULT_MNEMONIC, WORDLIST_URL } from "./constants";
import WhyBip85 from "./components/WhyBip85";
import DerivationPipeline from "./components/DerivationPipeline";
import ChildExplorer from "./components/ChildExplorer";
import SecurityPractice from "./components/SecurityPractice";
import {
  mnemonicToSeed,
  seedToMaster,
} from "@/components/visualizations/bip-pipeline/crypto";
import type { MasterKey } from "@/components/visualizations/bip-pipeline/types";

/* ── StepNav ── */

function StepNav({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number;
  completedSteps: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="mb-8 flex items-center gap-0 overflow-x-auto">
      {BIP85_STEPS.map((s, i) => {
        const isActive = currentStep === s.id;
        const isDone = s.id <= completedSteps;
        return (
          <div key={s.id} className="flex items-center">
            <button
              className={`flex flex-shrink-0 items-center gap-3 rounded-xl border px-4 py-3 font-code text-sm transition-all ${
                isActive
                  ? "border-[#fb7185] bg-[#fb7185]/15 text-white"
                  : isDone
                    ? "border-accent-success/30 bg-bg-card text-text-secondary"
                    : "border-border-subtle bg-bg-card text-text-muted"
              } ${!isDone && !isActive ? "opacity-50" : "cursor-pointer"}`}
              onClick={() => {
                if (isDone || isActive) onStepClick(s.id);
              }}
            >
              <div
                className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-[#fb7185] text-white"
                    : isDone
                      ? "bg-accent-success text-black"
                      : "bg-border-active text-text-muted"
                }`}
              >
                {isDone && !isActive ? "✓" : s.id}
              </div>
              <span className="hidden whitespace-nowrap sm:inline">{s.title}</span>
            </button>
            {i < BIP85_STEPS.length - 1 && (
              <div
                className={`h-px w-6 flex-shrink-0 ${isDone ? "bg-accent-success" : "bg-border-subtle"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */

export default function Bip85Visualizer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps] = useState(4); // All steps navigable
  const [mnemonic, setMnemonic] = useState(DEFAULT_MNEMONIC);
  const [wordlist, setWordlist] = useState<string[]>([]);
  const [masterKey, setMasterKey] = useState<MasterKey | null>(null);
  const [seed, setSeed] = useState<Uint8Array | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute master key and seed from mnemonic
  const computeMaster = useCallback(async () => {
    if (!mnemonic.trim()) {
      setMasterKey(null);
      setSeed(null);
      return;
    }
    try {
      const s = await mnemonicToSeed(mnemonic);
      const mk = await seedToMaster(s);
      setSeed(s);
      setMasterKey(mk);
    } catch {
      setMasterKey(null);
      setSeed(null);
    }
  }, [mnemonic]);

  useEffect(() => {
    computeMaster();
  }, [computeMaster]);

  // Load wordlist
  useEffect(() => {
    fetch(WORDLIST_URL)
      .then((res) => res.text())
      .then((text) => {
        const words = text
          .split("\n")
          .map((w) => w.trim())
          .filter(Boolean);
        setWordlist(words);
      })
      .catch((e) => console.error("Failed to load wordlist:", e));
  }, []);

  // Step entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-bip85-animate]", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WhyBip85 />;
      case 2:
        return (
          <DerivationPipeline
            mnemonic={mnemonic}
            onMnemonicChange={setMnemonic}
            wordlist={wordlist}
          />
        );
      case 3:
        return <ChildExplorer mnemonic={mnemonic} wordlist={wordlist} masterKey={masterKey} seed={seed} />;
      case 4:
        return <SecurityPractice />;
      default:
        return null;
    }
  };

  return (
    <div>
      <StepNav
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      <div ref={containerRef} key={currentStep}>
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            className="flex items-center gap-2 rounded-lg border border-border-active bg-transparent px-4 py-2.5 font-code text-sm text-text-secondary transition-all hover:border-[#fb7185] hover:text-[#fb7185]"
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            ← Zurück
          </button>
        ) : (
          <div />
        )}
        {currentStep < 4 && (
          <button
            className="flex items-center gap-2 rounded-lg border border-[#fb7185] bg-[#fb7185]/15 px-4 py-2.5 font-code text-sm text-white transition-all hover:bg-[#fb7185]/30"
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            Weiter →
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 rounded-xl border border-border-subtle bg-bg-card p-3 text-center font-code text-[10px] leading-[1.8] text-text-muted">
        NUR FÜR LERNZWECKE — Niemals echte Mnemonics in Browser-Apps eingeben
      </div>
    </div>
  );
}
