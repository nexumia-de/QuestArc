import type { Journey } from './types/journey';
import type { RunView } from './types/view';

/**
 * The choice records each user action writes (docs/data-model.md §2), as
 * pure functions so both hosts write the same: the plugin imports them,
 * Pensum calls them through engine-cli.mjs (`{ "action": … }`). Run ids
 * and the day come from the host, never from the engine.
 */

export type RecordChanges = Record<string, unknown>;

/**
 * Start a journey: the run and the acceptance of its first stage. A
 * journey that was active waits from today (behaviour, screen 2).
 */
export const startJourney = (input: {
  runId: string;
  journey: Journey;
  startDay: string;
  today?: string;
  why?: string;
  activeRunId?: string;
}): RecordChanges => {
  const first = input.journey.stages[0];
  const why = input.why?.trim();
  return {
    ...(input.activeRunId
      ? {
          [`pause:${input.activeRunId}:${input.today ?? input.startDay}`]: {
            action: 'pause',
            source: 'user',
          },
        }
      : {}),
    [`run:${input.runId}`]: {
      journeyId: input.journey.id,
      journeyVersion: input.journey.version,
      startDay: input.startDay,
      ...(why ? { why } : {}),
    },
    ...(first ? { [`stage:${input.runId}:${first.id}`]: { acceptedDay: input.startDay } } : {}),
  };
};

/** Bind a stage to a task; the repeat config may follow later (create and hand over). */
export const bindStage = (input: {
  runId: string;
  stageId: string;
  taskId: string;
  repeatCfgId?: string | null;
  day: string;
}): RecordChanges => ({
  [`binding:${input.runId}:${input.stageId}`]: {
    taskId: input.taskId,
    ...(input.repeatCfgId ? { repeatCfgId: input.repeatCfgId } : {}),
    day: input.day,
  },
});

/**
 * Continue after a met station (behaviour, flow C): the checkpoint of the
 * current stage ([deleted history](../../../../docs/decisions/deleted-history.md))
 * and the acceptance of the next one, or the end of the journey after its
 * last stage.
 */
export const continueJourney = (run: RunView, journey: Journey, today: string): RecordChanges => {
  const index = run.position.stage;
  const station = run.stations[index];
  const stage = journey.stages[index];
  if (!station || !stage || station.state !== 'met') return {};
  const next = journey.stages[index + 1];
  return {
    [`stage-done:${run.runId}:${stage.id}`]: {
      day: today,
      xp: station.xp,
      damage: station.guardian?.damage ?? 0,
    },
    ...(next
      ? { [`stage:${run.runId}:${next.id}`]: { acceptedDay: today } }
      : { [`run-end:${run.runId}`]: { day: today, reason: 'finished' } }),
  };
};

const pauseRecord = (runId: string, day: string, action: 'pause' | 'resume'): RecordChanges => ({
  [`pause:${runId}:${day}`]: { action, source: 'user' },
});

/** Pause a journey (design rule 14): its days stop counting. */
export const pauseJourney = (runId: string, today: string): RecordChanges =>
  pauseRecord(runId, today, 'pause');

/** Resume a journey; the journey that was active waits (data model, active journey). */
export const resumeJourney = (
  runId: string,
  today: string,
  activeRunId?: string,
): RecordChanges => ({
  ...(activeRunId && activeRunId !== runId ? pauseRecord(activeRunId, today, 'pause') : {}),
  ...pauseRecord(runId, today, 'resume'),
});

/** End a journey early; undone by withdrawing the record. */
export const endJourney = (runId: string, today: string): RecordChanges => ({
  [`run-end:${runId}`]: { day: today, reason: 'abandoned' },
});

/**
 * The bound repeat config of the active stage was paused or resumed in
 * the task app (game rules §2, pauses): a paused config carries no
 * dates, so the day is recorded.
 */
export const repeatPause = (runId: string, today: string, paused: boolean): RecordChanges => ({
  [`pause:${runId}:${today}`]: { action: paused ? 'pause' : 'resume', source: 'repeat-cfg' },
});

/** Answer the weekly look back (design rule 9): the automaticity score 1–7. */
export const answerCheckin = (
  runId: string,
  stageId: string,
  isoWeek: string,
  score: number,
): RecordChanges => ({ [`checkin:${runId}:${stageId}:${isoWeek}`]: { score } });

/** Calm or game mode (design rule 17). */
export const setMode = (mode: 'calm' | 'rpg'): RecordChanges => ({ settings: { mode } });

/** Withdraw a record (undo), the empty string the data model defines. */
export const withdraw = (key: string): RecordChanges => ({ [key]: '' });

/** The actions by name, for engine-cli.mjs. */
export const actions = {
  startJourney,
  bindStage,
  continueJourney,
  pauseJourney,
  resumeJourney,
  endJourney,
  repeatPause,
  answerCheckin,
  setMode,
  withdraw,
} as const;
