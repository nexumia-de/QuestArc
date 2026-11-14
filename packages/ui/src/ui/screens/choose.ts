import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/**
 * Screen 2: the journeys with their first step as a plan sentence. With
 * `anchorId` the journey extends that moment (screen 0).
 */
export const chooseScreen = (ctx: Context, anchorId?: string): Screen => ({
  title: t('ui.choose.title'),
  body: h(
    'ul',
    { class: 'qa-list' },
    ...ctx.state.journeys.map((journey) => {
      const first = journey.stages[0];
      return h(
        'li',
        {},
        h(
          'button',
          {
            class: 'qa-card qa-card-button',
            type: 'button',
            onclick: () =>
              ctx.go({ name: 'preview', journeyId: journey.id, ...(anchorId ? { anchorId } : {}) }),
          },
          h('span', { class: 'qa-section-title' }, t(journey.title)),
          h('span', {}, t(journey.description)),
          h(
            'span',
            { class: 'qa-muted qa-small' },
            t('ui.choose.stations', { n: journey.stages.length }),
          ),
          journey.author
            ? h(
                'span',
                { class: 'qa-muted qa-small' },
                t('ui.journey.author', { name: journey.author }),
              )
            : null,
          first ? h('span', { class: 'qa-plan' }, planSentence(first)) : null,
        ),
      );
    }),
  ),
});
