import type { BlockHeader, MerkleNode, Transaction } from "./types";

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashTransaction(tx: Omit<Transaction, "hash" | "id">): Promise<string> {
  return sha256hex(`${tx.from}:${tx.to}:${tx.amount}`);
}

export async function hashBlock(header: BlockHeader): Promise<string> {
  const serialized = [
    header.version.toString(),
    header.prevHash,
    header.merkleRoot,
    header.timestamp.toString(),
    header.difficulty.toString(),
    header.nonce.toString(),
  ].join("|");
  return sha256hex(serialized);
}

export async function computeMerkleRoot(txHashes: string[]): Promise<{ root: string; tree: MerkleNode }> {
  if (txHashes.length === 0) {
    const emptyHash = await sha256hex("empty");
    return { root: emptyHash, tree: { hash: emptyHash, isLeaf: true } };
  }

  let nodes: MerkleNode[] = txHashes.map((hash, i) => ({
    hash,
    isLeaf: true,
    txId: `tx-${i}`,
  }));

  while (nodes.length > 1) {
    const nextLevel: MerkleNode[] = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];
      const combinedHash = await sha256hex(left.hash + right.hash);
      nextLevel.push({
        hash: combinedHash,
        left,
        right: i + 1 < nodes.length ? right : { ...right },
        isLeaf: false,
      });
    }
    nodes = nextLevel;
  }

  return { root: nodes[0].hash, tree: nodes[0] };
}

export function meetsTarget(hash: string, difficulty: number): boolean {
  return hash.startsWith("0".repeat(difficulty));
}

export async function mineBlock(
  header: BlockHeader,
  difficulty: number,
  startNonce: number,
  batchSize: number
): Promise<{ found: boolean; hash: string; nonce: number }> {
  for (let i = 0; i < batchSize; i++) {
    const nonce = startNonce + i;
    const h = await hashBlock({ ...header, nonce });
    if (meetsTarget(h, difficulty)) {
      return { found: true, hash: h, nonce };
    }
  }
  return { found: false, hash: "", nonce: startNonce + batchSize };
}
