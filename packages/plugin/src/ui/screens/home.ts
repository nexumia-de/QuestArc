import { findStage, planSentence, progressText } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/**
 * Screen 4, the journey. Until the drawn path arrives (#36) it shows the
 * current station as text; with no journey, the empty state.
 */
export const homeScreen = (ctx: Context): Screen => {
  const { view, journeys } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  if (!run || !journey) {
    return {
      title: t('ui.app.name'),
      body: h(
        'div',
        { class: 'qa-empty' },
        h('h2', { class: 'qa-heading' }, t('ui.home.empty.title')),
        h('p', { class: 'qa-muted' }, t('ui.home.empty.text')),
      ),
      actions: [
        h(
          'button',
          {
            class: 'qa-btn qa-btn-primary',
            type: 'button',
            onclick: () => ctx.go({ name: 'choose' }),
          },
          t('ui.home.choose'),
        ),
      ],
    };
  }
  const station = run.stations[run.position.stage];
  const stage = station && findStage(journeys, run.journeyId, station.stageId);
  return {
    title: t(journey.title),
    body: h(
      'div',
      { class: 'qa-stack' },
      view.mode === 'rpg'
        ? h('p', { class: 'qa-chip' }, t('ui.level', { level: view.level }))
        : null,
      stage && station
        ? h(
            'section',
            { class: 'qa-card' },
            h('p', { class: 'qa-plan' }, planSentence(stage)),
            h('p', { class: 'qa-muted' }, progressText(stage, station)),
          )
        : null,
    ),
  };
};
