"use client";

import { ZPUB_STEPS } from "../constants";

interface StepNavProps {
  currentStep: number;
  completedSteps: number;
  onStepClick: (step: number) => void;
}

export function StepNav({ currentStep, completedSteps, onStepClick }: StepNavProps) {
  return (
    <div className="mb-8 flex items-center gap-0 overflow-x-auto">
      {ZPUB_STEPS.map((s, i) => {
        const isActive = currentStep === s.id;
        const isDone = s.id <= completedSteps;
        return (
          <div key={s.id} className="flex items-center">
            <button
              className={`flex flex-shrink-0 items-center gap-3 rounded-xl border px-4 py-3 font-code text-sm transition-all ${
                isActive
                  ? "border-accent-secondary bg-accent-secondary/15 text-white"
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
                    ? "bg-accent-secondary text-white"
                    : isDone
                      ? "bg-accent-success text-black"
                      : "bg-border-active text-text-muted"
                }`}
              >
                {isDone && !isActive ? "✓" : s.id}
              </div>
              <span className="hidden whitespace-nowrap sm:inline">{s.title}</span>
            </button>
            {i < ZPUB_STEPS.length - 1 && (
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
