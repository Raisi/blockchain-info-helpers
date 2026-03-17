import type { StepDef, FlowNodeDef } from "./types";

export const DEFAULT_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

export const COIN_TYPES: Record<number, string> = {
  0: "Bitcoin (BTC)",
  60: "Ethereum (ETH)",
  195: "Tron (TRX)",
  501: "Solana (SOL)",
};

export const STEPS: StepDef[] = [
  { id: 0, label: "Übersicht", icon: "🗺️" },
  { id: 1, label: "BIP39", icon: "🎲" },
  { id: 2, label: "PBKDF2", icon: "🔑" },
  { id: 3, label: "Master", icon: "🌱" },
  { id: 4, label: "Child", icon: "🌳" },
  { id: 5, label: "BIP44", icon: "📍" },
];

export const STEP_COLORS = [
  "var(--accent-primary)",
  "var(--accent-warning)",
  "var(--accent-success)",
  "var(--accent-primary)",
  "var(--accent-secondary)",
  "var(--accent-danger)",
];

export const FLOW_NODES: FlowNodeDef[] = [
  { icon: "🎲", label: "Entropie", color: "var(--accent-warning)" },
  { icon: "📝", label: "BIP39", color: "var(--accent-warning)" },
  { icon: "🔁", label: "PBKDF2", color: "var(--accent-success)" },
  { icon: "🌱", label: "Seed", color: "var(--accent-success)" },
  { icon: "🔐", label: "HMAC", color: "var(--accent-primary)" },
  { icon: "🗝️", label: "Master", color: "var(--accent-secondary)" },
  { icon: "🌳", label: "BIP32", color: "var(--accent-secondary)" },
  { icon: "📍", label: "BIP44", color: "var(--accent-danger)" },
  { icon: "💎", label: "Key", color: "var(--accent-success)" },
];

export const STEP_TO_FLOW: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 5,
  4: 6,
  5: 7,
};

export const BIP85_APPS: Record<
  string,
  { label: string; icon: string; desc: string; purpose: number }
> = {
  bip39: {
    label: "BIP39 Mnemonic",
    icon: "🎲",
    desc: "Child Mnemonic aus Entropy",
    purpose: 39,
  },
  wif: {
    label: "WIF Privkey",
    icon: "🔐",
    desc: "Bitcoin Private Key (WIF)",
    purpose: 2,
  },
  hex: {
    label: "HEX Entropie",
    icon: "📊",
    desc: "Rohe Hex-Entropie",
    purpose: 128169,
  },
};
