import { continueJourney, stayHere } from '@questarc/engine';
import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/**
 * Flow C, continue to the next stage: the station's acceptance story and
 * the next plan, then two equal choices. Continue writes the checkpoint
 * and accepts the next stage, then sets up its task; after the last stage
 * the journey ends. Stay Here a While changes nothing and quiets the offer
 * for a week. The latest weekly answer suggests one of them (design rule 1).
 */
export const continueScreen = (ctx: Context): Screen => {
  const { view, journeys } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  const index = run?.position.stage ?? 0;
  const station = run?.stations[index];
  const stage = journey?.stages[index];
  if (!run || !journey || !stage || station?.state !== 'met') {
    queueMicrotask(() => ctx.reset({ name: 'home' }));
    return { title: t('ui.app.name'), body: h('p', {}) };
  }
  const next = journey.stages[index + 1];
  const go = async () => {
    await ctx.write(continueJourney(run, journey, view.todayStr));
    ctx.reset({ name: 'home' });
    if (next) ctx.go({ name: 'setup' });
    else ctx.go({ name: 'finished', journeyId: journey.id });
  };
  const stay = async () => {
    await ctx.write(stayHere(run, view.todayStr));
    ctx.reset({ name: 'home' });
  };
  const suggest = run.offer?.suggest ?? 'none';
  const hint =
    suggest === 'stay'
      ? t(run.offer?.answer === undefined ? 'ui.continue.suggest-new' : 'ui.continue.suggest-stay')
      : suggest === 'continue'
        ? t('ui.continue.suggest-continue')
        : undefined;
  const choice = (label: string, onclick: () => void, suggested: boolean) =>
    h(
      'button',
      {
        class: `qa-btn ${suggested ? 'qa-btn-primary' : 'qa-btn-secondary'}`,
        type: 'button',
        onclick,
      },
      label,
    );
  return {
    title: t('ui.continue.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      stage.story?.accept ? h('p', { class: 'qa-story' }, t(stage.story.accept)) : null,
      next
        ? h(
            'section',
            { class: 'qa-card' },
            h(
              'p',
              { class: 'qa-overline' },
              t('ui.station.of', { n: index + 2, total: journey.stages.length }),
            ),
            h(
              'p',
              { class: 'qa-plan' },
              planSentence(next, run.stations[index + 1]?.pair ?? station.pair),
            ),
          )
        : h('p', {}, t('ui.continue.last')),
      next ? h('p', { class: 'qa-muted' }, t('ui.continue.earlier')) : null,
      hint ? h('p', {}, hint) : null,
      h('p', { class: 'qa-muted' }, t('ui.continue.choice')),
    ),
    actions: [
      choice(
        t(next ? 'ui.action.continue' : 'ui.continue.finish'),
        () => void go(),
        suggest === 'continue',
      ),
      choice(t('ui.action.stay'), () => void stay(), suggest === 'stay'),
    ],
  };
};
