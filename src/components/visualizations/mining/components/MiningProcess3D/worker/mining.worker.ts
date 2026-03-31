/// <reference lib="webworker" />

const SAMPLE_HEADER =
  "02000000" +
  "000000000000000000076c2b3f9a31e3b42c5ec8a3b1d7f84a2e6c5d8b9f3a21" +
  "4a5e1e4baab89f3a3251818a9c1d7f6b3e2d4c5a8f7e6d9b0c1a2b3c4d5e6f70" +
  "65f4e200" +
  "1d00ffff";

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface MineBatchMessage {
  type: "MINE_BATCH";
  startNonce: number;
  batchSize: number;
  difficulty: number;
}

self.onmessage = async (e: MessageEvent<MineBatchMessage>) => {
  const { startNonce, batchSize, difficulty } = e.data;
  const targetPrefix = "0".repeat(difficulty);

  const hashes: { nonce: number; hash: string; meetsTarget: boolean }[] = [];
  let foundNonce: number | null = null;
  let foundHash: string | null = null;

  for (let i = 0; i < batchSize; i++) {
    const nonce = startNonce + i;
    const nonceHex = nonce.toString(16).padStart(8, "0");
    const input = SAMPLE_HEADER + nonceHex;
    const hash = await sha256(input);
    const meetsTarget = hash.startsWith(targetPrefix);

    // Only send every 10th hash to reduce message size (unless it meets target)
    if (meetsTarget || i % 10 === 0) {
      hashes.push({ nonce, hash, meetsTarget });
    }

    if (meetsTarget) {
      foundNonce = nonce;
      foundHash = hash;
      break;
    }
  }

  self.postMessage({
    startNonce,
    endNonce: foundNonce !== null ? foundNonce + 1 : startNonce + batchSize,
    hashes,
    foundNonce,
    foundHash,
  });
};
