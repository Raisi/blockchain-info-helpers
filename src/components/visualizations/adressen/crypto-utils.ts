import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { base58, bech32 } from "@scure/base";

export type Step = 1 | 2 | 3 | 4;

export interface ComputedAddresses {
  sha256Result: Uint8Array;
  hash160: Uint8Array;
  p2pkhVersioned: Uint8Array;
  p2pkhChecksum: Uint8Array;
  p2pkhPayload: Uint8Array;
  p2pkhAddress: string;
  p2wpkhAddress: string;
}

export function isValidPubkey(hex: string): boolean {
  return /^(02|03)[0-9a-f]{64}$/.test(hex.toLowerCase());
}

export function generateRandomPubkey(): string {
  const privKey = secp256k1.utils.randomPrivateKey();
  const pubKeyBytes = secp256k1.getPublicKey(privKey, true);
  return bytesToHex(pubKeyBytes);
}

export function computeAddresses(pubkeyHex: string): ComputedAddresses {
  const pubBytes = hexToBytes(pubkeyHex);
  const sha256Result = sha256(pubBytes);
  const hash160 = ripemd160(sha256Result);

  // Base58Check manually (P2PKH)
  const versioned = new Uint8Array([0x00, ...hash160]);
  const checksumFull = sha256(sha256(versioned));
  const checksum = checksumFull.slice(0, 4);
  const payload25 = new Uint8Array([...versioned, ...checksum]);
  const p2pkhAddress = base58.encode(payload25);

  // Bech32 (P2WPKH)
  const words = bech32.toWords(hash160);
  const p2wpkhAddress = bech32.encode("bc", [0x00, ...words]);

  return {
    sha256Result,
    hash160,
    p2pkhVersioned: versioned,
    p2pkhChecksum: checksum,
    p2pkhPayload: payload25,
    p2pkhAddress,
    p2wpkhAddress,
  };
}

// ─── Test Vector Verification (runs once at module load in dev) ───────────────
// pubkey:  0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
// p2pkh:   1BpEi6DfDAUFd153wiGrvkiKW1ECQ8xCXe
// p2wpkh:  bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  try {
    const TV_PUBKEY = "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
    const TV_P2PKH = "1BpEi6DfDAUFd153wiGrvkiKW1ECQ8xCXe";
    const TV_P2WPKH = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
    const result = computeAddresses(TV_PUBKEY);
    console.assert(result.p2pkhAddress === TV_P2PKH,
      `Test vector P2PKH FAIL: expected ${TV_P2PKH}, got ${result.p2pkhAddress}`);
    console.assert(result.p2wpkhAddress === TV_P2WPKH,
      `Test vector P2WPKH FAIL: expected ${TV_P2WPKH}, got ${result.p2wpkhAddress}`);
    console.log("[AdressenVisualizer] Test vectors OK:", result.p2pkhAddress, result.p2wpkhAddress);
  } catch (e) {
    console.error("[AdressenVisualizer] Test vector check threw:", e);
  }
}
