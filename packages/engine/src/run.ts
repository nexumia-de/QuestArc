import { answersOf, weeklyAnswers } from './answers';
import { resolveBinding } from './binding';
import type { Choices, RunRecord } from './choices';
import { awayBy, comeBackOf, openStepBack } from './comeback';
import { creditedDays, minutesTracked } from './completions';
import { bestProgress, conditionProgress } from './conditions';
import { daysBetween, isoWeek } from './days';
import { habitOf } from './habit';
import { resolveBuild } from './ladders';
import { continueOffer } from './offer';
import { reminderView } from './reminder';
import { isSupported } from './schedule';
import { buildTimeline } from './timeline';
import type { Journey } from './types/journey';
import type { SnapshotRepeatCfg, SnapshotTask } from './types/snapshot';
import type { BuildView, ComeBack, ReminderView, RunView, StationView } from './types/view';

/**
 * One walk through a journey (docs/game-rules.md, docs/data-model.md):
 * finished stages come from their checkpoints, skipped ones from their
 * skip records, the current stage is derived from its bound recurring
 * task, later stages are ahead. After a step back the stage before the
 * one left is the current one again, counted from that day (#82).
 */

export interface RunContext {
  readonly today: string;
  readonly tasks: readonly SnapshotTask[];
  readonly repeatCfgs: readonly SnapshotRepeatCfg[];
  readonly choices: Choices;
  readonly logicalDay: (timestamp: number) => string;
}

const EMPTY_RUN = { current: 0, best: 0, total: 0, gap: false };

export const buildRun = (run: RunRecord, journey: Journey, ctx: RunContext): RunView => {
  const { today, choices } = ctx;
  const key = (stageId: string): string => `${run.runId}:${stageId}`;
  const pauses = choices.pauses.get(run.runId) ?? [];
  // A skipped stage is passed without a task (game rules §4); the last
  // stage cannot be skipped: a journey ends with a habit the user does.
  const skippedDay = (stageId: string, index: number): string | undefined =>
    index < journey.stages.length - 1 && !choices.checkpoints.has(key(stageId))
      ? choices.skips.get(key(stageId))
      : undefined;
  // A step back makes the finished stage before the one left current again.
  const stepBack = openStepBack(journey, choices, run.runId, today);
  const currentIndex = stepBack
    ? stepBack.index - 1
    : journey.stages.findIndex(
        (s, i) => !choices.checkpoints.has(key(s.id)) && skippedDay(s.id, i) === undefined,
      );
  const ended = choices.runEnds.has(run.runId);
  const lastPause = pauses.filter((p) => p.day <= today).at(-1);

  let lastDoneDay = run.startDay;
  let offerFallback = false;
  let checkinDue = false;
  let cfgPaused = false;
  let progress = 1;
  let markerProgress = 0;
  let comeBack: ComeBack | undefined;
  let reminder: ReminderView | undefined;

  const stations: StationView[] = journey.stages.map((stage, index) => {
    const checkpoint = choices.checkpoints.get(key(stage.id));
    if (checkpoint && index !== currentIndex) {
      lastDoneDay = checkpoint.day;
      return {
        stageId: stage.id,
        state: 'done',
        progress: 1,
        run: EMPTY_RUN,
        completions: 0,
        welcomeBacks: 0,
        doneDay: checkpoint.day,
      };
    }
    if (checkpoint) lastDoneDay = checkpoint.day;
    const skipped = skippedDay(stage.id, index);
    if (skipped !== undefined) {
      lastDoneDay = skipped;
      return {
        stageId: stage.id,
        state: 'skipped',
        progress: 1,
        run: EMPTY_RUN,
        completions: 0,
        welcomeBacks: 0,
        skippedDay: skipped,
      };
    }
    if (index !== currentIndex) {
      return {
        stageId: stage.id,
        state: 'ahead',
        progress: 0,
        run: EMPTY_RUN,
        completions: 0,
        welcomeBacks: 0,
        ...(stepBack?.index === index ? { leftDay: stepBack.day } : {}),
      };
    }

    // The current stage. If its acceptance record is missing (the journey
    // changed under a running walk), it counts from the last finished stage.
    // A stage walked again counts from the day of the step back.
    const acceptedDay = stepBack?.day ?? choices.accepted.get(key(stage.id)) ?? lastDoneDay;
    const base = {
      stageId: stage.id,
      acceptedDay,
      completions: 0,
      welcomeBacks: 0,
      ...(stepBack && checkpoint ? { doneDay: checkpoint.day, stepBackDay: stepBack.day } : {}),
    };
    const bindingRecord = choices.bindings.get(key(stage.id));
    const binding = resolveBinding(bindingRecord, ctx.tasks, ctx.repeatCfgs);
    // The station waits until its task is bound: days before that are
    // neither due nor missed (game rules §2).
    const countFrom =
      bindingRecord?.day && bindingRecord.day > acceptedDay ? bindingRecord.day : acceptedDay;
    if (binding.kind === 'unbound') {
      progress = 0;
      return { ...base, state: 'unbound', progress: 0, run: EMPTY_RUN };
    }
    if (!isSupported(binding.cfg)) {
      progress = 0;
      return { ...base, state: 'unsupported-repeat', progress: 0, run: EMPTY_RUN };
    }

    // While the stage was left for a smaller one its days are not due
    // and its task counts nothing.
    const stepBacks = choices.stepBacks.get(key(stage.id)) ?? [];
    const away = awayBy(stepBacks);
    const credited = new Set(
      [...creditedDays(binding.tasks, binding.cfg.id, countFrom, today, ctx.logicalDay)].filter(
        (day) => !away(day),
      ),
    );
    const timeline = buildTimeline({
      cfg: binding.cfg,
      acceptedDay: countFrom,
      today,
      credited,
      pauses,
      away,
      again: stepBack !== undefined,
    });
    const conditionInput = {
      dueDays: timeline.dueDays,
      credited,
      minutes: minutesTracked(binding.tasks, countFrom, today),
    };
    const condition = conditionProgress(stage.condition, conditionInput);
    markerProgress = bestProgress(stage.condition, conditionInput);
    offerFallback = timeline.offerFallback;
    cfgPaused = binding.cfg.isPaused === true;
    if (!ended)
      reminder = reminderView(binding.cfg, answersOf(choices, run.runId, stage.id), today);
    const before = journey.stages[index - 1];
    if (!ended && !cfgPaused && lastPause?.action !== 'pause') {
      comeBack = comeBackOf({
        today,
        countFrom,
        credited,
        pauses,
        stepBacks,
        carriedOn: choices.carryOns.get(key(stage.id)),
        smaller: before && choices.checkpoints.has(key(before.id)) ? before.id : undefined,
      });
    }
    checkinDue =
      daysBetween(acceptedDay, today) >= 7 &&
      !choices.checkins.has(`${run.runId}:${stage.id}:${isoWeek(today)}`);
    progress = condition.progress;
    return {
      ...base,
      state: condition.met ? 'met' : 'current',
      progress: condition.progress,
      run: timeline.run,
      completions: credited.size,
      welcomeBacks: timeline.welcomeBacks,
      lastDays: timeline.lastDays,
    };
  });
  // The user's own "pair it with" (design rule 7): shown, never evaluated.
  stations.forEach((station, index) => {
    const pair = choices.pairs.get(key(station.stageId));
    if (pair) stations[index] = { ...station, pair };
  });

  const current = stations[currentIndex];
  // The latest skip can be taken back while the stage after it has no
  // completion yet (game rules §4).
  const before = stations[currentIndex - 1];
  if (!ended && before?.state === 'skipped' && current?.completions === 0) {
    stations[currentIndex - 1] = { ...before, undoable: true };
  }
  // The build (game rules §7): an ended run shows its version standing,
  // without a marker. Finished and skipped stages each raise the version,
  // also a finished stage that is walked again: the version never goes down.
  const passed = stations.filter((s) => s.doneDay !== undefined || s.state === 'skipped');
  const build: BuildView = {
    ...resolveBuild(journey, choices.builds.get(run.runId)),
    version: 1 + passed.length,
    skipped: passed.flatMap((s, i) => (s.state === 'skipped' ? [i + 2] : [])),
    versions: journey.stages.length + 1,
    markerProgress: ended ? 0 : markerProgress,
    ready: !ended && current?.state === 'met',
  };
  const answers =
    !ended && current
      ? weeklyAnswers(answersOf(choices, run.runId, current.stageId), today)
      : undefined;
  const habit = habitOf(run, journey, ctx);
  return {
    runId: run.runId,
    journeyId: journey.id,
    startDay: run.startDay,
    ...(run.why ? { why: run.why } : {}),
    ...(choices.planChecks.has(run.runId) ? { planCheck: choices.planChecks.get(run.runId) } : {}),
    stations,
    position:
      currentIndex === -1
        ? { stage: journey.stages.length - 1, progress: 1 }
        : { stage: currentIndex, progress },
    paused: lastPause?.action === 'pause' || cfgPaused,
    checkinDue,
    offerFallback,
    ...(!ended && current?.state === 'met'
      ? {
          offer: continueOffer(
            choices,
            run.runId,
            current.stageId,
            today,
            stepBack ? isoWeek(stepBack.day) : '',
          ),
        }
      : {}),
    ...(comeBack ? { comeBack } : {}),
    build,
    ...(answers ? { answers } : {}),
    ...(reminder ? { reminder } : {}),
    ...(habit ? { habit } : {}),
  };
};
