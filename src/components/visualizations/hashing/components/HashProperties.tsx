"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { HASH_PROPERTIES } from "../constants";
import type { HashProperty } from "../types";

const PROPERTY_ICONS: Record<HashProperty["icon"], React.ReactNode> = {
  fingerprint: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
      <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
    </svg>
  ),
  ruler: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
      <path d="m14.5 12.5 2-2" />
      <path d="m11.5 9.5 2-2" />
      <path d="m8.5 6.5 2-2" />
      <path d="m17.5 15.5 2-2" />
    </svg>
  ),
  lock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

const ACCENT_COLORS = [
  "accent-primary",
  "accent-secondary",
  "accent-warning",
  "accent-success",
];

export default function HashProperties() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-property-card]", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {HASH_PROPERTIES.map((prop, i) => {
        const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
        return (
          <div
            key={prop.id}
            data-property-card
            className="rounded-xl border border-border-subtle bg-bg-card p-5 transition-colors hover:border-border-active hover:bg-bg-card-hover"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-${accent}/10 text-${accent}`}>
              {PROPERTY_ICONS[prop.icon]}
            </div>
            <h3 className="mb-2 font-display text-base font-semibold text-text-primary">
              {prop.title}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {prop.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
