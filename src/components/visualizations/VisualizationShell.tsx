"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import type { VisualizationShellProps } from "@/types";

export function VisualizationShell({
  title,
  description,
  topic,
  children,
}: VisualizationShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shellRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-shell-animate]", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, shellRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={shellRef}>
      <div className="mb-8" data-shell-animate>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-md bg-accent-primary/10 px-2.5 py-1 font-code text-xs font-medium text-accent-primary">
            {topic.toUpperCase()}
          </span>
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-text-primary sm:text-4xl">
          {title}
        </h1>
        <p className="text-lg text-text-secondary">{description}</p>
      </div>

      <div
        className="rounded-xl border border-border-subtle bg-bg-secondary/50 p-4 sm:p-6 lg:p-8"
        data-shell-animate
      >
        {children}
      </div>
    </div>
  );
}
