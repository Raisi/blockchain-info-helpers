# Architecture — Blockchain Knowledge Hub

## Overview

Static-exported Next.js 16 application for interactive Bitcoin/blockchain education. All
rendering and all cryptography happen in the browser. No server, no database, no API routes.
Deployed to GitHub Pages via GitHub Actions.

Source of truth for versions is `package.json`; for topics it is `src/lib/constants.ts`.

---

## Tech Stack

| Layer         | Technology                                            | Notes                                            |
| ------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Framework     | Next.js 16, App Router, `output: "export"`            | `basePath` only in production                    |
| Runtime       | React 19                                              |                                                  |
| Language      | TypeScript, `strict: true`                            | no `any`                                         |
| Styling       | Tailwind CSS 4 + CSS custom properties                | `@theme inline` in `globals.css`, no config file |
| Animation     | GSAP 3 + ScrollTrigger                                | wrapper in `src/lib/gsap.ts`                     |
| 3D            | Three.js, @react-three/fiber, @react-three/drei       | mining topic only, dynamic import                |
| Cryptography  | @noble/curves, @noble/hashes, @scure/base, Web Crypto | client-side only                                 |
| Lint / Format | ESLint 9 flat config, Prettier                        | CI does not run lint                             |
| Tooling       | pnpm 10, Node 24                                      | `.nvmrc`, `packageManager` field                 |
| Deployment    | GitHub Actions → GitHub Pages                         | `.github/workflows/deploy.yml`                   |

---

## Directory Layout

```
src/
├── app/
│   ├── layout.tsx                    # Fonts (next/font/google), Nav, Footer, <html lang="de">
│   ├── page.tsx                      # Hub: topic cards grouped by category
│   ├── globals.css                   # Tokens, @theme inline, utilities, keyframes
│   └── <slug>/page.tsx               # One static folder per topic (9 today)
│
├── components/
│   ├── layout/                       # Nav (burger + overlay), Footer, PageShell — barrel export
│   ├── ui/                           # Card, Button, icons — barrel export
│   └── visualizations/
│       ├── VisualizationShell.tsx    # Badge + title + description + bordered content box
│       └── <slug>/                   # One folder per topic
│           ├── <Name>Visualizer.tsx  # Tab orchestrator
│           ├── components/           # One sub-component per tab / step
│           ├── crypto-utils.ts       # Topic-specific crypto (noble / Web Crypto)
│           ├── constants.ts          # Tab definitions, defaults, copy
│           └── types.ts
│
├── hooks/useGsapAnimation.ts         # present, currently unused
├── lib/
│   ├── constants.ts                  # TOPICS registry, CATEGORY_LABELS, CATEGORY_ORDER
│   ├── gsap.ts                       # registerPlugin(ScrollTrigger) guarded by typeof window
│   └── utils.ts                      # cn() = clsx + tailwind-merge
├── styles/theme.ts                   # present, currently unused; tokens drift from globals.css
└── types/index.ts                    # Topic, TopicCategory, VisualizationShellProps
```

The mining topic is the largest: `mining/components/MiningProcess3D/` holds the Three.js
scene (`MiningScene.tsx`), instanced meshes in `objects/`, a reducer-based stage machine in
`hooks/useMiningSequence.ts`, a SHA-256 Web Worker in `worker/mining.worker.ts`, and a
`WebGLFallback.tsx`.

---

## Core Patterns

### Page composition

```
page.tsx (server) → PageShell → VisualizationShell → <Name>Visualizer ("use client")
```

- **PageShell**: fixed grid texture + radial glow, `max-w-7xl` container.
- **VisualizationShell**: uppercase topic badge, `h1`, description, GSAP entrance, bordered box.
- **Visualizer**: `activeTab` state, per-tab sub-component, GSAP fade on tab change.

Pages that read `useSearchParams` wrap the visualizer in `<Suspense>` so the static export
succeeds (see `app/adressen/page.tsx`).

### Topic registry

```ts
{ slug, title, description, icon, category, order, available?: boolean }
```

Hub page and Nav both derive from `TOPICS`. Entries without `available: true` render as
dimmed "Bald verfügbar" cards and non-clickable Nav rows. Icons come from
`components/ui/icons.tsx`; unknown icon names fall back to `hash`.

### Cryptography

| Library / API                | Used for                                |
| ---------------------------- | --------------------------------------- |
| Web Crypto (`crypto.subtle`) | SHA-256, PBKDF2, HMAC-SHA512 (async)    |
| `@noble/hashes`              | sha256, ripemd160, utils (sync)         |
| `@noble/curves/secp256k1`    | point arithmetic, public-key derivation |
| `@scure/base`                | Base58Check, Bech32                     |

Everything runs under `"use client"`. No keys ever leave the browser. Footer warns that
generated keys must not be used for real wallets.

### Animation

Every animated component:

```ts
useEffect(() => {
  const ctx = gsap.context(() => {
    /* tweens on refs or data-* selectors */
  }, containerRef);
  return () => ctx.revert();
}, [deps]);
```

Rules and the lessons behind them:

- `gsap.fromTo` for elements with deterministic end states (percentage-width flex children).
  `gsap.from` + `revert()` can leave them stuck invisible.
- Never `transition-all` on GSAP-animated elements. CSS transitions fight GSAP on
  opacity/transform.
- Kill long-running tweens on unmount.
- Micro-interactions 0.2–0.4s, entrances 0.6–1.0s, `power3.out`.

### 3D (mining)

`next/dynamic` with `ssr: false` → WebGL detection → `MiningScene` or `WebGLFallback`.
InstancedMesh for repeated geometry, Float32Array particle buffers, opacity fades instead of
geometry churn, camera lerps between stage positions.

### Web Worker (mining)

```
UI → worker.postMessage({ startNonce, batchSize, difficulty })
   → worker hashes header+nonce in batches of 500
   → postMessage({ results, found? }) → UI updates → next batch or success animation
```

---

## Design System

Tokens live in `src/app/globals.css` and are exposed as Tailwind colors via `@theme inline`,
so components use `bg-bg-card`, `text-text-secondary`, `border-border-subtle`,
`text-accent-primary`, not `bg-[var(--x)]`.

| Token                | Value     | Role                       |
| -------------------- | --------- | -------------------------- |
| `--bg-primary`       | `#0a0e17` | page background            |
| `--bg-secondary`     | `#111827` | shell content box          |
| `--bg-card`          | `#1a1f2e` | cards                      |
| `--accent-primary`   | `#22d3ee` | cyan, primary interactive  |
| `--accent-secondary` | `#2563eb` | blue, secondary highlights |
| `--text-primary`     | `#e2e8f0` |                            |
| `--text-secondary`   | `#94a3b8` |                            |
| `--border-subtle`    | `#1e293b` |                            |

Fonts via `next/font/google`: JetBrains Mono (`font-display`), Outfit (`font-body`),
Fira Code (`font-code`). Utilities in `globals.css`: `.bg-grid`, `.text-gradient`,
custom scrollbar, keyframes `shimmer`, `flow`, `hashFloat`, `byteSlotIn`.

Inline `style={{}}` is used only for computed values (dynamic widths, data-driven colors,
SVG geometry).

---

## Build & Deploy

```bash
pnpm dev          # Turbopack dev server
pnpm build        # static export → out/
pnpm lint         # ESLint (not run in CI)
pnpm type-check   # tsc --noEmit
```

`deploy.yml`: on push to `main` → checkout → pnpm/action-setup → setup-node 24 →
`pnpm install --frozen-lockfile` → `pnpm build` → upload `out/` → deploy-pages.
`public/.nojekyll` keeps `_next/` assets servable. `basePath` is
`/blockchain-info-helpers` in production, empty in dev.

Because there is no Next.js server at runtime, Next advisories about Server Actions, the
Image Optimization API, middleware bypass or SSRF do not affect the deployed site. They
only matter for `next dev` locally.

---

## Browser Requirements

| Feature        | Needed for                          |
| -------------- | ----------------------------------- |
| ES2020+        | everything                          |
| Web Crypto API | hashing, key derivation             |
| WebGL          | mining 3D scene (graceful fallback) |
| Web Workers    | mining nonce search                 |

---

## Key Constraints

- Static export only: no server components with dynamic data, no API routes.
- No runtime network calls; all crypto local.
- `"use client"` on every component using hooks or browser APIs.
- No `any`.
- Tokens only; no ad-hoc hex colors in components.
- `generated_artifacts/` is read-only reference material and gitignored.
