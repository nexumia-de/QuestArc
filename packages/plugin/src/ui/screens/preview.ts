import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/** Screen 2, preview: every station of a journey as a plan sentence. */
export const previewScreen = (ctx: Context, journeyId: string, anchorId?: string): Screen => {
  const journey = ctx.state.journeys.find((j) => j.id === journeyId);
  if (!journey) return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  return {
    title: t(journey.title),
    body: h(
      'div',
      { class: 'qa-stack' },
      h('p', {}, t(journey.description)),
      journey.author
        ? h('p', { class: 'qa-muted qa-small' }, t('ui.journey.author', { name: journey.author }))
        : null,
      h('h2', { class: 'qa-section-title' }, t('ui.preview.stations')),
      h(
        'ol',
        { class: 'qa-steps' },
        ...journey.stages.map((stage) => h('li', {}, planSentence(stage))),
      ),
    ),
    actions: [
      h(
        'button',
        {
          class: 'qa-btn qa-btn-primary',
          type: 'button',
          onclick: () =>
            ctx.go({ name: 'start', journeyId: journey.id, ...(anchorId ? { anchorId } : {}) }),
        },
        t('ui.preview.start'),
      ),
    ],
  };
};
