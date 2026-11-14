import { capitalise } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/**
 * The stations as a list in journey order; each opens screen 5.
 */
export const stationsScreen = (ctx: Context): Screen => {
  const { view, journeys } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  if (!run || !journey) return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  return {
    title: t('ui.build.stations'),
    body: h(
      'ol',
      { class: 'qa-stack qa-station-list' },
      ...journey.stages.map((stage, index) => {
        const station = run.stations[index];
        return h(
          'li',
          {},
          h(
            'button',
            {
              class: 'qa-card qa-card-button',
              type: 'button',
              onclick: () => ctx.go({ name: 'station', index }),
            },
            h(
              'span',
              { class: 'qa-overline' },
              t('ui.station.of', { n: index + 1, total: run.stations.length }),
            ),
            h('span', { class: 'qa-section-title' }, capitalise(t(stage.plan.action))),
            h(
              'span',
              { class: 'qa-muted' },
              t(`ui.build.station.${station?.leftDay ? 'left' : (station?.state ?? 'ahead')}`),
            ),
          ),
        );
      }),
    ),
  };
};
