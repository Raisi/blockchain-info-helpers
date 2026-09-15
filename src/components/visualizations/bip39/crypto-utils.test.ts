import { describe, expect, it } from "vitest";
import { b2hN, chk, h2b, randHex, sha256hex } from "./crypto-utils";

describe("bip39/crypto-utils", () => {
  it("sha256hex hashes raw bytes given as hex", async () => {
    // sha256 of the single byte 0x00 … 0x0f? Use the FIPS "abc" vector via its bytes.
    expect(await sha256hex("616263")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("zero entropy yields the BIP-39 checksum bits for 'abandon … about'", async () => {
    // 128-bit entropy of all zeros → sha256 first byte 0x37 → checksum nibble 0011 → word index 3 = "about"
    const entropy = "00".repeat(16);
    const hash = await sha256hex(entropy);
    expect(hash.startsWith("37")).toBe(true);
    const checksumBits = h2b(hash).slice(0, 4);
    expect(checksumBits).toBe("0011");
    const bits = h2b(entropy) + checksumBits;
    const groups = chk(bits, 11);
    expect(groups).toHaveLength(12);
    expect(groups.slice(0, 11).every((g) => parseInt(g, 2) === 0)).toBe(true);
    expect(parseInt(groups[11], 2)).toBe(3);
  });

  it("h2b and b2hN are inverse on nibble-aligned input", () => {
    expect(h2b("f0")).toBe("11110000");
    expect(b2hN("11110000", 8)).toBe("f0");
    expect(b2hN("1", 8)).toBe("80"); // right-padded with zeros
  });

  it("chk splits into fixed-size chunks", () => {
    expect(chk("abcdefg", 3)).toEqual(["abc", "def", "g"]);
  });

  it("randHex returns n bytes as hex", () => {
    expect(randHex(16)).toMatch(/^[0-9a-f]{32}$/);
  });
});
