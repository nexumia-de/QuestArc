import type { ReminderView, RunView } from '@questarc/engine';

import { t } from '../shared/texts';
import { appState } from './app-state';
import { h } from './dom';
import { taskOfBinding } from './repeat';
import type { Context } from './screen';
import { markSeen, wasSeen } from './seen';

/**
 * Reminders (design rule 23, docs/behaviour.md flow H): QuestArc sends
 * none. It suggests the host's own task reminder for the first weeks of
 * a station, says when it may not be needed any more, and leads to the
 * task; it never sets or removes one.
 */

/** Days after a stage was accepted in which the reminder is suggested. */
const SUGGEST_DAYS = 14;

/** "Would a reminder at 21:30 help …": the time of a fixed-time moment is named. */
export const reminderQuestion = (run: RunView, key: string): string =>
  run.anchor?.kind === 'time' && run.anchor.time
    ? t(`${key}-at`, { time: run.anchor.time })
    : t(key);

/**
 * At most one banner about the reminder of a followed stage: that it may
 * not be needed any more (`fade`), or, in a station's first two weeks
 * without one, the suggestion to set one. Both are put away with **Not
 * Now** on this device; the first comes back with the next week's answer.
 */
export const reminderBanner = (
  ctx: Context,
  target: {
    runId: string;
    stageId: string;
    reminder: ReminderView | undefined;
    /** Days since the stage was accepted; the suggestion is for the first weeks. */
    age?: number;
    texts: { fade: string; suggest?: string };
  },
  week: string,
): HTMLElement[] => {
  const { runId, stageId, reminder, texts } = target;
  if (!reminder) return [];
  const id = `${runId}:${stageId}`;
  const seenKey = reminder.fade ? `fade:${id}:${week}` : `reminder:${id}`;
  const text = reminder.fade
    ? texts.fade
    : !reminder.set && texts.suggest && (target.age ?? SUGGEST_DAYS) < SUGGEST_DAYS
      ? texts.suggest
      : undefined;
  if (!text || wasSeen(seenKey)) return [];
  const app = appState(ctx);
  const binding = ctx.state.records[`binding:${id}`] as
    { taskId?: string; repeatCfgId?: string } | undefined;
  const task = app ? taskOfBinding(Object.values(app.tasks), binding) : undefined;
  const button = (label: string, onclick: () => void) =>
    h('button', { class: 'qa-btn qa-btn-text', type: 'button', onclick }, label);
  return [
    h(
      'div',
      { class: 'qa-banner', role: 'status' },
      h('p', {}, text),
      task ? button(t('ui.setup.open'), () => void PluginAPI.selectTask(task.id)) : null,
      button(t('ui.action.not-now'), () => {
        markSeen(seenKey);
        ctx.redraw();
      }),
    ) as HTMLElement,
  ];
};
