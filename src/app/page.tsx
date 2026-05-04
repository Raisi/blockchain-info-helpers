"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { TOPICS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { Card } from "@/components/ui";
import { PageShell } from "@/components/layout";

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
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        delay: 0.5,
        ease: "power3.out",
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const availableCount = TOPICS.filter((t) => t.available).length;
  const totalCount = TOPICS.length;

  return (
    <PageShell>
      <div ref={heroRef}>
        {/* Hero — left-aligned */}
        <section className="pb-20 pt-12 sm:pt-20">
          <div data-hero-animate className="mb-5 flex items-center gap-3">
            <span className="h-px w-6 bg-accent-primary" />
            <span className="font-code text-xs uppercase tracking-[0.15em] text-accent-primary">
              Open Source · Interaktiv
            </span>
          </div>

          <h1
            data-hero-animate
            className="mb-5 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Blockchain
            <br />
            <span className="text-accent-primary">Visualizer</span>
          </h1>

          <p
            data-hero-animate
            className="mb-10 max-w-lg text-base leading-relaxed text-text-secondary sm:text-lg"
          >
            Verstehe die Technologie hinter Bitcoin — von Hashing bis zur
            Schlüsselableitung — durch interaktive Schritt-für-Schritt-Visualisierungen.
          </p>

          <div
            data-hero-animate
            className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-muted"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold tabular-nums text-text-primary">
                {availableCount}
              </span>
              <span>verfügbar</span>
            </div>
            <div className="hidden h-3 w-px bg-border-subtle sm:block" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold tabular-nums text-text-primary">
                {totalCount}
              </span>
              <span>geplant</span>
            </div>
            <div className="hidden h-3 w-px bg-border-subtle sm:block" />
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-success" />
              </span>
              <span>Läuft vollständig lokal</span>
            </div>
          </div>
        </section>

        {/* Topics */}
        {CATEGORY_ORDER.map((category) => {
          const topicsInCategory = TOPICS.filter(
            (t) => t.category === category
          ).sort((a, b) => a.order - b.order);

          if (topicsInCategory.length === 0) return null;

          const label = CATEGORY_LABELS[category];

          return (
            <section key={category} className="mb-14">
              <div className="mb-6" data-animate>
                {label?.subtitle && (
                  <p className="mb-1 font-code text-[10px] uppercase tracking-[0.15em] text-accent-primary/70">
                    {label.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-2xl font-bold text-text-primary">
                    {label?.title ?? category}
                  </h2>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topicsInCategory.map((topic) => (
                  <Card
                    key={topic.slug}
                    title={topic.title}
                    description={topic.description}
                    icon={topic.icon}
                    href={`/${topic.slug}`}
                    available={topic.available === true}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
