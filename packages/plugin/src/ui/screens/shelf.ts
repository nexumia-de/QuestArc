import type { RunView } from '@questarc/engine';

import { resumeJourney } from '@questarc/engine';
import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { shortDate } from '../journey/format';
import type { Context, Screen } from '../screen';

/**
 * Screen 7, the shelf (issue #33): journeys that wait, finished journeys
 * and the habits that stay after them (design rule 24). Graduation and the
 * run of a maintained habit come with the More journeys milestone (#22).
 */
export const shelfScreen = (ctx: Context): Screen => {
  const { view, journeys, records } = ctx.state;
  const journeyOf = (run: RunView) => journeys.find((j) => j.id === run.journeyId);
  const endOf = (run: RunView) =>
    records[`run-end:${run.runId}`] as { day?: string; reason?: string } | undefined;

  const section = (title: string, items: Node[]) =>
    items.length
      ? h(
          'section',
          { class: 'qa-stack' },
          h('h2', { class: 'qa-section-title' }, title),
          h('ul', { class: 'qa-list' }, ...items),
        )
      : null;

  const paused = view.paused.flatMap((run) => {
    const journey = journeyOf(run);
    if (!journey) return [];
    return [
      h(
        'li',
        { class: 'qa-card' },
        h('p', { class: 'qa-plan' }, t(journey.title)),
        h(
          'p',
          { class: 'qa-muted qa-small' },
          t('ui.shelf.waiting', { n: run.position.stage + 1, total: run.stations.length }),
        ),
        h(
          'button',
          {
            class: 'qa-btn qa-btn-secondary',
            type: 'button',
            onclick: async () => {
              await ctx.write(resumeJourney(run.runId, view.todayStr, view.active?.runId));
              ctx.reset({ name: 'home' });
            },
          },
          t('ui.action.resume'),
        ),
      ),
    ];
  });

  const finished = view.finished.flatMap((run) => {
    const journey = journeyOf(run);
    if (!journey) return [];
    const end = endOf(run);
    return [
      h(
        'li',
        { class: 'qa-card' },
        h('p', { class: 'qa-plan' }, t(journey.title)),
        h(
          'p',
          { class: 'qa-muted qa-small' },
          t(end?.reason === 'abandoned' ? 'ui.shelf.ended' : 'ui.shelf.finished', {
            start: shortDate(run.startDay),
            end: end?.day ? shortDate(end.day) : '',
          }),
        ),
      ),
    ];
  });

  const habits = view.finished.flatMap((run) => {
    const journey = journeyOf(run);
    const last = journey?.stages.at(-1);
    if (!journey || !last || endOf(run)?.reason === 'abandoned') return [];
    return [
      h(
        'li',
        { class: 'qa-card' },
        h('p', { class: 'qa-plan' }, planSentence(last)),
        h('p', { class: 'qa-muted qa-small' }, t('ui.shelf.maintained')),
      ),
    ];
  });

  const empty = paused.length + finished.length === 0;
  return {
    title: t('ui.shelf.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      empty ? h('p', { class: 'qa-muted' }, t('ui.shelf.empty')) : null,
      section(t('ui.shelf.paused'), paused),
      section(t('ui.shelf.habits'), habits),
      section(t('ui.shelf.journeys'), finished),
    ),
  };
};
