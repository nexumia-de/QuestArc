import type { WeeklyAnswers } from '@questarc/engine';

import { t } from '../../shared/texts';
import { h } from '../dom';

/**
 * The weekly answers so far as a row of seven-step marks, week by week
 * (docs/behaviour.md, screen 6; issue #88), and one sentence when the
 * step feels easier than four weeks ago or about the same. No target
 * line and no number to reach; a skipped week is an empty mark, and a
 * lower answer gets no words. Each mark has a text for screen readers.
 */

const STEPS = 7;
const STEP = 4;
const GAP = 1;
const WIDTH = 14;
const HEIGHT = STEPS * (STEP + GAP) - GAP;

const mark = (score: number | undefined): SVGElement => {
  const svg = h('svg', {
    width: WIDTH,
    height: HEIGHT,
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    'aria-hidden': 'true',
  }) as SVGElement;
  for (let step = 1; step <= STEPS; step += 1) {
    svg.append(
      h('rect', {
        x: 0,
        y: HEIGHT - step * (STEP + GAP) + GAP,
        width: WIDTH,
        height: STEP,
        rx: 1,
        class: score !== undefined && step <= score ? 'qa-step-on' : 'qa-step',
      }),
    );
  }
  return svg;
};

/** "2026-W45" → 45 */
const weekNumber = (week: string): number => Number(week.slice(-2));

export const answersRow = (answers: WeeklyAnswers): HTMLElement =>
  h(
    'div',
    { class: 'qa-answers-block' },
    h(
      'ol',
      { class: 'qa-answers', 'aria-label': t('ui.answers.label') },
      ...answers.weeks.map(({ week, score }) =>
        h(
          'li',
          {
            'aria-label':
              score === undefined
                ? t('ui.answers.none', { week: weekNumber(week) })
                : t('ui.answers.week', { week: weekNumber(week), score }),
          },
          mark(score),
          h('span', { 'aria-hidden': 'true' }, score === undefined ? '·' : String(score)),
        ),
      ),
    ),
    answers.trend ? h('p', { class: 'qa-muted qa-small' }, t(`ui.answers.${answers.trend}`)) : null,
  ) as HTMLElement;
