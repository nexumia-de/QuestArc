import { resolveBinding } from './binding';
import type { Choices, RunRecord } from './choices';
import { creditedDays, minutesTracked } from './completions';
import { bestProgress, conditionProgress } from './conditions';
import { daysBetween, isoWeek } from './days';
import { resolveBuild } from './ladders';
import { isSupported } from './schedule';
import { buildTimeline } from './timeline';
import type { Journey } from './types/journey';
import type { SnapshotRepeatCfg, SnapshotTask } from './types/snapshot';
import type { BuildView, RunView, StationView } from './types/view';
import { stageXp } from './xp';

/**
 * One walk through a journey (docs/game-rules.md, docs/data-model.md):
 * finished stages come from their checkpoints, the current stage is
 * derived from its bound recurring task, later stages are ahead.
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
  const currentIndex = journey.stages.findIndex((s) => !choices.checkpoints.has(key(s.id)));

  let lastDoneDay = run.startDay;
  let offerFallback = false;
  let checkinDue = false;
  let cfgPaused = false;
  let progress = 1;
  let markerProgress = 0;

  const stations: StationView[] = journey.stages.map((stage, index) => {
    const checkpoint = choices.checkpoints.get(key(stage.id));
    if (checkpoint) {
      lastDoneDay = checkpoint.day;
      return {
        stageId: stage.id,
        state: 'done',
        progress: 1,
        run: EMPTY_RUN,
        xp: checkpoint.xp,
        completions: 0,
        welcomeBacks: 0,
        doneDay: checkpoint.day,
        ...(stage.guardian
          ? {
              guardian: {
                hp: stage.guardian.hp,
                damage: checkpoint.damage,
                defeated: checkpoint.damage >= stage.guardian.hp,
              },
            }
          : {}),
      };
    }
    if (index !== currentIndex) {
      return {
        stageId: stage.id,
        state: 'ahead',
        progress: 0,
        run: EMPTY_RUN,
        xp: 0,
        completions: 0,
        welcomeBacks: 0,
      };
    }

    // The current stage. If its acceptance record is missing (the journey
    // changed under a running walk), it counts from the last finished stage.
    const acceptedDay = choices.accepted.get(key(stage.id)) ?? lastDoneDay;
    const base = { stageId: stage.id, acceptedDay, xp: 0, completions: 0, welcomeBacks: 0 };
    const bindingRecord = choices.bindings.get(key(stage.id));
    const binding = resolveBinding(bindingRecord, ctx.tasks, ctx.repeatCfgs);
    // The station waits until its task is bound: days before that are
    // neither due nor missed (game rules §2).
    const countFrom =
      bindingRecord?.day && bindingRecord.day > acceptedDay ? bindingRecord.day : acceptedDay;
    const guardianOf = (damage: number): Pick<StationView, 'guardian'> =>
      stage.guardian
        ? { guardian: { hp: stage.guardian.hp, damage, defeated: damage >= stage.guardian.hp } }
        : {};
    if (binding.kind === 'unbound') {
      progress = 0;
      return { ...base, state: 'unbound', progress: 0, run: EMPTY_RUN, ...guardianOf(0) };
    }
    if (!isSupported(binding.cfg)) {
      progress = 0;
      return {
        ...base,
        state: 'unsupported-repeat',
        progress: 0,
        run: EMPTY_RUN,
        ...guardianOf(0),
      };
    }

    const credited = creditedDays(binding.tasks, binding.cfg.id, countFrom, today, ctx.logicalDay);
    const timeline = buildTimeline({
      cfg: binding.cfg,
      acceptedDay: countFrom,
      today,
      credited,
      pauses,
    });
    const conditionInput = {
      dueDays: timeline.dueDays,
      credited,
      minutes: minutesTracked(binding.tasks, countFrom, today),
    };
    const condition = conditionProgress(stage.condition, conditionInput);
    markerProgress = bestProgress(stage.condition, conditionInput);
    const xp = stageXp(credited.size, timeline.welcomeBacks);
    offerFallback = timeline.offerFallback;
    cfgPaused = binding.cfg.isPaused === true;
    checkinDue =
      daysBetween(acceptedDay, today) >= 7 &&
      !choices.checkins.has(`${run.runId}:${stage.id}:${isoWeek(today)}`);
    progress = condition.progress;
    return {
      ...base,
      state: condition.met ? 'met' : 'current',
      progress: condition.progress,
      run: timeline.run,
      xp,
      completions: credited.size,
      welcomeBacks: timeline.welcomeBacks,
      ...guardianOf(xp),
      lastDays: timeline.lastDays,
    };
  });

  const lastPause = pauses.filter((p) => p.day <= today).at(-1);
  // The build (game rules §9): game mode only; an ended run shows its
  // version standing, without a marker.
  const ended = choices.runEnds.has(run.runId);
  const build: BuildView | undefined =
    choices.mode === 'rpg'
      ? {
          ...resolveBuild(journey, choices.builds.get(run.runId)),
          version: 1 + stations.filter((s) => s.state === 'done').length,
          versions: journey.stages.length + 1,
          markerProgress: ended ? 0 : markerProgress,
          ready: !ended && stations[currentIndex]?.state === 'met',
        }
      : undefined;
  return {
    runId: run.runId,
    journeyId: journey.id,
    startDay: run.startDay,
    ...(run.why ? { why: run.why } : {}),
    stations,
    position:
      currentIndex === -1
        ? { stage: journey.stages.length - 1, progress: 1 }
        : { stage: currentIndex, progress },
    paused: lastPause?.action === 'pause' || cfgPaused,
    checkinDue,
    offerFallback,
    ...(build ? { build } : {}),
  };
};
