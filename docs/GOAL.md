# Project Goal — Blockchain Knowledge Hub

## What This Is

An interactive educational website that makes Bitcoin and blockchain concepts tangible through visual, hands-on demonstrations. The target audience is technically curious people — developers, students, or Bitcoin users — who want to understand *how* things work under the hood, not just that they work.

---

## Core Philosophy

**"Show, don't tell."**

Every concept has a live, interactive component:
- SHA-256 hashing → type anything, watch the hash change in real time
- BIP-39 seed phrases → see exactly how entropy becomes 24 words
- Elliptic curve math → move a point on secp256k1 and watch the math
- Mining → actually find a nonce and see proof-of-work happen

No static diagrams. No walls of text. Everything is explorable.

---

## Content Roadmap

Topics are organized into five categories. Status as of April 2026:

### Fundamentals
| Slug | Title | Status |
|------|-------|--------|
| hashing | Was ist Hashing? | ✅ Live |
| elliptic-curves | Elliptische Kurven | ✅ Live |
| merkle-trees | Merkle Trees | Planned |
| ecdsa | ECDSA Signaturen | Planned |

### Keys & Wallets
| Slug | Title | Status |
|------|-------|--------|
| bip39 | Wie entsteht eine Seed Phrase? | ✅ Live |
| bip-visualizer | Vom Seed zum Wallet (BIP-32/44) | ✅ Live |
| zpub | Was ist ein zpub? | ✅ Live |
| bip85 | BIP-85 Child Seeds | ✅ Live |
| adressen | Bitcoin Adressen | Planned |

### Transactions
| Slug | Title | Status |
|------|-------|--------|
| utxo | UTXO Explorer | Planned |
| tx-builder | Transaktion bauen | Planned |
| script | Bitcoin Script | Planned |
| fees | Gebühren & vBytes | Planned |

### Network & Consensus
| Slug | Title | Status |
|------|-------|--------|
| mining | Mining Simulator | ✅ Live |
| propagation | Block-Propagierung | Planned |
| difficulty | Difficulty Anpassung | Planned |

### Advanced
| Slug | Title | Status |
|------|-------|--------|
| lightning | Lightning Network | Planned |
| schnorr | Schnorr Signaturen | Planned |
| taproot | Taproot | Planned |
| timechain | Timechain (Halving/Supply) | Planned |

Also under consideration: **Borderwallet** concept visualization.

---

## Design Intent

**Aesthetic: "Crypto Terminal meets Editorial Design"**

- Dark theme — this is a crypto tool, it lives at night
- Cyan (`#22d3ee`) as the primary accent — electric, technical
- Monospace fonts for crypto data and code; clean sans-serif for prose
- GSAP animations throughout — nothing is static, but nothing is distracting
- Feels like a polished product, not a demo project

---

## Technical Constraints (Intentional)

- **No backend** — runs entirely in the browser, deployable as static files
- **No telemetry** — user data never leaves the browser
- **Real cryptography** — uses `@noble/*` libraries (audited, production-grade), not toy implementations
- **German-first UI** — content is in German (target audience is German-speaking)

---

## Open Decisions

- **Hosting**: Currently GitHub Pages; Vercel being evaluated
- **CMS**: Possibly MDX for longer explanatory text alongside visualizations
- **Learning progress**: Local Storage vs. database (Prisma/SQLite)
- **Internationalization**: German now; English later?
- **Standalone artifacts**: Should original `generated_artifacts/` files remain accessible?

---

## Source of Artifacts

Many visualizations were initially created as standalone Claude artifacts (HTML, JSX, TSX) stored in `generated_artifacts/`. The project converts these into unified TypeScript components that follow the design system. The `generated_artifacts/` directory is read-only reference material.
