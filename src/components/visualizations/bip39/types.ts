export interface WordEntry {
  bits: string;
  idx: number;
  word: string;
}

export interface TrngOption12 {
  v: number;
  sb: string;       // 7-bit TRNG string
  cs: string;       // 4-bit checksum string
  lb: string;       // combined 11-bit string
  li: number;       // word index
  word: string;
  hx: string;       // hex entropy
  hash: string;     // SHA256 hash
}

export interface TrngOption24 {
  v: number;
  tb: string;       // 3-bit user choice
  cs: string;       // 8-bit checksum string
  lb: string;       // combined 11-bit string
  li: number;       // word index
  word: string;
  hx: string;       // hex entropy
  hash: string;     // SHA256 hash
}

export type Mode = 12 | 24;

export interface Bip39State12 {
  hex12?: string;
  b121?: string;
  words11?: WordEntry[];
  opts12?: TrngOption12[];
  trng12?: number | null;
  sel12?: number | null;
  w12?: WordEntry[];
}

export interface Bip39State24 {
  hex24?: string;
  b253?: string;
  words23?: WordEntry[];
  opts24?: TrngOption24[];
  sel24?: number | null;
  w24?: WordEntry[];
}
