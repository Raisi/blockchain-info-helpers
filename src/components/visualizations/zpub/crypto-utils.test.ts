import { describe, expect, it } from "vitest";
import {
  childDerivePublic,
  decodeZpub,
  deriveAddressFromZpub,
  fullZpubDerivation,
  hash160,
  mnemonicToSeed,
  pubkeyToP2wpkhAddress,
  toHex,
} from "./crypto-utils";

// BIP-84 test vectors (bip-0084.mediawiki)
const MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const ACCOUNT_ZPUB =
  "zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs";
const ADDR_0_0 = "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu";
const PUB_0_0 = "0330d54fd0dd420a6e5f8d3624f5f3482cae350f79d5f0753bf5beef9c2d91af3c";
const ADDR_0_1 = "bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g";
const ADDR_1_0 = "bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el";

// BIP-39 vector: "abandon ... about" with passphrase "TREZOR"
const SEED_TREZOR =
  "c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04";

const hexToBytes = (h: string) => Uint8Array.from(h.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

describe("zpub/crypto-utils", () => {
  it("mnemonicToSeed matches the BIP-39 TREZOR vector", async () => {
    expect(toHex(await mnemonicToSeed(MNEMONIC, "TREZOR"))).toBe(SEED_TREZOR);
  });

  it("fullZpubDerivation reproduces the BIP-84 account zpub and addresses", async () => {
    const r = await fullZpubDerivation(MNEMONIC);
    expect(r.serialized.encoded).toBe(ACCOUNT_ZPUB);
    expect(r.serialized.depth).toBe(3);
    expect(r.derivationLevels.map((l) => l.path)).toEqual(["m/84'", "m/84'/0'", "m/84'/0'/0'"]);
    expect(r.addresses[0]).toBe(ADDR_0_0);
    expect(r.addresses[1]).toBe(ADDR_0_1);
  });

  it("public-only derivation from the account key yields receive and change addresses", async () => {
    const { accountPubKey, accountChainCode } = await fullZpubDerivation(MNEMONIC);

    const receive0 = await deriveAddressFromZpub(accountPubKey, accountChainCode, false, 0);
    expect(toHex(receive0.childPubKey)).toBe(PUB_0_0);
    expect(receive0.address).toBe(ADDR_0_0);
    expect(receive0.path).toBe("m/84'/0'/0'/0/0");

    const change0 = await deriveAddressFromZpub(accountPubKey, accountChainCode, true, 0);
    expect(change0.address).toBe(ADDR_1_0);
    expect(change0.path).toBe("m/84'/0'/0'/1/0");
  });

  it("childDerivePublic rejects hardened indices", async () => {
    const { accountPubKey, accountChainCode } = await fullZpubDerivation(MNEMONIC);
    await expect(childDerivePublic(accountPubKey, accountChainCode, 0x80000000)).rejects.toThrow(
      /hardened/,
    );
  });

  it("decodeZpub round-trips the serialized key and validates the checksum", async () => {
    const { serialized } = await fullZpubDerivation(MNEMONIC);
    const decoded = decodeZpub(ACCOUNT_ZPUB);
    expect(toHex(decoded.version)).toBe("04b24746");
    expect(decoded.depth).toBe(3);
    expect(decoded.childIndex).toBe(0x80000000);
    expect(toHex(decoded.publicKey)).toBe(toHex(serialized.publicKey));
    expect(toHex(decoded.chainCode)).toBe(toHex(serialized.chainCode));
    expect(toHex(decoded.fingerprint)).toBe(toHex(serialized.fingerprint));

    const tampered = ACCOUNT_ZPUB.slice(0, -1) + (ACCOUNT_ZPUB.endsWith("s") ? "t" : "s");
    expect(() => decodeZpub(tampered)).toThrow(/checksum/i);
  });

  it("pubkeyToP2wpkhAddress encodes hash160 as bech32 v0", () => {
    const pub = hexToBytes(PUB_0_0);
    expect(hash160(pub)).toHaveLength(20);
    expect(pubkeyToP2wpkhAddress(pub)).toBe(ADDR_0_0);
  });
});
