import { secp256k1 } from "@noble/curves/secp256k1";
import type { MasterKey } from "./types";

/** Cast Uint8Array to BufferSource for Web Crypto API (TS 5.7+ compat) */
const asBuf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

const bytesToBigInt = (b: Uint8Array): bigint =>
  b.reduce((acc, x) => (acc << 8n) | BigInt(x), 0n);

const bigIntToBytes32 = (n: bigint): Uint8Array => {
  const out = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return out;
};

/** BIP-32 CKDpriv step: child key = (IL + parent key) mod n */
function addPrivateKeysModN(il: Uint8Array, parent: Uint8Array): Uint8Array {
  const n = secp256k1.CURVE.n;
  return bigIntToBytes32((bytesToBigInt(il) + bytesToBigInt(parent)) % n);
}

export const toHex = (b: Uint8Array): string =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

export const fmtHex = (h: string, n = 20): string =>
  h.length > n * 2 + 3 ? `${h.slice(0, n)}···${h.slice(-8)}` : h;

export const splitHex = (h: string, size = 8): string[] =>
  h.match(new RegExp(`.{1,${size}}`, "g")) || [];

export async function mnemonicToSeed(
  mnemonic: string,
  passphrase = ""
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey(
    "raw",
    enc.encode(mnemonic.normalize("NFKD")),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(("mnemonic" + passphrase).normalize("NFKD")),
      iterations: 2048,
      hash: "SHA-512",
    },
    km,
    512
  );
  return new Uint8Array(bits);
}

export async function seedToMaster(seed: Uint8Array): Promise<MasterKey> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("Bitcoin seed"),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const I = new Uint8Array(await crypto.subtle.sign("HMAC", key, asBuf(seed)));
  return { priv: I.slice(0, 32), chain: I.slice(32) };
}

/**
 * BIP-32 private child derivation (CKDpriv).
 * Hardened:     I = HMAC-SHA512(chain, 0x00 || k_par || i)
 * Non-hardened: I = HMAC-SHA512(chain, ser_P(K_par) || i)
 * k_child = (I_L + k_par) mod n, c_child = I_R
 */
export async function childDerive(
  priv: Uint8Array,
  chain: Uint8Array,
  idx: number,
  hardened: boolean
): Promise<MasterKey> {
  const data = new Uint8Array(37);
  const i = hardened ? (idx | 0x80000000) >>> 0 : idx;
  if (hardened) {
    data[0] = 0x00;
    data.set(priv, 1);
  } else {
    data.set(secp256k1.getPublicKey(priv, true), 0);
  }
  new DataView(data.buffer).setUint32(33, i, false);
  const key = await crypto.subtle.importKey(
    "raw",
    asBuf(chain),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const I = new Uint8Array(await crypto.subtle.sign("HMAC", key, asBuf(data)));
  return { priv: addPrivateKeysModN(I.slice(0, 32), priv), chain: I.slice(32) };
}

export async function bip85ExtractEntropy(
  derivedPrivKey: Uint8Array
): Promise<Uint8Array> {
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("bip-entropy-from-k"),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", hmacKey, asBuf(derivedPrivKey))
  );
}

export async function entropyToMnemonic(
  entropyBytes: Uint8Array,
  wordlist: string[]
): Promise<string[]> {
  const hashBuf = await crypto.subtle.digest("SHA-256", asBuf(entropyBytes));
  const hashArr = new Uint8Array(hashBuf);
  const csLen = (entropyBytes.length * 8) / 32;
  let bits = "";
  for (const b of entropyBytes) bits += b.toString(2).padStart(8, "0");
  bits += hashArr[0].toString(2).padStart(8, "0").slice(0, csLen);
  const words: string[] = [];
  for (let i = 0; i < bits.length; i += 11) {
    words.push(wordlist[parseInt(bits.slice(i, i + 11), 2)]);
  }
  return words.filter(Boolean);
}
