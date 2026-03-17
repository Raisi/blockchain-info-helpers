export interface Bip85Step {
  id: number;
  title: string;
  description: string;
  color: string;
}

export const BIP85_STEPS: Bip85Step[] = [
  {
    id: 1,
    title: "Warum BIP-85?",
    description: "Das Problem und die Lösung",
    color: "#fb7185",
  },
  {
    id: 2,
    title: "Der Ableitungsprozess",
    description: "Von Master Key zu Child Entropy",
    color: "#fb7185",
  },
  {
    id: 3,
    title: "Child Seed Explorer",
    description: "Mehrere Children vergleichen",
    color: "#fb7185",
  },
  {
    id: 4,
    title: "Sicherheit & Praxis",
    description: "Sicherheitsmodell und Tipps",
    color: "#fb7185",
  },
];

export const BIP85_COLOR = "#fb7185";

export const DEFAULT_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

export const WORDLIST_URL =
  "https://cdn.jsdelivr.net/gh/bitcoin/bips@master/bip-0039/english.txt";

export const BIP85_APPS = {
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
} as const;
