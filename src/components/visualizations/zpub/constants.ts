import type { ZpubStep } from "./types";

export const ZPUB_STEPS: ZpubStep[] = [
  {
    id: 1,
    title: "Private → Public Key",
    description: "EC-Multiplikation auf secp256k1",
    color: "var(--accent-primary)",
  },
  {
    id: 2,
    title: "Anatomie eines zpub",
    description: "78-Byte Struktur + Base58Check Encoding",
    color: "#fb7185",
  },
  {
    id: 3,
    title: "Non-Hardened Derivation",
    description: "Child Public Keys ohne Private Key ableiten",
    color: "var(--accent-secondary)",
  },
  {
    id: 4,
    title: "Adress-Ableitung",
    description: "Vom zpub zur bc1q-Adresse",
    color: "var(--accent-success)",
  },
  {
    id: 5,
    title: "Watch-Only Wallet",
    description: "Was ein zpub kann — und was nicht",
    color: "var(--accent-warning)",
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
