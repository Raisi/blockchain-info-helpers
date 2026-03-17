export interface ZpubStep {
  id: number;
  title: string;
  description: string;
  color: string;
}

export interface DerivationLevel {
  depth: number;
  path: string;
  name: string;
  index: number;
  hardened: boolean;
  privKey: Uint8Array;
  chainCode: Uint8Array;
}

export interface SerializedKey {
  version: Uint8Array;
  depth: number;
  fingerprint: Uint8Array;
  childIndex: number;
  chainCode: Uint8Array;
  publicKey: Uint8Array;
  raw78: Uint8Array;
  checksum: Uint8Array;
  full82: Uint8Array;
  encoded: string;
}

export interface VersionInfo {
  prefix: string;
  versionHex: string;
  addressType: string;
  bytes: Uint8Array;
}

export interface PublicChildDerivation {
  parentPubKey: Uint8Array;
  parentChainCode: Uint8Array;
  index: number;
  hmacData: Uint8Array;
  hmacResult: Uint8Array;
  IL: Uint8Array;
  IR: Uint8Array;
  childPubKey: Uint8Array;
  childChainCode: Uint8Array;
}

export interface DerivedAddress {
  index: number;
  path: string;
  childPubKey: Uint8Array;
  hash160: Uint8Array;
  address: string;
  isChange: boolean;
  chainDerivation: PublicChildDerivation;
  addressDerivation: PublicChildDerivation;
}
