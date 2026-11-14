import { isoWeek } from '@questarc/engine';

import { t } from '../shared/texts';
import { h } from './dom';
import { habitName, habitsOf } from './habit';
import { reminderBanner } from './reminder';
import type { Context, Route } from './screen';
import { markSeen, wasSeen } from './seen';

/**
 * Banners for the habits finished journeys left (docs/behaviour.md,
 * flow F), at most one per habit: the question after graduation, the
 * offer to graduate, the weekly look back, or that its task's reminder
 * may not be needed any more (flow H). Each is said once and
 * leaves when it is answered or put aside on this device; the shelf
 * keeps the quiet way to all three.
 */
export const habitBanners = (ctx: Context): HTMLElement[] => {
  const week = isoWeek(ctx.state.view.todayStr);
  return habitsOf(ctx.state).flatMap(({ run, stage, habit }) => {
    const id = `${run.runId}:${stage.id}`;
    const name = habitName(stage, run.anchor);
    const banner = (text: string, label: string, route: Route, seenKey?: string): HTMLElement[] => [
      h(
        'div',
        { class: 'qa-banner', role: 'status' },
        h('p', {}, text),
        h(
          'button',
          { class: 'qa-btn qa-btn-text', type: 'button', onclick: () => ctx.go(route) },
          label,
        ),
        seenKey
          ? h(
              'button',
              {
                class: 'qa-btn qa-btn-text',
                type: 'button',
                onclick: () => {
                  markSeen(seenKey);
                  ctx.redraw();
                },
              },
              t('ui.action.not-now'),
            )
          : null,
      ) as HTMLElement,
    ];
    const due = habit.graduated?.checkDue;
    if (due && !wasSeen(`still:${id}:${due}`)) {
      return banner(t('ui.banner.still', { habit: name }), t('ui.action.answer'), {
        name: 'still',
        runId: run.runId,
      });
    }
    if (habit.canGraduate && !wasSeen(`graduate:${id}`)) {
      return banner(
        t('ui.banner.graduate', { habit: name }),
        t('ui.action.look'),
        { name: 'graduate', runId: run.runId },
        `graduate:${id}`,
      );
    }
    if (habit.checkinDue && !wasSeen(`checkin:${id}:${week}`)) {
      return banner(t('ui.banner.habit-checkin', { habit: name }), t('ui.action.answer'), {
        name: 'checkin',
        runId: run.runId,
      });
    }
    return reminderBanner(
      ctx,
      {
        runId: run.runId,
        stageId: stage.id,
        reminder: habit.reminder,
        texts: { fade: t('ui.banner.habit-fade', { habit: name }) },
      },
      week,
    );
  });
};
