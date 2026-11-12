/**
 * The scene of a ladder (content/art/<name>.ladder.json, #42): one build
 * standing in its slot of its setting; while a stage runs the scaffold
 * stands behind it, with the flag when the stage is met; after graduation
 * the lantern. The picture shows states, never a count: counts stay exact
 * in the card. The rules are in docs/journey-design.md, "Builds and
 * ladders"; Day Planner composes the same scene
 * (pensum/ui/journey/art.py, `ladder_scene`).
 */
import type { Placed, Scene } from './art';

export interface LadderVersion {
  readonly art: string;
  readonly title: string;
}

export type LadderPlace =
  | (Placed & { readonly slot?: undefined })
  | (Omit<Placed, 'art'> & {
      readonly slot: 'scaffold' | 'build' | 'flag' | 'lantern' | 'keeper';
    });

export interface Ladder {
  readonly title: string;
  /** The default hue of its setting's kind (palette.json). */
  readonly hue: string;
  readonly width: number;
  readonly height: number;
  /** The scaffold shown while the next version is worked on. */
  readonly scaffold: string;
  /** Where the setting's path meets every version, in build units. */
  readonly ways: readonly (readonly (readonly [number, number])[])[];
  readonly versions: readonly LadderVersion[];
  readonly pictures: readonly LadderPlace[];
}

/**
 * `standing`: the version stands; `extending`: the next version is worked
 * on (scaffold); `ready`: the stage is met (scaffold and flag). A met stage
 * that falls back below its condition goes back to `extending` only.
 */
export type BuildState = 'standing' | 'extending' | 'ready';

/** The scene with `version` (from 1) standing in `state`, the lantern if `lit`. */
export const ladderScene = (
  ladder: Ladder,
  version: number,
  state: BuildState = 'standing',
  lit = false,
): Scene => {
  const { versions } = ladder;
  const standing = versions[Math.min(Math.max(version, 1), versions.length) - 1];
  const next = versions[version];
  // after the last version there is nothing to extend
  const work = next === undefined ? 'standing' : state;
  const words = [standing?.title ?? ladder.title];
  if (work === 'extending') words.push(`work on ${next?.title.toLowerCase() ?? ''} has begun`);
  if (work === 'ready') words.push(`${next?.title.toLowerCase() ?? ''} is ready`);
  if (lit) words.push('the lantern lit');
  const pictures: Placed[] = [];
  for (const place of ladder.pictures) {
    if (place.slot === undefined) pictures.push(place);
    else if (place.slot === 'build' && standing !== undefined)
      pictures.push({ ...place, art: standing.art });
    else if (place.slot === 'scaffold' && work !== 'standing')
      pictures.push({ ...place, art: ladder.scaffold });
    else if (place.slot === 'flag' && work === 'ready') pictures.push({ ...place, art: 'pennant' });
    else if (place.slot === 'lantern' && lit) pictures.push({ ...place, art: 'lantern' });
  }
  return { title: words.join(', '), width: ladder.width, height: ladder.height, pictures };
};
