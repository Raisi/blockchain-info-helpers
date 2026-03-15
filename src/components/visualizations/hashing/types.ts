export type HashTab = "live" | "avalanche" | "properties" | "mining";

export interface HashResult {
  hex: string;
  binary: string;
}

export interface BitDiff {
  index: number;
  bitA: string;
  bitB: string;
  changed: boolean;
}

export interface MiningState {
  isMining: boolean;
  nonce: number;
  hashAttempt: string;
  found: boolean;
  difficulty: number;
  targetPrefix: string;
}

export interface HashProperty {
  id: string;
  title: string;
  description: string;
  icon: "fingerprint" | "ruler" | "lock" | "shield";
}

export interface TabConfig {
  id: HashTab;
  label: string;
  description: string;
}
