import type { Journey } from './types/journey';
import type { AnchorWords, GameView, PlanCheck, RunView } from './types/view';
import { CHECKPOINT_FORMAT, isTime, SKIP_FORMAT, STEP_BACK_FORMAT } from './choices';
import { anchorWords, ownWords, pairWords, PLAN_CHECK_FIELDS, PLAN_CHECK_LIMIT } from './words';

/**
 * The choice records each user action writes (docs/data-model.md §2), as
 * pure functions so both hosts write the same: the plugin imports them,
 * Pensum calls them through engine-cli.mjs (`{ "action": … }`). Run ids
 * and the day come from the host, never from the engine.
 */

export type RecordChanges = Record<string, unknown>;

/**
 * Name an anchor (design rule 2): a moment that already exists in the
 * user's day, in their own words: a routine that completes "After …", or
 * a fixed time. One record per anchor, rewritten as a whole; `name` is
 * what the user calls its place, if they like. The id comes from the
 * host. Without usable words or time nothing is written.
 */
export const nameAnchor = (input: {
  anchorId: string;
  anchor: AnchorWords;
  name?: string;
}): RecordChanges => {
  const { kind, time } = input.anchor;
  const words = anchorWords(input.anchor.words);
  const name = anchorWords(input.name);
  const value =
    kind === 'time' && isTime(time)
      ? { kind, time }
      : kind === 'routine' && words
        ? { kind, words }
        : undefined;
  if (!value || !input.anchorId) return {};
  return { [`anchor:${input.anchorId}`]: { ...value, ...(name ? { name } : {}) } };
};

/**
 * Tie a run to an anchor: to the anchor itself, or with `after` to the
 * step of a finished journey that stands there (a chain; the user's
 * choice, never automatic, design rule 3). Rewritten as a whole, so
 * leaving `after` out ties the run to the anchor itself again.
 */
export const anchorRun = (input: {
  runId: string;
  anchorId: string;
  after?: string;
}): RecordChanges => ({
  [`run-anchor:${input.runId}`]: {
    anchorId: input.anchorId,
    ...(input.after ? { after: input.after } : {}),
  },
});

/**
 * Journeys from before anchors (the view's group with `suggest`): the
 * user confirms the moment once, and every run of that journey is tied
 * to it: to an anchor they already have, or with `anchor` to a new one
 * in their words.
 */
export const confirmAnchor = (
  view: GameView,
  input: { journeyId: string; anchorId: string; anchor?: AnchorWords },
): RecordChanges => {
  const group = view.anchors.find((a) => a.id === undefined && a.suggest === input.journeyId);
  if (!group) return {};
  const named = input.anchor
    ? nameAnchor({ anchorId: input.anchorId, anchor: input.anchor })
    : undefined;
  if (named ? Object.keys(named).length === 0 : !view.anchors.some((a) => a.id === input.anchorId))
    return {};
  const changes: RecordChanges = { ...named };
  for (const { runId } of [
    ...(group.growing ? [group.growing] : []),
    ...group.resting,
    ...group.steps,
  ])
    Object.assign(changes, anchorRun({ runId, anchorId: input.anchorId }));
  return changes;
};

/**
 * Remove an anchor where nothing stands: no growing step, no journey
 * that waits and no habit. An anchor with any of these stays.
 */
export const removeAnchor = (view: GameView, anchorId: string): RecordChanges => {
  const anchor = view.anchors.find((a) => a.id === anchorId);
  if (!anchor || anchor.growing || anchor.resting.length > 0 || anchor.steps.length > 0) return {};
  return { [`anchor:${anchorId}`]: '' };
};

/**
 * Start a journey: the run and the acceptance of its first stage. A
 * journey that was active waits from today (behaviour, screen 2). With
 * `anchor` the run is tied to that anchor (`anchorRun`).
 */
export const startJourney = (input: {
  runId: string;
  journey: Journey;
  startDay: string;
  today?: string;
  why?: string;
  activeRunId?: string;
  anchor?: { anchorId: string; after?: string };
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
    ...(input.anchor ? anchorRun({ runId: input.runId, ...input.anchor }) : {}),
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
 * last stage. What the user pairs the stage with goes along to the next
 * one, unless that already has its own (design rule 7). From a stage
 * walked again after a step back it only takes up the stage left behind:
 * that one keeps its acceptance, its own pairing and what it counted,
 * and the days in between are not due for it.
 */
export const continueJourney = (run: RunView, journey: Journey, today: string): RecordChanges => {
  const index = run.position.stage;
  const station = run.stations[index];
  const stage = journey.stages[index];
  if (!station || !stage || station.state !== 'met') return {};
  const next = journey.stages[index + 1];
  if (station.stepBackDay !== undefined) {
    if (!next) return {};
    return {
      [`step-back:${run.runId}:${next.id}:${station.stepBackDay}`]: {
        until: today,
        dataFormat: STEP_BACK_FORMAT,
      },
    };
  }
  return {
    [`stage-done:${run.runId}:${stage.id}`]: { day: today, dataFormat: CHECKPOINT_FORMAT },
    ...(next
      ? { [`stage:${run.runId}:${next.id}`]: { acceptedDay: today } }
      : { [`run-end:${run.runId}`]: { day: today, reason: 'finished' } }),
    ...(next && station.pair && !run.stations[index + 1]?.pair
      ? { [`pair:${run.runId}:${next.id}`]: { text: station.pair } }
      : {}),
  };
};

/**
 * Stay a while at a met station (design rule 1): nothing changes, the
 * stage keeps counting; the record only quiets the offer for a week.
 */
export const stayHere = (run: RunView, today: string): RecordChanges => {
  const station = run.stations[run.position.stage];
  if (!station || station.state !== 'met') return {};
  return { [`stay:${run.runId}:${station.stageId}`]: { day: today } };
};

/**
 * "I already do this" (behaviour, flow B): the offered stage is passed
 * without a task and the next one is accepted. Only a stage that has no
 * task yet can be skipped, and never the last one.
 */
export const skipStage = (run: RunView, journey: Journey, today: string): RecordChanges => {
  const index = run.position.stage;
  const stage = journey.stages[index];
  const next = journey.stages[index + 1];
  const station = run.stations[index];
  // A stage walked again is finished already: it has nothing to pass.
  if (!stage || !next || station?.state !== 'unbound' || station.stepBackDay !== undefined)
    return {};
  return {
    [`skip:${run.runId}:${stage.id}`]: { day: today, dataFormat: SKIP_FORMAT },
    [`stage:${run.runId}:${next.id}`]: { acceptedDay: today },
  };
};

/**
 * Take a skip back, while the view says it can be (`undoable`): the stage
 * is offered again and the acceptance of the stage after it is withdrawn.
 */
export const undoSkip = (run: RunView, journey: Journey, stageId: string): RecordChanges => {
  const index = run.stations.findIndex((s) => s.stageId === stageId);
  const next = journey.stages[index + 1];
  if (!next || run.stations[index]?.undoable !== true) return {};
  return { [`skip:${run.runId}:${stageId}`]: '', [`stage:${run.runId}:${next.id}`]: '' };
};

/**
 * Carry on after a long break (design rule 14): nothing changes; the
 * record only closes the card for this gap.
 */
export const carryOn = (run: RunView, today: string): RecordChanges => {
  const station = run.stations[run.position.stage];
  if (!run.comeBack || !station) return {};
  return { [`carry-on:${run.runId}:${station.stageId}`]: { day: today } };
};

/**
 * Call the gap a pause: pause and resume records for the stretch from
 * the first day of the gap to yesterday, so those days are not due. It
 * never reaches back further than the gap.
 */
export const callItAPause = (run: RunView, today: string): RecordChanges => {
  if (!run.comeBack || run.comeBack.from >= today) return {};
  return {
    [`pause:${run.runId}:${run.comeBack.from}`]: { action: 'pause', source: 'user' },
    [`pause:${run.runId}:${today}`]: { action: 'resume', source: 'user' },
  };
};

/**
 * Start smaller: the finished stage before the current one is walked
 * again from today; the stage left behind waits. With `pause` the gap is
 * also called a pause (the two choices combined).
 */
export const stepBack = (
  run: RunView,
  today: string,
  options: { pause?: boolean } = {},
): RecordChanges => {
  const station = run.stations[run.position.stage];
  if (!run.comeBack?.smaller || !station) return {};
  return {
    ...(options.pause ? callItAPause(run, today) : {}),
    [`step-back:${run.runId}:${station.stageId}:${today}`]: { dataFormat: STEP_BACK_FORMAT },
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

/**
 * A host saw the reminder of a followed stage's task change (game rules
 * §9): on, or off since `day`. Like a paused repeat, a reminder carries
 * no dates, so the day is recorded; one record per stage, rewritten.
 */
export const reminderSeen = (
  runId: string,
  stageId: string,
  day: string,
  on: boolean,
): RecordChanges => ({ [`reminder-seen:${runId}:${stageId}`]: { on, day } });

/** Answer the weekly look back (design rule 9): the automaticity score 1–7. */
export const answerCheckin = (
  runId: string,
  stageId: string,
  isoWeek: string,
  score: number,
): RecordChanges => ({ [`checkin:${runId}:${stageId}:${isoWeek}`]: { score } });

/**
 * Let a habit graduate (game rules §6, design rule 25): from today it
 * runs by itself and is not followed any more. Only while the view says
 * it can (`habit.canGraduate`). `choice` is what the user does with the
 * task: `end` its repeat themselves (QuestArc never ends one), or `keep`
 * it repeating quietly; either way its completions count for nothing.
 */
export const graduate = (run: RunView, today: string, choice: 'end' | 'keep'): RecordChanges => {
  if (!run.habit?.canGraduate || (choice !== 'end' && choice !== 'keep')) return {};
  return { [`graduation:${run.runId}:${run.habit.stageId}:${today}`]: { choice } };
};

/**
 * "Not Now" to the offer to graduate (game rules §6): the offer is quiet
 * for four weeks and comes back if the habit still can. One record per
 * habit, rewritten; only while the view says it can graduate.
 */
export const graduateLater = (run: RunView, today: string): RecordChanges => {
  if (!run.habit?.canGraduate) return {};
  return { [`graduation-later:${run.runId}:${run.habit.stageId}`]: { day: today } };
};

/**
 * Answer "does it still run by itself?" for a graduated habit, while the
 * view says the question is due (`habit.graduated.checkDue`, which names
 * the record). "Not really" (`still: false`) changes nothing by itself:
 * the hosts then offer to bring the habit back.
 */
export const answerStill = (run: RunView, today: string, still: boolean): RecordChanges => {
  const graduated = run.habit?.graduated;
  if (!run.habit || !graduated?.checkDue || typeof still !== 'boolean') return {};
  return {
    [`graduation-check:${run.runId}:${run.habit.stageId}:${graduated.checkDue}`]: {
      day: today,
      still,
    },
  };
};

/**
 * Bring a graduated habit back: from today it is followed again like any
 * maintained habit. The record stays and gets `until`, so the days it
 * ran by itself never turn into gaps and nothing it counted is lost.
 */
export const bringBack = (run: RunView, today: string): RecordChanges => {
  const graduated = run.habit?.graduated;
  if (!run.habit || !graduated) return {};
  return {
    [`graduation:${run.runId}:${run.habit.stageId}:${graduated.day}`]: {
      choice: graduated.choice,
      until: today,
    },
  };
};

/**
 * The user's choice of what a run builds, what hangs on its marker and
 * its hue (game rules §7), one record per run; names come from
 * content/art/. Choosing nothing withdraws the record, so the
 * journey's suggestion applies again.
 */
export const chooseBuild = (
  runId: string,
  choice: { ladder?: string; marker?: string; hue?: string },
): RecordChanges => {
  const value = Object.fromEntries(
    (['ladder', 'marker', 'hue'] as const)
      .filter((field) => typeof choice[field] === 'string' && choice[field] !== '')
      .map((field) => [field, choice[field]]),
  );
  return { [`build:${runId}`]: Object.keys(value).length > 0 ? value : '' };
};

/**
 * "Pair it with" (design rule 7): something the user enjoys only while
 * doing the stage's habit, in their own words, one record per stage.
 * The text is one line without a final full stop, so it fits the plan
 * sentence; an empty text withdraws the record.
 */
export const pairStage = (runId: string, stageId: string, text: string): RecordChanges => {
  const words = pairWords(text);
  return { [`pair:${runId}:${stageId}`]: words ? { text: words } : '' };
};

/**
 * The optional plan check of a run (design rule 6): wish, best outcome,
 * main obstacle and the plan for it, in the user's own words, one record
 * per run, rewritten as a whole. Empty answers are left out; no answer
 * at all withdraws the record.
 */
export const checkPlan = (runId: string, answers: PlanCheck): RecordChanges => {
  const value = Object.fromEntries(
    PLAN_CHECK_FIELDS.map((field) => [field, ownWords(answers[field], PLAN_CHECK_LIMIT)]).filter(
      ([, text]) => text !== '',
    ),
  );
  return { [`plan-check:${runId}`]: Object.keys(value).length > 0 ? value : '' };
};

/** Withdraw a record (undo), the empty string the data model defines. */
export const withdraw = (key: string): RecordChanges => ({ [key]: '' });

/** The actions by name, for engine-cli.mjs. */
export const actions = {
  nameAnchor,
  anchorRun,
  confirmAnchor,
  removeAnchor,
  startJourney,
  bindStage,
  continueJourney,
  stayHere,
  skipStage,
  undoSkip,
  carryOn,
  callItAPause,
  stepBack,
  pauseJourney,
  resumeJourney,
  endJourney,
  repeatPause,
  reminderSeen,
  answerCheckin,
  graduate,
  graduateLater,
  answerStill,
  bringBack,
  chooseBuild,
  checkPlan,
  pairStage,
  withdraw,
} as const;
