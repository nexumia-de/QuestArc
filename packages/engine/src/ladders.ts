// Named imports, so the bundles keep only these fields and none of the
// pictures' coordinates (the plugin's view has a size limit).
import * as crossing from '../../../content/art/crossing.ladder.json';
import * as home from '../../../content/art/home.ladder.json';
import markers from '../../../content/art/markers.json';
import palette from '../../../content/art/palette.json';
import type { Journey } from './types/journey';

/**
 * What a journey can build (docs/game-rules.md §9), read from the picture
 * files in content/art/ that the art checker checks: each
 * `<name>.ladder.json` (its versions, `water`, default `marker` and `hue`),
 * `markers.json` (`landOnly`) and the hue names of `palette.json`. One
 * list for the engine, the journey checker and both hosts; the engine uses
 * names and numbers only. A new ladder file gets one line in SOURCES (a
 * test checks that none is missing).
 */

interface LadderFile {
  readonly versions: readonly unknown[];
  readonly water: boolean;
  readonly marker: string;
  readonly hue: string;
}

/** Only the fields the engine reads, named one by one so bundlers drop the rest. */
const SOURCES: Readonly<Record<string, LadderFile>> = {
  home: { versions: home.versions, water: home.water, marker: home.marker, hue: home.hue },
  crossing: {
    versions: crossing.versions,
    water: crossing.water,
    marker: crossing.marker,
    hue: crossing.hue,
  },
};

export interface Ladder {
  /** Number of whole versions drawn. */
  readonly versions: number;
  /** The setting has water: no marker that grows only on land. */
  readonly water: boolean;
  /** Default marker. */
  readonly marker: string;
  /** Default hue. */
  readonly hue: string;
}

export interface LadderList {
  readonly defaultLadder: string;
  readonly ladders: Readonly<Record<string, Ladder>>;
  readonly markers: Readonly<Record<string, { readonly landOnly: boolean }>>;
  readonly hues: readonly string[];
}

const listFromFiles = (): LadderList => ({
  defaultLadder: 'home',
  ladders: Object.fromEntries(
    Object.entries(SOURCES).map(([name, file]) => [
      name,
      { versions: file.versions.length, water: file.water, marker: file.marker, hue: file.hue },
    ]),
  ),
  markers: Object.fromEntries(
    Object.entries(markers).map(([name, kind]) => [name, { landOnly: kind.landOnly }]),
  ),
  hues: Object.keys(palette),
});

// Marked pure, so a bundle that does not use the list (the plugin's view,
// which has a size limit) leaves it out.
export const LADDERS: LadderList = /* @__PURE__ */ listFromFiles();

/** The user's choices for a run (`build:<runId>`, docs/data-model.md §2). */
export interface BuildChoice {
  readonly ladder?: string;
  readonly marker?: string;
  readonly hue?: string;
}

/** The entry `name` of a list, if it is the list's own (no prototype keys). */
const entry = <T>(record: Readonly<Record<string, T>>, name: unknown): T | undefined =>
  typeof name === 'string' && Object.prototype.hasOwnProperty.call(record, name)
    ? record[name]
    : undefined;

/** Whether `marker` is known and may hang in the setting of `ladder`. */
export const markerFits = (marker: unknown, ladder: string, ladders = LADDERS): boolean => {
  const kind = entry(ladders.markers, marker);
  const own = entry(ladders.ladders, ladder);
  return kind !== undefined && own !== undefined && !(kind.landOnly && own.water);
};

/**
 * Ladder, marker and hue of a run: the user's choice, else the journey's,
 * else the ladder's default; names that are unknown or do not fit are
 * skipped, so an older list never leaves a host without pictures.
 */
export const resolveBuild = (
  journey: Journey,
  choice: BuildChoice | undefined,
): { ladder: string; marker: string; hue: string } => {
  const ladder =
    [choice?.ladder, journey.build?.ladder].find(
      (name): name is string => entry(LADDERS.ladders, name) !== undefined,
    ) ?? LADDERS.defaultLadder;
  const own = entry(LADDERS.ladders, ladder);
  const marker =
    [choice?.marker, journey.build?.marker].find((name): name is string =>
      markerFits(name, ladder),
    ) ??
    own?.marker ??
    '';
  const hue =
    [choice?.hue].find((name): name is string => LADDERS.hues.includes(name ?? '')) ??
    own?.hue ??
    '';
  return { ladder, marker, hue };
};
