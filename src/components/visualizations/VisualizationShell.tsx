"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { TOPICS, CATEGORY_LABELS } from "@/lib/constants";
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

  const category = TOPICS.find((t) => t.slug === topic)?.category;
  const categoryTitle = category ? CATEGORY_LABELS[category]?.title : undefined;

  return (
    <div ref={shellRef}>
      <div className="mb-16 flex flex-col gap-5 pt-4 sm:pt-10 lg:mb-20" data-shell-animate>
        <Link
          href="/"
          className="group flex flex-wrap items-center gap-2.5 text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {categoryTitle && (
            <>
              <span>{categoryTitle}</span>
              <span className="text-border-active">/</span>
            </>
          )}
          <span className="font-code text-xs uppercase tracking-[0.12em] text-accent-primary">
            {topic}
          </span>
        </Link>
        <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-text-primary text-pretty sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="max-w-xl text-lg font-light leading-relaxed text-text-secondary text-pretty sm:text-xl">
          {description}
        </p>
      </div>

      <div data-shell-animate>{children}</div>
    </div>
  );
}
