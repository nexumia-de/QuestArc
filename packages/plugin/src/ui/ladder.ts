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
  | (Place & { readonly slot: 'build' | 'lantern' | 'keeper' })
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
}

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
  const now = ladder.versions[version - 1]?.title ?? ladder.title;
  const stands = now.startsWith('A ') ? 'stands' : 'stand';
  const next = ladder.versions[version]?.title.toLowerCase();
  const ready = state.ready === true;
  if (next === undefined || (!ready && (state.progress ?? 0) <= 0)) return `${now} ${stands}`;
  return `${now} ${stands} · ${next} ${ready ? 'is ready' : 'is on its way'}`;
};

/** The scene with `version` (from 1) standing and the marker in `state`. */
export const ladderScene = (ladder: Ladder, version: number, state: BuildState = {}): Scene => {
  const { versions } = ladder;
  const standing = versions[Math.min(Math.max(version, 1), versions.length) - 1];
  // after the last version nothing is on its way: no marker
  const last = versions[version] === undefined;
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
