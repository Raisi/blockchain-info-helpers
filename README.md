# Blockchain Knowledge Hub

Interaktive Lern-Website zu Blockchain- und Bitcoin-Konzepten. Komplexe Themen werden durch visuelle, hands-on Demos verständlich gemacht.

**Live:** [raisi.github.io/blockchain-info-helpers](https://raisi.github.io/blockchain-info-helpers/)

## Themen

Live (9 von 21 geplanten, Stand September 2026):

- **Hashing (SHA-256)** — Wie aus beliebigen Daten ein eindeutiger Fingerprint entsteht
- **Elliptische Kurven (secp256k1)** — Die Mathematik hinter Bitcoin-Schlüsseln
- **BIP-39 Seed Phrases** — Wie aus Zufall merkbare Wörter werden
- **Vom Seed zum Wallet (BIP-32/44)** — Hierarchische Key-Ableitung erklärt
- **zpub (Extended Public Key)** — Öffentliche Schlüssel und Adress-Ableitung
- **Bitcoin Adressen** — Base58Check & Bech32 Encoding-Lab
- **BIP-85 Child Seeds** — Unabhängige Seeds aus einem Master-Seed
- **Mining Simulator** — Nonce-Suche, Difficulty, Mining-Race und 3D-Prozess
- **Blockchain-Struktur** — Blöcke, Verkettung und Proof-of-Work

Roadmap und Status: [`docs/GOAL.md`](docs/GOAL.md)

## Tech Stack

Next.js 16 · React 19 · Tailwind CSS 4 · GSAP · Three.js (R3F) · @noble/\* 2.x · TypeScript · Vitest · pnpm

## Prüfen

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```

Die Krypto-Module werden gegen BIP-Testvektoren getestet (BIP-39, BIP-84, BIP-85, BIP-173).

## Lokale Entwicklung

```bash
pnpm install
pnpm dev
```
