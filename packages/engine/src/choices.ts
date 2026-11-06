import { isDay } from './days';
import type { Journey } from './types/journey';

/**
 * Parses the choice records (docs/data-model.md §2) from plugin-data keys.
 * Empty and malformed records are ignored; malformed ones are reported.
 */

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

export interface Choices {
  readonly mode: 'calm' | 'rpg';
  readonly runs: readonly RunRecord[];
  /** runId → end day */
  readonly runEnds: ReadonlyMap<string, string>;
  /** `${runId}:${stageId}` → accepted day */
  readonly accepted: ReadonlyMap<string, string>;
  /** `${runId}:${stageId}` → binding */
  readonly bindings: ReadonlyMap<string, Binding>;
  /** `${runId}:${stageId}` → checkpoint */
  readonly checkpoints: ReadonlyMap<string, { day: string; xp: number; damage: number }>;
  /** runId → pause/resume actions sorted by day */
  readonly pauses: ReadonlyMap<string, readonly { day: string; action: 'pause' | 'resume' }[]>;
  /** `${runId}:${stageId}:${isoWeek}` present when answered */
  readonly checkins: ReadonlySet<string>;
  readonly userJourneys: readonly unknown[];
  readonly problems: readonly string[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const parseChoices = (records: Readonly<Record<string, unknown>>): Choices => {
  let mode: 'calm' | 'rpg' = 'calm';
  const runs: RunRecord[] = [];
  const runEnds = new Map<string, string>();
  const accepted = new Map<string, string>();
  const bindings = new Map<string, Binding>();
  const checkpoints = new Map<string, { day: string; xp: number; damage: number }>();
  const pauses = new Map<string, { day: string; action: 'pause' | 'resume' }[]>();
  const checkins = new Set<string>();
  const userJourneys: unknown[] = [];
  const problems: string[] = [];

  for (const key of Object.keys(records).sort()) {
    const value = records[key];
    if (value === '' || value === null || value === undefined) continue;
    const parts = key.split(':');
    const kind = parts[0];
    const bad = (): void => {
      problems.push(`record ${key}: unexpected value`);
    };
    if (!isObject(value)) {
      bad();
      continue;
    }

    if (kind === 'settings') {
      if (value.mode === 'rpg' || value.mode === 'calm') mode = value.mode;
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
      const xp = num(value.xp);
      const damage = num(value.damage);
      if (isDay(value.day) && xp !== undefined && damage !== undefined) {
        checkpoints.set(`${parts[1]}:${parts[2]}`, { day: value.day, xp, damage });
      } else bad();
    } else if (kind === 'pause' && parts.length === 3 && parts[1] && isDay(parts[2])) {
      if (value.action === 'pause' || value.action === 'resume') {
        const list = pauses.get(parts[1]) ?? [];
        list.push({ day: parts[2], action: value.action });
        pauses.set(parts[1], list);
      } else bad();
    } else if (kind === 'checkin' && parts.length === 4) {
      const score = num(value.score);
      if (score !== undefined && score >= 1 && score <= 7) checkins.add(parts.slice(1).join(':'));
      else bad();
    } else if (kind === 'journey' && parts.length === 2) {
      userJourneys.push(value as unknown as Journey);
    } else if (kind === 'graduation') {
      // Graduation is evaluated with the More journeys milestone (#22).
    } else {
      problems.push(`record ${key}: unknown kind`);
    }
  }

  for (const list of pauses.values()) list.sort((a, b) => a.day.localeCompare(b.day));
  return {
    mode,
    runs,
    runEnds,
    accepted,
    bindings,
    checkpoints,
    pauses,
    checkins,
    userJourneys,
    problems,
  };
};
