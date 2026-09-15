import { describe, expect, it } from "vitest";
import { computeBitDiff, hexToBinary, meetsTarget, sha256, targetPrefix } from "./crypto-utils";

// FIPS 180-4 SHA-256 test vectors
const SHA256_EMPTY = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const SHA256_ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

describe("hashing/crypto-utils", () => {
  it("sha256 matches FIPS 180-4 vectors", async () => {
    expect(await sha256("")).toBe(SHA256_EMPTY);
    expect(await sha256("abc")).toBe(SHA256_ABC);
  });

  it("hexToBinary expands each nibble to 4 bits", () => {
    expect(hexToBinary("0f")).toBe("00001111");
    expect(hexToBinary("a")).toBe("1010");
    expect(hexToBinary(SHA256_ABC)).toHaveLength(256);
  });

  it("computeBitDiff counts differing bits over 256 positions", () => {
    const a = "0".repeat(256);
    const b = "1".repeat(8) + "0".repeat(248);
    const { diffs, changedCount } = computeBitDiff(a, b);
    expect(changedCount).toBe(8);
    expect(diffs).toHaveLength(256);
    expect(diffs.slice(0, 8).every(Boolean)).toBe(true);
    expect(diffs.slice(8).some(Boolean)).toBe(false);
  });

  it("meetsTarget checks leading hex zeros", () => {
    expect(meetsTarget("000abc", 3)).toBe(true);
    expect(meetsTarget("000abc", 4)).toBe(false);
    expect(meetsTarget("abc", 0)).toBe(true);
  });

  it("targetPrefix pads to 64 characters", () => {
    expect(targetPrefix(3)).toBe("000" + "x".repeat(61));
    expect(targetPrefix(0)).toHaveLength(64);
  });
});
