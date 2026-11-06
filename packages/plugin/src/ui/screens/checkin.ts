import { answerCheckin, isoWeek } from '@questarc/engine';

import { capitalise } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { lastDaysRow } from '../journey/last-days';
import type { Context, Screen } from '../screen';
import { markSeen } from '../seen';

/**
 * Screen 6, weekly look back (design rule 9, issue #53): the last due
 * days, the runs, and the validated single automaticity item with the
 * habit filled in, answered 1–7 or skipped. A skipped week stays empty.
 */
export const checkinScreen = (ctx: Context): Screen => {
  const { view, journeys } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  const station = run?.stations[run.position.stage];
  const stage = journey?.stages[run?.position.stage ?? 0];
  if (!run || !station || !stage)
    return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  const week = isoWeek(view.todayStr);
  const habit = t('ui.checkin.habit', {
    action: capitalise(t(stage.plan.action)),
    anchor: t(stage.plan.anchor),
  });
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
      station.lastDays?.length ? lastDaysRow(station.lastDays) : null,
      h(
        'p',
        { class: 'qa-muted' },
        t('ui.card.run', {
          current: station.run.current,
          best: station.run.best,
          total: station.run.total,
        }),
      ),
      h(
        'fieldset',
        { class: 'qa-fieldset' },
        h('legend', { class: 'qa-plan' }, t('ui.checkin.question', { habit })),
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
