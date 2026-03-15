import { secp256k1 } from "@noble/curves/secp256k1";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { sha256 } from "@noble/hashes/sha256";
import { base58 } from "@scure/base";
import { bech32 } from "@scure/base";
import type { DerivationLevel, SerializedKey, VersionInfo } from "./types";

/** Cast Uint8Array to BufferSource for Web Crypto API (TS 5.7+ compat) */
const asBuf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

/* ── Core BIP32 operations (Web Crypto API) ── */

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

export async function seedToMaster(
  seed: Uint8Array
): Promise<{ priv: Uint8Array; chain: Uint8Array }> {
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

export async function hardenedChildDerive(
  priv: Uint8Array,
  chain: Uint8Array,
  idx: number
): Promise<{ priv: Uint8Array; chain: Uint8Array }> {
  const data = new Uint8Array(37);
  const i = (idx | 0x80000000) >>> 0;
  data[0] = 0x00;
  data.set(priv, 1);
  new DataView(data.buffer).setUint32(33, i, false);
  const key = await crypto.subtle.importKey(
    "raw",
    asBuf(chain),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const I = new Uint8Array(await crypto.subtle.sign("HMAC", key, asBuf(data)));

  // Child private key = (IL + parent private key) mod n
  const IL = I.slice(0, 32);
  const childPriv = addPrivateKeys(IL, priv);

  return { priv: childPriv, chain: I.slice(32) };
}

/** Add two 32-byte private keys mod secp256k1 order n */
function addPrivateKeys(a: Uint8Array, b: Uint8Array): Uint8Array {
  const n = secp256k1.CURVE.n;
  const aBig = bytesToBigInt(a);
  const bBig = bytesToBigInt(b);
  const sum = (aBig + bBig) % n;
  return bigIntToBytes(sum, 32);
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const b of bytes) {
    result = (result << 8n) | BigInt(b);
  }
  return result;
}

function bigIntToBytes(n: bigint, length: number): Uint8Array {
  const result = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    result[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return result;
}

/* ── Public Key derivation ── */

export function privateToPublicKey(privKey: Uint8Array): Uint8Array {
  // Returns compressed public key (33 bytes)
  return secp256k1.getPublicKey(privKey, true);
}

/* ── Hash utilities ── */

export function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

export function doubleSha256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/* ── Serialization ── */

export const VERSION_BYTES: VersionInfo[] = [
  {
    prefix: "xpub",
    versionHex: "0488B21E",
    addressType: "Legacy P2PKH (1xxx)",
    bytes: new Uint8Array([0x04, 0x88, 0xb2, 0x1e]),
  },
  {
    prefix: "ypub",
    versionHex: "049D7CB2",
    addressType: "SegWit wrapped P2SH (3xxx)",
    bytes: new Uint8Array([0x04, 0x9d, 0x7c, 0xb2]),
  },
  {
    prefix: "zpub",
    versionHex: "04B24746",
    addressType: "Native SegWit P2WPKH (bc1q)",
    bytes: new Uint8Array([0x04, 0xb2, 0x47, 0x46]),
  },
];

export function serializeExtendedKey(
  pubkey: Uint8Array,
  chainCode: Uint8Array,
  depth: number,
  fingerprint: Uint8Array,
  childIndex: number,
  versionBytes: Uint8Array
): SerializedKey {
  const raw78 = new Uint8Array(78);
  raw78.set(versionBytes, 0);       // 4 bytes version
  raw78[4] = depth;                  // 1 byte depth
  raw78.set(fingerprint, 5);         // 4 bytes parent fingerprint
  new DataView(raw78.buffer).setUint32(9, childIndex, false); // 4 bytes child index
  raw78.set(chainCode, 13);          // 32 bytes chain code
  raw78.set(pubkey, 45);             // 33 bytes public key

  const checksum = doubleSha256(raw78).slice(0, 4);
  const full82 = new Uint8Array(82);
  full82.set(raw78, 0);
  full82.set(checksum, 78);

  const encoded = base58.encode(full82);

  return {
    version: versionBytes,
    depth,
    fingerprint,
    childIndex,
    chainCode,
    publicKey: pubkey,
    raw78,
    checksum,
    full82,
    encoded,
  };
}

/* ── Address generation ── */

export function pubkeyToP2wpkhAddress(pubkey: Uint8Array): string {
  const h = hash160(pubkey);
  // Bech32 encode: witness version 0 + 20-byte hash
  const words = bech32.toWords(h);
  words.unshift(0); // witness version
  return bech32.encode("bc", words);
}

/* ── Full derivation pipeline ── */

export async function fullZpubDerivation(
  mnemonic: string,
  passphrase = ""
): Promise<{
  seed: Uint8Array;
  masterPriv: Uint8Array;
  masterChain: Uint8Array;
  derivationLevels: DerivationLevel[];
  accountPubKey: Uint8Array;
  accountChainCode: Uint8Array;
  serialized: SerializedKey;
  addresses: string[];
}> {
  // Step 1: Mnemonic → Seed
  const seed = await mnemonicToSeed(mnemonic, passphrase);

  // Step 2: Seed → Master Keys
  const master = await seedToMaster(seed);

  // Step 3: Hardened Derivation m/84'/0'/0'
  const derivationPath = [
    { idx: 84, name: "Purpose (BIP84)" },
    { idx: 0, name: "Coin (Bitcoin)" },
    { idx: 0, name: "Account #0" },
  ];

  const derivationLevels: DerivationLevel[] = [];
  let current = { priv: master.priv, chain: master.chain };

  for (let i = 0; i < derivationPath.length; i++) {
    const { idx, name } = derivationPath[i];
    const prev = current;
    current = await hardenedChildDerive(prev.priv, prev.chain, idx);

    derivationLevels.push({
      depth: i + 1,
      path: `m/${derivationPath
        .slice(0, i + 1)
        .map((d) => `${d.idx}'`)
        .join("/")}`,
      name,
      index: (idx | 0x80000000) >>> 0,
      hardened: true,
      privKey: current.priv,
      chainCode: current.chain,
    });
  }

  // Step 4: Account Private → Public Key
  const accountPubKey = privateToPublicKey(current.priv);
  const accountChainCode = current.chain;

  // Parent fingerprint: first 4 bytes of HASH160 of parent's public key
  const parentPubKey = privateToPublicKey(
    derivationLevels.length >= 2
      ? derivationLevels[derivationLevels.length - 2].privKey
      : master.priv
  );
  const parentFingerprint = hash160(parentPubKey).slice(0, 4);

  // Step 5: Serialize to zpub
  const zpubVersion = VERSION_BYTES.find((v) => v.prefix === "zpub")!;
  const serialized = serializeExtendedKey(
    accountPubKey,
    accountChainCode,
    3, // depth = 3 (m/84'/0'/0')
    parentFingerprint,
    0x80000000, // Account 0 hardened
    zpubVersion.bytes
  );

  // Derive first few addresses: m/84'/0'/0'/0/i
  const addresses: string[] = [];
  // Non-hardened derivation for external chain (0)
  // For non-hardened, we use public key derivation
  // But since we have the private key, we can derive child private keys
  const externalChain = await normalChildDerive(current.priv, current.chain, 0);

  for (let i = 0; i < 5; i++) {
    const addrKey = await normalChildDerive(
      externalChain.priv,
      externalChain.chain,
      i
    );
    const addrPub = privateToPublicKey(addrKey.priv);
    addresses.push(pubkeyToP2wpkhAddress(addrPub));
  }

  return {
    seed,
    masterPriv: master.priv,
    masterChain: master.chain,
    derivationLevels,
    accountPubKey,
    accountChainCode,
    serialized,
    addresses,
  };
}

/** Non-hardened child derivation (uses public key in HMAC data) */
async function normalChildDerive(
  priv: Uint8Array,
  chain: Uint8Array,
  idx: number
): Promise<{ priv: Uint8Array; chain: Uint8Array }> {
  const pub = privateToPublicKey(priv);
  const data = new Uint8Array(37);
  data.set(pub, 0); // 33 bytes public key
  new DataView(data.buffer).setUint32(33, idx, false); // 4 bytes index
  const key = await crypto.subtle.importKey(
    "raw",
    asBuf(chain),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const I = new Uint8Array(await crypto.subtle.sign("HMAC", key, asBuf(data)));
  const childPriv = addPrivateKeys(I.slice(0, 32), priv);
  return { priv: childPriv, chain: I.slice(32) };
}

/* ── Hex helpers ── */

export const toHex = (b: Uint8Array): string =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

export const fmtHex = (h: string, n = 20): string =>
  h.length > n * 2 + 3 ? `${h.slice(0, n)}···${h.slice(-8)}` : h;

export const splitHex = (h: string, size = 8): string[] =>
  h.match(new RegExp(`.{1,${size}}`, "g")) || [];
