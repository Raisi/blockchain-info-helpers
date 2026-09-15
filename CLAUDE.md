# CLAUDE.md — Blockchain Knowledge Hub

## Projektübersicht

Eine interaktive Wissens-Website zu Bitcoin- und Blockchain-Themen. Jedes Thema ist eine
hands-on Visualisierung mit echter Kryptografie im Browser. Statisch exportiert, kein Backend.
Viele Visualisierungen entstanden ursprünglich als Claude-Artefakte (`generated_artifacts/`)
und wurden in einheitliche TypeScript-Komponenten überführt.

**Live:** https://raisi.github.io/blockchain-info-helpers/

---

## Tech Stack (Stand: package.json)

| Kategorie       | Technologie                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, `output: "export"`)                                       |
| UI              | React 19                                                                          |
| Styling         | Tailwind CSS 4 (`@theme inline` in `globals.css`, **keine** `tailwind.config.ts`) |
| Animation       | GSAP 3 + ScrollTrigger                                                            |
| 3D              | Three.js + @react-three/fiber + @react-three/drei (nur Mining)                    |
| Kryptografie    | @noble/curves, @noble/hashes, @scure/base, Web Crypto API                         |
| Sprache         | TypeScript (strict)                                                               |
| Linting         | ESLint 9 (flat config) + Prettier                                                 |
| Package Manager | pnpm 10, Node 24 (`.nvmrc`)                                                       |
| Deployment      | GitHub Actions → GitHub Pages (`out/`)                                            |

Kein Prisma, keine DB, keine API-Routen. Erst einbauen, wenn eine offene Entscheidung
(siehe unten) das verlangt.

---

## Projektstruktur (Ist-Zustand)

```
/
├── CLAUDE.md
├── README.md
├── ToDos.md                         ← Bugs, Ideen, Roadmap-Checkliste
├── docs/
│   ├── ARCHITECTURE.md              ← Tech-Details, Patterns, Build/Deploy
│   ├── GOAL.md                      ← Ziel, Topic-Roadmap mit Status, offene Entscheidungen
│   └── superpowers/specs/           ← Design-Specs einzelner Features
├── generated_artifacts/             ← Original-Artefakte (READ-ONLY, gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← Fonts (next/font/google), Nav, Footer
│   │   ├── page.tsx                 ← Hub: Topic-Cards nach Kategorie
│   │   ├── globals.css              ← CSS Custom Properties + @theme inline + Keyframes
│   │   └── <slug>/page.tsx          ← EIN statischer Ordner pro Topic (kein [topic]-Dynamic-Route)
│   ├── components/
│   │   ├── ui/                      ← Card, Button, icons (Barrel-Export)
│   │   ├── layout/                  ← Nav, Footer, PageShell (Barrel-Export)
│   │   └── visualizations/
│   │       ├── VisualizationShell.tsx
│   │       └── <slug>/              ← EIN Ordner pro Topic
│   │           ├── <Name>Visualizer.tsx   ← Tab-Orchestrator
│   │           ├── components/            ← Ein Sub-Component pro Tab/Schritt
│   │           ├── crypto-utils.ts
│   │           ├── constants.ts
│   │           └── types.ts
│   ├── lib/
│   │   ├── constants.ts             ← TOPICS-Registry = Single Source of Truth
│   │   ├── gsap.ts                  ← GSAP + ScrollTrigger Registrierung (client-only)
│   │   └── utils.ts                 ← cn()
│   ├── hooks/useGsapAnimation.ts    ← vorhanden, aktuell nirgends importiert
│   ├── styles/theme.ts              ← vorhanden, aktuell nirgends importiert (Tokens leicht abweichend)
│   └── types/index.ts               ← Topic, TopicCategory, VisualizationShellProps
├── .github/workflows/deploy.yml
├── next.config.ts                   ← output: "export", basePath in Prod
├── eslint.config.mjs
└── package.json
```

---

## Design-System

### Ästhetik

**"Crypto Terminal meets Editorial Design"**: dunkles Schema, Cyan als Primärakzent,
Monospace für Crypto-Daten, Sans für Lesetext, subtile Grid-Textur im Hintergrund.

### Tokens (Quelle: `src/app/globals.css`)

```css
--bg-primary: #0a0e17;
--bg-secondary: #111827;
--bg-card: #1a1f2e;
--bg-card-hover: #242a3d;
--text-primary: #e2e8f0;
--text-secondary: #94a3b8;
--text-muted: #64748b;
--accent-primary: #22d3ee; /* Cyan */
--accent-secondary: #2563eb; /* Blau — NICHT violett */
--accent-success: #10b981;
--accent-warning: #f59e0b;
--accent-danger: #ef4444;
--border-subtle: #1e293b;
--border-active: #334155;
--glow-primary: inset 0 0 0 1px rgba(34, 211, 238, 0.25), 0 4px 16px rgba(34, 211, 238, 0.06);
```

Alle Tokens sind via `@theme inline` als Tailwind-Farben registriert. **Verwende die
Token-Klassen, nicht `bg-[var(--x)]`:**

```tsx
// richtig
<div className="rounded-xl border border-border-subtle bg-bg-card text-text-secondary hover:border-accent-primary/30" />
// veraltet
<div className="bg-[var(--bg-card)] border-[var(--border-subtle)]" />
```

Bei neuen Farben: Token in `globals.css` ergänzen. Keine eigenen Hex-Werte in Komponenten.

### Typografie

| Rolle               | Font           | Tailwind-Klasse |
| ------------------- | -------------- | --------------- |
| Display / Headings  | JetBrains Mono | `font-display`  |
| Body / Lesetext     | Outfit         | `font-body`     |
| Code / Crypto-Daten | Fira Code      | `font-code`     |

Geladen in `layout.tsx` via `next/font/google`.

### Inline-Styles

Erlaubt nur für **berechnete** Werte, die Tailwind nicht ausdrücken kann (dynamische
Breiten in %, Farb-Props aus Daten, SVG-Koordinaten). Statische Farben/Abstände gehören
in Klassen.

---

## Seiten- und Komponenten-Pattern

Jede Topic-Seite:

```tsx
// src/app/<slug>/page.tsx  (Server Component, kein "use client")
import type { Metadata } from "next";
import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import FooVisualizer from "@/components/visualizations/foo/FooVisualizer";
// Bestand: 8 von 9 Visualizer sind Default-Exports, nur AdressenVisualizer ist named.

export const metadata: Metadata = { title: "Foo" };

export default function FooPage() {
  return (
    <PageShell>
      <VisualizationShell title="Foo" description="…" topic="foo">
        <FooVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
```

Visualizer sind `"use client"`, meist tab-basiert: `activeTab`-State, ein Sub-Component pro
Tab in `components/`, GSAP-Fade beim Tab-Wechsel. Wenn der Visualizer `useSearchParams`
nutzt, in `<Suspense>` wrappen (siehe `adressen/page.tsx`), sonst bricht der statische Export.

Schwere Berechnungen (Mining-Nonce-Suche) laufen im Web Worker. Three.js wird per
`next/dynamic` mit `ssr: false` geladen und hat einen WebGL-Fallback.

---

## Neues Topic anlegen

1. Eintrag in `src/lib/constants.ts` (`available: true` erst wenn fertig; ohne Flag erscheint
   die Card als „Bald verfügbar" und Nav/Hub übernehmen das automatisch).
2. Icon in `src/components/ui/icons.tsx` ergänzen, falls neu.
3. `src/components/visualizations/<slug>/` nach dem Ordner-Pattern oben.
4. `src/app/<slug>/page.tsx` nach dem Seiten-Pattern.
5. `pnpm type-check && pnpm lint && pnpm build`, dann visuell in `pnpm dev` prüfen.
6. Status in `docs/GOAL.md`, `ToDos.md` und `README.md` aktualisieren.

Bei Konvertierung eines Artefakts aus `generated_artifacts/`: Kernlogik (State, Berechnungen,
Interaktionen) **unverändert** übernehmen, nur Styling und Struktur ans Design-System anpassen.

---

## GSAP-Regeln

- Import immer aus `@/lib/gsap`, nie direkt aus `gsap`.
- Jede Animation in `useEffect` innerhalb `gsap.context(() => …, containerRef)` mit
  `return () => ctx.revert()`.
- Targets über `useRef` oder `data-*`-Selektoren im Scope, nie `document.querySelector`.
- Dauer: Mikrointeraktionen 0.2–0.4s, Eingangsanimationen 0.6–1.0s, Easing `power3.out`.
- **Kein `transition-all`** auf GSAP-animierten Elementen (CSS kämpft gegen GSAP). Konkrete
  Transition nennen: `transition-colors`, `transition-[border-color,color]`.
- Für Elemente mit deterministischem Endzustand (Prozent-Breiten in Flex) `gsap.fromTo`
  statt `gsap.from`.
- Tweens, die über mehrere Renders laufen, beim Unmount killen.
- ScrollTrigger nach dynamischem Content `ScrollTrigger.refresh()`.

---

## Code-Qualität

- `strict: true`, keine `any`. Props als `interface Props`.
- Absolute Imports via `@/`. Barrel-Exports nur in `ui/` und `layout/`.
- ESLint (`eslint-config-next` core-web-vitals + typescript + prettier). Die Regel
  `react-hooks/set-state-in-effect` ist als **Error** aktiv: kein synchrones `setState`
  im Effect-Body. Async-Ergebnisse in `.then`/Callbacks setzen oder State ableiten.
- Responsiv mobile-first. Reihen mit 4+ interaktiven Elementen als responsives Grid, nicht
  `overflow-x-auto` (macOS versteckt Scrollbars).
- Accessibility: semantisches HTML, `aria-label` auf Icon-Buttons, Keyboard-Navigation.
- JSDoc für komplexe Funktionen (v.a. `crypto-utils.ts`).

---

## Workflow-Regeln

1. Vor jeder Arbeit: diese CLAUDE.md lesen, bei Bedarf `docs/ARCHITECTURE.md`.
2. Ein Topic pro Durchgang.
3. Nach jeder Änderung: `pnpm type-check`, `pnpm lint`, `pnpm build`. CI führt **nur**
   `pnpm build` aus, Lint-Fehler fallen dort nicht auf.
4. Design-System-Treue: nur definierte Tokens.
5. Commits atomar im Format `feat(topic): …`, `fix(topic): …`, `style(ui): …`,
   `refactor(viz): …`, `docs: …`. Vor jedem Commit um Erlaubnis fragen.
6. Bestehende Seiten müssen nach jeder Änderung funktionieren.
7. `generated_artifacts/` nie editieren.

---

## Befehle

```bash
pnpm dev          # Entwicklungsserver (Turbopack)
pnpm build        # Statischer Export nach out/
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
pnpm outdated     # Dependency-Stand
pnpm audit        # Advisories (Server-seitige Next-CVEs betreffen den Static Export nicht)
```

---

## Dokumentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Patterns, Datenfluss, Crypto-Architektur, 3D, Build/Deploy
- [`docs/GOAL.md`](docs/GOAL.md) — Projektziel, Topic-Roadmap mit Status, offene Entscheidungen
- [`ToDos.md`](ToDos.md) — Bugs, Ideen, Roadmap-Checkliste

Source of Truth für Topic-Status ist `src/lib/constants.ts`. Wenn ein Topic live geht,
alle drei Dateien oben plus README im selben Commit anpassen.

---

## Fachliche Referenzen

- **BIPs:** https://github.com/bitcoin/bips/ — bei Unsicherheit über Algorithmen, Feld-Formate
  oder Testvektoren ist der BIP-Originaltext die Source of Truth (BIP-32, 39, 44, 84, 85, 173, 350).
- Zeitabhängige Fakten im Content (Coinbase-Reward, Difficulty-Vergleich, Quantencomputer-Stand)
  sind mit Datum zu prüfen. Nächster fixer Termin: Halving ~2028 (Reward 3.125 → 1.5625 BTC).

---

## Offene Entscheidungen (mit Rainer klären)

- [ ] Hosting: GitHub Pages (aktuell) vs. Vercel
- [ ] CMS (MDX) für längere Erklärtexte?
- [ ] Lernfortschritt: localStorage vs. DB
- [ ] Mehrsprachigkeit DE/EN
- [ ] Original-Artefakte standalone erreichbar lassen?
