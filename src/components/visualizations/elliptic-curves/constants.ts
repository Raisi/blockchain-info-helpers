import type { TabConfig, ECTab, CompletionState } from "./types";

export const EC_TABS: TabConfig[] = [
  {
    id: "curve",
    label: "Die Kurve",
    description:
      "Die secp256k1-Kurve y² = x³ + 7 über den reellen Zahlen. Klicke auf die Kurve, um Punkte zu setzen. Bitcoin verwendet dieselbe Gleichung, aber über einem endlichen Körper (mod p).",
  },
  {
    id: "addition",
    label: "Punkt-Addition",
    description:
      "Geometrische Konstruktion der Addition: Eine Gerade durch P und Q schneidet die Kurve in einem dritten Punkt — gespiegelt an der x-Achse ergibt das P + Q.",
  },
  {
    id: "scalar",
    label: "Skalarmultiplikation",
    description:
      "Das Ergebnis R aus der Punkt-Addition wird zum Basispunkt P. Skalarmultiplikation wiederholt die Addition aus Tab 2: n × P = P + P + … + P. Der Schrittmodus zeigt den effizienten Double-and-Add-Algorithmus.",
  },
  {
    id: "keygen",
    label: "Schlüssel-Erzeugung",
    description:
      "Private Key (zufällige 256-Bit-Zahl) × Generator G = Public Key. Reale Berechnung mit der secp256k1-Kurve.",
  },
];

export const CURVE_X_RANGE: [number, number] = [-4, 6];
export const CURVE_Y_RANGE: [number, number] = [-10, 10];

/** x³ + 7 has no real roots for x < -cbrt(7) ≈ -1.913 */
export const CURVE_X_MIN_REAL = -Math.cbrt(7);

export const POINT_COLORS = [
  "#22d3ee", // cyan
  "#8b5cf6", // violet
  "#10b981", // green
  "#f59e0b", // amber
];

export const MAX_PLACED_POINTS = 4;

export const DEFAULT_P = { x: -1, y: 2.449 };
export const DEFAULT_Q = { x: 1, y: 2.828 };

export const SCALAR_MIN = 2;
export const SCALAR_MAX = 20;
export const SCALAR_DEFAULT = 5;

export const INITIAL_COMPLETION: CompletionState = {
  tab1: { pointsPlaced: 0 },
  tab2: { constructionCompleted: false },
  tab3: { sliderMoved: false },
};

export const COMPLETION_CHECKS: Record<
  ECTab,
  ((s: CompletionState) => boolean) | null
> = {
  curve: (s) => s.tab1.pointsPlaced >= 2,
  addition: (s) => s.tab2.constructionCompleted,
  scalar: (s) => s.tab3.sliderMoved,
  keygen: null,
};

export const TAB_ORDER: ECTab[] = ["curve", "addition", "scalar", "keygen"];
