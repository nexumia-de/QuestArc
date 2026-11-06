import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/** The end of a journey (flow C, step 4): the ending, and the habit stays. */
export const finishedScreen = (ctx: Context, journeyId: string): Screen => {
  const journey = ctx.state.journeys.find((j) => j.id === journeyId);
  return {
    title: journey ? t(journey.title) : t('ui.app.name'),
    body: h(
      'div',
      { class: 'qa-empty' },
      h('h2', { class: 'qa-heading' }, t('ui.finished.title')),
      journey?.ending ? h('p', { class: 'qa-story' }, t(journey.ending.story)) : null,
      h('p', { class: 'qa-muted' }, t('ui.finished.habit')),
    ),
    actions: [
      h(
        'button',
        {
          class: 'qa-btn qa-btn-primary',
          type: 'button',
          onclick: () => ctx.reset({ name: 'home' }),
        },
        t('ui.finished.done'),
      ),
    ],
  };
};
