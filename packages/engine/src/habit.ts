import { answersOf, weeklyAnswers } from './answers';
import { resolveBinding } from './binding';
import type { Choices, RunRecord } from './choices';
import { awayBy } from './comeback';
import { creditedDays } from './completions';
import { daysBetween, isoWeek } from './days';
import { graduatedView, openGraduation, qualifies } from './graduation';
import { isSupported } from './schedule';
import { buildTimeline } from './timeline';
import type { Journey } from './types/journey';
import type { SnapshotRepeatCfg, SnapshotTask } from './types/snapshot';
import type { HabitView } from './types/view';

/**
 * The habit a finished journey leaves (docs/game-rules.md §6, design
 * rules 24 and 25): its last stage's recurring task, followed as before
 * until the habit graduates. A graduated habit is not followed at all:
 * what it shows comes from its records alone, so it stays when the task
 * is ended or deleted.
 */

export interface HabitContext {
  readonly today: string;
  readonly tasks: readonly SnapshotTask[];
  readonly repeatCfgs: readonly SnapshotRepeatCfg[];
  readonly choices: Choices;
  readonly logicalDay: (timestamp: number) => string;
}

export const habitOf = (
  run: RunRecord,
  journey: Journey,
  ctx: HabitContext,
): HabitView | undefined => {
  const { today, choices } = ctx;
  const index = journey.stages.length - 1;
  const stage = journey.stages[index];
  if (!stage || !choices.runEnds.has(run.runId)) return undefined;
  const key = `${run.runId}:${stage.id}`;
  // A journey ended early leaves no habit: its last stage was not finished.
  if (!choices.checkpoints.has(key)) return undefined;

  const answers = answersOf(choices, run.runId, stage.id);
  const row = weeklyAnswers(answers, today);
  const graduations = choices.graduations.get(key) ?? [];
  const graduation = openGraduation(graduations, today);
  const base = { stageId: stage.id, ...(row ? { answers: row } : {}) };
  if (graduation) {
    return {
      ...base,
      state: 'graduated',
      checkinDue: false,
      canGraduate: false,
      graduated: graduatedView(graduation, choices.stillChecks.get(key) ?? [], today),
    };
  }
  const backDay = graduations
    .filter((g) => g.until !== undefined && g.until <= today)
    .map((g) => g.until)
    .sort()
    .at(-1);
  const maintained = { ...base, ...(backDay !== undefined ? { backDay } : {}) };

  const bindingRecord = choices.bindings.get(key);
  const binding = resolveBinding(bindingRecord, ctx.tasks, ctx.repeatCfgs);
  if (binding.kind === 'unbound' || !isSupported(binding.cfg)) {
    return {
      ...maintained,
      state: binding.kind === 'unbound' ? 'unbound' : 'unsupported-repeat',
      checkinDue: false,
      canGraduate: false,
    };
  }

  // The stage counts from its acceptance (or the stage before, as in
  // run.ts) and from the day its task was bound; the journey's end
  // changes nothing for the habit.
  const before = journey.stages[index - 1];
  const acceptedDay =
    choices.accepted.get(key) ??
    (before ? choices.checkpoints.get(`${run.runId}:${before.id}`)?.day : undefined) ??
    run.startDay;
  const countFrom =
    bindingRecord?.day && bindingRecord.day > acceptedDay ? bindingRecord.day : acceptedDay;
  // Days the stage was left for a smaller one, and days the habit ran by
  // itself before it was brought back, are not due and count nothing.
  const away = awayBy([...(choices.stepBacks.get(key) ?? []), ...graduations]);
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
    pauses: choices.pauses.get(run.runId) ?? [],
    away,
  });
  return {
    ...maintained,
    state: 'maintained',
    checkinDue: daysBetween(acceptedDay, today) >= 7 && !answers.has(isoWeek(today)),
    canGraduate: qualifies({ today, answers, dueDays: timeline.dueDays, credited }),
  };
};
