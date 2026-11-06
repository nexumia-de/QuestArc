import type { Journey, RunView } from '@questarc/engine';

/**
 * The choice records each user action writes (docs/data-model.md §2), as
 * pure functions so both the view and plugin.js write the same and tests
 * can check them. Run ids come from the host, never from the engine.
 */

export type RecordChanges = Record<string, unknown>;

export const newRunId = (cryptoApi: Pick<Crypto, 'getRandomValues'> = crypto): string => {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};

/** Start a journey: the run and the acceptance of its first stage. */
export const startJourney = (input: {
  runId: string;
  journey: Journey;
  startDay: string;
  why?: string;
}): RecordChanges => {
  const first = input.journey.stages[0];
  const why = input.why?.trim();
  return {
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
