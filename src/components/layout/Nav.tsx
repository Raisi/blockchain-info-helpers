"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { TOPICS, CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Topic, TopicCategory } from "@/types";

const ICON_EMOJI: Record<string, string> = {
  hash: "#",
  blocks: "⛓",
  key: "🔑",
  "git-branch": "🌿",
  shield: "🛡",
};

function getGroupedTopics() {
  const grouped = new Map<TopicCategory, Topic[]>();

  for (const topic of TOPICS) {
    const list = grouped.get(topic.category) ?? [];
    list.push(topic);
    grouped.set(topic.category, list);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  return grouped;
}

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setIsOpen(false), []);

  // Nav bar entrance animation
  useEffect(() => {
    if (!navRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
    }, navRef);
    return () => ctx.revert();
  }, []);

  // Close on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // GSAP overlay animation
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.fromTo(
        "[data-overlay-backdrop]",
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );

      tl.fromTo(
        "[data-overlay-item]",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "power3.out",
        },
        "-=0.15"
      );
    }, overlayRef);

    return () => ctx.revert();
  }, [isOpen]);

  const grouped = getGroupedTopics();
  const categoryOrder: TopicCategory[] = [
    "fundamentals",
    "keys",
    "transactions",
    "network",
    "advanced",
  ];

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 z-50 w-full border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent-primary"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <line x1="10" y1="6.5" x2="14" y2="6.5" />
                <line x1="6.5" y1="10" x2="6.5" y2="14" />
                <line x1="17.5" y1="10" x2="17.5" y2="14" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold text-text-primary">
              Blockchain<span className="text-accent-primary">Visualizer</span>
            </span>
          </Link>

          {/* Burger button — all breakpoints */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
            aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={isOpen}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Full-screen overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          {/* Backdrop */}
          <div
            data-overlay-backdrop
            className="absolute inset-0 bg-bg-primary/95 backdrop-blur-xl"
          />

          {/* Content */}
          <div className="relative flex h-full flex-col overflow-y-auto">
            {/* Header — mirrors nav bar layout */}
            <div className="mx-auto flex h-16 w-full max-w-7xl shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                onClick={close}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-accent-primary"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <line x1="10" y1="6.5" x2="14" y2="6.5" />
                    <line x1="6.5" y1="10" x2="6.5" y2="14" />
                    <line x1="17.5" y1="10" x2="17.5" y2="14" />
                  </svg>
                </div>
                <span className="font-display text-lg font-bold text-text-primary">
                  Blockchain
                  <span className="text-accent-primary">Visualizer</span>
                </span>
              </Link>

              {/* Close button */}
              <button
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
                aria-label="Menü schließen"
                autoFocus
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category-grouped links */}
            <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
              {categoryOrder
                .filter((cat) => grouped.has(cat))
                .map((cat) => (
                  <section key={cat} className="mb-8" data-overlay-item>
                    <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-text-muted">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {grouped.get(cat)!.map((topic) => {
                        const isActive = pathname === `/${topic.slug}`;
                        return (
                          <Link
                            key={topic.slug}
                            href={`/${topic.slug}`}
                            onClick={close}
                            data-overlay-item
                            className={cn(
                              "group flex items-center gap-4 rounded-lg border-l-2 px-4 py-3 transition-colors",
                              isActive
                                ? "border-accent-primary bg-accent-primary/10"
                                : "border-transparent hover:border-border-active hover:bg-bg-card"
                            )}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-card text-lg group-hover:bg-bg-card-hover">
                              {ICON_EMOJI[topic.icon] ?? "●"}
                            </span>
                            <div className="min-w-0">
                              <div
                                className={cn(
                                  "font-body text-sm font-semibold",
                                  isActive
                                    ? "text-accent-primary"
                                    : "text-text-primary"
                                )}
                              >
                                {topic.title}
                              </div>
                              <div className="truncate font-body text-xs text-text-muted">
                                {topic.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
