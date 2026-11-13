import { undoSkip } from '@questarc/engine';

import { capitalise, planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { conditionText } from '../journey/card';
import { shortDate, weekdayOfId } from '../journey/format';
import { pairField } from '../journey/pair';
import { scheduleText } from '../repeat';
import type { Context, Screen } from '../screen';

/**
 * Screen 5, station details: arrival story, plan, schedule, condition
 * and the learning nugget as "Try this" (design rule 22). A skipped
 * station says "already yours" and can be offered again while the engine
 * says so. The current station's "pair it with" can be changed or
 * removed here (design rule 7).
 */

export const stationScreen = (ctx: Context, index: number): Screen => {
  const { view, journeys } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  const stage = journey?.stages[index];
  const station = run?.stations[index];
  if (!run || !journey || !stage || !station) {
    return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  }
  const reached = station.state !== 'ahead';
  const plan = h('p', { class: 'qa-plan' }, planSentence(stage, station.pair));
  const condition = stage.condition;
  const conditionRule =
    condition.type === 'days'
      ? t('ui.details.condition.days', { n: condition.n, of: condition.of })
      : condition.type === 'count'
        ? t('ui.details.condition.count', { n: condition.n })
        : t('ui.details.condition.time', { n: condition.minutes });

  return {
    title: capitalise(t(stage.plan.action)),
    body: h(
      'div',
      { class: 'qa-stack' },
      h(
        'p',
        { class: 'qa-overline' },
        t('ui.station.of', { n: index + 1, total: run.stations.length }),
      ),
      reached && stage.story?.arrival
        ? h('p', { class: 'qa-story' }, t(stage.story.arrival))
        : null,
      h(
        'section',
        { class: 'qa-card' },
        plan,
        h('p', { class: 'qa-muted' }, scheduleText(stage.schedule, weekdayOfId)),
        h('p', { class: 'qa-muted' }, conditionRule),
        station.state === 'current' || station.state === 'met'
          ? h('p', {}, conditionText(stage, station))
          : null,
        station.state === 'done' && station.doneDay
          ? h('p', {}, t('ui.details.finished', { date: shortDate(station.doneDay) }))
          : null,
        station.state === 'skipped' && station.skippedDay
          ? h('p', {}, t('ui.details.skipped', { date: shortDate(station.skippedDay) }))
          : null,
        station.undoable
          ? h(
              'button',
              {
                class: 'qa-btn qa-btn-secondary',
                type: 'button',
                onclick: () =>
                  void ctx.write(undoSkip(run, journey, stage.id)).then(() => ctx.back()),
              },
              t('ui.details.skip-undo'),
            )
          : null,
      ),
      reached && run.planCheck?.plan
        ? h('p', { class: 'qa-why' }, t('ui.check.yours', { plan: run.planCheck.plan }))
        : null,
      index === run.position.stage && !['done', 'skipped'].includes(station.state)
        ? pairField(ctx, run, stage, plan)
        : null,
      reached && stage.nugget
        ? h(
            'section',
            { class: 'qa-card qa-nugget' },
            h('h2', { class: 'qa-section-title' }, t('ui.details.try')),
            h('p', {}, t(stage.nugget)),
          )
        : null,
    ),
  };
};
