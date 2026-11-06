import type { Journey, RunView, StationView } from '@questarc/engine';

import { capitalise } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { shortDate } from './format';
import { heightOf, segmentMiddle, segmentPath, WIDTH, X, yOf } from './geometry';

/**
 * The drawn journey (issue #36, docs/journey-design.md): the path in SVG,
 * the stations as buttons in a list over it, so every station has a text
 * and a 44 px target, and screen readers get them in path order.
 */

const CHECK = 'l5 5 l9 -10';

const stationLabel = (station: StationView, index: number, current: number): string => {
  switch (station.state) {
    case 'done':
      return t('ui.station.done', { date: station.doneDay ? shortDate(station.doneDay) : '' });
    case 'met':
      return t('ui.station.met');
    case 'current':
      return t('ui.station.here');
    case 'unbound':
      return t('ui.station.unbound');
    case 'unsupported-repeat':
      return t('ui.station.unsupported');
    case 'ahead':
      return index === current + 1 ? t('ui.station.next') : '';
  }
};

const stationShape = (station: StationView, y: number, rpg: boolean): SVGElement => {
  const g = h('g', { class: `qa-st qa-st-${station.state}` }) as SVGElement;
  switch (station.state) {
    case 'done':
      g.append(
        h('circle', { cx: X, cy: y, r: 14, class: 'qa-fill' }),
        h('path', { d: `M${X - 7} ${y} ${CHECK}`, class: 'qa-on-fill' }),
      );
      break;
    case 'current':
    case 'met':
      g.append(h('circle', { cx: X, cy: y, r: 19, class: 'qa-ring' }));
      if (station.state === 'met')
        g.append(h('path', { d: `M${X - 7} ${y} ${CHECK}`, class: 'qa-check' }));
      else if (rpg)
        g.append(h('path', { d: `M${X - 4} ${y + 9} v-19 l12 5 l-12 5`, class: 'qa-fill' }));
      else g.append(h('circle', { cx: X, cy: y, r: 7, class: 'qa-fill' }));
      break;
    case 'unbound':
    case 'unsupported-repeat':
      g.append(
        h('circle', { cx: X, cy: y, r: 14, class: 'qa-hollow' }),
        h('path', { d: `M${X - 6} ${y} h12 M${X} ${y - 6} v12`, class: 'qa-plus' }),
      );
      break;
    case 'ahead':
      g.append(h('circle', { cx: X, cy: y, r: 10, class: 'qa-hollow' }));
      break;
  }
  return g;
};

export interface PathOptions {
  readonly run: RunView;
  readonly journey: Journey;
  readonly rpg: boolean;
  readonly onStation: (index: number) => void;
}

export const journeyPath = ({ run, journey, rpg, onStation }: PathOptions): HTMLElement => {
  const n = run.stations.length;
  const current = run.position.stage;
  const allDone = run.stations.every((s) => s.state === 'done');
  const svg = h('svg', {
    class: 'qa-path-svg',
    width: WIDTH,
    height: heightOf(n),
    viewBox: `0 0 ${WIDTH} ${heightOf(n)}`,
    'aria-hidden': 'true',
  }) as SVGElement;

  // Segments: k joins station k with station k + 1 (or the goal).
  for (let k = 0; k < n; k += 1) {
    const d = segmentPath(k, n);
    if (allDone || k < current) svg.append(h('path', { d, class: 'qa-seg-done' }));
    else if (k === current) {
      svg.append(
        h('path', { d, class: 'qa-seg-open' }),
        h('path', {
          d,
          pathLength: 100,
          class: 'qa-seg-done',
          'stroke-dasharray': `${Math.round(run.position.progress * 100)} 100`,
        }),
      );
    } else svg.append(h('path', { d, class: 'qa-seg-ahead' }));
  }

  // The goal: a pennant at the top.
  const goalY = yOf(n, n);
  svg.append(
    h('path', {
      d: `M${X - 6} ${goalY + 12} v-26 l18 7 l-18 7`,
      class: allDone ? 'qa-fill' : 'qa-goal',
    }),
  );

  // Guardians (game only) on the segment their stage guards.
  const labels: HTMLElement[] = [];
  run.stations.forEach((station, k) => {
    const stage = journey.stages[k];
    if (!rpg || !station.guardian || !stage?.guardian) return;
    const { x, y } = segmentMiddle(k, n);
    const { hp, damage, defeated } = station.guardian;
    svg.append(
      h('path', {
        d: `M${x} ${y - 10} l10 10 l-10 10 l-10 -10 z`,
        class: defeated ? 'qa-guardian qa-guardian-defeated' : 'qa-guardian',
      }),
    );
    const left = Math.max(0, hp - damage);
    labels.push(
      h(
        'div',
        { class: 'qa-guardian-label', style: `top:${y - 22}px` },
        h('span', { class: 'qa-guardian-name' }, t(stage.guardian.name)),
        defeated
          ? h('span', { class: 'qa-muted qa-small' }, t('ui.guardian.defeated'))
          : h(
              'span',
              { class: 'qa-hp' },
              h(
                'span',
                { class: 'qa-hp-bar' },
                h('span', { style: `width:${(left / hp) * 100}%` }),
              ),
              h('span', { class: 'qa-muted qa-small' }, t('ui.guardian.hp', { left, hp })),
            ),
      ) as HTMLElement,
    );
  });

  run.stations.forEach((station, k) => svg.append(stationShape(station, yOf(k, n), rpg)));

  const list = h(
    'ol',
    { class: 'qa-stations' },
    ...run.stations.map((station, k) => {
      const stage = journey.stages[k];
      const name = stage ? capitalise(t(stage.plan.action)) : station.stageId;
      const label = stationLabel(station, k, current);
      return h(
        'li',
        { style: `top:${yOf(k, n) - 30}px` },
        h(
          'button',
          {
            type: 'button',
            class: `qa-station-btn${k === current && !allDone ? ' qa-station-current' : ''}`,
            'aria-label': t('ui.station.a11y', { n: k + 1, total: n, state: label || name, name }),
            onclick: () => onStation(k),
          },
          h('span', { class: 'qa-station-name' }, name),
          label ? h('span', { class: 'qa-muted qa-small' }, label) : null,
        ),
      );
    }),
  );

  const ending = journey.ending
    ? h(
        'p',
        { class: 'qa-goal-label qa-muted', style: `top:${goalY - 14}px` },
        t(journey.ending.story),
      )
    : null;

  return h(
    'div',
    { class: 'qa-path', style: `height:${heightOf(n)}px` },
    svg,
    ending,
    ...labels,
    list,
  ) as HTMLElement;
};

/** Scroll position that puts station k in the middle of a viewport of `height`. */
export const scrollFor = (k: number, stations: number, height: number): number =>
  Math.max(0, yOf(k, stations) - height / 2);
