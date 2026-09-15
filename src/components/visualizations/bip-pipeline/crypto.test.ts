import { describe, expect, it } from "vitest";
import { base58 } from "@scure/base";
import { secp256k1 } from "@noble/curves/secp256k1";
import {
  bip85ExtractEntropy,
  childDerive,
  entropyToMnemonic,
  mnemonicToSeed,
  seedToMaster,
  toHex,
} from "./crypto";

// Minimal stand-in for the 2048-word BIP-39 list: only indices 0 and 3 are exercised.
const STUB_WORDLIST = Array.from({ length: 2048 }, (_, i) =>
  i === 0 ? "abandon" : i === 3 ? "about" : `w${i}`,
);

// BIP-84 test vectors (bip-0084.mediawiki)
const MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const PUB_84_0_0_0_0 = "0330d54fd0dd420a6e5f8d3624f5f3482cae350f79d5f0753bf5beef9c2d91af3c";
const PUB_84_0_0_0_1 = "03e775fd51f0dfb8cd865d9ff1cca2a158cf651fe997fdc9fee9c1d3b5e995ea77";
const PUB_84_0_0_1_0 = "03025324888e429ab8e3dbaf1f7802648b9cd01e9b418485c5fa4c1b9b5700e1a6";

// BIP-85 test vector (bip-0085.mediawiki): master xprv, path m/83696968'/39'/0'/12'/0'
const BIP85_MASTER_XPRV =
  "xprv9s21ZrQH143K2LBWUUQRFXhucrQqBpKdRRxNVq2zBqsx8HVqFk2uYo8kmbaLLHRdqtQpUm98uKfu3vca1LqdGhUtyoFnCNkfmXRyPXLjbKb";
const BIP85_PATH = [83696968, 39, 0, 12, 0];
const BIP85_ENTROPY_12 = "6250b68daf746d12a24d58b4787a714b";

/** Decode an xprv: chain code at bytes 13..45, private key at 46..78 (after the 0x00 pad). */
function decodeXprv(xprv: string): { priv: Uint8Array; chain: Uint8Array } {
  const raw = base58.decode(xprv);
  expect(raw).toHaveLength(82);
  expect(toHex(raw.slice(0, 4))).toBe("0488ade4");
  return { chain: raw.slice(13, 45), priv: raw.slice(46, 78) };
}

describe("bip-pipeline/crypto — BIP-32 child derivation", () => {
  it("derives m/84'/0'/0'/0/0, 0/1 and 1/0 to the BIP-84 public keys", async () => {
    const master = await seedToMaster(await mnemonicToSeed(MNEMONIC));

    let acct = master;
    for (const idx of [84, 0, 0]) acct = await childDerive(acct.priv, acct.chain, idx, true);

    const receive = await childDerive(acct.priv, acct.chain, 0, false);
    const change = await childDerive(acct.priv, acct.chain, 1, false);

    const r0 = await childDerive(receive.priv, receive.chain, 0, false);
    const r1 = await childDerive(receive.priv, receive.chain, 1, false);
    const c0 = await childDerive(change.priv, change.chain, 0, false);

    expect(toHex(secp256k1.getPublicKey(r0.priv, true))).toBe(PUB_84_0_0_0_0);
    expect(toHex(secp256k1.getPublicKey(r1.priv, true))).toBe(PUB_84_0_0_0_1);
    expect(toHex(secp256k1.getPublicKey(c0.priv, true))).toBe(PUB_84_0_0_1_0);
  });

  it("hardened and non-hardened derivation of the same index differ", async () => {
    const master = await seedToMaster(await mnemonicToSeed(MNEMONIC));
    const hard = await childDerive(master.priv, master.chain, 0, true);
    const soft = await childDerive(master.priv, master.chain, 0, false);
    expect(toHex(hard.priv)).not.toBe(toHex(soft.priv));
  });
});

describe("bip-pipeline/crypto — BIP-85", () => {
  it("extracts the 12-word entropy of the BIP-85 test vector", async () => {
    let node = decodeXprv(BIP85_MASTER_XPRV);
    for (const idx of BIP85_PATH) node = await childDerive(node.priv, node.chain, idx, true);
    const entropy = await bip85ExtractEntropy(node.priv);
    expect(entropy).toHaveLength(64);
    expect(toHex(entropy.slice(0, 16))).toBe(BIP85_ENTROPY_12);
  });

  it("entropyToMnemonic maps zero entropy to 'abandon' ×11 + 'about'", async () => {
    const words = await entropyToMnemonic(new Uint8Array(16), STUB_WORDLIST);
    expect(words).toHaveLength(12);
    expect(words.slice(0, 11).every((w) => w === "abandon")).toBe(true);
    expect(words[11]).toBe("about");
  });
});
