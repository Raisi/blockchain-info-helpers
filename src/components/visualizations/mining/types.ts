export type MiningTab =
  | "anatomy"
  | "nonce-search"
  | "difficulty"
  | "race"
  | "adjustment"
  | "3d-process";

export type MiningStage =
  | "idle"
  | "mempool"
  | "assembly"
  | "header"
  | "nonce-search"
  | "found"
  | "chain-connect"
  | "complete";

export interface MiningSequenceState {
  stage: MiningStage;
  progress: number;
  speed: number;
  paused: boolean;
  nonce: number;
  hashAttempts: number;
  foundHash: string | null;
  lastHash: string | null;
  startTime: number | null;
  elapsed: number;
}

export interface HashBatchResult {
  startNonce: number;
  endNonce: number;
  hashes: { nonce: number; hash: string; meetsTarget: boolean }[];
  foundNonce: number | null;
  foundHash: string | null;
}

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
