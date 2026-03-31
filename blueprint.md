# Blueprint — Blockchain Knowledge Hub

## Vision

An interactive, visual learning platform that makes Bitcoin and blockchain technology understandable through hands-on exploration. Every concept — from hashing to Lightning — is taught through interactive visualizations, not walls of text.

**Target audience:** Developers, crypto-curious technicians, and anyone who wants to understand *how* Bitcoin actually works under the hood.

**Language:** German (primary), English (future consideration)

---

## Design Philosophy

- **Learn by doing** — Every topic is an interactive playground, not a lecture
- **Visually rich** — Dark "Crypto Terminal" aesthetic with polished animations
- **Technically accurate** — Real cryptographic operations (not simulations), BIP specifications as source of truth
- **Progressive depth** — From hashing basics to Taproot spending paths

---

## Topic Roadmap

### Implemented (9/23)

| # | Topic | Category | Description |
|---|-------|----------|-------------|
| 1 | Hashing & SHA-256 | fundamentals | Live hashing, avalanche effect, collision resistance |
| 2 | Elliptic Curves | fundamentals | Point addition, scalar multiplication, key generation on secp256k1 |
| 3 | BIP-39 Seed Phrases | keys | Entropy → checksum → mnemonic word mapping |
| 4 | BIP-32/44 Derivation | keys | Hierarchical key derivation tree visualization |
| 5 | zpub Extended Keys | keys | Serialization, encoding, address derivation from zpub |
| 6 | BIP-85 Child Seeds | keys | Deterministic child seed generation from master seed |
| 7 | Blockchain Structure | network | Block building, mining, chain visualization, tamper detection |
| 8 | Mining Simulator | network | Nonce search, difficulty, mining race, 3D process visualization |
| 9 | Bitcoin Addresses | keys | Base58 & Bech32 encoding lab |

### Next Up — Fundamentals & Signatures

| Topic | Description | Priority |
|-------|-------------|----------|
| **Merkle Trees** | Tree builder + proof verification — how Bitcoin efficiently verifies transactions | High |
| **ECDSA Signaturen** | Sign & verify playground — understanding digital signatures | High |

### Planned — Transactions

| Topic | Description |
|-------|-------------|
| **UTXO Explorer** | Coin selection simulation — how Bitcoin manages balances |
| **Transaction Builder** | Build a Bitcoin transaction step by step |
| **Bitcoin Script** | Script playground — the programming language behind Bitcoin |
| **Fees & vBytes** | Transaction fee calculation and estimation |

### Planned — Network & Consensus

| Topic | Description |
|-------|-------------|
| **Block Propagation** | How blocks spread through the Bitcoin network |
| **Difficulty Adjustment** | Why mining difficulty changes every 2016 blocks |

### Planned — Advanced

| Topic | Description |
|-------|-------------|
| **Lightning Network** | Payment channel simulator — understanding fast payments |
| **Schnorr Signatures** | Schnorr vs. ECDSA comparison — why Schnorr is better |
| **Taproot** | MAST trees + spending paths — Bitcoin's smart contracts |
| **Timechain** | Halving, supply & emission — Bitcoin's monetary policy visualized |

### Ideas (Backlog)

- **Border Wallet** concept visualization
- Additional themes / light mode
- More interactive features per existing topic

---

## Goals

### Product Goals

1. **Complete the topic map** — Implement all 23 planned topics covering the full Bitcoin stack from hashing to Lightning
2. **Each topic standalone** — Every visualization works independently, tells a complete story
3. **Real cryptography** — Use actual algorithms (SHA-256, secp256k1, HMAC-SHA512), not toy approximations
4. **Mobile-ready** — Every visualization responsive and usable on phone screens

### Quality Goals

1. **Build always green** — TypeScript strict, ESLint clean, static export succeeds
2. **Fast page loads** — Static export, no server round-trips, heavy components lazy-loaded
3. **Accessible** — Semantic HTML, keyboard navigation, ARIA labels, screen reader support
4. **Smooth animations** — GSAP-driven, 60fps, scoped cleanup on every unmount

### Learning Goals

1. **Progressive complexity** — Fundamentals → Keys → Transactions → Network → Advanced
2. **Cross-topic connections** — Show how hashing feeds into mining, how keys feed into addresses, how addresses feed into transactions
3. **Honest about limits** — Clearly mark educational simplifications vs. real Bitcoin behavior

---

## Open Decisions

These need to be resolved as the project grows:

| Decision | Options | Status |
|----------|---------|--------|
| **Hosting** | GitHub Pages (current) vs. Vercel | Using GitHub Pages |
| **CMS for text content** | MDX-based vs. hardcoded in components | Not decided |
| **Learning progress** | localStorage vs. Prisma/SQLite | Not decided |
| **Internationalization** | German-only vs. DE/EN from start | Currently German-only |
| **Original artifacts** | Keep standalone accessible or archive | Not decided |
| **Domain** | Custom domain or github.io subpath | Using github.io |

---

## Known Issues

- Flash/flicker on first page navigation (GSAP entrance race condition)

---

## Success Metrics

The project succeeds when:

1. All 23 topics are implemented and polished
2. A newcomer can go from "what is hashing?" to "how does Lightning work?" in one session
3. Every visualization is technically accurate enough that a Bitcoin developer would approve
4. The site loads fast, looks professional, and works on mobile
