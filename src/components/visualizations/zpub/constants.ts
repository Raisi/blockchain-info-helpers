import type { ZpubStep } from "./types";

export const ZPUB_STEPS: ZpubStep[] = [
  {
    id: 1,
    title: "Mnemonic → Seed",
    description: "PBKDF2-HMAC-SHA512 (2048 Iterationen)",
    color: "var(--accent-warning)",
  },
  {
    id: 2,
    title: "Seed → Master Keys",
    description: 'HMAC-SHA512 mit Key "Bitcoin seed"',
    color: "var(--accent-success)",
  },
  {
    id: 3,
    title: "Hardened Derivation (3×)",
    description: "m/84'/0'/0' — Purpose → Coin → Account",
    color: "var(--accent-secondary)",
  },
  {
    id: 4,
    title: "Private → Public Key",
    description: "EC-Multiplikation auf secp256k1",
    color: "var(--accent-primary)",
  },
  {
    id: 5,
    title: "Serialisierung → zpub",
    description: "78-Byte Struktur + SHA256² + Base58Check",
    color: "#fb7185",
  },
];

export const DEFAULT_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

export const DERIVATION_PATH = "m / 84' / 0' / 0'";

export const BYTE_FIELD_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  version:     { bg: "bg-[#fb7185]/15", text: "text-[#fb7185]",        label: "Version (4B)" },
  depth:       { bg: "bg-accent-warning/15", text: "text-accent-warning",    label: "Depth (1B)" },
  fingerprint: { bg: "bg-accent-success/15", text: "text-accent-success",    label: "Parent Fingerprint (4B)" },
  childIndex:  { bg: "bg-accent-secondary/15", text: "text-accent-secondary", label: "Child Index (4B)" },
  chainCode:   { bg: "bg-accent-primary/15", text: "text-accent-primary",    label: "Chain Code (32B)" },
  publicKey:   { bg: "bg-[#34d399]/15", text: "text-[#34d399]",        label: "Public Key (33B)" },
  checksum:    { bg: "bg-accent-danger/15", text: "text-accent-danger",     label: "Checksum (4B)" },
};
