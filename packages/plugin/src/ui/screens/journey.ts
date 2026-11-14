import { endJourney, pauseJourney, resumeJourney } from '@questarc/engine';
import { t } from '../../shared/texts';
import { banners } from '../banners';
import { h } from '../dom';
import { habitBanners } from '../habit-banners';
import { buildSection } from '../journey/build';
import { stationCard } from '../journey/card';
import type { Context, MenuItem, Screen } from '../screen';
import { readOnlyScreen } from './read-only';

/**
 * Screen 4, the journey (docs/behaviour.md): the build (journey/build.ts)
 * and the current station's card with its main action, opened from the
 * growing step of a moment (screens/home.ts). A read-only journey gets
 * its own page.
 */
export const journeyScreen = (ctx: Context): Screen => {
  const { view, journeys } = ctx.state;
  const readOnly = view.readOnly.find((r) => r.state === 'active');
  if (readOnly) return readOnlyScreen(ctx, readOnly);
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  const shelfItem: MenuItem = {
    label: t('ui.shelf.title'),
    onSelect: () => ctx.go({ name: 'shelf' }),
  };
  if (!run || !journey) {
    // Ended or finished in the meantime: the moments show what stands.
    queueMicrotask(() => ctx.reset({ name: 'home' }));
    return { title: t('ui.app.name'), body: h('p', {}) };
  }

  const station = run.stations[run.position.stage];
  const build = buildSection(run, journey);

  const action = (label: string, route: Parameters<Context['go']>[0], quiet = false) =>
    h(
      'button',
      {
        class: `qa-btn ${quiet ? 'qa-btn-secondary' : 'qa-btn-primary'}`,
        type: 'button',
        onclick: () => ctx.go(route),
      },
      label,
    );
  // While the user stays at a met station the offer is quiet, not gone.
  const actions =
    station?.state === 'met'
      ? [action(t('ui.action.continue'), { name: 'continue' }, !!run.offer?.quietUntil)]
      : station?.state === 'unbound' || station?.state === 'unsupported-repeat'
        ? [
            action(t(station.state === 'unbound' ? 'ui.action.setup' : 'ui.action.change-repeat'), {
              name: 'setup',
            }),
          ]
        : [];

  const today = view.todayStr;
  const menu: MenuItem[] = [
    run.paused
      ? {
          label: t('ui.action.resume'),
          onSelect: () => void ctx.write(resumeJourney(run.runId, today)),
        }
      : {
          label: t('ui.menu.pause'),
          onSelect: () => void ctx.write(pauseJourney(run.runId, today)),
        },
    {
      // Undo, not confirm: ending is one record, withdrawn by Undo.
      label: t('ui.menu.end'),
      onSelect: () => {
        const title = t(journey.title);
        void ctx
          .write(endJourney(run.runId, today))
          .then(() => ctx.reset({ name: 'home' }, { ended: { runId: run.runId, title } }));
      },
    },
    ...(build ? [{ label: t('ui.build.title'), onSelect: () => ctx.go({ name: 'build' }) }] : []),
    { label: t('ui.check.title'), onSelect: () => ctx.go({ name: 'plan-check' }) },
    { label: t('ui.build.stations'), onSelect: () => ctx.go({ name: 'stations' }) },
    shelfItem,
  ];

  return {
    title: t(journey.title),
    layout: 'fill',
    menu,
    body: h(
      'div',
      { class: 'qa-journey' },
      build,
      h(
        'div',
        { class: 'qa-card-area' },
        ...banners(ctx, run, journey),
        // The card after a long break stands alone.
        ...(run.comeBack ? [] : habitBanners(ctx)),
        stationCard(run, journey, view.todayStr) ?? null,
      ),
    ),
    actions,
  };
};
