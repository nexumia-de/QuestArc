import { capitalise, planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { conditionText } from '../journey/card';
import { shortDate, weekdayOfId } from '../journey/format';
import { scheduleText } from '../repeat';
import type { Context, Screen } from '../screen';

/**
 * Screen 5, station details: arrival story, plan, schedule, condition
 * and the learning nugget as "Try this" (design rule 22).
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
        h('p', { class: 'qa-plan' }, planSentence(stage)),
        h('p', { class: 'qa-muted' }, scheduleText(stage.schedule, weekdayOfId)),
        h('p', { class: 'qa-muted' }, conditionRule),
        station.state === 'current' || station.state === 'met'
          ? h('p', {}, conditionText(stage, station))
          : null,
        station.state === 'done' && station.doneDay
          ? h('p', {}, t('ui.details.finished', { date: shortDate(station.doneDay) }))
          : null,
      ),
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
