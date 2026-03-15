export interface MasterKey {
  priv: Uint8Array;
  chain: Uint8Array;
}

export interface Bip44Config {
  coin: number;
  account: number;
  change: number;
  index: number;
}

export interface Bip85Config {
  app: "bip39" | "wif" | "hex";
  wordCount: 12 | 18 | 24;
  lang: number;
  index: number;
  numBytes: number;
}

export interface Bip85Result {
  rawEntropy: Uint8Array;
  entropyBytes: Uint8Array;
  childMnemonic: string[] | null;
  derivedKey: MasterKey;
}

export interface TreeChild {
  childEntropy: Uint8Array;
  childMnemonic: string[];
  childSeed: Uint8Array;
  childMaster: MasterKey;
  finalKey: MasterKey;
}

export interface StepDef {
  id: number;
  label: string;
  icon: string;
}

export interface FlowNodeDef {
  icon: string;
  label: string;
  color: string;
}
