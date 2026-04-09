# Architecture — Blockchain Knowledge Hub

## Overview

A Next.js 16 static site that turns complex Bitcoin/blockchain concepts into interactive, browser-based visualizations. All cryptographic operations run client-side using `@noble/*` libraries — no backend, no API keys, no server state.

Deployed as a static export to GitHub Pages via GitHub Actions.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, static export) | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | v4 |
| Animation | GSAP + ScrollTrigger | 3.14+ |
| 3D | Three.js + @react-three/fiber + @react-three/drei | 0.183 / 9.x |
| Cryptography | @noble/hashes + @noble/curves + @scure/base | latest |
| Language | TypeScript (strict) | 5.x |
| Package Manager | pnpm | 10.x |

---

## Directory Layout

```
src/
├── app/
│   ├── layout.tsx               # Root layout: Nav, Footer, global theme
│   ├── page.tsx                 # Hub / landing page (topic card grid)
│   ├── globals.css              # CSS custom properties + Tailwind directives
│   └── [topic]/page.tsx         # One route per topic (e.g. /bip39, /hashing)
│
├── components/
│   ├── ui/                      # Primitives: Button, Card, Badge, etc.
│   ├── layout/                  # Nav, Footer, Sidebar, PageShell
│   ├── visualizations/          # One component per topic (the heavy stuff)
│   │   ├── VisualizationShell.tsx   # Shared wrapper for all viz components
│   │   ├── hashing/
│   │   ├── bip39/
│   │   ├── bip85/
│   │   ├── zpub/
│   │   ├── bip-pipeline/
│   │   ├── blockchain-structure/
│   │   ├── elliptic-curves/
│   │   └── mining/              # 3D visualization using R3F
│   └── interactive/             # Quiz, Stepper, Explorer widgets
│
├── lib/
│   ├── constants.ts             # TOPICS registry (slug, title, category, order, available)
│   ├── gsap.ts                  # GSAP + ScrollTrigger registration (client-only)
│   └── utils.ts                 # cn(), formatters
│
├── hooks/
│   └── useGsapAnimation.ts      # Reusable GSAP hook pattern
│
├── styles/
│   └── theme.ts                 # Design tokens as JS object
│
└── types/
    └── index.ts                 # Topic, TopicCategory, and shared types
```

---

## Data Flow

There is no server-side data fetching. Each page is fully static:

```
TOPICS constant (constants.ts)
    └──> Hub page (page.tsx)         renders topic card grid
    └──> [topic]/page.tsx            renders the visualization for that slug

User interaction
    └──> React state (useState)      drives visualization logic
    └──> @noble/* libraries          crypto operations (client-side only)
    └──> GSAP animations             all visual feedback
```

---

## Topic Registry

`src/lib/constants.ts` is the single source of truth for all topics. Each entry:

```typescript
{
  slug: "bip39",           // URL path: /bip39
  title: "...",            // Display name
  description: "...",      // Subtitle on hub card
  icon: "key",             // Icon identifier
  category: "keys",        // fundamentals | keys | transactions | network | advanced
  order: 1,                // Sort order within category
  available: true,         // false = "Coming Soon" card, no route
}
```

To add a new topic: add the entry here, create `src/app/<slug>/page.tsx`, and create `src/components/visualizations/<Name>/`.

---

## Design System

All visual tokens are CSS custom properties defined in `src/app/globals.css`.

**Color palette (dark theme only):**
```
--bg-primary:    #0a0e17   (page background)
--bg-secondary:  #111827
--bg-card:       #1a1f2e   (card backgrounds)
--accent-primary: #22d3ee  (cyan — primary interactive color)
--accent-secondary: #8b5cf6 (violet — secondary highlights)
--text-primary:  #e2e8f0
--text-secondary: #94a3b8
--glow-primary:  0 0 20px rgba(34, 211, 238, 0.15)
```

**Typography:**
- Headings/display: JetBrains Mono or Space Mono
- Body: Outfit or Satoshi
- Code/crypto data: Fira Code

**Tailwind classes always reference CSS vars:**
```tsx
<div className="bg-[var(--bg-card)] border border-[var(--border-subtle)]">
```

---

## GSAP Conventions

Every component that animates follows this pattern:

```typescript
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from("[data-animate]", {
      y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out"
    });
  }, containerRef);
  return () => ctx.revert();        // always clean up
}, []);
```

Rules:
- Always `gsap.context()` + `.revert()` — never leak listeners
- Always `useRef` for targets — never `document.querySelector`
- Micro-interactions: 0.2–0.4s · Entrance: 0.6–1.0s · Easing: `power3.out`
- Import from `@/lib/gsap`, not directly from `gsap`

---

## 3D Components (R3F)

The mining visualizer uses `@react-three/fiber`. Conventions:
- Wrapped in `<Canvas>` with explicit camera settings
- Use `@react-three/drei` helpers (OrbitControls, Text, etc.) before writing custom geometry
- Always call `geometry.dispose()` and `material.dispose()` in cleanup effects
- Keep draw calls low — instanced meshes for repeated geometry

---

## Build & Deploy

```bash
pnpm dev          # local dev server
pnpm build        # static export → out/
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
```

GitHub Actions runs `pnpm build` on push to `main` and deploys the `out/` directory to GitHub Pages.

`next.config.ts` sets `output: "export"` and the correct `basePath` for GitHub Pages.

---

## Key Constraints

- **No server components with dynamic data** — static export only
- **No external API calls at runtime** — all crypto is local
- **`"use client"` required** on every component that uses hooks or browser APIs
- **No `any` types** — TypeScript strict mode enforced
- **No inline styles** — use Tailwind + CSS custom properties only
