import type { Problem } from './content-check';
import { SCENE_BANDS, type SceneBand } from './art-scene-check';
import { hasVertex, type Point } from './art-vertices';

/**
 * The ladder checker (docs/journey-design.md, "Builds and ladders"): a
 * ladder (`content/art/<name>.ladder.json`) is one build in its versions,
 * each whole, standing in the same slot of the same setting; while a stage
 * runs a marker (lanterns, bunting, flowers: `markers.json`) stands as a
 * gate across the path in the foreground: in phases 1–3, and ready (lit,
 * with a centrepiece) while the stage's condition is met. The hosts fill
 * the slots (`build`, `lantern`, `keeper`, and the `marker` places: the
 * first post, the second post, the line, its elements and the centre) and
 * place everything else as the file says. Where the setting's path meets
 * the build (`ways`), every version and the setting have a corner at the
 * same points; the gate's posts stand on corners of the setting's path
 * (`gate`), and nothing of the marker covers a way point.
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

const SLOTS = ['build', 'lantern', 'keeper'] as const;
type Slot = (typeof SLOTS)[number] | 'marker';
/** The marker's parts: posts, the lines between them, the hanging elements. */
const MARKER_PARTS = ['post', 'cord', 'bead'] as const;
/** The layouts: one line over all posts, or two lines with a gap between. */
export const MARKER_LAYOUTS = ['span', 'sides'] as const;
/** The pictures every marker kind has (`marker-<kind>-<part>`). */
export const MARKER_PICTURES = ['post', 'bead', 'bead-lit'] as const;
/** A post's line is tied on at y = 12 of its 32 grid. */
const TIE = 12 / 32;
/** Hanging elements: near band sizes, or 24 between the two smaller ones. */
const HANG_SIZES = [...SCENE_BANDS.near.sizes, 24];

/** A marker kind in `content/art/markers.json`. */
export interface MarkerKind {
  readonly title: string;
  /** Only for settings on land (flowers), refused where `water` is true. */
  readonly landOnly: boolean;
}

/** Problems of `markers.json`: every kind has a title and its three pictures. */
export const markerProblems = (value: unknown, names: readonly string[]): Problem[] => {
  const problems: Problem[] = [];
  const kinds = (value ?? {}) as Record<string, Record<string, unknown> | undefined>;
  if (Object.keys(kinds).length === 0)
    problems.push({ level: 'error', at: 'markers', message: 'at least one marker kind' });
  for (const [kind, entry] of Object.entries(kinds)) {
    if (typeof entry?.title !== 'string' || entry.title.trim() === '')
      problems.push({ level: 'error', at: kind, message: 'the marker in words' });
    if (typeof entry?.landOnly !== 'boolean')
      problems.push({ level: 'error', at: kind, message: 'landOnly is true or false' });
    for (const part of MARKER_PICTURES)
      if (!names.includes(`marker-${kind}-${part}`))
        problems.push({ level: 'error', at: kind, message: `no picture marker-${kind}-${part}` });
  }
  return problems;
};

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

/** Whether (x, y) lies inside the polygon (even-odd rule). */
const inside = (poly: readonly (readonly number[])[], x: number, y: number): boolean => {
  let result = false;
  poly.forEach(([x1 = 0, y1 = 0], i) => {
    const [x2 = 0, y2 = 0] = poly[(i + 1) % poly.length] ?? [];
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) result = !result;
  });
  return result;
};

/**
 * Problems of a ladder file: `names` are the pictures in content/art/,
 * `hues` the names in palette.json, `markers` markers.json; with `sources`
 * (name → SVG text) the way points are checked on every version and on the
 * setting.
 */
export const ladderProblems = (
  value: unknown,
  names: readonly string[],
  hues: readonly string[],
  markers: Readonly<Record<string, MarkerKind>>,
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
  // The row of versions may show a part of every version, zoomed: a 3 : 2
  // rectangle in build units inside the build's view box.
  if (ladder.row !== undefined) {
    const row = Array.isArray(ladder.row) ? (ladder.row as unknown[]).map(num) : [];
    const [x = NaN, y = NaN, w = NaN, h = NaN] = row;
    if (
      row.length !== 4 ||
      row.some(Number.isNaN) ||
      Math.abs(w / h - 1.5) > 0.01 ||
      x < 0 ||
      y < 0 ||
      x + w > 120 ||
      y + h > 80
    )
      error('row', '[x, y, width, height]: 3 : 2 inside the build (120 × 80)');
  }
  if (typeof ladder.water !== 'boolean') error('water', 'true if the setting is water, else false');
  const kind = markers[String(ladder.marker)];
  if (kind === undefined) error('marker', `one of ${Object.keys(markers).join(', ')}`);
  else if (kind.landOnly && ladder.water === true)
    error('marker', `${String(ladder.marker)} only on land, this setting is water`);

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
  const markerParts: {
    part: string;
    order: number;
    at: string;
    box: [number, number, number, number];
    feet: number;
  }[] = [];
  rest.forEach((p, i) => {
    const at = `pictures[${i + 1}]`;
    if (p.slot === 'marker' && p.part === 'cord') {
      // a line of the setting: a setting-… picture over the whole scene
      if (
        typeof p.art !== 'string' ||
        !p.art.startsWith('setting-') ||
        !names.includes(p.art) ||
        p.x !== 0 ||
        p.y !== 0 ||
        p.width !== SETTING_SIZE.width ||
        p.height !== SETTING_SIZE.height
      )
        error(at, 'a line is a known setting-… picture filling the setting');
      markerParts.push({ part: 'cord', order: num(p.order), at, box: [0, 0, 0, 0], feet: NaN });
      return;
    }
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
      if (slot !== 'marker' && !SLOTS.includes(slot)) {
        error(at, `slot is one of ${SLOTS.join(', ')}, marker`);
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
    if (slot === 'marker') {
      const part = String(p.part);
      const order = num(p.order);
      if (!(MARKER_PARTS as readonly string[]).includes(part))
        error(at, `a marker part is one of ${MARKER_PARTS.join(', ')}`);
      if (band !== 'near') error(at, 'the marker stands in the near band');
      if (part === 'bead') {
        // hangs from a line: no feet
        if (w !== h || !HANG_SIZES.includes(w)) error(at, `it is ${HANG_SIZES.join(', ')} square`);
        if (y < 0 || x < -w / 2 || x + w / 2 > SETTING_SIZE.width)
          error(at, 'lies outside the scene');
        markerParts.push({ part, order, at, box: [x, y, x + w, y + h], feet: NaN });
        return;
      }
      // a post: thin, in the middle third of its picture
      markerParts.push({
        part,
        order,
        at,
        box: [x + w / 3, y + h * TIE, x + (2 * w) / 3, y + h * FEET],
        feet: y + h * FEET,
      });
    }
    if (slot === 'build') {
      if (band !== 'middle') error(at, 'the build stands in the middle band');
      if (w !== BUILD_SLOT.width || h !== BUILD_SLOT.height)
        error(at, `the build slot is ${BUILD_SLOT.width} × ${BUILD_SLOT.height}`);
      buildPlace = p;
      feet = y + h * BUILD_FEET;
    } else {
      if (slot === 'marker' && p.art !== undefined) error(at, 'the host fills a marker post');
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

  // The marker: posts on the layout's post points, in order; then the
  // lines, each shown once both its posts stand; then the hanging elements,
  // one by one, between the posts of a line. Every element has its place in
  // one order 1 … E (`order`); the hosts show the first ceil(p × E).
  const layout = String(ladder.layout);
  const postPoints = Array.isArray(ladder.posts)
    ? (ladder.posts as unknown[]).map((pt) =>
        Array.isArray(pt) && pt.length === 2 ? [num(pt[0]), num(pt[1])] : [NaN, NaN],
      )
    : [];
  const [nearLow, nearHigh] = SETTING_FEET.near;
  const buildFeet =
    buildPlace === undefined ? 0 : num(buildPlace.y) + num(buildPlace.height) * BUILD_FEET;
  const wanted = layout === 'span' ? postPoints.length >= 2 : postPoints.length === 4;
  if (!(MARKER_LAYOUTS as readonly string[]).includes(layout))
    error('layout', `one of ${MARKER_LAYOUTS.join(', ')}`);
  else if (
    !wanted ||
    postPoints.some(([px = NaN, py = NaN], k) => {
      const before = postPoints[k - 1]?.[0] ?? -Infinity;
      return Number.isNaN(px) || py < nearLow || py > nearHigh || px <= before;
    })
  )
    error('posts', 'post points [x, y] in the near band, left to right (sides: four)');
  // No post stands in water: a setting with water marks it (`waterAreas`,
  // polygons in setting units) and no post point lies inside one.
  const areas = Array.isArray(ladder.waterAreas) ? (ladder.waterAreas as unknown[]) : [];
  const polygons = areas.map((area) =>
    Array.isArray(area)
      ? (area as unknown[]).map((pt) =>
          Array.isArray(pt) && pt.length === 2 ? [num(pt[0]), num(pt[1])] : [NaN, NaN],
        )
      : [],
  );
  if (
    (ladder.water === true && polygons.length === 0) ||
    polygons.some((poly) => poly.length < 3 || poly.flat().some(Number.isNaN))
  )
    error('waterAreas', 'a setting with water marks it: polygons of [x, y] points');
  postPoints.forEach(([px = NaN, py = NaN], k) => {
    if (polygons.some((poly) => inside(poly, px, py)))
      error('posts', `post point ${k + 1} (${px}, ${py}) stands in water`);
  });
  const parts = (part: string) =>
    markerParts.filter((m) => m.part === part).sort((a, b) => a.order - b.order);
  const posts = parts('post');
  if (posts.length !== postPoints.length) error('marker', 'one post on each post point');
  posts.forEach((m, k) => {
    const [px = NaN, py = NaN] = postPoints[k] ?? [];
    const centre = (m.box[0] + m.box[2]) / 2;
    if (Math.abs(centre - px) > WAY_TOLERANCE || Math.abs(m.feet - py) > WAY_TOLERANCE)
      error(m.at, `post ${k + 1} stands on post point ${px}, ${py}`);
    if (m.order !== k + 1) error(m.at, `post ${k + 1} is element ${k + 1}`);
    if (m.box[1] < buildFeet) error(m.at, 'its line is tied on below the build');
  });
  // the lines: between neighbours; `sides` leaves the middle pair open
  const pairs = postPoints
    .slice(1)
    .map((_, k) => [k, k + 1] as const)
    .filter(([k]) => layout === 'span' || k !== postPoints.length / 2 - 1);
  const cords = parts('cord');
  if (cords.length !== pairs.length)
    error('marker', `${pairs.length} lines for the ${layout} layout`);
  cords.forEach((m, k) => {
    const pair = pairs[k];
    if (pair !== undefined && m.order !== pair[1] + 1)
      error(m.at, 'a line shows when its second post stands');
  });
  // the hanging elements: after the posts, one by one, under a line
  const beads = parts('bead');
  if (beads.length < 2) error('marker', 'at least two hanging elements');
  beads.forEach((m, k) => {
    if (m.order !== postPoints.length + k + 1)
      error(m.at, `hanging element ${k + 1} is element ${postPoints.length + k + 1}`);
    const centre = (m.box[0] + m.box[2]) / 2;
    const under = pairs.some(
      ([a, b]) => centre > (postPoints[a]?.[0] ?? NaN) && centre < (postPoints[b]?.[0] ?? NaN),
    );
    if (!under || m.box[1] < buildFeet)
      error(m.at, 'hangs from a line between two posts, below the build');
  });

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
    if (buildPlace === undefined) return;
    const scale = num(buildPlace.width) / 120;
    const toSetting = ([px, py]: Point): Point => [
      num(buildPlace?.x) + px * scale,
      num(buildPlace?.y) + py * scale,
    ];
    // nothing of the marker covers the way where it meets the build
    for (const point of pair.map(toSetting))
      for (const m of markerParts) {
        const [x1, y1, x2, y2] = m.box;
        if (point[0] >= x1 && point[0] <= x2 && point[1] >= y1 && point[1] <= y2)
          error(at, `the marker's ${m.part} covers the way`);
      }
    if (sources === undefined) return;
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
