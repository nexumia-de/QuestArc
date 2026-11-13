/**
 * The scene of a ladder (content/art/<name>.ladder.json, #42): one build
 * standing in its slot of its setting; while a stage runs a festive marker
 * (lanterns, pennants or flowers) grows in the foreground one element at a
 * time, plain posts first, then the hanging elements, which take their
 * "on" form while the stage's condition is met; after graduation the lantern. The
 * picture shows states, never a count: counts stay exact in the card. The
 * rules are in docs/journey-design.md, "Builds and ladders"; Day Planner
 * composes the same scene (pensum/ui/journey/art.py, `ladder_scene`).
 */
import type { Placed, Scene } from './art';

export interface LadderVersion {
  readonly art: string;
  readonly title: string;
}

type Place = Omit<Placed, 'art'> & { readonly art?: string };

export type LadderPlace =
  | (Placed & { readonly slot?: undefined })
  | (Place & { readonly slot: 'build' | 'lantern' })
  | (Place & {
      readonly slot: 'marker';
      readonly part: 'post' | 'cord' | 'bead';
      /** Its place in the marker's order of elements (1 … E). */
      readonly order: number;
    });

export interface Ladder {
  readonly title: string;
  /** The default hue of its setting's kind (palette.json). */
  readonly hue: string;
  /** Whether the setting is water (no flowers there). */
  readonly water: boolean;
  /** The default marker kind (markers.json). */
  readonly marker: string;
  /** The marker's layout: one line (`span`) or two with a gap (`sides`). */
  readonly layout: 'span' | 'sides';
  /** The marker's post points in the near band, in order. */
  readonly posts: readonly (readonly [number, number])[];
  readonly width: number;
  readonly height: number;
  /**
   * The part of every version the row of versions shows, zoomed
   * ([x, y, width, height] in build units, 3 : 2); the whole build if absent.
   */
  readonly row?: readonly number[];
  /** Where the setting's path meets every version, in build units. */
  readonly ways: readonly (readonly (readonly [number, number])[])[];
  readonly versions: readonly LadderVersion[];
  readonly pictures: readonly LadderPlace[];
}

/**
 * The marker while a stage runs: `progress` (0 … 1) is the best progress
 * reached in the stage's condition, so the marker never loses an element;
 * `ready` while the condition is met now (every element stands, on).
 */
export interface BuildState {
  readonly progress?: number;
  readonly ready?: boolean;
  /** The marker kind; the ladder's default when left out. */
  readonly marker?: string;
  /** After graduation: the lantern. */
  readonly graduated?: boolean;
  /**
   * The versions the journey uses (its stages + 1, from the engine); the
   * ladder's own number when left out. Versions past the ladder's last
   * picture are drawn with that picture.
   */
  readonly versions?: number;
  /** The journey's own names per version, in words; the ladder's titles where missing. */
  readonly names?: readonly (string | undefined)[];
}

/** The picture of `version` (from 1): the ladder's last for versions past it. */
const versionAt = (ladder: Ladder, version: number): LadderVersion | undefined =>
  ladder.versions[Math.min(Math.max(version, 1), ladder.versions.length) - 1];

/** How many versions the journey uses. */
const versionCount = (ladder: Ladder, state: BuildState): number =>
  state.versions ?? ladder.versions.length;

/**
 * A version's name: the journey's own, else the ladder's title; `inLine`
 * lowers the ladder's title for the middle of a sentence ("a stone bridge").
 */
export const versionName = (
  ladder: Ladder,
  version: number,
  state: BuildState = {},
  inLine = false,
): string => {
  const own = state.names?.[version - 1];
  if (own !== undefined && own !== '') return own;
  const title = versionAt(ladder, version)?.title ?? ladder.title;
  return inLine ? title.charAt(0).toLowerCase() + title.slice(1) : title;
};

/** E: how many elements the ladder's marker has (posts and hanging ones). */
export const markerElements = (ladder: Ladder): number =>
  Math.max(0, ...ladder.pictures.map((p) => (p.slot === 'marker' ? p.order : 0)));

/** How many elements stand at `progress`: the first ceil(p × E). */
export const elementsShown = (ladder: Ladder, progress: number): number =>
  Math.max(0, Math.ceil(Math.min(Math.max(progress, 0), 1) * markerElements(ladder) - 1e-9));

/** The view box of a version in the row of versions. */
export const rowViewBox = (ladder: Ladder): string => (ladder.row ?? [0, 0, 120, 80]).join(' ');

/** The state in words, as under the row of versions. */
export const buildWords = (ladder: Ladder, version: number, state: BuildState = {}): string => {
  const now = versionName(ladder, version, state);
  const stands = /^(A|An|The) /.test(now) || !now.endsWith('s') ? 'stands' : 'stand';
  const last = version >= versionCount(ladder, state);
  const ready = state.ready === true;
  if (last || (!ready && (state.progress ?? 0) <= 0)) return `${now} ${stands}`;
  const next = versionName(ladder, version + 1, state, true);
  return `${now} ${stands} · ${next} ${ready ? 'is ready' : 'is on its way'}`;
};

/** What of the marker stands: posts and hanging elements, each shown of all. */
export interface MarkerCount {
  readonly posts: number;
  readonly postsShown: number;
  readonly hanging: number;
  readonly hangingShown: number;
}

/** The marker in numbers for a version and state (nothing after the last version). */
export const markerCount = (
  ladder: Ladder,
  version: number,
  state: BuildState = {},
): MarkerCount => {
  const posts = ladder.posts.length;
  const all = markerElements(ladder);
  const last = version >= versionCount(ladder, state);
  const shown = last ? 0 : state.ready === true ? all : elementsShown(ladder, state.progress ?? 0);
  return {
    posts,
    postsShown: Math.min(shown, posts),
    hanging: all - posts,
    hangingShown: Math.max(0, shown - posts),
  };
};

/**
 * The build for screen readers (docs/journey-design.md, "The journey
 * screen with the build"): "A plank bridge, version 3 of 5; marker: 2 of
 * 2 posts and 3 of 6 lanterns; not ready yet". `kind` names the hanging
 * elements in the plural.
 */
export const buildLabel = (
  ladder: Ladder,
  version: number,
  state: BuildState,
  kind: string,
): string => {
  const total = versionCount(ladder, state);
  const head = `${versionName(ladder, version, state)}, version ${version} of ${total}`;
  if (version >= total) return `${head}; all versions stand`;
  const count = markerCount(ladder, version, state);
  if (count.postsShown === 0) return `${head}; nothing on its way yet`;
  const posts = `${count.postsShown} of ${count.posts} posts`;
  const hanging = `${count.hangingShown} of ${count.hanging} ${kind.toLowerCase()}`;
  return `${head}; marker: ${posts} and ${hanging}; ${state.ready === true ? 'ready' : 'not ready yet'}`;
};

/** What the screen drew last, to find what is new at the moment of the tick. */
export interface Drawn {
  readonly key: string;
  readonly version: number;
  readonly shown: number;
}

/**
 * What appears with this draw: marker elements with an order above the
 * last drawn count, and the version when it grew. Nothing on a first draw
 * or after the run, ladder or marker changed (the key).
 */
export const appearing = (
  before: Drawn | undefined,
  now: Drawn,
): { readonly version: boolean; readonly fromOrder: number } => {
  if (before === undefined || before.key !== now.key)
    return { version: false, fromOrder: Infinity };
  if (now.version > before.version) return { version: true, fromOrder: 1 };
  if (now.version < before.version) return { version: false, fromOrder: Infinity };
  return { version: false, fromOrder: now.shown > before.shown ? before.shown + 1 : Infinity };
};

/** The scene with `version` (from 1) standing and the marker in `state`. */
export const ladderScene = (ladder: Ladder, version: number, state: BuildState = {}): Scene => {
  const standing = versionAt(ladder, version);
  // after the last version nothing is on its way: no marker
  const last = version >= versionCount(ladder, state);
  const ready = !last && state.ready === true;
  const shown = last
    ? 0
    : ready
      ? markerElements(ladder)
      : elementsShown(ladder, state.progress ?? 0);
  const kind = state.marker ?? ladder.marker;
  let title = buildWords(ladder, version, last ? {} : { ...state, ready }).replace(' · ', ', ');
  if (state.graduated === true) title += ', the lantern lit';
  const pictures: Placed[] = [];
  for (const place of ladder.pictures) {
    if (place.slot === undefined) pictures.push(place);
    else if (place.slot === 'build' && standing !== undefined)
      pictures.push({ ...place, art: standing.art });
    else if (place.slot === 'lantern' && state.graduated === true)
      pictures.push({ ...place, art: 'lantern' });
    else if (place.slot === 'marker' && place.order <= shown)
      pictures.push({
        ...place,
        art:
          place.part === 'cord'
            ? (place.art ?? '')
            : `marker-${kind}-${place.part}${ready && place.part === 'bead' ? '-lit' : ''}`,
      });
  }
  return { title, width: ladder.width, height: ladder.height, pictures };
};
