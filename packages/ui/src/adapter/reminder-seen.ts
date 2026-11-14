import { reminderSeen, type GameView, type ReminderView } from '@questarc/engine';

import type { Records } from './records';

/**
 * A task's reminder carries no dates, so the host records what it sees
 * (game rules §9): when a followed stage's task has a reminder and no
 * record says so, "on" with today; when the record says "on" and the
 * task has none any more, "off" since today. Graduation waits for 14
 * days without one (game rules §6). Devices that see the same change on
 * the same day write the same record, so sync keeps one.
 */
export const reminderSeenChanges = (view: GameView, records: Records): Records => {
  const followed: { runId: string; stageId: string; reminder: ReminderView }[] = [];
  const run = view.active;
  const stage = run?.stations[run.position.stage];
  if (run?.reminder && stage)
    followed.push({ runId: run.runId, stageId: stage.stageId, reminder: run.reminder });
  for (const finished of view.finished) {
    const habit = finished.habit;
    if (habit?.reminder)
      followed.push({ runId: finished.runId, stageId: habit.stageId, reminder: habit.reminder });
  }
  const changes: Record<string, unknown> = {};
  for (const { runId, stageId, reminder } of followed) {
    const record = records[`reminder-seen:${runId}:${stageId}`] as { on?: unknown } | undefined;
    const on = record?.on === true;
    if (reminder.set !== on && (reminder.set || record !== undefined))
      Object.assign(changes, reminderSeen(runId, stageId, view.todayStr, reminder.set));
  }
  return changes;
};
