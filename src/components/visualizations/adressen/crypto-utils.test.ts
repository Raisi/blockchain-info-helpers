import { describe, expect, it } from "vitest";
import { computeAddresses, generateRandomPubkey, isValidPubkey } from "./crypto-utils";

// Compressed secp256k1 generator point G. Its P2WPKH address is the BIP-173 test vector.
const G_COMPRESSED = "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
const G_P2PKH = "1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH";
const G_P2WPKH = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
const G_HASH160 = "751e76e8199196d454941c45d1b3a323f1433bd6";

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

describe("adressen/crypto-utils", () => {
  it("computeAddresses derives P2PKH and P2WPKH for the generator point", () => {
    const r = computeAddresses(G_COMPRESSED);
    expect(toHex(r.hash160)).toBe(G_HASH160);
    expect(r.p2pkhAddress).toBe(G_P2PKH);
    expect(r.p2wpkhAddress).toBe(G_P2WPKH);
  });

  it("Base58Check payload is version || hash160 || 4-byte checksum", () => {
    const r = computeAddresses(G_COMPRESSED);
    expect(r.p2pkhVersioned[0]).toBe(0x00);
    expect(r.p2pkhVersioned).toHaveLength(21);
    expect(r.p2pkhChecksum).toHaveLength(4);
    expect(r.p2pkhPayload).toHaveLength(25);
    expect(toHex(r.p2pkhPayload)).toBe(toHex(r.p2pkhVersioned) + toHex(r.p2pkhChecksum));
  });

  it("isValidPubkey accepts compressed keys only", () => {
    expect(isValidPubkey(G_COMPRESSED)).toBe(true);
    expect(isValidPubkey(G_COMPRESSED.toUpperCase())).toBe(true);
    expect(isValidPubkey("04" + G_COMPRESSED.slice(2))).toBe(false);
    expect(isValidPubkey(G_COMPRESSED.slice(0, 65))).toBe(false);
  });

  it("generateRandomPubkey returns a valid compressed key", () => {
    const hex = generateRandomPubkey();
    expect(isValidPubkey(hex)).toBe(true);
    expect(() => computeAddresses(hex)).not.toThrow();
  });
});
