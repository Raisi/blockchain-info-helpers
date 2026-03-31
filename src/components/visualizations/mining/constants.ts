import type { MiningTabConfig, BlockHeaderField, BlockHeaderData } from "./types";

export const MINING_TABS: MiningTabConfig[] = [
  {
    id: "anatomy",
    label: "Block-Anatomie",
    description:
      "Ein Bitcoin-Block-Header besteht aus 6 Feldern (80 Bytes). Jedes Feld hat eine spezifische Rolle — zusammen ergeben sie den Input für den doppelten SHA-256-Hash, der über Gültigkeit entscheidet.",
  },
  {
    id: "nonce-search",
    label: "Nonce-Suche",
    description:
      "Das Herzstück des Minings: Die Nonce wird systematisch durchprobiert, bis der resultierende Hash unter dem Target liegt. Im manuellen Modus entwickelst du ein Gefühl für die Zufälligkeit — im Auto-Modus siehst du die Geschwindigkeit.",
  },
  {
    id: "difficulty",
    label: "Difficulty & Target",
    description:
      "Die Difficulty bestimmt den 256-Bit-Schwellenwert (Target), den ein gültiger Hash unterschreiten muss. Je höher die Difficulty, desto kleiner der gültige Bereich — und desto mehr Versuche braucht ein Miner im Schnitt.",
  },
  {
    id: "race",
    label: "Mining-Wettbewerb",
    description:
      "Simuliere einen Mining-Wettbewerb: Stelle die Hashrate jedes Miners ein und beobachte, wer zuerst einen gültigen Hash findet. Mehr Hashrate = höhere Wahrscheinlichkeit — aber Zufall entscheidet.",
  },
  {
    id: "3d-process",
    label: "3D Mining-Prozess",
    description:
      "Erlebe den kompletten Mining-Prozess als interaktive 3D-Animation: Vom Mempool über Block-Assembly und Nonce-Suche bis zum neuen Block in der Chain.",
  },
  {
    id: "adjustment",
    label: "Difficulty-Anpassung",
    description:
      "Alle 2016 Blöcke (≈2 Wochen) passt Bitcoin die Difficulty automatisch an: War die Epoche zu schnell, wird's schwieriger — war sie zu langsam, wird's leichter. So bleibt die durchschnittliche Blockzeit bei ≈10 Minuten.",
  },
];

export const BLOCK_HEADER_FIELDS: BlockHeaderField[] = [
  {
    key: "version",
    label: "Version",
    description:
      "Protokollversion des Blocks. Signalisiert, welche Regeln und Soft-Fork-Features der Miner unterstützt.",
    example: "02000000",
  },
  {
    key: "prevHash",
    label: "Previous Block Hash",
    description:
      "SHA-256d-Hash des vorherigen Block-Headers. Diese Verkettung macht die Blockchain unveränderlich.",
    example: "00000000000000000007...a3f2",
  },
  {
    key: "merkleRoot",
    label: "Merkle Root",
    description:
      "Wurzelhash des Merkle-Baums aller Transaktionen im Block. Fasst tausende TXs in 32 Bytes zusammen.",
    example: "4a5e1e4baab89f3a32...b6f3",
  },
  {
    key: "timestamp",
    label: "Zeitstempel",
    description:
      "Unix-Zeitstempel (Sekunden seit 1970). Muss grob korrekt sein — Nodes akzeptieren nur ±2h Abweichung.",
    example: "1231006505",
  },
  {
    key: "bits",
    label: "Difficulty Bits",
    description:
      "Kompakte Darstellung des Targets (4 Bytes). Wird alle 2016 Blöcke angepasst, um die 10-Min-Blockzeit zu halten.",
    example: "1d00ffff",
  },
  {
    key: "nonce",
    label: "Nonce",
    description:
      "Die Zufallszahl, die der Miner variiert (0 bis 2³²−1). Ziel: einen Hash zu finden, der unter dem Target liegt.",
    example: "2083236893",
  },
];

export const SAMPLE_BLOCK_HEADER: BlockHeaderData = {
  version: "02000000",
  prevHash:
    "000000000000000000076c2b3f9a31e3b42c5ec8a3b1d7f84a2e6c5d8b9f3a21",
  merkleRoot:
    "4a5e1e4baab89f3a3251818a9c1d7f6b3e2d4c5a8f7e6d9b0c1a2b3c4d5e6f70",
  timestamp: 1710000000,
  bits: "1d00ffff",
  nonce: 0,
};

export const NONCES_PER_FRAME = 200;

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 5;
export const DIFFICULTY_DEFAULT = 2;

export const DEFAULT_MINERS = [
  { id: "you", name: "Du", hashrate: 50 },
  { id: "miner-a", name: "Miner A", hashrate: 30 },
  { id: "miner-b", name: "Miner B", hashrate: 60 },
  { id: "miner-c", name: "Miner C", hashrate: 40 },
];

export const TARGET_BLOCK_TIME = 600; // 10 minutes in seconds
export const BLOCKS_PER_EPOCH = 2016;

export const FIELD_COLORS: Record<
  keyof BlockHeaderData,
  { text: string; bg: string; border: string }
> = {
  version: {
    text: "text-accent-primary",
    bg: "bg-accent-primary/20",
    border: "border-accent-primary/40",
  },
  prevHash: {
    text: "text-accent-secondary",
    bg: "bg-accent-secondary/20",
    border: "border-accent-secondary/40",
  },
  merkleRoot: {
    text: "text-accent-success",
    bg: "bg-accent-success/25",
    border: "border-accent-success/40",
  },
  timestamp: {
    text: "text-accent-warning",
    bg: "bg-accent-warning/25",
    border: "border-accent-warning/40",
  },
  bits: {
    text: "text-accent-danger",
    bg: "bg-accent-danger/20",
    border: "border-accent-danger/40",
  },
  nonce: {
    text: "text-text-primary",
    bg: "bg-white/10",
    border: "border-white/30",
  },
};

export const FIELD_BYTES: Record<keyof BlockHeaderData, number> = {
  version: 4,
  prevHash: 32,
  merkleRoot: 32,
  timestamp: 4,
  bits: 4,
  nonce: 4,
};

export const THREE_COLORS = {
  bgPrimary: 0x0a0e17,
  bgSecondary: 0x111827,
  bgCard: 0x1a1f2e,
  accentPrimary: 0x22d3ee,
  accentSecondary: 0x8b5cf6,
  accentSuccess: 0x10b981,
  accentWarning: 0xf59e0b,
  accentDanger: 0xef4444,
  textPrimary: 0xe2e8f0,
  borderSubtle: 0x1e293b,
} as const;

export const FIELD_HEX_COLORS: Record<keyof BlockHeaderData, number> = {
  version: 0x22d3ee,
  prevHash: 0x8b5cf6,
  merkleRoot: 0x10b981,
  timestamp: 0xf59e0b,
  bits: 0xef4444,
  nonce: 0xe2e8f0,
};

export const DIFFICULTY_COMPARISON = [
  { difficulty: 1, expectedAttempts: 16, label: "16" },
  { difficulty: 2, expectedAttempts: 256, label: "256" },
  { difficulty: 3, expectedAttempts: 4096, label: "4.096" },
  { difficulty: 4, expectedAttempts: 65536, label: "65.536" },
  { difficulty: 5, expectedAttempts: 1048576, label: "1.048.576" },
];
