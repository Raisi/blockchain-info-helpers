export type ECTab = "curve" | "addition" | "scalar" | "keygen" | "quantum";

export interface TabConfig {
  id: ECTab;
  label: string;
  description: string;
}

export interface CurvePoint2D {
  x: number;
  y: number;
}

export interface AdditionResult {
  result: CurvePoint2D;
  slope: number;
  thirdIntersection: CurvePoint2D;
}

export type AnimStep = "idle" | "line" | "intersect" | "reflect" | "done";

export interface ScalarMulStep {
  bit: number;
  operation: "double" | "add";
  intermediate: CurvePoint2D;
  label: string;
}

export interface CanvasLine {
  from: CurvePoint2D;
  to: CurvePoint2D;
  color: string;
  dashed?: boolean;
  width?: number;
}

export interface CanvasPoint {
  point: CurvePoint2D;
  color: string;
  label?: string;
  radius?: number;
  pulse?: boolean;
}

export interface CompletionState {
  tab1: { pointsPlaced: number };
  tab2: { constructionCompleted: boolean };
  tab3: { sliderMoved: boolean };
  tab4: { keyGenerated: boolean };
}
