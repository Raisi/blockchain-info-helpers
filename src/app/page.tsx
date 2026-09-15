"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { TOPICS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { PageShell } from "@/components/layout";
import { cn } from "@/lib/utils";
import type { Topic } from "@/types";

function TopicRow({ topic, index }: { topic: Topic; index: number }) {
  const available = topic.available === true;
  const number = String(index).padStart(2, "0");

  const content = (
    <>
      <span className="font-code text-xs text-text-muted lg:pt-2">{number}</span>
      <span
        className={cn(
          "font-display text-xl font-medium leading-tight tracking-tight text-pretty sm:text-2xl",
          available ? "text-text-primary" : "text-text-muted"
        )}
      >
        {topic.title}
      </span>
      <span
        className={cn(
          "col-start-2 text-sm font-light leading-relaxed text-pretty lg:col-start-auto lg:pt-1.5",
          available ? "text-text-secondary" : "text-text-muted/70"
        )}
      >
        {topic.description}
      </span>
      <span
        className={cn(
          "col-start-2 font-code text-[11px] uppercase tracking-[0.12em] lg:col-start-auto lg:pt-2 lg:text-right",
          available ? "text-accent-primary" : "text-text-muted/70"
        )}
      >
        {available ? "Öffnen" : "Bald"}
      </span>
    </>
  );

  const rowClass =
    "grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-border-subtle py-5 lg:grid-cols-[4rem_minmax(0,1fr)_22.5rem_5rem] lg:gap-x-8 lg:gap-y-0 lg:py-6";

  if (!available) {
    return (
      <div className={rowClass} data-animate>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/${topic.slug}`}
      className={cn(
        rowClass,
        "group transition-colors hover:border-accent-primary/40"
      )}
      data-animate
    >
      {content}
    </Link>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-animate]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.from("[data-animate]", {
        y: 16,
        opacity: 0,
        duration: 0.6,
        stagger: 0.04,
        delay: 0.4,
        ease: "power3.out",
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const availableCount = TOPICS.filter((t) => t.available).length;
  const totalCount = TOPICS.length;

  const sections = CATEGORY_ORDER.map((category) => ({
    category,
    topics: TOPICS.filter((t) => t.category === category).sort(
      (a, b) => a.order - b.order
    ),
  })).filter((s) => s.topics.length > 0);
  const offsets = sections.map((_, i) =>
    sections.slice(0, i).reduce((sum, s) => sum + s.topics.length, 0)
  );

  return (
    <PageShell>
      <div ref={heroRef}>
        {/* Hero */}
        <section className="grid gap-10 pb-24 pt-12 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end lg:gap-20 lg:pb-32">
          <h1
            data-hero-animate
            className="font-display text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl"
          >
            Bitcoin
            <br />
            verstehen,
            <br />
            <span className="text-accent-primary">Schritt für Schritt.</span>
          </h1>
          <div data-hero-animate className="flex flex-col gap-5">
            <p className="text-lg font-light leading-relaxed text-text-secondary text-pretty">
              {totalCount} interaktive Visualisierungen mit echter Kryptografie im
              Browser — {availableCount} davon heute verfügbar.
            </p>
            <p className="font-code text-xs uppercase tracking-[0.15em] text-accent-primary">
              Open Source · Läuft lokal
            </p>
          </div>
        </section>

        {/* Topics */}
        <div className="flex flex-col gap-20 pb-16 lg:gap-28">
          {sections.map(({ category, topics }, sectionIndex) => {
            const label = CATEGORY_LABELS[category];

            return (
              <section key={category} className="flex flex-col gap-6">
                <div
                  className="flex flex-wrap items-baseline gap-x-5 gap-y-1"
                  data-animate
                >
                  <h2 className="font-display text-sm font-bold uppercase tracking-[0.06em] text-text-primary">
                    {label?.title ?? category}
                  </h2>
                  {label?.subtitle && (
                    <p className="font-code text-xs text-text-muted">
                      {label.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  {topics.map((topic, i) => (
                    <TopicRow
                      key={topic.slug}
                      topic={topic}
                      index={offsets[sectionIndex] + i + 1}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
