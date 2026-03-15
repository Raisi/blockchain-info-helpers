import type { Topic } from "@/types";

export const TOPICS: readonly Topic[] = [
  {
    slug: "hashing",
    title: "Hashing & SHA-256",
    description: "Von Daten zum digitalen Fingerabdruck",
    icon: "hash",
    category: "fundamentals",
    order: 1,
  },
  {
    slug: "blockchain-structure",
    title: "Blockchain Struktur",
    description: "Wie Blöcke eine unveränderliche Kette bilden",
    icon: "blocks",
    category: "fundamentals",
    order: 2,
  },
  {
    slug: "bip39",
    title: "BIP-39 Seed Generation",
    description: "Wie aus Zufall Wörter werden — Schritt für Schritt",
    icon: "key",
    category: "keys",
    order: 1,
  },
  {
    slug: "bip-visualizer",
    title: "BIP Derivation Pipeline",
    description: "BIP32/39/44/85 — Vom Mnemonic zum Wallet-Schlüssel",
    icon: "git-branch",
    category: "keys",
    order: 2,
  },
  {
    slug: "zpub",
    title: "zpub Key Generation",
    description: "Vom Mnemonic zum Extended Public Key — 5 Schritte",
    icon: "shield",
    category: "keys",
    order: 3,
  },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  fundamentals: "Grundlagen",
  keys: "Schlüssel & Seeds",
  transactions: "Transaktionen",
  network: "Netzwerk",
  advanced: "Fortgeschritten",
};
