import list from '../../../content/ladders.json';
import type { Journey } from './types/journey';

/**
 * What a journey can build (docs/game-rules.md §10): the built-in list of
 * ladders, settings, markers and hues in content/ladders.json, and how a
 * run's ladder, marker and hue follow from the user's choice, the journey
 * and the list. Names only; pictures are the hosts' concern.
 */

export interface Ladder {
  readonly versions: number;
  readonly setting: string;
  readonly marker: string;
}

export interface LadderList {
  readonly defaultLadder: string;
  readonly ladders: Readonly<Record<string, Ladder>>;
  readonly settings: Readonly<
    Record<
      string,
      { readonly water: boolean; readonly layout: 'span' | 'sides'; readonly hue: string }
    >
  >;
  readonly markers: Readonly<Record<string, { readonly onWater: boolean }>>;
  readonly hues: readonly string[];
}

export const LADDERS = list as LadderList;

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
  const hanging = entry(ladders.markers, marker);
  const setting = entry(ladders.settings, entry(ladders.ladders, ladder)?.setting);
  return hanging !== undefined && setting !== undefined && (!setting.water || hanging.onWater);
};

/**
 * Ladder, marker and hue of a run: the user's choice, else the journey's,
 * else the list's default; names that are unknown or do not fit are
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
    entry(LADDERS.settings, own?.setting)?.hue ??
    '';
  return { ladder, marker, hue };
};

/** Inconsistencies in the list itself; checked in CI (test/ladders.test.ts). */
export const ladderListProblems = (ladders: LadderList): string[] => {
  const problems: string[] = [];
  if (entry(ladders.ladders, ladders.defaultLadder) === undefined)
    problems.push(`defaultLadder ${ladders.defaultLadder}: not a ladder`);
  for (const [name, ladder] of Object.entries(ladders.ladders)) {
    if (!Number.isInteger(ladder.versions) || ladder.versions < 2)
      problems.push(`ladder ${name}: needs at least 2 versions`);
    if (entry(ladders.settings, ladder.setting) === undefined)
      problems.push(`ladder ${name}: setting ${ladder.setting} unknown`);
    else if (!markerFits(ladder.marker, name, ladders))
      problems.push(`ladder ${name}: default marker ${ladder.marker} unknown or not fitting`);
  }
  for (const [name, setting] of Object.entries(ladders.settings)) {
    if (!ladders.hues.includes(setting.hue))
      problems.push(`setting ${name}: hue ${setting.hue} unknown`);
    if (setting.layout !== 'span' && setting.layout !== 'sides')
      problems.push(`setting ${name}: layout must be span or sides`);
  }
  return problems;
};
