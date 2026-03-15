import type { TabConfig, HashProperty } from "./types";

export const HASH_TABS: TabConfig[] = [
  { id: "live", label: "Live Hash", description: "Echtzeit SHA-256 Berechnung" },
  { id: "avalanche", label: "Lawineneffekt", description: "Kleine Änderung → komplett anderer Hash" },
  { id: "properties", label: "Eigenschaften", description: "Die vier Kerneigenschaften von Hash-Funktionen" },
  { id: "mining", label: "Mining Puzzle", description: "Finde einen Hash mit führenden Nullen" },
];

export const HASH_PROPERTIES: HashProperty[] = [
  {
    id: "deterministic",
    title: "Deterministisch",
    description: "Gleiche Eingabe → immer gleiche Ausgabe. Kein Zufall, kein Variieren. SHA-256(\"Hello\") liefert jedes Mal denselben 256-Bit-Wert.",
    icon: "fingerprint",
  },
  {
    id: "fixed-length",
    title: "Feste Länge",
    description: "Egal ob 1 Byte oder 1 GB Eingabe — der Hash ist immer exakt 256 Bit (32 Bytes, 64 Hex-Zeichen) lang.",
    icon: "ruler",
  },
  {
    id: "one-way",
    title: "Einwegfunktion",
    description: "Vom Hash zurück zur Eingabe zu kommen ist rechnerisch unmöglich. Es gibt keinen \"Entschlüsselungs\"-Algorithmus.",
    icon: "lock",
  },
  {
    id: "collision-resistant",
    title: "Kollisionsresistent",
    description: "Zwei verschiedene Eingaben, die denselben Hash erzeugen, zu finden ist praktisch unmöglich (2¹²⁸ Versuche nötig).",
    icon: "shield",
  },
];

export const DEFAULT_INPUT = "Hello, Blockchain!";
export const DEFAULT_INPUT_B = "Hello, Blockchain.";

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 5;
export const DIFFICULTY_DEFAULT = 2;

export const NONCES_PER_FRAME = 200;
