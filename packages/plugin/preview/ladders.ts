// The ladders' pages (#42) for preview/art.ts, for the owner to judge:
// `sequence` shows one ladder as it grows (each version, then the scaffold
// while the next is worked on, the scaffold with the flag when it is
// ready, the last version with the lit lantern, and the row of versions),
// `journey` a static mock of the journey screen at 360 px with the build on
// top, `palette` every hue and each ladder in two hues. Not part of the
// plugin; the real journey screen is unchanged.
import { ladders, palette, pictures } from 'virtual:questarc-art';
import { picture, scene, type Hue } from '../src/ui/art';
import { ladderScene, type BuildState, type Ladder, type LadderVersion } from '../src/ui/ladder';

export const laddersCss = `
.frames{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.versions{display:flex;gap:4px;align-items:flex-end;padding:8px 8px 4px}
.version{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;color:var(--text-color-muted)}
.version svg{width:60px;height:40px}
.next{width:56px;height:36px;border:2px solid var(--text-color-muted);border-radius:10px;box-sizing:border-box;margin:2px}
.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;padding:10px 12px}
.swatch{display:flex;align-items:center;gap:8px;font-size:12px}
.mock{max-width:360px;margin:0 auto;padding:0;gap:8px}
.mock header{display:flex;align-items:center;gap:12px;padding:14px 16px 6px;font-size:18px;font-weight:600}
.mock header span{flex:1}
.mock .build{border-radius:0;box-shadow:none;background:var(--bg-lighter)}
.mock .row-text{padding:0 16px;color:var(--text-color-muted);font-size:13px}
.mock .station{margin:0 8px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.mock .station small{letter-spacing:.08em;color:var(--text-color-muted)}
.mock .bar{height:8px;border-radius:4px;background:color-mix(in srgb,var(--c-primary) 20%,var(--bg-lighter))}
.mock .bar b{display:block;height:100%;width:60%;border-radius:4px;background:var(--c-primary)}
.mock .days{display:flex;justify-content:space-between;font-size:11px;color:var(--text-color-muted)}
.mock .days span{display:flex;flex-direction:column;align-items:center;gap:3px}
.mock .days i{width:18px;height:18px;border-radius:50%;border:2px solid var(--c-primary);box-sizing:border-box}
.mock .days i.on{background:var(--c-primary)}
.mock .days i.off{border-color:var(--text-color-muted)}
`;

type El = (tag: string, className: string, ...children: (Node | string)[]) => HTMLElement;

const frame = (
  el: El,
  ladder: Ladder,
  hue: Hue,
  version: number,
  state: BuildState,
  lit: boolean,
  caption: string,
) =>
  el(
    'div',
    'card',
    scene(ladderScene(ladder, version, state, lit), pictures, hue),
    el('p', '', caption),
  );

/** The row of versions: the standing ones small, the next as a plain step. */
const versionRow = (el: El, ladder: Ladder, hue: Hue, standing: number) =>
  el(
    'div',
    'versions',
    ...ladder.versions
      .slice(0, standing)
      .map((v: LadderVersion, i: number) =>
        el('div', 'version', picture(pictures[v.art] ?? '', hue), String(i + 1)),
      ),
    ...(standing < ladder.versions.length
      ? [el('div', 'version', el('div', 'next'), String(standing + 1))]
      : []),
  );

const hueOf = (ladder: Ladder, name: string | null): Hue =>
  palette[name ?? ''] ?? palette[ladder.hue] ?? { title: '', light: '#6495ed', dark: '#6495ed' };

/** The state in words, as under the row of versions. */
const words = (ladder: Ladder, version: number, state: BuildState) => {
  const now = ladder.versions[version - 1]?.title ?? '';
  const stands = now.startsWith('A ') ? 'stands' : 'stand';
  const next = ladder.versions[version]?.title.toLowerCase() ?? '';
  if (state === 'extending') return `${now} ${stands} · work on ${next} has begun`;
  if (state === 'ready') return `${now} ${stands} · ${next} is ready`;
  return `${now} ${stands}`;
};

export const sequence = (el: El, name: string, hueName: string | null): Node[] => {
  const ladder = ladders[name];
  if (ladder === undefined) return [el('p', '', `No ladder ${name}`)];
  const hue = hueOf(ladder, hueName);
  const frames: Node[] = [];
  const last = ladder.versions.length;
  for (let v = 1; v <= last; v += 1) {
    frames.push(
      frame(el, ladder, hue, v, 'standing', false, `${v} · ${words(ladder, v, 'standing')}`),
    );
    if (v < last)
      for (const state of ['extending', 'ready'] as const)
        frames.push(frame(el, ladder, hue, v, state, false, words(ladder, v, state)));
  }
  frames.push(
    frame(el, ladder, hue, last, 'standing', true, `${last} · after graduation: the lantern lit`),
  );
  frames.push(
    el(
      'div',
      'card',
      versionRow(el, ladder, hue, last),
      el('p', '', 'The row of versions, 60 × 40 px'),
    ),
  );
  return [
    el('h1', '', `${ladder.title}: one thing, whole at every step (${hue.title.toLowerCase()})`),
    el('div', 'frames', ...frames),
  ];
};

export const journey = (el: El, name: string, hueName: string | null): Node[] => {
  const ladder = ladders[name];
  if (ladder === undefined) return [el('p', '', `No ladder ${name}`)];
  const hue = hueOf(ladder, hueName);
  const standing = 3;
  const dots = [
    ['Fr', 'off'],
    ['Sa', 'on'],
    ['Su', 'on'],
    ['Mo', 'off'],
    ['Tu', 'on'],
    ['We', ''],
    ['Th', ''],
  ].map(([day, state]) => el('span', '', el('i', state ?? ''), day ?? ''));
  return [
    el('header', '', '‹', el('span', '', 'A gentle morning'), '⋮'),
    el('div', 'card build', scene(ladderScene(ladder, standing, 'extending'), pictures, hue)),
    versionRow(el, ladder, hue, standing),
    el('div', 'row-text', words(ladder, standing, 'extending')),
    el(
      'div',
      'card station',
      el('small', '', 'STATION 3 OF 4'),
      el(
        'strong',
        '',
        'After getting up, I will drink a glass of water and stretch for five minutes.',
      ),
      el('div', 'bar', el('b', '')),
      el('span', '', '3 of 5 days in the last 7 due days'),
      el('div', 'days', ...dots),
    ),
  ];
};

export const hues = (el: El): Node[] => {
  const swatch = (name: string, hue: Hue) => {
    const svg = picture(pictures['lantern'] ?? '', hue);
    svg.style.width = '28px';
    svg.style.height = '28px';
    return el('div', 'swatch', svg, `${hue.title} (${name})`);
  };
  const two = (ladder: string, a: string, b: string, version: number) => {
    const l = ladders[ladder];
    if (l === undefined) return [];
    return [a, b].map((h) => {
      const hue = hueOf(l, h);
      return frame(el, l, hue, version, 'ready', false, `${l.title} in ${hue.title.toLowerCase()}`);
    });
  };
  return [
    el('h1', '', 'A hue per region'),
    el('div', 'card swatches', ...Object.entries(palette).map(([name, hue]) => swatch(name, hue))),
    el(
      'div',
      'frames',
      ...two('crossing', 'water', 'slate', 4),
      ...two('home', 'meadow', 'rust', 4),
    ),
  ];
};
