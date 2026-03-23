export type MiningTab =
  | "anatomy"
  | "nonce-search"
  | "difficulty"
  | "race"
  | "adjustment";

export interface MiningTabConfig {
  id: MiningTab;
  label: string;
  description: string;
}

export interface BlockHeaderField {
  key: keyof BlockHeaderData;
  label: string;
  description: string;
  example: string;
}

export interface BlockHeaderData {
  version: string;
  prevHash: string;
  merkleRoot: string;
  timestamp: number;
  bits: string;
  nonce: number;
}

export interface HashAttempt {
  nonce: number;
  hash: string;
  meetsTarget: boolean;
}

export interface MinerState {
  id: string;
  name: string;
  hashrate: number;
  nonce: number;
  currentHash: string;
  isWinner: boolean;
}

export interface EpochData {
  epoch: number;
  difficulty: number;
  targetTime: number;
  actualTime: number;
  adjustment: number;
  hashrate: number;
}
