import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Screen } from '../screen';

/** Screen 9, "How QuestArc motivates you" (design rules 26 and 27, issue #57). */
const PARAGRAPHS = [
  'small-steps',
  'plan',
  'misses',
  'welcome-back',
  'reason',
  'weekly',
  'graduation',
  'game',
  'not',
  'success',
] as const;

export const motivatesScreen = (): Screen => ({
  title: t('ui.motivates.title'),
  noSettings: true,
  body: h(
    'div',
    { class: 'qa-stack qa-prose' },
    ...PARAGRAPHS.map((key) =>
      h(
        'section',
        {},
        h('h2', { class: 'qa-section-title' }, t(`ui.motivates.${key}.title`)),
        h('p', {}, t(`ui.motivates.${key}`)),
      ),
    ),
  ),
});
