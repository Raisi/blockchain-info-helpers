"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { gsap } from "@/lib/gsap";
import {
  type Step,
  isValidPubkey,
  generateRandomPubkey,
  computeAddresses,
} from "./crypto-utils";
import { StepNav } from "./components/StepNav";
import { Step1PublicKey } from "./components/Step1PublicKey";
import { Step2Hash160 } from "./components/Step2Hash160";
import { Step3Encoding } from "./components/Step3Encoding";
import { Step4Addresses } from "./components/Step4Addresses";

export function AdressenVisualizer() {
  const searchParams = useSearchParams();
  const initialPubkey = searchParams.get("pubkey") ?? undefined;
  const [pubkeyHex, setPubkeyHex] = useState<string>("");
  const [pubkeyInput, setPubkeyInput] = useState<string>("");
  const [pubkeyValid, setPubkeyValid] = useState<boolean>(false);
  const [sha256Result, setSha256Result] = useState<Uint8Array | null>(null);
  const [hash160, setHash160] = useState<Uint8Array | null>(null);
  const [p2pkhAddress, setP2pkhAddress] = useState<string>("");
  const [p2wpkhAddress, setP2wpkhAddress] = useState<string>("");
  const [p2pkhChecksum, setP2pkhChecksum] = useState<Uint8Array | null>(null);
  const [activeStep, setActiveStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialise on mount
  useEffect(() => {
    const initial =
      initialPubkey && isValidPubkey(initialPubkey)
        ? initialPubkey
        : generateRandomPubkey();
    setPubkeyInput(initial);
    setPubkeyHex(initial);
    setPubkeyValid(true);
  }, [initialPubkey]);

  // Crypto pipeline whenever valid pubkey changes
  useEffect(() => {
    if (!pubkeyValid || !pubkeyHex) return;
    try {
      const result = computeAddresses(pubkeyHex);
      setSha256Result(result.sha256Result);
      setHash160(result.hash160);
      setP2pkhChecksum(result.p2pkhChecksum);
      setP2pkhAddress(result.p2pkhAddress);
      setP2wpkhAddress(result.p2wpkhAddress);
    } catch (e) {
      console.error("Address computation error:", e);
    }
  }, [pubkeyHex, pubkeyValid]);

  // Hero entrance animation on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-animate]", {
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Kill any in-flight step tween on unmount
  const stepTweenRef = useRef<ReturnType<typeof gsap.from> | null>(null);
  useEffect(() => () => { stepTweenRef.current?.kill(); }, []);

  const animateStepIn = useCallback(() => {
    if (!contentRef.current) return;
    stepTweenRef.current?.kill();
    stepTweenRef.current = gsap.from(contentRef.current, {
      opacity: 0,
      y: 15,
      duration: 0.4,
      ease: "power2.out",
    });
  }, []);

  function handleStepChange(step: Step) {
    setActiveStep(step);
    animateStepIn();
  }

  function handleInputChange(val: string) {
    setPubkeyInput(val);
    const normalised = val.trim().toLowerCase();
    const valid = isValidPubkey(normalised);
    setPubkeyValid(valid);
    if (valid) setPubkeyHex(normalised);
  }

  function handleRandomize() {
    const hex = generateRandomPubkey();
    setPubkeyInput(hex);
    setPubkeyHex(hex);
    setPubkeyValid(true);
  }

  function handleNext() {
    const nextStep = (activeStep + 1) as Step;
    setCompletedSteps((prev) => new Set([...prev, activeStep]));
    handleStepChange(nextStep);
  }

  function handlePrev() {
    handleStepChange((activeStep - 1) as Step);
  }

  function handleRestart() {
    handleRandomize();
    setCompletedSteps(new Set());
    handleStepChange(1);
  }

  const canProceed =
    activeStep === 1
      ? pubkeyValid
      : activeStep === 2
        ? !!hash160
        : activeStep === 3
          ? !!p2pkhAddress && !!p2wpkhAddress
          : false;

  return (
    <div ref={containerRef}>
      <StepNav
        activeStep={activeStep}
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
      />

      <div ref={contentRef}>
        {activeStep === 1 && (
          <Step1PublicKey
            pubkeyInput={pubkeyInput}
            pubkeyValid={pubkeyValid}
            onInputChange={handleInputChange}
            onRandomize={handleRandomize}
          />
        )}
        {activeStep === 2 && sha256Result && hash160 && (
          <Step2Hash160
            pubkeyHex={pubkeyHex}
            sha256Result={sha256Result}
            hash160={hash160}
          />
        )}
        {activeStep === 3 && hash160 && p2pkhChecksum && (
          <Step3Encoding
            hash160={hash160}
            p2pkhChecksum={p2pkhChecksum}
            p2pkhAddress={p2pkhAddress}
            p2wpkhAddress={p2wpkhAddress}
          />
        )}
        {activeStep === 4 && (
          <Step4Addresses
            p2pkhAddress={p2pkhAddress}
            p2wpkhAddress={p2wpkhAddress}
            onRestart={handleRestart}
          />
        )}
      </div>

      {activeStep < 4 && (
        <div data-hero-animate className="mt-6 flex items-center justify-between">
          {activeStep > 1 ? (
            <button
              className="flex items-center gap-2 rounded-lg border border-[var(--border-active)] bg-transparent px-4 py-2.5 font-mono text-sm text-[var(--text-secondary)] transition-[border-color,color] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              onClick={handlePrev}
            >
              ← Zurück
            </button>
          ) : (
            <div />
          )}
          <button
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-sm transition-[border-color,color] ${
              canProceed
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-white hover:bg-[var(--accent-primary)]/30"
                : "cursor-not-allowed border-[var(--border-subtle)] text-[var(--text-muted)] opacity-50"
            }`}
            onClick={canProceed ? handleNext : undefined}
            disabled={!canProceed}
          >
            Weiter →
          </button>
        </div>
      )}

      <div data-hero-animate className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-center font-mono text-[10px] leading-[1.8] text-[var(--text-muted)]">
        NUR FÜR LERNZWECKE — Alle Berechnungen laufen lokal im Browser
      </div>
    </div>
  );
}
