import { describe, expect, it } from "vitest";
import {
  computeTarget,
  estimateExpectedAttempts,
  hashBelowTarget,
  hashBlockHeader,
  serializeBlockHeader,
} from "./crypto-utils";
import type { BlockHeaderData } from "./types";

const header: BlockHeaderData = {
  version: "20000000",
  prevHash: "00".repeat(32),
  merkleRoot: "ab".repeat(32),
  timestamp: 0x65f0c1a0,
  bits: "17034219",
  nonce: 0x0000002a,
};

describe("mining/crypto-utils", () => {
  it("serializeBlockHeader concatenates fields with fixed-width hex", () => {
    const s = serializeBlockHeader(header);
    expect(s.startsWith("20000000" + "00".repeat(32) + "ab".repeat(32))).toBe(true);
    expect(s.endsWith("17034219" + "0000002a")).toBe(true);
    expect(s).toHaveLength(8 + 64 + 64 + 8 + 8 + 8);
  });

  it("hashBlockHeader is deterministic and nonce-sensitive", async () => {
    const a = await hashBlockHeader(header);
    const b = await hashBlockHeader({ ...header, nonce: header.nonce + 1 });
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashBlockHeader(header)).toBe(a);
    expect(b).not.toBe(a);
  });

  it("computeTarget produces a 64-char hex threshold", () => {
    expect(computeTarget(3)).toBe("000" + "f".repeat(61));
    expect(computeTarget(0)).toBe("f".repeat(64));
  });

  it("hashBelowTarget compares lexicographically on hex", () => {
    const target = computeTarget(2);
    expect(hashBelowTarget("00ab" + "0".repeat(60), target)).toBe(true);
    expect(hashBelowTarget("01" + "0".repeat(62), target)).toBe(false);
  });

  it("estimateExpectedAttempts is 16^difficulty", () => {
    expect(estimateExpectedAttempts(0)).toBe(1);
    expect(estimateExpectedAttempts(3)).toBe(4096);
  });
});
