import { answerCheckin, isoWeek } from '@questarc/engine';

import { t } from '../../shared/texts';
import { h } from '../dom';
import { habitName, targetOf } from '../habit';
import { answersRow } from '../journey/answers-row';
import { lastDaysRow } from '../journey/last-days';
import type { Context, Screen } from '../screen';
import { markSeen } from '../seen';

/**
 * Screen 6, weekly look back (design rule 9, issue #53): the last due
 * days, the runs, the answers so far week by week (#88), and the
 * validated single automaticity item with the habit filled in, answered
 * 1–7 or skipped. A skipped week stays empty. With `runId` it asks about
 * the habit a finished journey left (flow F).
 */
export const checkinScreen = (ctx: Context, runId?: string): Screen => {
  const { view } = ctx.state;
  const target = targetOf(ctx.state, runId);
  if (!target) return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  const { run, stage } = target;
  const station = target.habit ? undefined : run.stations[target.index];
  const answers = target.habit ? target.habit.answers : run.answers;
  const week = isoWeek(view.todayStr);
  const answer = (score: number) => async () => {
    await ctx.write(answerCheckin(run.runId, stage.id, week, score));
    ctx.back();
  };
  const skip = () => {
    markSeen(`checkin:${run.runId}:${stage.id}:${week}`);
    ctx.back();
  };
  return {
    title: t('ui.checkin.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      station?.lastDays?.length ? lastDaysRow(station.lastDays) : null,
      station
        ? h(
            'p',
            { class: 'qa-muted' },
            t('ui.card.run', {
              current: station.run.current,
              best: station.run.best,
              total: station.run.total,
            }),
          )
        : null,
      answers ? answersRow(answers) : null,
      h(
        'fieldset',
        { class: 'qa-fieldset' },
        h('legend', { class: 'qa-plan' }, t('ui.checkin.question', { habit: habitName(stage) })),
        h(
          'div',
          { class: 'qa-scale' },
          ...[1, 2, 3, 4, 5, 6, 7].map((score) =>
            h(
              'button',
              {
                type: 'button',
                class: 'qa-scale-btn',
                'aria-label': t('ui.checkin.score', { score }),
                onclick: answer(score),
              },
              String(score),
            ),
          ),
        ),
        h(
          'div',
          { class: 'qa-scale-labels qa-muted qa-small' },
          h('span', {}, t('ui.checkin.low')),
          h('span', {}, t('ui.checkin.high')),
        ),
      ),
    ),
    actions: [
      h(
        'button',
        { class: 'qa-btn qa-btn-secondary', type: 'button', onclick: skip },
        t('ui.action.skip'),
      ),
    ],
  };
};
