import type { DayMark } from '@questarc/engine';

import { t } from '../../shared/texts';
import { h } from '../dom';
import { weekdayLetters, weekdayName } from './format';

/**
 * The last seven due days as marks (docs/journey-design.md): done is
 * filled, a gap is a hollow grey circle with a dash (never red), open
 * (today, or yesterday not yet ticked off) a dashed ring, paused two bars.
 * Each mark has a text for screen readers.
 */

const R = 8;
const C = 11;

const shape = (mark: DayMark['mark']): SVGElement => {
  const svg = h('svg', {
    width: 22,
    height: 22,
    viewBox: '0 0 22 22',
    'aria-hidden': 'true',
  }) as SVGElement;
  switch (mark) {
    case 'done':
      svg.append(h('circle', { cx: C, cy: C, r: R, class: 'qa-fill' }));
      break;
    case 'gap':
      svg.append(
        h('circle', { cx: C, cy: C, r: R - 1, class: 'qa-mark-gap' }),
        h('path', { d: `M${C - 4} ${C} h8`, class: 'qa-mark-gap' }),
      );
      break;
    case 'open':
      svg.append(h('circle', { cx: C, cy: C, r: R - 1, class: 'qa-mark-open' }));
      break;
    case 'paused':
      svg.append(
        h('path', { d: `M${C - 3} ${C - 5} v10 M${C + 3} ${C - 5} v10`, class: 'qa-mark-gap' }),
      );
      break;
  }
  return svg;
};

export const lastDaysRow = (days: readonly DayMark[]): HTMLElement =>
  h(
    'ol',
    { class: 'qa-days', 'aria-label': t('ui.days.label') },
    ...days.map(({ day, mark }) =>
      h(
        'li',
        { 'aria-label': `${weekdayName(day)}: ${t(`ui.mark.${mark}`)}` },
        shape(mark),
        h('span', { 'aria-hidden': 'true' }, weekdayLetters(day)),
      ),
    ),
  ) as HTMLElement;
