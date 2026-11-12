// Draws the ladders of the Valley (#42) into content/art/: the versions of
// each build (`build-<ladder>-<n>.svg`, view box 120 × 80), the scaffold
// (`build-scaffold.svg`) shown while the next version is worked on, the settings (`setting-<name>.svg`,
// 320 × 180) and the ladder files (`<ladder>.ladder.json`) that place them.
// Shapes and places come from the numbers here, so a picture is changed by
// changing this file and running it again:
//
//   node scripts/draw-ladders.mjs
//
// The rules the numbers follow are in docs/journey-design.md, "Builds and
// ladders". Own work, CC BY-SA 4.0 like everything in content/.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(import.meta.dirname, '..', 'content', 'art');
const n = (v) => String(Math.round(v * 10) / 10);
const pts = (list) => list.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');

// ---- shapes --------------------------------------------------------------

const rect = (role, x, y, w, h, r = 0) =>
  `<rect class="${role}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r ? ` rx="${n(r)}"` : ''}/>`;
const poly = (role, list) => `<polygon class="${role}" points="${pts(list)}"/>`;
const path = (role, d, evenodd = false) =>
  `<path class="${role}" d="${d}"${evenodd ? ' fill-rule="evenodd"' : ''}/>`;
const ellipse = (role, cx, cy, rx, ry) =>
  `<ellipse class="${role}" cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"/>`;

/** An outlined rectangle: `fg` with the same rectangle `t` smaller in `fill`. */
const boxO = (x, y, w, h, t, r = 0, fill = 'bg') => [
  rect('fg', x, y, w, h, r),
  rect(fill, x + t, y + t, w - 2 * t, h - 2 * t, Math.max(0, r - t)),
];
const ellipseO = (cx, cy, rx, ry, t) => [
  ellipse('fg', cx, cy, rx, ry),
  ellipse('bg', cx, cy, rx - t, ry - t),
];

/** The polygon moved `t` inwards (edges parallel, corners mitred). */
const inset = (list, t) => {
  let area = 0;
  list.forEach(([x1, y1], i) => {
    const [x2, y2] = list[(i + 1) % list.length];
    area += x1 * y2 - x2 * y1;
  });
  const s = area > 0 ? 1 : -1; // inwards normal side
  const lines = list.map(([x1, y1], i) => {
    const [x2, y2] = list[(i + 1) % list.length];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nx = (-(y2 - y1) / len) * s;
    const ny = ((x2 - x1) / len) * s;
    return [x1 + nx * t, y1 + ny * t, x2 - x1, y2 - y1];
  });
  return lines.map((b, i) => {
    const a = lines[(i - 1 + lines.length) % lines.length];
    const [ax, ay, adx, ady] = a;
    const [bx, by, bdx, bdy] = b;
    const det = adx * bdy - ady * bdx;
    const u = ((bx - ax) * bdy - (by - ay) * bdx) / det;
    return [ax + adx * u, ay + ady * u];
  });
};
const polyO = (list, t, fill = 'bg') => [poly('fg', list), poly(fill, inset(list, t))];

const svg = (viewBox, title, shapes) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n  <title>${title}</title>\n${shapes
    .flat()
    .map((s) => `  ${s}`)
    .join('\n')}\n</svg>\n`;

const files = new Map();
const write = (name, text) => files.set(name, text);

// ---- builds: 120 × 80, base line y = 74, centre x = 60 --------------------

const T = 2; // outline of a build, in its own units
const build = (name, title, shapes) => write(`build-${name}.svg`, svg('0 0 120 80', title, shapes));

// The build slot in a setting: 1.75 setting units per build unit, base
// line on y = 140 of the setting (the front of the middle band).
const S = 1.75;
const SLOT = { x: 55, y: 10.5, width: 120 * S, height: 80 * S };
const toBuild = ([x, y]) => [(x - SLOT.x) / S, (y - SLOT.y) / S];

// The way: a crossing carries the path over the river. Every version's
// walking surface runs from the left way point to the right one, at the
// same height and as thick as the path where it meets them (build units);
// the setting's path ends exactly there. WAYS goes into the ladder file and
// the ladder checker compares both.
const DECK = { top: 57, bottom: 64, left: 14, right: 106 };
const CROSSING_WAYS = [
  [
    [DECK.left, DECK.top],
    [DECK.left, DECK.bottom],
  ],
  [
    [DECK.right, DECK.top],
    [DECK.right, DECK.bottom],
  ],
];
const toScene = ([x, y]) => [SLOT.x + x * S, SLOT.y + y * S];

// The river runs from the near edge of the setting under the crossing and
// bends away to the left edge behind it: water never stops in the scene.
// Its banks are straight lines between y = 112 and the build's base, so the
// build's own strip of water lies exactly on it.
const riverLeft = (y) => 116 - (y - 140) * 0.4;
const riverRight = (y) => 205 + (y - 140) * 0.45;
const waterStrip = () => {
  const top = SLOT.y + DECK.bottom * S; // under the deck
  const bottom = SLOT.y + 80 * S;
  return poly('tint-strong', [
    toBuild([riverLeft(top), top]),
    toBuild([riverRight(top), top]),
    toBuild([riverRight(bottom), bottom]),
    toBuild([riverLeft(bottom), bottom]),
  ]);
};
/** The walking surface every crossing shows: a band from way point to way point. */
const surface = () => boxO(DECK.left, DECK.top, DECK.right - DECK.left, DECK.bottom - DECK.top, T);

build('crossing-1', 'Stepping stones across a river', [
  waterStrip(),
  // flat slabs where the path meets the water, stones between
  ...boxO(DECK.left, DECK.top, 14, DECK.bottom - DECK.top, T, 2),
  ...boxO(DECK.right - 14, DECK.top, 14, DECK.bottom - DECK.top, T, 2),
  ...[36, 48, 60, 72, 84].flatMap((cx, i) => ellipseO(cx, 62.6 + (i % 2) * 0.8, 4.6, 4, T)),
]);

build('crossing-2', 'A log across a river', [
  waterStrip(),
  ...boxO(DECK.left, DECK.top, DECK.right - DECK.left, DECK.bottom - DECK.top + 1, T, 4),
  rect('fg', 30, 60, 14, 2, 1),
  rect('fg', 64, 60, 18, 2, 1),
  ...ellipseO(DECK.right - 5, 61, 4.4, 4.4, 1.8),
  ellipse('fg', DECK.right - 5, 61, 1.2, 1.2),
]);

build('crossing-3', 'A plank bridge across a river', [
  waterStrip(),
  rect('fg', 40, 62, 3.4, 16), // trestles in the water
  rect('fg', 77, 62, 3.4, 16),
  rect('fg', 40, 69, 40, 2.4),
  ...surface(),
  ...[16, 38, 59, 80, 101.4].map((x) => rect('fg', x, 44, 2.6, 13)),
  rect('fg', DECK.left, 43, DECK.right - DECK.left, 3, 1.5),
  rect('accent', 57.5, 40.5, 5.6, 5.6, 1.5),
]);

// The stone bridge: one arch from bank to bank, the crossing's heaviest step.
const archBridge = () => [
  path('fg', 'M16 80V62H104V80H90C90 74 77 70 60 70C43 70 30 74 30 80Z'),
  path('bg', 'M18 78V64H102V78H92C91 72 78 68 60 68C42 68 29 72 28 78Z'),
  path(
    'fg',
    'M27 80C27 71 42 65.5 60 65.5C78 65.5 93 71 93 80H89C89 73 76 69.5 60 69.5C44 69.5 31 73 31 80Z',
  ),
  rect('accent', 56.5, 64.5, 7, 6, 1),
  ...surface(),
];
const parapet = () => [
  ...boxO(DECK.left, 49, DECK.right - DECK.left, 8, T, 1.5),
  ...[34, 52, 70, 88].map((x) => rect('fg', x, 49, 2, 8)),
];
build('crossing-4', 'A stone bridge across a river', [waterStrip(), ...archBridge(), ...parapet()]);

build('crossing-5', 'A covered bridge across a river', [
  waterStrip(),
  ...archBridge(),
  ...boxO(18, 34, 84, 23, T),
  ...[26, 45, 64, 83].map((x) => rect('fg', x, 39, 11, 8, 1)),
  ...[26, 45, 64, 83].map((x) => rect('bg', x + 2, 41, 7, 4)),
  ...polyO(
    [
      [10, 36],
      [24, 18],
      [96, 18],
      [110, 36],
    ],
    T,
  ),
  rect('fg', 8, 34, 104, 4, 2),
]);

// Home: everything grows around the fire at x = 60; its light stays the
// accent (flame, glowing door, lit window). The yard is the same in all.
// The way arrives at the threshold stone in front of every version: the
// fire, the tent's opening, each door.
const HOME_WAYS = [
  [
    [53, 77.5],
    [67, 77.5],
  ],
];
const yard = () => [ellipse('tint-strong', 60, 75, 54, 4.6), ...boxO(53, 74, 14, 3.5, 1.4, 1)];
const seat = (x = 82) => [
  rect('fg', x, 67, 18, 7, 3.5),
  rect('bg', x + 2, 69, 14, 3, 1.5),
  ...ellipseO(x + 16, 70.5, 3.5, 3.5, 1.6),
];
const fire = (scale = 1) => {
  const f = (x, y) => [60 + (x - 60) * scale, 74 + (y - 74) * scale];
  const flame = [
    [60, 48],
    [66, 58],
    [67.5, 64],
    [64, 69],
    [56, 69],
    [52.5, 64],
    [54, 58],
  ].map(([x, y]) => f(x, y));
  return [
    poly('accent', flame),
    // the ring of stones: a low wall with joints, the flame rising from it
    ...boxO(...f(40, 64.5), 40 * scale, 9.5 * scale, 2, 4 * scale),
    ...[47, 54, 61, 68, 75].map((x) => {
      const [jx, jy] = f(x, 64.5);
      return rect('fg', jx, jy, 1.8, 9.5 * scale);
    }),
  ];
};
build('home-1', 'A fireplace in a clearing', [yard(), ...fire(1.3), ...seat(12)]);

build('home-2', 'A tent by its fire', [
  yard(),
  ...polyO(
    [
      [60, 28],
      [90, 74],
      [30, 74],
    ],
    T,
  ),
  poly('accent', [
    [60, 46],
    [69, 74],
    [51, 74],
  ]),
  rect('fg', 59, 22, 2, 8),
  rect('fg', 59, 46, 2, 26),
  ...seat(8),
]);

const door = (x, y, w, h) => [
  rect('fg', x, y, w, h, 1),
  rect('accent', x + 2, y + 2, w - 4, h - 2),
];
build('home-3', 'A hut with a glowing door', [
  yard(),
  ...boxO(38, 54, 44, 20, T),
  ...polyO(
    [
      [60, 18],
      [96, 60],
      [24, 60],
    ],
    T,
  ),
  ...door(53, 60, 14, 14),
]);

const window4 = (x, y, w, h, role = 'bg') => [
  rect('fg', x, y, w, h, 1),
  rect(role, x + 1.8, y + 1.8, w - 3.6, h - 3.6),
  rect('fg', x + w / 2 - 0.8, y, 1.6, h),
  rect('fg', x, y + h / 2 - 0.8, w, 1.6),
];
build('home-4', 'A cottage with a chimney', [
  yard(),
  ...boxO(72, 14, 8, 16, T),
  ...boxO(26, 42, 68, 32, T),
  ...polyO(
    [
      [36, 20],
      [84, 20],
      [100, 44],
      [20, 44],
    ],
    T,
  ),
  ...door(53, 54, 14, 20),
  ...window4(32, 52, 14, 12),
  ...window4(74, 52, 14, 12),
]);

build('home-5', 'A house of two storeys', [
  yard(),
  ...boxO(80, 4, 8, 16, T),
  ...boxO(16, 30, 88, 44, T),
  ...polyO(
    [
      [30, 8],
      [90, 8],
      [110, 32],
      [10, 32],
    ],
    T,
  ),
  rect('fg', 16, 50, 88, 2),
  ...door(53, 56, 14, 18),
  ...window4(24, 56, 14, 12),
  ...window4(82, 56, 14, 12),
  ...window4(24, 36, 14, 11),
  ...window4(53, 36, 14, 11, 'accent'),
  ...window4(82, 36, 14, 11),
]);

// ---- the scaffold: one for every build (120 × 80) ------------------------
// While a stage runs, the scaffold stands behind the build: two light towers
// beside the largest version and a beam with a hoist over it. It is drawn in
// `dim` and behind the version, so the version stays whole and in front;
// it reads as "being improved", never as damage. The ready flag (the
// pennant) is set on the right tower's top (the `flag` slot).
const SCAFFOLD_TOP = 12;
const tower = (x) => [
  rect('dim', x, SCAFFOLD_TOP, 1.8, 80 - SCAFFOLD_TOP),
  rect('dim', x + 8.2, SCAFFOLD_TOP, 1.8, 80 - SCAFFOLD_TOP),
  ...[26, 42, 58].map((y) => rect('dim', x, y, 10, 1.6)),
  ...[SCAFFOLD_TOP + 2, 28, 44, 60].map((y) =>
    poly('dim', [
      [x + 0.6, y + 12.4],
      [x + 1.8, y + 13.4],
      [x + 9.4, y + 0.6],
      [x + 8.2, y - 0.4],
    ]),
  ),
];
write(
  'build-scaffold.svg',
  svg('0 0 120 80', 'A scaffold: work on the next version', [
    ...tower(2),
    ...tower(108),
    rect('dim', 0, SCAFFOLD_TOP - 1, 120, 2.4, 1),
    rect('dim', 59.2, SCAFFOLD_TOP, 1.6, 12),
    rect('dim', 56.5, SCAFFOLD_TOP + 11.5, 7, 3, 1),
  ]),
);

// ---- settings: 320 × 180 --------------------------------------------------

const setting = (name, title, shapes) =>
  write(`setting-${name}.svg`, svg('0 0 320 180', title, shapes));
const wave = (x, y, w) =>
  path(
    'bg',
    `M${n(x)} ${n(y)}C${n(x + w / 3)} ${n(y - 2.4)} ${n(x + (2 * w) / 3)} ${n(y - 2.4)} ${n(x + w)} ${n(y)}C${n(x + (2 * w) / 3)} ${n(y - 1.2)} ${n(x + w / 3)} ${n(y - 1.2)} ${n(x)} ${n(y + 1.2)}Z`,
  );

const [wayLeftTop, wayLeftBottom, wayRightTop, wayRightBottom] = CROSSING_WAYS.flat().map(toScene);
setting('river', 'River bank', [
  path('tint', 'M0 48C40 36 90 32 140 40C180 46 220 32 270 34C295 35 310 40 320 44V180H0Z'),
  path(
    'tint-strong',
    `M0 72C120 74 ${n(riverRight(112) - 0.45 * 18)} 94 ${n(riverRight(112))} 112L${n(riverRight(150.5))} 150.5C${n(riverRight(150.5) + 4.5)} 160.5 218 170 214 180H84C92 170 ${n(riverLeft(150.5) - 4)} 160.5 ${n(riverLeft(150.5))} 150.5L${n(riverLeft(112))} 112C${n(riverLeft(112) + 3.2)} 104 80 96 0 96Z`,
  ),
  // the way on both banks, ending exactly at the crossing's way points
  path(
    'bg',
    `M0 106C30 106 56 ${n(wayLeftTop[1])} ${n(wayLeftTop[0])} ${n(wayLeftTop[1])}V${n(wayLeftBottom[1])}C56 ${n(wayLeftBottom[1])} 30 124 0 125Z`,
  ),
  path(
    'bg',
    `M${n(wayRightTop[0])} ${n(wayRightTop[1])}C270 ${n(wayRightTop[1])} 300 106 320 104V117C300 119 270 ${n(wayRightBottom[1])} ${n(wayRightBottom[0])} ${n(wayRightBottom[1])}Z`,
  ),
  wave(136, 158, 14),
  wave(170, 168, 16),
  wave(112, 175, 12),
  wave(184, 150, 10),
  wave(40, 86, 12),
  wave(110, 90, 10),
]);

const forest = () => {
  // The edge of the wood around the clearing, low in the middle.
  let d = 'M0 34';
  for (let x = 0; x < 320; x += 16) {
    const mid = Math.abs(x + 8 - 160) / 160; // 0 in the middle, 1 at the sides
    const top = 46 - 18 * mid - (x % 32 === 0 ? 0 : 4);
    d += `Q${n(x + 8)} ${n(top - 10)} ${n(x + 16)} ${n(top + 2)}`;
  }
  return `${d}V180H0Z`;
};
setting('clearing', 'Clearing in a wood', [
  path('tint', forest()),
  path('tint-strong', 'M0 146C30 140 62 152 84 180H0Z'),
  path('tint-strong', 'M320 150C300 148 282 160 270 180H320Z'),
  path(
    'bg',
    `M128 180C138 166 146 156 ${HOME_WAYS[0]
      .map((p) => toScene(p).map(n).join(' '))
      .join('H')
      .replace(/ [\d.]+$/, '')}C174 156 182 166 192 180Z`,
  ),
]);

// ---- ladders --------------------------------------------------------------

const MIDDLE = 24; // a medium picture in the middle band
const feetOf = (y, size) => y + (size * 30) / 32;
const at = (art, band, x, feet, size) => ({
  art,
  band,
  x,
  y: feet - (size * 30) / 32,
  width: size,
  height: size,
});
// The flag that says "ready": the pennant's pole on the right tower's top.
const FLAG = 24;
const flag = () => {
  const [x, y] = toScene([113, SCAFFOLD_TOP]);
  return {
    slot: 'flag',
    band: 'middle',
    x: x - FLAG * (9 / 32),
    y: y - (FLAG * 30) / 32,
    width: FLAG,
    height: FLAG,
  };
};
const byFeet = (list) =>
  [...list].sort((a, b) => {
    const f = (p) =>
      p.slot === 'flag'
        ? 999
        : p.slot === 'build' || p.slot === 'scaffold'
          ? SLOT.y + SLOT.height * (74 / 80)
          : feetOf(p.y, p.height);
    return f(a) - f(b);
  });
const ladder = (name, data, ground, places) =>
  write(
    `${name}.ladder.json`,
    `${JSON.stringify({ ...data, width: 320, height: 180, pictures: [ground, ...byFeet(places)] }, null, 2)}\n`,
  );
const groundOf = (name) => ({ art: `setting-${name}`, x: 0, y: 0, width: 320, height: 180 });
const slot = (name, extra = {}) => ({ slot: name, ...extra });

ladder(
  'crossing',
  {
    title: 'Crossing',
    hue: 'water',
    ways: CROSSING_WAYS,
    scaffold: 'build-scaffold',
    versions: [
      { art: 'build-crossing-1', title: 'Stepping stones' },
      { art: 'build-crossing-2', title: 'A log' },
      { art: 'build-crossing-3', title: 'A plank bridge' },
      { art: 'build-crossing-4', title: 'A stone bridge' },
      { art: 'build-crossing-5', title: 'A covered bridge' },
    ],
  },
  groundOf('river'),
  [
    at('tree', 'far', 246, 40, 20),
    at('tree', 'far', 26, 45, 20),
    at('tuft', 'middle', 262, 96, 14),
    slot('scaffold', { band: 'middle', ...SLOT }),
    slot('build', { band: 'middle', ...SLOT }),
    flag(),
    { ...at('', 'middle', 8, 139, 34), art: undefined, slot: 'lantern' },
    { ...at('', 'middle', 40, 140, MIDDLE), art: undefined, slot: 'keeper' },
    at('reeds', 'near', 80, 166, 34),
    at('bush', 'near', -20, 178, 48),
    at('tuft', 'near', 296, 174, 20),
  ],
);

ladder(
  'home',
  {
    title: 'Home',
    hue: 'meadow',
    ways: HOME_WAYS,
    scaffold: 'build-scaffold',
    versions: [
      { art: 'build-home-1', title: 'A fireplace' },
      { art: 'build-home-2', title: 'A tent' },
      { art: 'build-home-3', title: 'A hut' },
      { art: 'build-home-4', title: 'A cottage' },
      { art: 'build-home-5', title: 'A house' },
    ],
  },
  groundOf('clearing'),
  [
    at('tree', 'far', 18, 40, 20),
    at('tree', 'far', 284, 41, 20),
    { ...at('', 'middle', 8, 139, 34), art: undefined, slot: 'lantern' },
    { ...at('', 'middle', 40, 140, MIDDLE), art: undefined, slot: 'keeper' },
    slot('scaffold', { band: 'middle', ...SLOT }),
    slot('build', { band: 'middle', ...SLOT }),
    flag(),
    at('flowers', 'near', 76, 160, 20),
    at('bush', 'near', -18, 176, 48),
    at('tuft', 'near', 46, 172, 20),
    at('tuft', 'near', 196, 168, 20),
  ],
);

// JSON as prettier writes it, so `npm run check` passes without a second step.
const { format } = await import('prettier');
for (const [name, text] of files)
  writeFileSync(
    join(out, name),
    name.endsWith('.json') ? await format(text, { parser: 'json' }) : text,
  );
console.log(`Wrote ${files.size} files to content/art/`);
