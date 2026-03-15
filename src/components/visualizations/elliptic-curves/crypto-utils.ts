import { secp256k1 } from "@noble/curves/secp256k1";

/**
 * Generates a random 32-byte private key.
 */
export function generatePrivateKey(): Uint8Array {
  return secp256k1.utils.randomPrivateKey();
}

/**
 * Derives the public key from a private key.
 * Returns both compressed and uncompressed forms plus affine coordinates.
 */
export function getPublicKey(privKey: Uint8Array): {
  compressed: Uint8Array;
  x: string;
  y: string;
} {
  const compressed = secp256k1.getPublicKey(privKey, true);
  const point = secp256k1.ProjectivePoint.fromPrivateKey(privKey).toAffine();
  return {
    compressed,
    x: point.x.toString(16).padStart(64, "0"),
    y: point.y.toString(16).padStart(64, "0"),
  };
}

/**
 * Converts a Uint8Array to hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * secp256k1 curve parameters as hex strings.
 */
export const SECP256K1_PARAMS = {
  p: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F",
  n: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
  Gx: "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798",
  Gy: "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8",
  a: "0",
  b: "7",
} as const;
