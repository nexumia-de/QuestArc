import { isDay } from './days';
import type { BuildChoice } from './ladders';
import type { Journey } from './types/journey';
import type { PlanCheck } from './types/view';
import { PLAN_CHECK_FIELDS } from './words';

/**
 * Parses the choice records (docs/data-model.md §2) from plugin-data keys.
 * Empty and malformed records are ignored; malformed ones are reported.
 * Unknown kinds and fields are ignored without a problem; a run with a
 * record in a newer data format is read only from its run, pause and
 * run-end records (data model §2, data format).
 */

/** The data format this engine reads and writes (docs/decisions/data-format.md). */
export const DATA_FORMAT = 4;

/** The format a checkpoint carries: without `xp` and `damage` since 3.3 (#110). */
export const CHECKPOINT_FORMAT = 2;

/** The format a skipped stage carries: an older engine would still work on it (#81). */
export const SKIP_FORMAT = 3;

/** The format a step back carries: an older engine would work on the stage left behind (#82). */
export const STEP_BACK_FORMAT = 4;

/** Record kinds that name their run in the key's second part. */
export const RUN_KINDS: ReadonlySet<string> = new Set([
  'run',
  'run-end',
  'stage',
  'binding',
  'stage-done',
  'pause',
  'build',
  'checkin',
  'graduation',
  'stay',
  'skip',
  'pair',
  'plan-check',
  'carry-on',
  'step-back',
]);

/** Kinds every engine reads, also for a run in a newer format: they place the run among the others. */
const PLACING_KINDS: ReadonlySet<string> = new Set(['run', 'run-end', 'pause']);

export interface RunRecord {
  readonly runId: string;
  readonly journeyId: string;
  readonly journeyVersion: number;
  readonly startDay: string;
  readonly why?: string;
}

/** A stage's task; `day` is when it was bound (counting starts then at the latest). */
export interface Binding {
  readonly taskId: string;
  readonly repeatCfgId?: string;
  readonly day?: string;
}

/** A step back from a stage: the stage before it is walked again from `day` until `until`. */
export interface StepBack {
  readonly day: string;
  /** The day the stage was taken up again; absent while the smaller stage is walked. */
  readonly until?: string;
}

export interface Choices {
  readonly runs: readonly RunRecord[];
  /** runId → end day */
  readonly runEnds: ReadonlyMap<string, string>;
  /** `${runId}:${stageId}` → accepted day */
  readonly accepted: ReadonlyMap<string, string>;
  /** `${runId}:${stageId}` → binding */
  readonly bindings: ReadonlyMap<string, Binding>;
  /** `${runId}:${stageId}` → the day the stage was finished (its checkpoint) */
  readonly checkpoints: ReadonlyMap<string, { day: string }>;
  /** runId → pause/resume actions sorted by day */
  readonly pauses: ReadonlyMap<string, readonly { day: string; action: 'pause' | 'resume' }[]>;
  /** `${runId}:${stageId}:${isoWeek}` → the weekly answer, 1..7 */
  readonly checkins: ReadonlyMap<string, number>;
  /** `${runId}:${stageId}` → the day the user chose to stay a while */
  readonly stays: ReadonlyMap<string, string>;
  /** `${runId}:${stageId}` → the day the stage was skipped ("already yours") */
  readonly skips: ReadonlyMap<string, string>;
  /** `${runId}:${stageId}` → what the user pairs the stage with, in their words */
  readonly pairs: ReadonlyMap<string, string>;
  /** runId → the user's plan check, the answers that are filled in */
  readonly planChecks: ReadonlyMap<string, PlanCheck>;
  /** `${runId}:${stageId}` → the day the user chose to carry on after a long break */
  readonly carryOns: ReadonlyMap<string, string>;
  /** `${runId}:${stageId}` (the stage left behind) → its step backs sorted by day */
  readonly stepBacks: ReadonlyMap<string, readonly StepBack[]>;
  /** runId → the user's build choices (names are checked when used) */
  readonly builds: ReadonlyMap<string, BuildChoice>;
  readonly userJourneys: readonly unknown[];
  /** runId → highest data format above DATA_FORMAT among its records */
  readonly newer: ReadonlyMap<string, number>;
  readonly problems: readonly string[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/** The run of a run-scoped key, if any. */
const runOf = (key: string): string | undefined => {
  const [kind, runId] = key.split(':');
  return kind && RUN_KINDS.has(kind) ? str(runId) : undefined;
};

/** Runs with a record above this engine's data format, with the highest format. */
const newerRuns = (records: Readonly<Record<string, unknown>>): Map<string, number> => {
  const newer = new Map<string, number>();
  for (const [key, value] of Object.entries(records)) {
    const runId = runOf(key);
    const format = isObject(value) ? num(value.dataFormat) : undefined;
    if (runId && format !== undefined && format > DATA_FORMAT) {
      newer.set(runId, Math.max(format, newer.get(runId) ?? 0));
    }
  }
  return newer;
};

export const parseChoices = (records: Readonly<Record<string, unknown>>): Choices => {
  const runs: RunRecord[] = [];
  const runEnds = new Map<string, string>();
  const accepted = new Map<string, string>();
  const bindings = new Map<string, Binding>();
  const checkpoints = new Map<string, { day: string }>();
  const pauses = new Map<string, { day: string; action: 'pause' | 'resume' }[]>();
  const checkins = new Map<string, number>();
  const stays = new Map<string, string>();
  const skips = new Map<string, string>();
  const pairs = new Map<string, string>();
  const planChecks = new Map<string, PlanCheck>();
  const carryOns = new Map<string, string>();
  const stepBacks = new Map<string, StepBack[]>();
  const builds = new Map<string, BuildChoice>();
  const userJourneys: unknown[] = [];
  const problems: string[] = [];
  const newer = newerRuns(records);

  for (const key of Object.keys(records).sort()) {
    const value = records[key];
    if (value === '' || value === null || value === undefined) continue;
    const parts = key.split(':');
    const kind = parts[0] ?? '';
    // Kinds of a newer engine are its own: ignored, never reported.
    if (kind !== 'settings' && kind !== 'journey' && !RUN_KINDS.has(kind)) continue;
    const runId = runOf(key);
    const tooNew = runId !== undefined && newer.has(runId);
    if (tooNew && !PLACING_KINDS.has(kind)) continue;
    const bad = (): void => {
      if (!tooNew) problems.push(`record ${key}: unexpected value`);
    };
    if (!isObject(value)) {
      bad();
      continue;
    }

    if (kind === 'settings') {
      // Written by QuestArc before 3.3 (calm or game mode); nothing is read from it.
    } else if (kind === 'run' && parts.length === 2 && parts[1]) {
      const journeyId = str(value.journeyId);
      const startDay = value.startDay;
      if (journeyId && isDay(startDay)) {
        runs.push({
          runId: parts[1],
          journeyId,
          journeyVersion: num(value.journeyVersion) ?? 1,
          startDay,
          ...(str(value.why) ? { why: str(value.why) } : {}),
        });
      } else bad();
    } else if (kind === 'run-end' && parts.length === 2 && parts[1]) {
      if (isDay(value.day)) runEnds.set(parts[1], value.day);
      else bad();
    } else if (kind === 'stage' && parts.length === 3) {
      if (isDay(value.acceptedDay)) accepted.set(`${parts[1]}:${parts[2]}`, value.acceptedDay);
      else bad();
    } else if (kind === 'binding' && parts.length === 3) {
      const taskId = str(value.taskId);
      const repeatCfgId = str(value.repeatCfgId);
      if (taskId) {
        bindings.set(`${parts[1]}:${parts[2]}`, {
          taskId,
          ...(repeatCfgId ? { repeatCfgId } : {}),
          ...(isDay(value.day) ? { day: value.day } : {}),
        });
      } else bad();
    } else if (kind === 'stage-done' && parts.length === 3) {
      // Checkpoints written before data format 2 also carry `xp` and
      // `damage`; they are read like any unknown field: not at all.
      if (isDay(value.day)) checkpoints.set(`${parts[1]}:${parts[2]}`, { day: value.day });
      else bad();
    } else if (kind === 'pause' && parts.length === 3 && parts[1] && isDay(parts[2])) {
      if (value.action === 'pause' || value.action === 'resume') {
        const list = pauses.get(parts[1]) ?? [];
        list.push({ day: parts[2], action: value.action });
        pauses.set(parts[1], list);
      } else bad();
    } else if (kind === 'checkin' && parts.length === 4) {
      const score = num(value.score);
      if (score !== undefined && score >= 1 && score <= 7)
        checkins.set(parts.slice(1).join(':'), score);
      else bad();
    } else if ((kind === 'stay' || kind === 'skip' || kind === 'carry-on') && parts.length === 3) {
      if (isDay(value.day))
        (kind === 'stay' ? stays : kind === 'skip' ? skips : carryOns).set(
          `${parts[1]}:${parts[2]}`,
          value.day,
        );
      else bad();
    } else if (kind === 'pair' && parts.length === 3) {
      const text = str(value.text);
      if (text) pairs.set(`${parts[1]}:${parts[2]}`, text);
      else bad();
    } else if (kind === 'plan-check' && parts.length === 2 && parts[1]) {
      const answers = PLAN_CHECK_FIELDS.flatMap((field) => {
        const text = str(value[field]);
        return text ? [[field, text]] : [];
      });
      if (answers.length > 0) planChecks.set(parts[1], Object.fromEntries(answers) as PlanCheck);
      else bad();
    } else if (kind === 'step-back' && parts.length === 4 && isDay(parts[3])) {
      const until = value.until;
      if (until === undefined || (isDay(until) && until >= parts[3])) {
        const list = stepBacks.get(`${parts[1]}:${parts[2]}`) ?? [];
        // Keys are sorted, so the list is sorted by day.
        list.push({ day: parts[3], ...(until !== undefined ? { until } : {}) });
        stepBacks.set(`${parts[1]}:${parts[2]}`, list);
      } else bad();
    } else if (kind === 'build' && parts.length === 2 && parts[1]) {
      const choice: Record<string, string> = {};
      for (const field of ['ladder', 'marker', 'hue'] as const) {
        const name = str(value[field]);
        if (name) choice[field] = name;
      }
      builds.set(parts[1], choice);
    } else if (kind === 'journey' && parts.length === 2) {
      userJourneys.push(value as unknown as Journey);
    } else if (kind === 'graduation') {
      // Graduation is evaluated with the More journeys milestone (#22).
    } else if (!tooNew) {
      problems.push(`record ${key}: unexpected key`);
    }
  }

  for (const list of pauses.values()) list.sort((a, b) => a.day.localeCompare(b.day));
  return {
    runs,
    runEnds,
    accepted,
    bindings,
    checkpoints,
    pauses,
    checkins,
    stays,
    skips,
    pairs,
    planChecks,
    carryOns,
    stepBacks,
    builds,
    userJourneys,
    newer,
    problems,
  };
};
