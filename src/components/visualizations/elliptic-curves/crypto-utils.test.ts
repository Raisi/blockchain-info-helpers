import { describe, expect, it } from "vitest";
import { bytesToHex, generatePrivateKey, getPublicKey, SECP256K1_PARAMS } from "./crypto-utils";

describe("elliptic-curves/crypto-utils", () => {
  it("private key 1 yields the generator point G", () => {
    const one = new Uint8Array(32);
    one[31] = 1;
    const pub = getPublicKey(one);
    expect(pub.x.toUpperCase()).toBe(SECP256K1_PARAMS.Gx);
    expect(pub.y.toUpperCase()).toBe(SECP256K1_PARAMS.Gy);
    // Gy is even → 0x02 prefix
    expect(bytesToHex(pub.compressed).toUpperCase()).toBe("02" + SECP256K1_PARAMS.Gx);
  });

  it("private key 2 yields 2G", () => {
    const two = new Uint8Array(32);
    two[31] = 2;
    const pub = getPublicKey(two);
    expect(pub.x).toBe("c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5");
    expect(pub.y).toBe("1ae168fea63dc339a3c58419466ceaeef7f632653266d0e1236431a950cfe52a");
  });

  it("generatePrivateKey returns 32 bytes below the curve order", () => {
    const k = generatePrivateKey();
    expect(k).toHaveLength(32);
    const n = BigInt("0x" + SECP256K1_PARAMS.n);
    const kBig = BigInt("0x" + bytesToHex(k));
    expect(kBig > 0n && kBig < n).toBe(true);
  });
});
