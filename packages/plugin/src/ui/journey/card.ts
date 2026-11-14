import type { Journey, RunView, Stage, StationView } from '@questarc/engine';

import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { shortDate } from './format';
import { lastDaysRow } from './last-days';

/**
 * The current station's card (docs/behaviour.md, screen 4): the plan,
 * the condition in words and as a bar, the last due days and the runs.
 * A gap shows as a gap, never as a loss.
 */

export const conditionText = (stage: Stage, station: StationView): string => {
  const { condition } = stage;
  if (condition.type === 'days') {
    const done = Math.min(condition.n, Math.round(station.progress * condition.n));
    return t('ui.condition.days', { done, n: condition.n, of: condition.of });
  }
  const target = condition.type === 'count' ? condition.n : condition.minutes;
  const done = Math.min(target, Math.round(station.progress * target));
  return t(condition.type === 'count' ? 'ui.condition.count' : 'ui.condition.time', {
    done,
    n: target,
  });
};

const hint = (station: StationView, today: string, staying: boolean): string | undefined => {
  if (station.acceptedDay && station.acceptedDay > today) {
    return t('ui.card.starts', { date: shortDate(station.acceptedDay) });
  }
  switch (station.state) {
    case 'current':
      return station.stepBackDay
        ? t('ui.card.smaller', { date: shortDate(station.stepBackDay) })
        : t('ui.card.hint');
    case 'met':
      return t(staying ? 'ui.card.staying' : 'ui.card.met');
    case 'unbound':
      return t('ui.card.unbound');
    case 'unsupported-repeat':
      return t('ui.card.unsupported');
    default:
      return undefined;
  }
};

export const stationCard = (
  run: RunView,
  journey: Journey,
  today: string,
): HTMLElement | undefined => {
  const index = run.position.stage;
  const station = run.stations[index];
  const stage = journey.stages[index];
  if (!station || !stage) return undefined;
  const bound = station.state === 'current' || station.state === 'met';
  const words = hint(station, today, !!run.offer?.quietUntil);
  return h(
    'section',
    { class: 'qa-card qa-station-card', 'aria-label': t('ui.card.label') },
    h(
      'p',
      { class: 'qa-overline' },
      t('ui.station.of', { n: index + 1, total: run.stations.length }),
    ),
    h('p', { class: 'qa-plan' }, planSentence(stage, station.pair, run.anchor)),
    bound
      ? h(
          'div',
          { class: 'qa-progress' },
          h(
            'div',
            {
              class: 'qa-bar',
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': 100,
              'aria-valuenow': Math.round(station.progress * 100),
              'aria-label': conditionText(stage, station),
            },
            h('span', { style: `width:${station.progress * 100}%` }),
          ),
          h('p', {}, conditionText(stage, station)),
        )
      : null,
    bound && station.lastDays?.length
      ? h(
          'div',
          { class: 'qa-days-row' },
          lastDaysRow(station.lastDays),
          h(
            'p',
            { class: 'qa-muted qa-small' },
            t('ui.card.run', {
              current: station.run.current,
              best: station.run.best,
              total: station.run.total,
            }),
          ),
        )
      : null,
    words ? h('p', { class: 'qa-muted qa-small' }, words) : null,
    // The card after a long break shows the reason itself.
    run.why && !run.comeBack
      ? h('p', { class: 'qa-why' }, t('ui.card.why', { why: run.why }))
      : null,
  ) as HTMLElement;
};
