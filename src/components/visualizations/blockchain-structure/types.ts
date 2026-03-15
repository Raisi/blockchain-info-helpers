export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  hash: string;
}

export interface BlockHeader {
  version: number;
  prevHash: string;
  merkleRoot: string;
  timestamp: number;
  difficulty: number;
  nonce: number;
}

export interface Block {
  index: number;
  header: BlockHeader;
  transactions: Transaction[];
  hash: string;
  isValid: boolean;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  txId?: string;
}

export interface MiningProgress {
  isMining: boolean;
  nonce: number;
  attempts: number;
}

export interface PendingTransaction {
  from: string;
  to: string;
  amount: string;
}

export interface BlockFieldColor {
  field: string;
  label: string;
  color: string;
}
