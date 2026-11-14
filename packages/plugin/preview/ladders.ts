// The ladders' pages (#42) for preview/art.ts, for the owner to judge:
// `sequence-<ladder>[-<marker>]` shows one ladder as it grows (each
// version, then its marker growing element by element (every element for
// the first stage, a few sampled steps for the others), ready, then the
// next version; the last version with the lit lantern; the row of
// versions), `journey-<ladder>[-ready]` a static mock of the journey screen
// at 360 px with the build on top (posts up and two elements hanging, or
// ready), `palette`
// every hue and each ladder in two hues. Not part of the plugin; the real
// journey screen is unchanged.
import { ladders, palette, pictures } from 'virtual:questarc-art';
import '@questarc/ui/shared/languages';
import { picture, scene, type Hue } from '@questarc/ui/ui/art';
import {
  buildWords,
  ladderScene,
  markerElements,
  rowViewBox,
  type BuildState,
  type Ladder,
  type LadderVersion,
} from '@questarc/ui/ui/ladder';

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
  caption: string,
) =>
  el(
    'div',
    'card',
    scene(ladderScene(ladder, version, state), pictures, hue),
    el('p', '', caption),
  );

/** The row of versions: the standing ones small, the next as a plain step. */
const versionRow = (el: El, ladder: Ladder, hue: Hue, standing: number) =>
  el(
    'div',
    'versions',
    ...ladder.versions.slice(0, standing).map((v: LadderVersion, i: number) => {
      const svg = picture(pictures[v.art] ?? '', hue);
      svg.setAttribute('viewBox', rowViewBox(ladder));
      svg.style.overflow = 'hidden';
      return el('div', 'version', svg, String(i + 1));
    }),
    ...(standing < ladder.versions.length
      ? [el('div', 'version', el('div', 'next'), String(standing + 1))]
      : []),
  );

const hueOf = (ladder: Ladder, name: string | null): Hue =>
  palette[name ?? ''] ?? palette[ladder.hue] ?? { title: '', light: '#6495ed', dark: '#6495ed' };

/** The steps shown for a stage: every element for the first, a few for the others. */
const steps = (ladder: Ladder, version: number): number[] => {
  const all = markerElements(ladder);
  const posts = ladder.posts.length;
  if (version === 1) return Array.from({ length: all }, (_, i) => i + 1);
  return [1, posts, posts + Math.ceil((all - posts) / 2), all];
};

/** `name` is `<ladder>` or `<ladder>-<marker kind>`. */
export const sequence = (el: El, name: string, hueName: string | null): Node[] => {
  const [ladderName = '', marker] = name.split('-');
  const ladder = ladders[ladderName];
  if (ladder === undefined) return [el('p', '', `No ladder ${name}`)];
  const hue = hueOf(ladder, hueName);
  const kind = marker ?? ladder.marker;
  const frames: Node[] = [];
  const last = ladder.versions.length;
  const all = markerElements(ladder);
  for (let v = 1; v <= last; v += 1) {
    frames.push(frame(el, ladder, hue, v, {}, `${v} · ${buildWords(ladder, v)}`));
    if (v < last) {
      for (const n of steps(ladder, v)) {
        const state = { progress: n / all, marker: kind };
        frames.push(
          frame(el, ladder, hue, v, state, `${n} of ${all} · ${buildWords(ladder, v, state)}`),
        );
      }
      const ready = { ready: true, marker: kind };
      frames.push(frame(el, ladder, hue, v, ready, `ready · ${buildWords(ladder, v, ready)}`));
    }
  }
  frames.push(
    frame(
      el,
      ladder,
      hue,
      last,
      { graduated: true },
      `${last} · after graduation: the lantern lit`,
    ),
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
    el(
      'h1',
      '',
      `${ladder.title} with ${kind}: one thing, whole at every step (${hue.title.toLowerCase()})`,
    ),
    el('div', 'frames', ...frames),
  ];
};

/** `name` is `<ladder>` (posts up, two elements hanging) or `<ladder>-ready`. */
export const journey = (el: El, name: string, hueName: string | null): Node[] => {
  const [ladderName = '', flag] = name.split('-');
  const ladder = ladders[ladderName];
  if (ladder === undefined) return [el('p', '', `No ladder ${name}`)];
  const hue = hueOf(ladder, hueName);
  const standing = 3;
  const ready = flag === 'ready';
  const midway = (ladder.posts.length + 2) / markerElements(ladder);
  const state: BuildState = ready ? { ready } : { progress: midway };
  const dots = [
    ['Fr', ready ? 'on' : 'off'],
    ['Sa', 'on'],
    ['Su', 'on'],
    ['Mo', 'off'],
    ['Tu', 'on'],
    ['We', ready ? 'on' : ''],
    ['Th', ''],
  ].map(([day, on]) => el('span', '', el('i', on ?? ''), day ?? ''));
  const bar = el('b', '');
  bar.style.width = ready ? '100%' : '60%';
  return [
    el('header', '', '‹', el('span', '', 'A gentle morning'), '⋮'),
    el('div', 'card build', scene(ladderScene(ladder, standing, state), pictures, hue)),
    versionRow(el, ladder, hue, standing),
    el('div', 'row-text', buildWords(ladder, standing, state)),
    el(
      'div',
      'card station',
      el('small', '', 'STATION 3 OF 4'),
      el(
        'strong',
        '',
        'After getting up, I will drink a glass of water and stretch for five minutes.',
      ),
      el('div', 'bar', bar),
      el('span', '', `${ready ? '5' : '3'} of 5 days in the last 7 due days`),
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
      return frame(
        el,
        l,
        hue,
        version,
        { ready: true },
        `${l.title} in ${hue.title.toLowerCase()}`,
      );
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
