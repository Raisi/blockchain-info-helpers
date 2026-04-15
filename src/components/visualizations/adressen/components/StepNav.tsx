import type { Step } from "../crypto-utils";

export const STEPS = [
  { id: 1 as Step, title: "Public Key", short: "Key" },
  { id: 2 as Step, title: "Hash160", short: "Hash" },
  { id: 3 as Step, title: "Encoding", short: "Enc." },
  { id: 4 as Step, title: "Adressen", short: "Addr." },
] as const;

interface StepNavProps {
  activeStep: Step;
  completedSteps: Set<Step>;
  onStepChange: (step: Step) => void;
}

export function StepNav({ activeStep, completedSteps, onStepChange }: StepNavProps) {
  return (
    <div data-hero-animate className="mb-8 flex items-center gap-0 overflow-x-auto">
      {STEPS.map((s, i) => {
        const isActive = activeStep === s.id;
        const isDone = completedSteps.has(s.id);
        return (
          <div key={s.id} className="flex items-center">
            <button
              className={`flex flex-shrink-0 items-center gap-3 rounded-xl border px-4 py-3 font-mono text-sm transition-[border-color,color] ${
                isActive
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-white"
                  : isDone
                    ? "border-[var(--accent-success)]/30 bg-[var(--bg-card)] text-[var(--text-secondary)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)]"
              } ${!isDone && !isActive ? "opacity-50" : "cursor-pointer"}`}
              onClick={() => {
                if (isDone || isActive) onStepChange(s.id);
              }}
            >
              <div
                className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                    : isDone
                      ? "bg-[var(--accent-success)] text-black"
                      : "bg-[var(--border-active)] text-[var(--text-muted)]"
                }`}
              >
                {isDone && !isActive ? "✓" : s.id}
              </div>
              <span className="hidden whitespace-nowrap sm:inline">{s.title}</span>
              <span className="whitespace-nowrap sm:hidden">{s.short}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-6 flex-shrink-0 ${isDone ? "bg-[var(--accent-success)]" : "bg-[var(--border-subtle)]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
