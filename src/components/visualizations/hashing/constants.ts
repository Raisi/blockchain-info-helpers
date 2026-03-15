import type { TabConfig, HashProperty } from "./types";

export const HASH_TABS: TabConfig[] = [
  { id: "live", label: "Live Hash", description: "Gib beliebigen Text ein und beobachte, wie dein Browser per Web Crypto API in Echtzeit einen SHA-256-Hash berechnet — ein einzigartiger 64-stelliger Hex-Fingerabdruck. Die Ausgabe wird zusätzlich als Binär-Darstellung (256 Bit) angezeigt, damit du siehst, was «unter der Haube» passiert." },
  { id: "avalanche", label: "Lawineneffekt", description: "Vergleiche zwei Eingaben Seite an Seite: Ein Bit-Grid zeigt dir alle 256 Bits beider Hashes und markiert jede Abweichung rot. Selbst bei minimalem Unterschied — z. B. ein Punkt statt Ausrufezeichen — ändern sich typischerweise ~50 % aller Bits. Genau diese Unvorhersagbarkeit macht SHA-256 manipulationssicher." },
  { id: "properties", label: "Eigenschaften", description: "Deterministisch, feste Länge, Einwegfunktion, kollisionsresistent — die vier Grundpfeiler, die SHA-256 zur Basis von Blockchain-Sicherheit machen." },
  { id: "mining", label: "Mining Puzzle", description: "Simuliere Bitcoins Proof-of-Work: Wähle eine Difficulty (Anzahl führender Nullen), und dein Browser probiert tausende Nonce-Werte pro Sekunde durch, bis ein passender Hash gefunden wird. Je höher die Difficulty, desto exponentiell mehr Versuche sind nötig — bei jeder zusätzlichen Null ver-16-facht sich der Aufwand." },
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
