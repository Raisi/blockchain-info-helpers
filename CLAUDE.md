# CLAUDE.md — Blockchain Knowledge Hub

## Projektübersicht

Eine interaktive Wissens-Website zu Blockchain-Themen, aufgebaut aus bestehenden Claude-Artefakten (HTML, JSX, TSX). Die Artefakte werden als Content-Pool verwendet, funktional in die App eingebettet und optisch vereinheitlicht.

---

## Tech Stack

| Kategorie       | Technologie                        |
| --------------- | ---------------------------------- |
| Framework       | Next.js 14+ (App Router)           |
| Styling         | Tailwind CSS 3.4+                  |
| Animation       | GSAP 3.12+ (mit ScrollTrigger)     |
| Sprache         | TypeScript (strikt)                |
| DB (optional)   | Prisma + SQLite (lokal) / Postgres |
| Linting         | ESLint + Prettier                  |
| Package Manager | pnpm                               |

---

## Projektstruktur

```
/
├── CLAUDE.md                        ← Diese Datei (Projekt-Instruktionen)
├── generated_artifacts/             ← Pool: Original-Artefakte aus Claude (READ-ONLY Referenz)
│   ├── *.html
│   ├── *.jsx
│   └── *.tsx
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← Root Layout mit globalem Theme, Nav, Footer
│   │   ├── page.tsx                 ← Landing Page / Hub-Übersicht
│   │   ├── globals.css              ← Tailwind Directives + CSS Custom Properties
│   │   └── [topic]/
│   │       └── page.tsx             ← Dynamische Themenseiten (z.B. /bip39, /hashing)
│   ├── components/
│   │   ├── ui/                      ← Wiederverwendbare UI-Primitives (Button, Card, etc.)
│   │   ├── layout/                  ← Nav, Footer, Sidebar, PageShell
│   │   ├── visualizations/          ← Eingebettete & vereinheitlichte Artefakte
│   │   │   ├── Bip39Visualizer.tsx
│   │   │   ├── HashingDemo.tsx
│   │   │   └── ...
│   │   └── interactive/             ← Interaktive Lernelemente (Quiz, Stepper, Explorer)
│   ├── lib/
│   │   ├── gsap.ts                  ← GSAP-Registrierung (ScrollTrigger, etc.)
│   │   ├── utils.ts                 ← Hilfsfunktionen (cn, formatters, etc.)
│   │   └── constants.ts             ← Theme-Tokens, Topic-Registry, Metadata
│   ├── hooks/
│   │   └── useGsapAnimation.ts      ← Wiederverwendbare GSAP-Hooks
│   ├── styles/
│   │   └── theme.ts                 ← Design-Tokens als JS-Objekt (Farben, Spacing, etc.)
│   └── types/
│       └── index.ts                 ← Globale TypeScript-Typen
├── prisma/                          ← Nur wenn DB benötigt wird
│   └── schema.prisma
├── public/
│   └── assets/                      ← Statische Bilder, Icons, OG-Images
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Design-System & Vereinheitlichung

### Ästhetische Richtung

**Konzept: "Crypto Terminal meets Editorial Design"**
- Dunkles Farbschema mit leuchtenden Akzenten (Cyber-Mint, Electric Blue)
- Monospace-Akzente für Crypto/Code-Elemente, elegante Serif/Sans für Lesetexte
- Subtile Raster/Grid-Texturen im Hintergrund (Matrix/Node-Netz-Ästhetik)
- Großzügiger Whitespace, klare Informationshierarchie

### CSS Custom Properties (in `globals.css`)

```css
:root {
  /* Basis */
  --bg-primary: #0a0e17;
  --bg-secondary: #111827;
  --bg-card: #1a1f2e;
  --bg-card-hover: #242a3d;

  /* Text */
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Akzente */
  --accent-primary: #22d3ee;      /* Cyan/Mint */
  --accent-secondary: #8b5cf6;    /* Violett */
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;

  /* Borders & Surfaces */
  --border-subtle: #1e293b;
  --border-active: #334155;
  --glow-primary: 0 0 20px rgba(34, 211, 238, 0.15);

  /* Spacing-Skala (für Konsistenz) */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;

  /* Radii */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

### Typografie

```
Display / Headings:  "JetBrains Mono" oder "Space Mono" (Monospace mit Charakter)
Body / Lesetext:     "Outfit" oder "Satoshi" (Clean Sans-Serif)
Code / Crypto-Daten: "Fira Code" (mit Ligaturen)
```

Lade Fonts via `next/font/google` oder `next/font/local`.

### Komponenten-Konventionen

- Jede Visualization-Komponente hat ein einheitliches Wrapper-Pattern:
  ```tsx
  <VisualizationShell
    title="BIP-39 Seed Generation"
    description="Interaktive Visualisierung der Seed-Phrase-Erzeugung"
    topic="bip39"
  >
    <Bip39Visualizer />
  </VisualizationShell>
  ```
- Cards nutzen `bg-card` + `border-subtle` + Hover-Glow-Effekt
- Alle interaktiven Elemente haben GSAP-Mikroanimationen (hover, enter, click)

---

## Artefakt-Einbettungsprozess

### Schritt-für-Schritt für jedes Artefakt aus `generated_artifacts/`

1. **Analysiere** das Artefakt: Was macht es? Welche Dependencies hat es?
2. **Extrahiere** die Kernlogik (State, Berechnungen, Interaktionen)
3. **Konvertiere** nach TypeScript React-Komponente (falls HTML/JSX)
4. **Vereinheitliche** das Styling:
    - Entferne Inline-Styles und eigene CSS-Variablen
    - Ersetze durch Tailwind-Klassen + Projekt-CSS-Custom-Properties
    - Passe Farben, Fonts, Spacing an das Design-System an
5. **Integriere** GSAP-Animationen:
    - Eingangsanimationen (staggered reveal)
    - ScrollTrigger für lange Visualisierungen
    - Hover-Mikrointeraktionen auf interaktiven Elementen
6. **Platziere** die Komponente in `src/components/visualizations/`
7. **Erstelle** eine Themenseite in `src/app/[topic]/page.tsx`

### Wichtige Regeln bei der Konvertierung

- **Funktionalität bewahren**: Die Kernlogik des Artefakts darf NICHT verändert werden
- **Web Crypto API**: Kryptografische Operationen bleiben client-seitig (`"use client"`)
- **State-Management**: React useState/useReducer, KEIN externes State-Management
- **Responsivität**: Alle Visualisierungen müssen mobile-first responsive sein
- **Accessibility**: Semantisches HTML, ARIA-Labels, Keyboard-Navigation
- **Performance**: Schwere Berechnungen in Web Workers auslagern wenn nötig

---

## GSAP-Richtlinien

### Setup (`src/lib/gsap.ts`)

```typescript
"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
```

### Animationsmuster

```typescript
// Standard Page-Enter Animation
gsap.from("[data-animate]", {
  y: 30,
  opacity: 0,
  duration: 0.8,
  stagger: 0.1,
  ease: "power3.out",
});

// Card Hover Glow
gsap.to(cardRef, {
  boxShadow: "var(--glow-primary)",
  scale: 1.02,
  duration: 0.3,
  ease: "power2.out",
});

// ScrollTrigger für Sections
ScrollTrigger.create({
  trigger: sectionRef,
  start: "top 80%",
  onEnter: () => gsap.to(sectionRef, { opacity: 1, y: 0 }),
});
```

### Regeln

- Alle Animationen in `useEffect` oder `useLayoutEffect` mit Cleanup
- `gsap.context()` verwenden für Scope-Cleanup
- Keine Animation ohne `useRef` — niemals DOM-Queries direkt
- ScrollTrigger: Immer `ScrollTrigger.refresh()` nach dynamischem Content
- Dauer: Mikrointeraktionen 0.2–0.4s, Eingangsanimationen 0.6–1.0s
- Easing: `power3.out` als Standard, `elastic.out` für spielerische Elemente

---

## Navigation & Seitenstruktur

### Topic-Registry (`src/lib/constants.ts`)

```typescript
export const TOPICS = [
  {
    slug: "hashing",
    title: "Hashing & SHA-256",
    description: "Von Daten zum Fingerprint",
    icon: "hash",
    category: "fundamentals",
    order: 1,
  },
  {
    slug: "bip39",
    title: "BIP-39 Seed Phrases",
    description: "Wie aus Zufall Wörter werden",
    icon: "key",
    category: "keys",
    order: 2,
  },
  // ... weitere Topics
] as const satisfies Topic[];
```

### Kategorien

- `fundamentals` — Hashing, Kryptografie-Basics, Blockchain-Struktur
- `keys` — BIP-32, BIP-39, BIP-44, BIP-85, Key Derivation
- `transactions` — TX-Aufbau, Signing, UTXO
- `network` — Nodes, Mining, Consensus
- `advanced` — Lightning, Taproot, Schnorr

---

## Code-Qualität

### TypeScript

- Strenger Modus (`strict: true`)
- Keine `any`-Types — immer explizite Typen oder `unknown` + Type Guards
- Interfaces für Props, Zod für Runtime-Validierung wenn nötig

### Komponenten-Pattern

```typescript
"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

interface Props {
  // Explizite Props-Definition
}

export default function ComponentName({ ...props }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animationen hier
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      {/* Content */}
    </div>
  );
}
```

### Imports

- Absolute Imports via `@/` Path-Alias
- Barrel-Exports (`index.ts`) nur für `ui/` und `layout/`
- Keine zirkulären Abhängigkeiten

---

## Prisma (optional — nur wenn benötigt)

Potenzielle Einsatzgebiete:
- Lernfortschritt pro Topic speichern
- Quiz-Ergebnisse tracken
- Bookmark/Favoriten-System

Erst einbauen, wenn konkret benötigt. Nicht vorzeitig.

---

## Workflow-Regeln für Claude Code

1. **Vor jeder Arbeit**: Lies diese CLAUDE/e.md komplett
2. **Ein Artefakt pro Durchgang**: Nicht mehrere gleichzeitig konvertieren
3. **Immer testen**: Nach jeder Konvertierung `pnpm dev` und visuell prüfen
4. **Design-System-Treue**: Keine eigenen Farben/Fonts erfinden — nur die definierten Tokens verwenden
5. **Git-Commits**: Atomar, eine logische Änderung pro Commit
    - Format: `feat(topic): add BIP-39 visualizer component`
    - Format: `style(ui): unify card hover effects`
    - Format: `refactor(viz): convert hashing demo to TypeScript`
6. **Keine Breaking Changes**: Bestehende Seiten müssen nach jeder Änderung funktionieren
7. **Dokumentation**: JSDoc-Kommentare für komplexe Funktionen und Hooks

---

## Befehle

```bash
pnpm dev          # Entwicklungsserver starten
pnpm build        # Production Build
pnpm lint         # ESLint prüfen
pnpm type-check   # TypeScript prüfen (tsc --noEmit)
```

---

## Fachliche Referenzen

Für Referenzen zu Bitcoin-Algorithmen, -Technologien oder BIP-Spezifikationen kann das offizielle BIPs-Repository als Kontext herangezogen werden:

- **Repository:** `https://github.com/bitcoin/bips/`
- Enthält alle offiziellen Bitcoin Improvement Proposals (BIP-32, BIP-39, BIP-44, BIP-84, BIP-85, etc.)
- Nutze dieses Repo um korrekte Algorithmus-Details, Feld-Definitionen, Testdaten und Referenz-Implementierungen nachzuschlagen
- Bei Unsicherheit über kryptografische Abläufe oder Datenformate: BIP-Originaltext als Source of Truth verwenden

---

## Offene Entscheidungen (mit Rainer klären)

- [ ] Domain / Hosting (Vercel?)
- [ ] Soll ein CMS (z.B. MDX-basiert) für redaktionelle Texte genutzt werden?
- [ ] Lernfortschritt-Tracking: Local Storage vs. Prisma/DB?
- [ ] Mehrsprachigkeit (DE/EN) von Anfang an?
- [ ] Sollen die Original-Artefakte auch standalone erreichbar bleiben?