# Technical Architecture

## Overview

Static-exported Next.js 16 web application for interactive Bitcoin/blockchain education. All rendering is client-side — no server, no database, no API routes. Deployed to GitHub Pages as a static site.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, `output: "export"`) | 16.1.6 |
| Runtime | React | 19.2.3 |
| Language | TypeScript (strict mode) | 5.x |
| Styling | Tailwind CSS + CSS Custom Properties | 4.x |
| Animation | GSAP + ScrollTrigger | 3.14+ |
| 3D Rendering | React Three Fiber + Drei + Three.js | r183 |
| Cryptography | @noble/curves, @noble/hashes, @scure/base | latest |
| Linting | ESLint 9 + Prettier 3.8 | — |
| Package Manager | pnpm | — |
| Deployment | GitHub Actions → GitHub Pages | — |

---

## Directory Layout

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root: fonts, Nav, Footer
│   ├── page.tsx                      # Landing page (topic grid)
│   ├── globals.css                   # Tailwind + CSS custom properties + keyframes
│   ├── hashing/page.tsx
│   ├── elliptic-curves/page.tsx
│   ├── bip39/page.tsx
│   ├── bip-visualizer/page.tsx       # BIP-32/44 derivation tree
│   ├── zpub/page.tsx
│   ├── bip85/page.tsx
│   ├── blockchain-structure/page.tsx
│   └── mining/page.tsx
│
├── components/
│   ├── layout/                       # Nav, Footer, PageShell
│   ├── ui/                           # Card, Button (barrel-exported)
│   └── visualizations/              # One folder per topic
│       ├── VisualizationShell.tsx    # Shared wrapper (badge, title, description)
│       ├── hashing/
│       │   ├── HashingVisualizer.tsx
│       │   ├── components/           # LiveHashInput, AvalancheCompare, ...
│       │   ├── crypto-utils.ts
│       │   ├── types.ts
│       │   └── constants.ts
│       ├── elliptic-curves/          # same pattern
│       ├── bip39/
│       ├── bip-pipeline/
│       ├── zpub/
│       ├── bip85/
│       ├── blockchain-structure/
│       └── mining/
│           ├── MiningVisualizer.tsx
│           ├── components/
│           │   ├── BlockAnatomy.tsx
│           │   ├── NonceSearch.tsx
│           │   ├── DifficultyTarget.tsx
│           │   ├── MiningRace.tsx
│           │   ├── DifficultyAdjustment.tsx
│           │   └── MiningProcess3D/   # Three.js scene (dynamic import, SSR off)
│           │       ├── index.tsx      # WebGL detection + fallback
│           │       ├── MiningScene.tsx # 7-stage animation orchestrator
│           │       ├── objects/       # 3D meshes (instanced, particle systems)
│           │       ├── ui/           # ControlPanel, NonceSearchPanel
│           │       ├── hooks/        # useMiningSequence, useHashWorker
│           │       └── worker/       # mining.worker.ts (Web Worker)
│           ├── crypto-utils.ts
│           ├── types.ts
│           └── constants.ts
│
├── hooks/
│   └── useGsapAnimation.ts          # Scoped GSAP with auto-cleanup
│
├── lib/
│   ├── constants.ts                  # Topic registry (28 topics, 5 categories)
│   ├── utils.ts                      # cn() — clsx + tailwind-merge
│   └── gsap.ts                       # Client-safe GSAP + ScrollTrigger init
│
├── styles/
│   └── theme.ts                      # Design tokens as JS object
│
└── types/
    └── index.ts                      # Topic, TopicCategory, VisualizationShellProps
```

---

## Core Architecture Patterns

### 1. Page Composition

Every topic page follows the same composition:

```
page.tsx → PageShell → VisualizationShell → TopicVisualizer
```

- **PageShell** — Background decoration (grid texture, radial glow), max-width container
- **VisualizationShell** — Topic badge, title, description, GSAP entrance animation
- **TopicVisualizer** — Tab system with per-tab sub-components

### 2. Visualization Component Pattern

Each visualizer is a tab-based interface:

```tsx
// Tab state drives which sub-component renders
const [activeTab, setActiveTab] = useState<TabType>("default");

// GSAP fade on tab change
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from(contentRef.current, { opacity: 0, y: 15, duration: 0.4 });
  }, contentRef);
  return () => ctx.revert();
}, [activeTab]);
```

Each visualization folder contains:
- `TopicVisualizer.tsx` — Tab orchestrator
- `components/` — One component per tab
- `crypto-utils.ts` — Topic-specific cryptographic operations
- `types.ts` — Data structures, state types
- `constants.ts` — Tab definitions, configuration, defaults

### 3. Cryptography Architecture

All crypto runs client-side (`"use client"` directive).

| Library | Purpose |
|---------|---------|
| Web Crypto API (`crypto.subtle`) | SHA-256 digest, PBKDF2, HMAC-SHA512 |
| @noble/curves | secp256k1 point arithmetic, ECDSA |
| @noble/hashes | SHA-256, SHA-512, RIPEMD-160 (synchronous) |
| @scure/base | Base58Check, Bech32 encoding |

Heavy computations (mining nonce search) are offloaded to **Web Workers** to avoid blocking the UI thread.

### 4. Animation System

**GSAP** handles all animations with strict cleanup:

```tsx
useEffect(() => {
  const ctx = gsap.context(() => { /* animations */ }, containerRef);
  return () => ctx.revert();  // always cleanup
}, [deps]);
```

Patterns used:
- **Entrance** — `gsap.from()` with stagger for page/section reveals
- **Tab transitions** — Opacity + Y-translate on content swap
- **Hover micro-interactions** — Scale + glow on cards/buttons
- **ScrollTrigger** — Registered but used sparingly
- **Timelines** — Sequential animations for complex flows (nav overlay)

Rules: All animations require `useRef` — no direct DOM queries. Duration: 0.2–0.4s for micro-interactions, 0.6–1.0s for entrances.

### 5. Three.js Integration (Mining 3D)

The 3D mining visualization uses a dedicated architecture:

```
Dynamic import (SSR off) → WebGL detection → Scene or Fallback
```

- **State machine** (`useMiningSequence`) — Reducer-based 8-stage progression
- **Web Worker** (`useHashWorker`) — Background SHA-256, batch size 500
- **Camera** — Smooth lerp follow with stage-specific positions
- **Performance** — InstancedMesh (40 transactions), Float32Array particles (400), opacity fades over geometry creation/destruction

---

## Design System

### CSS Custom Properties (defined in `globals.css`)

```
Background:  --bg-primary (#0a0e17), --bg-secondary, --bg-card, --bg-card-hover
Text:        --text-primary (#e2e8f0), --text-secondary, --text-muted
Accents:     --accent-primary (cyan #22d3ee), --accent-secondary (violet #8b5cf6)
             --accent-success, --accent-warning, --accent-danger
Borders:     --border-subtle (#1e293b), --border-active
Effects:     --glow-primary (cyan box-shadow)
```

### Typography

| Role | Font |
|------|------|
| Display / Headings | JetBrains Mono |
| Body / Reading | Outfit |
| Code / Crypto data | Fira Code |

All loaded via `next/font/google`.

### Visual Identity

Dark theme with "Crypto Terminal meets Editorial Design" aesthetic. Monospace accents for technical data, generous whitespace, subtle grid/matrix textures, cyan/violet accent glow effects.

---

## Data Flow

There is no backend. All data flows are client-side:

```
User interaction → React state → Crypto computation → Visual update
                                  ↓ (if heavy)
                              Web Worker → postMessage → UI update
```

### Example: Mining Nonce Search

```
User sets difficulty → Worker.postMessage({ startNonce, batchSize, difficulty })
                       → Worker iterates SHA-256(header + nonce)
                       → Worker.postMessage({ results, found? })
                       → UI updates hash waterfall + progress
                       → If not found: request next batch
                       → If found: success animation
```

---

## Build & Deployment

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Static export → /out/
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
```

### Static Export

`next.config.ts` sets `output: "export"`, producing a flat HTML/CSS/JS bundle in `/out/`. No Node.js runtime required at deploy time.

### GitHub Pages Pipeline

```
Push to main → GitHub Actions → pnpm build → Deploy /out/ to GitHub Pages
                                             Base path: /blockchain-info-helpers/
```

---

## Topic Registry

All topics (implemented and planned) are defined in `src/lib/constants.ts` as a typed array:

```typescript
TOPICS: Topic[] = [
  { slug, title, description, icon, category, order, available }
]
```

5 categories: `fundamentals`, `keys`, `transactions`, `network`, `advanced`

The landing page renders all topics as cards, with unavailable topics shown dimmed. Navigation groups topics by category with localized German headers.

---

## Browser Requirements

| Feature | Required for |
|---------|-------------|
| ES2020+ | All pages |
| Web Crypto API | Hashing, key derivation |
| WebGL | Mining 3D (graceful fallback) |
| Web Workers | Mining background computation |

---

## Codebase Stats

- **~20,000 lines** of TypeScript/TSX
- **9 implemented topic pages** with interactive visualizations
- **26 files** in the mining visualization alone
- **28 topics** registered (9 available, 19 planned)
