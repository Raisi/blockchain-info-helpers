import type { Topic, TopicCategory } from "@/types";

export const TOPICS: readonly Topic[] = [
  // === Fundamentals ===
  {
    slug: "hashing",
    title: "Was ist Hashing?",
    description:
      "Wie SHA-256 aus beliebigen Daten einen einzigartigen Fingerabdruck erzeugt",
    icon: "hash",
    category: "fundamentals",
    order: 1,
    available: true,
  },
  {
    slug: "elliptic-curves",
    title: "Elliptische Kurven",
    description:
      "Punkt-Addition auf secp256k1 — die Mathematik hinter Bitcoin",
    icon: "curve",
    category: "fundamentals",
    order: 2,
    available: true,
  },
  {
    slug: "merkle-trees",
    title: "Merkle Trees",
    description:
      "Baum-Builder + Proof-Check — wie Bitcoin Transaktionen effizient verifiziert",
    icon: "tree",
    category: "fundamentals",
    order: 3,
  },
  {
    slug: "ecdsa",
    title: "ECDSA Signaturen",
    description:
      "Sign & Verify Playground — digitale Unterschriften verstehen",
    icon: "pen",
    category: "fundamentals",
    order: 4,
  },

  // === Keys & Wallets ===
  {
    slug: "bip39",
    title: "Wie entsteht eine Seed Phrase?",
    description:
      "Der Weg vom Zufallswert zu den 12 oder 24 Wörtern deines Wallets",
    icon: "key",
    category: "keys",
    order: 1,
    available: true,
  },
  {
    slug: "bip-visualizer",
    title: "Vom Seed zum Wallet",
    description:
      "Wie aus einer Seed Phrase alle Schlüssel und Adressen abgeleitet werden (BIP-32/44)",
    icon: "git-branch",
    category: "keys",
    order: 2,
    available: true,
  },
  {
    slug: "zpub",
    title: "Was ist ein zpub (Extended Public Key)?",
    description:
      "Die 5 Schritte vom Seed zum zpub — dem Schlüssel, der deine Adressen erzeugt",
    icon: "shield",
    category: "keys",
    order: 3,
    available: true,
  },
  {
    slug: "adressen",
    title: "Bitcoin Adressen",
    description:
      "Base58 & Bech32 Encoding-Lab — wie Adressen aufgebaut sind",
    icon: "address",
    category: "keys",
    order: 4,
  },
  {
    slug: "bip85",
    title: "BIP-85 Child Seeds",
    description:
      "Wie aus einem Master-Seed weitere unabhängige Seeds abgeleitet werden",
    icon: "seedling",
    category: "keys",
    order: 5,
    available: true,
  },

  // === Transaktionen ===
  {
    slug: "utxo",
    title: "UTXO Explorer",
    description:
      "Coin-Auswahl simulieren — wie Bitcoin Guthaben verwaltet",
    icon: "coins",
    category: "transactions",
    order: 1,
  },
  {
    slug: "tx-builder",
    title: "Transaktion bauen",
    description:
      "Eine Bitcoin-Transaktion Schritt für Schritt zusammensetzen",
    icon: "build",
    category: "transactions",
    order: 2,
  },
  {
    slug: "script",
    title: "Bitcoin Script",
    description:
      "Script Playground — die Programmiersprache hinter Bitcoin",
    icon: "code",
    category: "transactions",
    order: 3,
  },
  {
    slug: "fees",
    title: "Gebühren & vBytes",
    description: "Transaktionsgebühren verstehen und berechnen",
    icon: "calculator",
    category: "transactions",
    order: 4,
  },

  // === Netzwerk & Konsens ===
  {
    slug: "mining",
    title: "Mining Simulator",
    description:
      "Nonce finden + Difficulty — wie neue Blöcke entstehen",
    icon: "pickaxe",
    category: "network",
    order: 1,
    available: true,
  },
  {
    slug: "blockchain-structure",
    title: "Wie funktioniert eine Blockchain?",
    description:
      "Blockaufbau interaktiv — baue, mine und manipuliere eine Blockchain",
    icon: "blocks",
    category: "network",
    order: 2,
    available: true,
  },
  {
    slug: "propagation",
    title: "Block-Propagierung",
    description:
      "Wie sich Blöcke im Bitcoin-Netzwerk verbreiten",
    icon: "network",
    category: "network",
    order: 3,
  },
  {
    slug: "difficulty",
    title: "Difficulty Anpassung",
    description:
      "Warum sich die Mining-Schwierigkeit alle 2016 Blöcke ändert",
    icon: "gauge",
    category: "network",
    order: 4,
  },

  // === Advanced ===
  {
    slug: "lightning",
    title: "Lightning Network",
    description:
      "Payment Channel Simulator — schnelle Zahlungen verstehen",
    icon: "zap",
    category: "advanced",
    order: 1,
  },
  {
    slug: "schnorr",
    title: "Schnorr Signaturen",
    description:
      "Signatur vs. ECDSA Vergleich — warum Schnorr besser ist",
    icon: "signature",
    category: "advanced",
    order: 2,
  },
  {
    slug: "taproot",
    title: "Taproot",
    description:
      "MAST-Bäume + Spending Paths — Bitcoins Smart Contracts",
    icon: "tree-branch",
    category: "advanced",
    order: 3,
  },
  {
    slug: "timechain",
    title: "Timechain",
    description:
      "Halving, Supply & Emission — Bitcoins Geldpolitik visualisiert",
    icon: "clock",
    category: "advanced",
    order: 4,
  },
] as const;

export const CATEGORY_LABELS: Record<
  string,
  { title: string; subtitle: string }
> = {
  fundamentals: {
    title: "Grundlagen",
    subtitle: "Kryptografische Bausteine",
  },
  keys: {
    title: "Keys & Wallets",
    subtitle: "Schlüsselableitung & Adresserzeugung",
  },
  transactions: {
    title: "Transaktionen",
    subtitle: "Aufbau, Signing, UTXO-Modell",
  },
  network: {
    title: "Netzwerk & Konsens",
    subtitle: "Mining, Blöcke, Propagierung",
  },
  advanced: {
    title: "Advanced",
    subtitle: "Lightning, Taproot, Schnorr",
  },
};

export const CATEGORY_ORDER: TopicCategory[] = [
  "fundamentals",
  "keys",
  "transactions",
  "network",
  "advanced",
];
