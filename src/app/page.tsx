"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { TOPICS, CATEGORY_LABELS } from "@/lib/constants";
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
        stagger: 0.15,
        ease: "power3.out",
      });

      gsap.from("[data-animate]", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.4,
        ease: "power3.out",
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const categories = [...new Set(TOPICS.map((t) => t.category))];

  return (
    <PageShell>
      <div ref={heroRef}>
        {/* Hero Section */}
        <section className="pb-16 pt-12 text-center sm:pt-20">
          <div data-hero-animate>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-success animate-pulse" />
              <span className="font-code text-xs text-text-secondary">
                Interaktiv & Open Source
              </span>
            </div>
          </div>

          <h1
            className="mb-6 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
            data-hero-animate
          >
            Blockchain
            <br />
            <span className="text-gradient">Visualizer</span>
          </h1>

          <p
            className="mx-auto mb-10 max-w-2xl text-lg text-text-secondary sm:text-xl"
            data-hero-animate
          >
            Verstehe Blockchain-Technologie durch interaktive Visualisierungen.
            Von Seed Phrases bis zur Key Derivation — Schritt für Schritt
            erklärt.
          </p>
        </section>

        {/* Topics Grid */}
        {categories.map((category) => {
          const topicsInCategory = TOPICS.filter(
            (t) => t.category === category
          ).sort((a, b) => a.order - b.order);

          return (
            <section key={category} className="mb-12">
              <div className="mb-6 flex items-center gap-3" data-animate>
                <h2 className="font-display text-xl font-semibold text-text-primary">
                  {CATEGORY_LABELS[category] ?? category}
                </h2>
                <div className="h-px flex-1 bg-border-subtle" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topicsInCategory.map((topic) => (
                  <Card
                    key={topic.slug}
                    title={topic.title}
                    description={topic.description}
                    icon={topic.icon}
                    href={`/${topic.slug}`}
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
