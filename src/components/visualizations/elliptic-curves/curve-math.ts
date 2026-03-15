import type { CurvePoint2D, AdditionResult, ScalarMulStep } from "./types";

/**
 * Evaluates y² = x³ + 7 for a given x.
 * Returns [+y, -y] if x³+7 ≥ 0, otherwise null (no real solution).
 */
export function evaluateCurve(x: number): [number, number] | null {
  const rhs = x * x * x + 7;
  if (rhs < 0) return null;
  const y = Math.sqrt(rhs);
  return [y, -y];
}

/**
 * Snaps to the nearest point on y² = x³ + 7 for a given x value.
 */
export function snapToCurve(
  x: number,
  preferPositiveY = true
): CurvePoint2D | null {
  const ys = evaluateCurve(x);
  if (!ys) return null;
  return { x, y: preferPositiveY ? ys[0] : ys[1] };
}

/**
 * Adds two distinct points P and Q on y² = x³ + 7 (real numbers).
 * Returns the result, slope, and the third intersection point (before reflection).
 */
export function addPoints(
  P: CurvePoint2D,
  Q: CurvePoint2D
): AdditionResult | null {
  // Same x, different y → point at infinity
  if (Math.abs(P.x - Q.x) < 1e-10 && Math.abs(P.y + Q.y) < 1e-10) {
    return null;
  }

  let slope: number;

  if (Math.abs(P.x - Q.x) < 1e-10) {
    // P = Q → tangent (doubling)
    if (Math.abs(P.y) < 1e-10) return null; // tangent is vertical
    slope = (3 * P.x * P.x) / (2 * P.y);
  } else {
    slope = (Q.y - P.y) / (Q.x - P.x);
  }

  const xR = slope * slope - P.x - Q.x;
  const yR = slope * (P.x - xR) - P.y;

  const thirdIntersection: CurvePoint2D = { x: xR, y: -yR };
  const result: CurvePoint2D = { x: xR, y: yR };

  return { result, slope, thirdIntersection };
}

/**
 * Doubles a point P on y² = x³ + 7.
 */
export function doublePoint(P: CurvePoint2D): AdditionResult | null {
  return addPoints(P, P);
}

/**
 * Computes n*P using the double-and-add algorithm.
 * Returns full trace of steps for visualization.
 */
export function computeDoubleAndAddSteps(
  P: CurvePoint2D,
  n: number
): { steps: ScalarMulStep[]; result: CurvePoint2D } | null {
  if (n < 1) return null;

  const bits = n.toString(2).split("").map(Number);
  const steps: ScalarMulStep[] = [];

  let current: CurvePoint2D = { ...P };

  // First bit is always 1 (MSB)
  steps.push({
    bit: bits[0],
    operation: "double",
    intermediate: { ...current },
    label: "Start: P",
  });

  for (let i = 1; i < bits.length; i++) {
    // Double
    const doubled = doublePoint(current);
    if (!doubled) return null;
    current = doubled.result;
    steps.push({
      bit: bits[i],
      operation: "double",
      intermediate: { ...current },
      label: `Double → (${current.x.toFixed(2)}, ${current.y.toFixed(2)})`,
    });

    // Add if bit is 1
    if (bits[i] === 1) {
      const added = addPoints(current, P);
      if (!added) return null;
      current = added.result;
      steps.push({
        bit: bits[i],
        operation: "add",
        intermediate: { ...current },
        label: `+ P → (${current.x.toFixed(2)}, ${current.y.toFixed(2)})`,
      });
    }
  }

  return { steps, result: current };
}

/**
 * Generates an array of points along y² = x³ + 7 for rendering.
 * Returns two branches: positive y and negative y.
 */
export function getCurvePoints(
  xMin: number,
  xMax: number,
  resolution = 500
): { upper: CurvePoint2D[]; lower: CurvePoint2D[] } {
  const upper: CurvePoint2D[] = [];
  const lower: CurvePoint2D[] = [];

  // Curve has no real points for x < -cbrt(7)
  const effectiveMin = Math.max(xMin, -Math.cbrt(7));
  const step = (xMax - effectiveMin) / resolution;

  for (let x = effectiveMin; x <= xMax; x += step) {
    const ys = evaluateCurve(x);
    if (ys) {
      upper.push({ x, y: ys[0] });
      lower.push({ x, y: ys[1] });
    }
  }

  return { upper, lower };
}

/**
 * Finds the intersection of a line (defined by slope and a point) with y² = x³ + 7.
 * Returns up to 3 intersection x-values.
 */
export function lineExtendedPoints(
  P: CurvePoint2D,
  Q: CurvePoint2D,
  xMin: number,
  xMax: number
): { from: CurvePoint2D; to: CurvePoint2D } {
  if (Math.abs(Q.x - P.x) < 1e-10) {
    // Vertical line
    return { from: { x: P.x, y: -100 }, to: { x: P.x, y: 100 } };
  }
  const slope = (Q.y - P.y) / (Q.x - P.x);
  const intercept = P.y - slope * P.x;
  return {
    from: { x: xMin, y: slope * xMin + intercept },
    to: { x: xMax, y: slope * xMax + intercept },
  };
}
