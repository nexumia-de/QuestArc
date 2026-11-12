/**
 * The corner points of a picture's shapes (content/art/), for checks that
 * two pictures meet at fixed points (the way of a ladder, docs/journey-
 * design.md "Builds and ladders"). Reads the subset the picture checker
 * allows: `rect` corners, `polygon` points and the end points of absolute
 * path commands (M, L, H, V, C, S, Q, T; relative commands are skipped).
 * Circles and ellipses have no corners.
 */
export type Point = readonly [number, number];

const ELEMENT = /<(rect|polygon|path)\b([^>]*?)\/?>/g;
const ATTRIBUTE = /([\w-]+)="([^"]*)"/g;
const TOKEN = /[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d+\.?\d*|\.\d+)/g;
/** Numbers per step and where the end point is in them, per command. */
const STEPS: Record<string, { size: number; end: number }> = {
  M: { size: 2, end: 0 },
  L: { size: 2, end: 0 },
  T: { size: 2, end: 0 },
  C: { size: 6, end: 4 },
  S: { size: 4, end: 2 },
  Q: { size: 4, end: 2 },
};

const pathPoints = (d: string): Point[] => {
  const points: Point[] = [];
  let command = '';
  let numbers: number[] = [];
  let at: Point = [0, 0];
  const flush = () => {
    const step = STEPS[command];
    if (step !== undefined)
      for (let i = 0; i + step.size <= numbers.length; i += step.size) {
        at = [numbers[i + step.end] ?? 0, numbers[i + step.end + 1] ?? 0];
        points.push(at);
      }
    else if (command === 'H')
      for (const x of numbers) {
        at = [x, at[1]];
        points.push(at);
      }
    else if (command === 'V')
      for (const y of numbers) {
        at = [at[0], y];
        points.push(at);
      }
    numbers = [];
  };
  for (const token of d.match(TOKEN) ?? []) {
    if (/[A-Za-z]/.test(token)) {
      flush();
      command = token;
    } else numbers.push(Number(token));
  }
  flush();
  return points;
};

/** Every corner point of the picture's rects, polygons and paths. */
export const vertices = (source: string): Point[] => {
  const points: Point[] = [];
  for (const [, name, body = ''] of source.matchAll(ELEMENT)) {
    const a: Record<string, string> = {};
    for (const [, key = '', value = ''] of body.matchAll(ATTRIBUTE)) a[key] = value;
    if (name === 'rect') {
      const [x, y, w, h] = [a.x, a.y, a.width, a.height].map((v) => Number(v ?? 0)) as [
        number,
        number,
        number,
        number,
      ];
      points.push([x, y], [x + w, y], [x, y + h], [x + w, y + h]);
    } else if (name === 'polygon') {
      const n = (a.points ?? '').split(/[\s,]+/).map(Number);
      for (let i = 0; i + 1 < n.length; i += 2) points.push([n[i] ?? 0, n[i + 1] ?? 0]);
    } else points.push(...pathPoints(a.d ?? ''));
  }
  return points;
};

/** Whether a corner of the picture lies within `tolerance` of `point`. */
export const hasVertex = (source: string, point: Point, tolerance = 1): boolean =>
  vertices(source).some(
    ([x, y]) => Math.abs(x - point[0]) <= tolerance && Math.abs(y - point[1]) <= tolerance,
  );
