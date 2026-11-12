import type { Problem } from './content-check';

/**
 * The scene checker (docs/journey-design.md, "Scenes of a region"): a
 * scene (`content/art/<name>.scene.json`) is a ground and pictures at
 * fixed places, each in one of three depth bands with fixed sizes. The
 * hosts only place what the file says; these rules keep every scene in
 * the same perspective.
 */

/** The size of every scene, the view box of a ground. */
export const SCENE_SIZE = { width: 320, height: 120 } as const;

/** Pictures stand on y = 30 of their 32 grid: the feet of a picture. */
const FEET = 30 / 32;

export type SceneBand = 'far' | 'middle' | 'near';

/**
 * The depth bands: where a picture's feet may stand (from the top of the
 * scene) and the sizes it may have there (large, medium, small things).
 * The far band is drawn as one silhouette in `tint` by the hosts.
 */
export const SCENE_BANDS: Readonly<
  Record<SceneBand, { readonly feet: readonly [number, number]; readonly sizes: readonly number[] }>
> = {
  far: { feet: [24, 52], sizes: [20, 12] },
  middle: { feet: [52, 92], sizes: [34, 24, 14] },
  near: { feet: [92, 120], sizes: [48, 34, 20] },
};

export interface ScenePicture {
  readonly art: string;
  /** Missing only for the ground, the first picture. */
  readonly band?: SceneBand;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const isBand = (value: unknown): value is SceneBand =>
  typeof value === 'string' && Object.hasOwn(SCENE_BANDS, value);

/**
 * Problems of a scene file: pictures named from `names`, the ground first
 * and filling the scene, then every other picture in a band, at one of
 * its sizes, with its feet inside the band, ordered back to front.
 */
export const sceneProblems = (value: unknown, names: readonly string[]): Problem[] => {
  const problems: Problem[] = [];
  const error = (at: string, message: string) => problems.push({ level: 'error', at, message });
  const scene = (value ?? {}) as Record<string, unknown>;
  if (scene.width !== SCENE_SIZE.width || scene.height !== SCENE_SIZE.height)
    error('size', `width ${SCENE_SIZE.width} and height ${SCENE_SIZE.height}`);
  if (typeof scene.title !== 'string' || scene.title.trim() === '')
    error('title', 'the scene in words, for screen readers');
  const pictures = Array.isArray(scene.pictures) ? (scene.pictures as unknown[]) : [];
  if (pictures.length === 0) error('pictures', 'a list of pictures');
  let lastFeet = 0;
  pictures.forEach((item, index) => {
    const at = `pictures[${index}]`;
    const p = (item ?? {}) as Record<string, unknown>;
    const art = typeof p.art === 'string' ? p.art : '';
    if (!names.includes(art)) error(at, `unknown picture ${String(p.art)}`);
    const [x = NaN, y = NaN, w = NaN, h = NaN] = ['x', 'y', 'width', 'height'].map((key) =>
      typeof p[key] === 'number' ? p[key] : NaN,
    );
    if ([x, y, w, h].some(Number.isNaN)) {
      error(at, 'x, y, width and height are numbers');
      return;
    }
    const ground = art.startsWith('ground-');
    if (index === 0 || ground) {
      if (index !== 0 || !ground) error(at, 'the ground (`ground-…`) comes first, and only once');
      else if (x !== 0 || y !== 0 || w !== SCENE_SIZE.width || h !== SCENE_SIZE.height)
        error(at, 'the ground fills the scene');
      else if (p.band !== undefined) error(at, 'the ground has no band');
      return;
    }
    if (!isBand(p.band)) {
      error(at, 'band is one of far, middle, near');
      return;
    }
    const band = SCENE_BANDS[p.band];
    if (w !== h || !band.sizes.includes(w))
      error(at, `in the ${p.band} band a picture is ${band.sizes.join(', ')} square`);
    const feet = y + h * FEET;
    if (feet < band.feet[0] || feet > band.feet[1])
      error(at, `its feet (y + 15/16 of its height) are inside ${band.feet.join('–')}`);
    if (y < 0 || x < -w / 2 || x + w / 2 > SCENE_SIZE.width)
      error(at, 'lies outside the scene (at most half of it may leave at the sides)');
    if (feet < lastFeet) error(at, 'pictures are listed back to front: feet never move up');
    lastFeet = Math.max(lastFeet, feet);
  });
  return problems;
};
