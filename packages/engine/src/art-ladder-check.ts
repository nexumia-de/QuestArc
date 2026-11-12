import type { Problem } from './content-check';
import { SCENE_BANDS, type SceneBand } from './art-scene-check';
import { hasVertex, type Point } from './art-vertices';

/**
 * The ladder checker (docs/journey-design.md, "Builds and ladders"): a
 * ladder (`content/art/<name>.ladder.json`) is one build in its versions,
 * each whole, standing in the same slot of the same setting; while a stage
 * runs the scaffold stands behind it, and the flag on the scaffold says the
 * stage is met. The hosts fill the slots (`scaffold`, `build`, `flag`,
 * `lantern`, `keeper`) and place everything else as the file says. Where
 * the setting's path meets the build (`ways`), every version and the
 * setting have a corner at the same points.
 */

/** The size of a setting: taller than a region, the build is the subject. */
export const SETTING_SIZE = { width: 320, height: 180 } as const;

/**
 * Where feet stand in a setting, per band; the sizes are those of a
 * region's bands (SCENE_BANDS), so plants and the lantern are reused at
 * the same sizes. At most the top fifth (36) is sky.
 */
export const SETTING_FEET: Readonly<Record<SceneBand, readonly [number, number]>> = {
  far: [36, 80],
  middle: [80, 145],
  near: [145, 180],
};

/** The build slot: 1.75 setting units per build unit (view box 120 × 80). */
export const BUILD_SLOT = { width: 210, height: 140 } as const;

/** A build stands on y = 74 of its 80 grid. */
const BUILD_FEET = 74 / 80;
/** Every other picture stands on y = 30 of its 32 grid. */
const FEET = 30 / 32;
/** How far (in its own units) a corner may lie from a way point. */
export const WAY_TOLERANCE = 1;

const SLOTS = ['scaffold', 'build', 'flag', 'lantern', 'keeper'] as const;
type Slot = (typeof SLOTS)[number];

const isBand = (value: unknown): value is SceneBand =>
  typeof value === 'string' && Object.hasOwn(SETTING_FEET, value);
const num = (value: unknown): number => (typeof value === 'number' ? value : NaN);

const points = (value: unknown): Point[] | undefined => {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const out = value.map((p: unknown) =>
    Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number')
      ? ([p[0], p[1]] as Point)
      : undefined,
  );
  return out.every((p) => p !== undefined) ? (out as Point[]) : undefined;
};

/**
 * Problems of a ladder file: `names` are the pictures in content/art/,
 * `hues` the names in palette.json; with `sources` (name → SVG text) the
 * way points are checked on every version and on the setting.
 */
export const ladderProblems = (
  value: unknown,
  names: readonly string[],
  hues: readonly string[],
  sources?: Readonly<Record<string, string>>,
): Problem[] => {
  const problems: Problem[] = [];
  const error = (at: string, message: string) => problems.push({ level: 'error', at, message });
  const ladder = (value ?? {}) as Record<string, unknown>;
  if (typeof ladder.title !== 'string' || ladder.title.trim() === '')
    error('title', 'the ladder in words');
  if (!hues.includes(String(ladder.hue))) error('hue', `one of ${hues.join(', ')}`);
  if (ladder.width !== SETTING_SIZE.width || ladder.height !== SETTING_SIZE.height)
    error('size', `width ${SETTING_SIZE.width} and height ${SETTING_SIZE.height}`);

  const versions = Array.isArray(ladder.versions) ? (ladder.versions as unknown[]) : [];
  if (versions.length < 3) error('versions', 'at least three versions, each whole');
  versions.forEach((item, index) => {
    const at = `versions[${index}]`;
    const v = (item ?? {}) as Record<string, unknown>;
    const art = typeof v.art === 'string' ? v.art : '';
    if (!art.startsWith('build-') || !names.includes(art))
      error(at, `art is a known build-… picture, not ${String(v.art)}`);
    if (typeof v.title !== 'string' || v.title.trim() === '') error(at, 'the version in words');
  });
  const scaffold = typeof ladder.scaffold === 'string' ? ladder.scaffold : '';
  if (!scaffold.startsWith('build-') || !names.includes(scaffold))
    error('scaffold', 'a known build-… picture, shown while the next version is worked on');

  const pictures = Array.isArray(ladder.pictures) ? (ladder.pictures as unknown[]) : [];
  const [ground, ...rest] = pictures.map((p) => (p ?? {}) as Record<string, unknown>);
  if (
    typeof ground?.art !== 'string' ||
    !ground.art.startsWith('setting-') ||
    !names.includes(ground.art) ||
    ground.x !== 0 ||
    ground.y !== 0 ||
    ground.width !== SETTING_SIZE.width ||
    ground.height !== SETTING_SIZE.height
  )
    error('pictures[0]', 'a known setting-… picture first, filling the setting');

  const seen = new Map<Slot, number>();
  let buildPlace: Record<string, unknown> | undefined;
  let lastFeet = 0;
  rest.forEach((p, i) => {
    const at = `pictures[${i + 1}]`;
    const band = p.band;
    if (!isBand(band)) {
      error(at, 'band is one of far, middle, near');
      return;
    }
    const [low, high] = SETTING_FEET[band];
    const sizes = SCENE_BANDS[band].sizes;
    const inBand = (feet: number) => feet >= low && feet <= high;
    let feet: number;
    const slot = p.slot as Slot | undefined;
    if (slot !== undefined) {
      if (!SLOTS.includes(slot)) {
        error(at, `slot is one of ${SLOTS.join(', ')}`);
        return;
      }
      seen.set(slot, (seen.get(slot) ?? 0) + 1);
    }
    const [x = NaN, y = NaN, w = NaN, h = NaN] = ['x', 'y', 'width', 'height'].map((key) =>
      num(p[key]),
    );
    if ([x, y, w, h].some(Number.isNaN)) {
      error(at, 'x, y, width and height are numbers');
      return;
    }
    if (slot === 'flag') {
      // on the scaffold's top: above the bands, drawn after the build
      if (!sizes.includes(w) || w !== h) error(at, `the flag is ${sizes.join(', ')} square`);
      if (seen.get('build') !== 1) error(at, 'the flag comes after the build');
      if (y < 0 || x < 0 || x + w > SETTING_SIZE.width) error(at, 'lies outside the scene');
      return;
    }
    if (slot === 'build' || slot === 'scaffold') {
      if (band !== 'middle') error(at, `the ${slot} stands in the middle band`);
      if (w !== BUILD_SLOT.width || h !== BUILD_SLOT.height)
        error(at, `the ${slot} slot is ${BUILD_SLOT.width} × ${BUILD_SLOT.height}`);
      if (slot === 'build') {
        buildPlace = p;
        if (seen.get('scaffold') !== 1) error(at, 'the scaffold comes just before the build');
      }
      if (slot === 'build' && (p.x !== rest[i - 1]?.x || p.y !== rest[i - 1]?.y))
        error(at, 'the scaffold stands in the build slot, just before it');
      feet = y + h * BUILD_FEET;
    } else {
      if (slot === undefined && (typeof p.art !== 'string' || !names.includes(p.art)))
        error(at, `unknown picture ${String(p.art)}`);
      if (w !== h || !sizes.includes(w))
        error(at, `in the ${band} band a picture is ${sizes.join(', ')} square`);
      feet = y + h * FEET;
    }
    if (!inBand(feet)) error(at, `its feet are inside ${low}–${high}`);
    if (y < -h || x < -w / 2 || x + w / 2 > SETTING_SIZE.width) error(at, 'lies outside the scene');
    if (feet < lastFeet) error(at, 'pictures are listed back to front: feet never move up');
    lastFeet = Math.max(lastFeet, feet);
  });
  for (const slot of SLOTS) if (seen.get(slot) !== 1) error('pictures', `exactly one ${slot} slot`);

  // The way: each end is two points in build units; every version and the
  // setting (in its own units) have a corner at both.
  const ways = Array.isArray(ladder.ways) ? (ladder.ways as unknown[]) : [];
  if (ways.length === 0) error('ways', 'where the path meets the build: one or two ends');
  ways.forEach((end, index) => {
    const at = `ways[${index}]`;
    const pair = points(end);
    if (pair === undefined) {
      error(at, 'two points [x, y] in build units: the edge where the path meets the build');
      return;
    }
    if (sources === undefined || buildPlace === undefined) return;
    const scale = num(buildPlace.width) / 120;
    const toSetting = ([px, py]: Point): Point => [
      num(buildPlace?.x) + px * scale,
      num(buildPlace?.y) + py * scale,
    ];
    for (const [k, v] of versions.entries()) {
      const art = String((v as Record<string, unknown>).art);
      const source = sources[art];
      if (source !== undefined && !pair.every((pt) => hasVertex(source, pt, WAY_TOLERANCE)))
        error(`versions[${k}]`, `${art} has no corner at the way points of ${at}`);
    }
    const setting = sources[String(ground?.art)];
    if (
      setting !== undefined &&
      !pair.every((pt) => hasVertex(setting, toSetting(pt), WAY_TOLERANCE * scale))
    )
      error(at, `the path of ${String(ground?.art)} does not end at these way points`);
  });
  return problems;
};
