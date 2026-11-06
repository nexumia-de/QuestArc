/**
 * Fixed geometry of the path (docs/journey-design.md): stations from the
 * bottom (start) to the top (goal), joined by a gentle S-curve in a narrow
 * column on the left; labels sit to the right of it.
 */

export const GAP = 120;
export const TOP = 56;
export const BOTTOM = 48;
export const X = 44;
export const WIDTH = 88;
const BULGE = 34;

/** Point k: stations 0 … n − 1, the goal at n. */
export const yOf = (k: number, stations: number): number => TOP + (stations - k) * GAP;

export const heightOf = (stations: number): number => TOP + stations * GAP + BOTTOM;

/** Which side segment k bulges to: right, left, right, … */
const side = (k: number): number => (k % 2 === 0 ? 1 : -1);

/** The cubic Bézier from point k to point k + 1. */
export const segmentPath = (k: number, stations: number): string => {
  const y1 = yOf(k, stations);
  const y2 = yOf(k + 1, stations);
  const cx = X + side(k) * BULGE;
  return `M${X} ${y1} C ${cx} ${y1 - GAP / 3}, ${cx} ${y2 + GAP / 3}, ${X} ${y2}`;
};

/** The middle of segment k, where its guardian stands. */
export const segmentMiddle = (k: number, stations: number): { x: number; y: number } => ({
  x: X + side(k) * BULGE * 0.75,
  y: (yOf(k, stations) + yOf(k + 1, stations)) / 2,
});
