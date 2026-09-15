# Project Goal — Blockchain Knowledge Hub

## What This Is

An interactive educational website that makes Bitcoin and blockchain concepts tangible
through visual, hands-on demonstrations. Target audience: technically curious people
(developers, students, Bitcoin users) who want to understand _how_ things work under the
hood. Language: German first, English a future consideration.

---

## Core Philosophy

**"Show, don't tell."** Every concept has a live, interactive component:

- SHA-256 → type anything, watch the hash change in real time
- BIP-39 → see exactly how entropy becomes 12 or 24 words
- Elliptic curves → move a point on secp256k1 and watch the math
- Mining → actually find a nonce and watch proof-of-work happen in 3D

Design principles:

- **Learn by doing**: playground, not lecture
- **Visually rich**: dark "Crypto Terminal" aesthetic, GSAP everywhere, nothing distracting
- **Technically accurate**: real cryptography via `@noble/*`, BIPs as source of truth
- **Progressive depth**: fundamentals → keys → transactions → network → advanced
- **Honest about limits**: mark educational simplifications vs. real Bitcoin behaviour

---

## Content Roadmap

Status as of **September 2026**: **9 of 21** registered topics live. The registry in
`src/lib/constants.ts` is authoritative; update this table, `ToDos.md` and `README.md`
in the same commit as a status change.

### Fundamentals

| Slug            | Title              | Status                  |
| --------------- | ------------------ | ----------------------- |
| hashing         | Was ist Hashing?   | ✅ Live                 |
| elliptic-curves | Elliptische Kurven | ✅ Live                 |
| merkle-trees    | Merkle Trees       | Planned (high priority) |
| ecdsa           | ECDSA Signaturen   | Planned (high priority) |

### Keys & Wallets

| Slug           | Title                              | Status               |
| -------------- | ---------------------------------- | -------------------- |
| bip39          | Wie entsteht eine Seed Phrase?     | ✅ Live              |
| bip-visualizer | Vom Seed zum Wallet (BIP-32/44)    | ✅ Live              |
| zpub           | Was ist ein zpub?                  | ✅ Live              |
| adressen       | Bitcoin Adressen (Base58 / Bech32) | ✅ Live (2026-04-15) |
| bip85          | BIP-85 Child Seeds                 | ✅ Live              |

### Transactions

| Slug       | Title             | Status  |
| ---------- | ----------------- | ------- |
| utxo       | UTXO Explorer     | Planned |
| tx-builder | Transaktion bauen | Planned |
| script     | Bitcoin Script    | Planned |
| fees       | Gebühren & vBytes | Planned |

### Network & Consensus

| Slug                 | Title                             | Status  |
| -------------------- | --------------------------------- | ------- |
| mining               | Mining Simulator (incl. 3D)       | ✅ Live |
| blockchain-structure | Wie funktioniert eine Blockchain? | ✅ Live |
| propagation          | Block-Propagierung                | Planned |
| difficulty           | Difficulty Anpassung              | Planned |

### Advanced

| Slug      | Title                        | Status  |
| --------- | ---------------------------- | ------- |
| lightning | Lightning Network            | Planned |
| schnorr   | Schnorr Signaturen           | Planned |
| taproot   | Taproot                      | Planned |
| timechain | Timechain (Halving / Supply) | Planned |

### Backlog / ideas

- Border Wallet concept visualization
- Light theme / additional themes
- More interactive features per existing topic
- Cross-topic links (hashing → mining, keys → addresses → transactions); first ones exist
  from bip-pipeline and zpub into adressen

---

## Goals

**Product**: complete the topic map; each topic standalone and self-explanatory; real
cryptography; mobile-ready.

**Quality**: build always green (type-check, lint, static export); fast static pages with
heavy components lazy-loaded; accessible (semantic HTML, keyboard, ARIA); smooth GSAP with
scoped cleanup.

**Learning**: progressive complexity; visible cross-topic connections; educational
simplifications clearly labelled.

Success looks like: a newcomer can go from "what is hashing?" to "how does Lightning work?"
in one session, and a Bitcoin developer would sign off on the accuracy.

---

## Technical Constraints (intentional)

- No backend; static files only
- No telemetry; nothing leaves the browser
- Real cryptography via audited `@noble/*` libraries
- German-first UI

---

## Open Decisions

| Decision             | Options                                | Status                   |
| -------------------- | -------------------------------------- | ------------------------ |
| Hosting              | GitHub Pages vs. Vercel                | GitHub Pages for now     |
| Custom domain        | github.io subpath vs. own domain       | subpath for now          |
| CMS for prose        | MDX vs. hardcoded in components        | undecided                |
| Learning progress    | localStorage vs. Prisma/DB             | undecided, nothing built |
| Internationalization | DE only vs. DE/EN                      | DE only for now          |
| Original artifacts   | keep standalone accessible vs. archive | undecided                |

---

## Known Issues

- Flash on first page navigation (GSAP entrance race). Tracked in `ToDos.md`.
- `pnpm lint` is error-free but reports ~23 warnings (unused vars, exhaustive-deps). CI fails
  on lint errors only.
- Time-sensitive content, last verified September 2026 (re-check yearly): quantum-computer
  status card in `elliptic-curves/components/QuantumThreat.tsx` (qubit counts, Google/IonQ
  resource estimates, BIP-360 status), real-world difficulty in
  `mining/components/DifficultyTarget.tsx` (~127 T), coinbase reward in
  `mining/components/BlockAnatomy.tsx` (3.125 BTC until the ~2028 halving).

---

## Source of Artifacts

Several visualizations began as standalone Claude artifacts (HTML, JSX, Markdown) in
`generated_artifacts/` (gitignored, read-only). Converted components keep the original
logic and adopt the shared design system.
