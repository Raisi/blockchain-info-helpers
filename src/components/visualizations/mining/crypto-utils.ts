import { sha256 } from "@/components/visualizations/hashing/crypto-utils";
import type { BlockHeaderData } from "./types";

export { sha256 };

export function serializeBlockHeader(header: BlockHeaderData): string {
  return (
    header.version +
    header.prevHash +
    header.merkleRoot +
    header.timestamp.toString(16).padStart(8, "0") +
    header.bits +
    header.nonce.toString(16).padStart(8, "0")
  );
}

export async function hashBlockHeader(
  header: BlockHeaderData
): Promise<string> {
  const serialized = serializeBlockHeader(header);
  return sha256(serialized);
}

export function computeTarget(difficulty: number): string {
  const leadingZeros = difficulty;
  return "0".repeat(leadingZeros) + "f".repeat(64 - leadingZeros);
}

export function hashBelowTarget(hash: string, target: string): boolean {
  return hash < target;
}

export function estimateExpectedAttempts(difficulty: number): number {
  return Math.pow(16, difficulty);
}
