import type { BuildView, Journey, RunView } from '@questarc/engine';

import { t } from '../../shared/texts';
import { art } from '../art-store';
import { picture, scene, type Hue } from '../art';
import { h } from '../dom';
import {
  appearing,
  buildLabel,
  buildWords,
  ladderScene,
  markerCount,
  rowViewBox,
  versionName,
  type BuildState,
  type Drawn,
  type Ladder,
} from '../ladder';

/**
 * The build on the journey screen in game mode (docs/behaviour.md screen
 * 4, docs/journey-design.md "The journey screen with the build"): the
 * ladder's scene in the run's hue, the row of versions and one line of
 * state in words. Elements that are new since the last draw grow in.
 */

/** What this view drew last; lives as long as the view is open. */
let drawn: Drawn | undefined;

/** Forget the last draw (tests, a new view). */
export const forgetDrawn = (): void => {
  drawn = undefined;
};

export const hueOf = (name: string, ladder?: Ladder): Hue | undefined =>
  art().palette[name] ?? (ladder ? art().palette[ladder.hue] : undefined);

/** The marker kind's plural title, from its pictures' list. */
export const markerTitle = (kind: string): string => art().markers[kind]?.title ?? kind;

/** The state the scene is drawn in, from the engine's view and the journey's names. */
export const buildState = (build: BuildView, journey: Journey): BuildState => ({
  progress: build.markerProgress,
  ready: build.ready,
  marker: build.marker,
  versions: build.versions,
  names: journey.build?.names?.map((key) => (key ? t(key) : undefined)),
});

/** The row of versions: those standing small, the next as a plain step. */
export const versionRow = (
  ladder: Ladder,
  version: number,
  state: BuildState,
  hue: Hue | undefined,
): HTMLElement => {
  const total = state.versions ?? ladder.versions.length;
  const items: Node[] = [];
  for (let v = 1; v <= Math.min(version, total); v += 1) {
    const file = ladder.versions[Math.min(v, ladder.versions.length) - 1]?.art ?? '';
    const svg = picture(art().pictures[file] ?? '', hue);
    svg.setAttribute('viewBox', rowViewBox(ladder));
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('role');
    svg.removeAttribute('aria-label');
    items.push(
      h(
        'li',
        { class: 'qa-version', 'aria-label': `${v}: ${versionName(ladder, v, state)}` },
        svg,
        h('span', { 'aria-hidden': 'true' }, v),
      ),
    );
  }
  if (version < total) {
    items.push(
      h(
        'li',
        {
          class: 'qa-version qa-version-next',
          'aria-label': t('ui.build.next', { n: version + 1 }),
        },
        h('span', { class: 'qa-version-step', 'aria-hidden': 'true' }),
        h('span', { 'aria-hidden': 'true' }, version + 1),
      ),
    );
  }
  return h(
    'ol',
    { class: 'qa-versions', 'aria-label': t('ui.build.versions') },
    ...items,
  ) as HTMLElement;
};

/** The upper part of the journey screen in game mode. */
export const buildSection = (run: RunView, journey: Journey): HTMLElement | null => {
  const build = run.build;
  const ladder = build && art().ladders[build.ladder];
  if (!build || !ladder) return null;
  const state = buildState(build, journey);
  const hue = hueOf(build.hue, ladder);
  const layout = ladderScene(ladder, build.version, state);
  const count = markerCount(ladder, build.version, state);
  const now: Drawn = {
    key: `${run.runId}/${build.ladder}/${build.marker}`,
    version: build.version,
    shown: count.postsShown + count.hangingShown,
  };
  const grow = appearing(drawn, now);
  drawn = now;
  const pictured = {
    ...layout,
    pictures: layout.pictures.map((place) => {
      const slot = (place as { slot?: string }).slot;
      const order = (place as { order?: number }).order ?? 0;
      const fresh =
        (slot === 'build' && grow.version) || (slot === 'marker' && order >= grow.fromOrder);
      return fresh ? { ...place, className: 'qa-grow' } : place;
    }),
  };
  const svg = scene(pictured, art().pictures, hue);
  svg.setAttribute(
    'aria-label',
    buildLabel(ladder, build.version, state, markerTitle(build.marker)),
  );
  return h(
    'section',
    { class: 'qa-build', 'aria-label': t('ui.build.title') },
    h('div', { class: 'qa-build-scene' }, svg),
    versionRow(ladder, build.version, state, hue),
    h('p', { class: 'qa-build-state' }, buildWords(ladder, build.version, state)),
  ) as HTMLElement;
};
