import type { Transaction, BlockFieldColor } from "./types";

export const GENESIS_PREV_HASH = "0".repeat(64);

export const SAMPLE_TRANSACTIONS: Omit<Transaction, "id" | "hash">[] = [
  { from: "Alice", to: "Bob", amount: "0.5 BTC" },
  { from: "Bob", to: "Charlie", amount: "0.3 BTC" },
  { from: "Charlie", to: "Diana", amount: "1.0 BTC" },
  { from: "Diana", to: "Eve", amount: "0.2 BTC" },
];

export const BLOCK_FIELD_COLORS: BlockFieldColor[] = [
  { field: "version", label: "Version", color: "accent-primary" },
  { field: "prevHash", label: "Prev Hash", color: "accent-secondary" },
  { field: "merkleRoot", label: "Merkle Root", color: "accent-success" },
  { field: "timestamp", label: "Zeitstempel", color: "accent-warning" },
  { field: "difficulty", label: "Difficulty", color: "accent-danger" },
  { field: "nonce", label: "Nonce", color: "accent-primary" },
];

export const MINING_DIFFICULTY = 2;
export const NONCES_PER_FRAME = 300;
