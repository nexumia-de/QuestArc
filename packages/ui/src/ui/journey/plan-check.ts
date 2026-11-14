import { PLAN_CHECK_FIELDS, PLAN_CHECK_LIMIT } from '@questarc/engine';

import { t } from '../../shared/texts';
import { h } from '../dom';

/**
 * The four optional fields of the plan check (design rule 6,
 * docs/behaviour.md screens 3 and 3b): wish, best outcome, main obstacle
 * and the plan for it. None is focused or required; `answers` holds what
 * the user typed, so a redraw keeps it.
 */
export const planCheckFields = (answers: Record<string, string | undefined>): Node[] => [
  h('p', { class: 'qa-muted' }, t('ui.check.intro')),
  ...PLAN_CHECK_FIELDS.map((field) => {
    const id = `qa-check-${field}`;
    const input = h('textarea', {
      id,
      class: 'qa-textarea',
      rows: 2,
      maxlength: PLAN_CHECK_LIMIT,
      oninput: () => {
        answers[field] = input.value;
      },
    }) as HTMLTextAreaElement;
    input.value = answers[field] ?? '';
    return h('div', { class: 'qa-field' }, h('label', { for: id }, t(`ui.check.${field}`)), input);
  }),
];
