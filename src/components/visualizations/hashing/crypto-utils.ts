export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBinary(hex: string): string {
  return hex
    .split("")
    .map((c) => parseInt(c, 16).toString(2).padStart(4, "0"))
    .join("");
}

export function computeBitDiff(binaryA: string, binaryB: string): { diffs: boolean[]; changedCount: number } {
  const diffs: boolean[] = [];
  let changedCount = 0;
  for (let i = 0; i < 256; i++) {
    const changed = binaryA[i] !== binaryB[i];
    diffs.push(changed);
    if (changed) changedCount++;
  }
  return { diffs, changedCount };
}

export function meetsTarget(hex: string, difficulty: number): boolean {
  const prefix = "0".repeat(difficulty);
  return hex.startsWith(prefix);
}

export function targetPrefix(difficulty: number): string {
  return "0".repeat(difficulty) + "x".repeat(Math.max(0, 64 - difficulty));
}
