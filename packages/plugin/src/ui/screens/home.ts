import { t } from '../../shared/texts';
import { h } from '../dom';
import { stationCard } from '../journey/card';
import { journeyPath, scrollFor } from '../journey/path';
import type { Context, Screen } from '../screen';

/**
 * Screen 4, the journey (docs/behaviour.md): the path, opened scrolled to
 * the current station, and the current station's card with its main
 * action. With no journey, the empty state.
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

  const rpg = view.mode === 'rpg';
  const station = run.stations[run.position.stage];
  const scroller = h(
    'div',
    { class: 'qa-path-scroll', 'data-scroll-key': 'path' },
    journeyPath({ run, journey, rpg, onStation: (index) => ctx.go({ name: 'station', index }) }),
  ) as HTMLElement;

  const action = (label: string, route: Parameters<Context['go']>[0]) =>
    h(
      'button',
      { class: 'qa-btn qa-btn-primary', type: 'button', onclick: () => ctx.go(route) },
      label,
    );
  const actions =
    station?.state === 'met'
      ? [action(t('ui.action.continue'), { name: 'continue' })]
      : station?.state === 'unbound' || station?.state === 'unsupported-repeat'
        ? [
            action(t(station.state === 'unbound' ? 'ui.action.setup' : 'ui.action.change-repeat'), {
              name: 'setup',
            }),
          ]
        : [];

  return {
    title: t(journey.title),
    layout: 'fill',
    body: h(
      'div',
      { class: 'qa-journey' },
      rpg ? h('p', { class: 'qa-chip qa-level' }, t('ui.level', { level: view.level })) : null,
      scroller,
      stationCard(run, journey, rpg, view.todayStr) ?? null,
    ),
    actions,
    onShow: () => {
      scroller.scrollTop = scrollFor(
        run.position.stage,
        run.stations.length,
        scroller.clientHeight,
      );
    },
  };
};
