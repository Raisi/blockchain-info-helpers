import { describe, expect, it } from "vitest";
import {
  computeMerkleRoot,
  hashBlock,
  hashTransaction,
  meetsTarget,
  mineBlock,
} from "./crypto-utils";
import type { BlockHeader } from "./types";

const header: BlockHeader = {
  version: 1,
  prevHash: "0".repeat(64),
  merkleRoot: "a".repeat(64),
  timestamp: 1_700_000_000,
  difficulty: 1,
  nonce: 0,
};

describe("blockchain-structure/crypto-utils", () => {
  it("hashTransaction depends on every field", async () => {
    const base = { from: "alice", to: "bob", amount: "1.5" };
    const h = await hashTransaction(base);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashTransaction({ ...base, amount: "1.6" })).not.toBe(h);
    expect(await hashTransaction({ ...base, to: "carol" })).not.toBe(h);
  });

  it("computeMerkleRoot with one leaf returns that leaf", async () => {
    const { root, tree } = await computeMerkleRoot(["aa"]);
    expect(root).toBe("aa");
    expect(tree.isLeaf).toBe(true);
  });

  it("computeMerkleRoot pairs leaves and duplicates the odd last one", async () => {
    const two = await computeMerkleRoot(["aa", "bb"]);
    expect(two.tree.isLeaf).toBe(false);
    expect(two.tree.left?.hash).toBe("aa");
    expect(two.tree.right?.hash).toBe("bb");

    // Three leaves: level 1 = [H(aa+bb), H(cc+cc)]
    const three = await computeMerkleRoot(["aa", "bb", "cc"]);
    expect(three.tree.right?.left?.hash).toBe("cc");
    expect(three.tree.right?.right?.hash).toBe("cc");
    expect(three.root).not.toBe(two.root);
  });

  it("computeMerkleRoot with no leaves returns a fixed empty hash", async () => {
    const a = await computeMerkleRoot([]);
    const b = await computeMerkleRoot([]);
    expect(a.root).toBe(b.root);
    expect(a.root).toMatch(/^[0-9a-f]{64}$/);
  });

  it("mineBlock finds a nonce whose hash meets difficulty 1", async () => {
    const r = await mineBlock(header, 1, 0, 200);
    expect(r.found).toBe(true);
    expect(meetsTarget(r.hash, 1)).toBe(true);
    expect(await hashBlock({ ...header, nonce: r.nonce })).toBe(r.hash);
  });

  it("mineBlock reports the next start nonce when the batch is exhausted", async () => {
    const r = await mineBlock(header, 64, 10, 5);
    expect(r.found).toBe(false);
    expect(r.nonce).toBe(15);
  });
});
