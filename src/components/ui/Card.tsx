"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  className?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  key: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  "git-branch": (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  shield: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  hash: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  blocks: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="6" height="6" rx="1" />
      <rect x="9" y="4" width="6" height="6" rx="1" />
      <rect x="16" y="4" width="6" height="6" rx="1" />
      <path d="M8 7h1" />
      <path d="M15 7h1" />
      <rect x="5.5" y="14" width="6" height="6" rx="1" />
      <rect x="12.5" y="14" width="6" height="6" rx="1" />
      <path d="M11.5 17h1" />
    </svg>
  ),
};

export function Card({ title, description, icon, href, className }: CardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      boxShadow: "var(--glow-primary)",
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      boxShadow: "none",
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <Link
      ref={cardRef}
      href={href}
      className={cn(
        "group block rounded-xl border border-border-subtle bg-bg-card p-6 transition-colors hover:border-border-active hover:bg-bg-card-hover",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-animate
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
        {ICONS[icon] ?? ICONS.hash}
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-primary opacity-0 transition-opacity group-hover:opacity-100">
        Erkunden
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
