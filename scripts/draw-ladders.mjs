// Draws the ladders of the Valley (#42) into content/art/: the versions of
// each build (`build-<ladder>-<n>.svg`, view box 120 × 80), the markers
// shown beside the build while the next version is on its way
// (`marker-<kind>-post|bead[-lit].svg`, 32 × 32, and `markers.json`), the
// settings (`setting-<name>.svg`, 320 × 180) with their marker cords
// (`setting-<name>-cord-<n>.svg`) and the ladder files
// (`<ladder>.ladder.json`) that place them.
// Shapes and places come from the numbers here, so a picture is changed by
// changing this file and running it again:
//
//   node scripts/draw-ladders.mjs
//
// The rules the numbers follow are in docs/journey-design.md, "Builds and
// ladders". Own work, CC BY-SA 4.0 like everything in content/.
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
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

// Where the deck ends, the bank holds it: every crossing stands on two
// stone abutments at its way points, so no deck floats at the banks. Their
// inner faces slope down into the water strip.
const abutments = () =>
  [10, 88].flatMap((x) => [
    ...boxO(x, 63.5, 22, 9.5, T),
    rect('fg', x, 67.6, 22, 1.5),
    rect('fg', x + 10.2, 63.5, 1.6, 4.5),
    rect('fg', x + 5, 68.5, 1.6, 4.5),
    rect('fg', x + 15.4, 68.5, 1.6, 4.5),
  ]);

// Stepping stones: two landing slabs at the way points, four boulders
// between, each with a flat top face, so they read as stones, not dots.
const boulder = (cx, top, w, h) => [
  rect('fg', cx - w / 2, top, w, h, h / 2.2),
  rect('bg', cx - w / 2 + T, top + T, w - 2 * T, h - 2 * T, h / 2.2 - T),
  path('bg', `M${n(cx - w / 2 - 2)} ${n(top + h + 1.5)}h${n(w + 4)}v1.4h${n(-w - 4)}Z`),
];
build('crossing-1', 'Stepping stones across a river', [
  waterStrip(),
  ...abutments(),
  ...boxO(DECK.left, DECK.top, 16, DECK.bottom - DECK.top, T, 1.5),
  ...boxO(DECK.right - 16, DECK.top, 16, DECK.bottom - DECK.top, T, 1.5),
  ...[
    [40, 56.5, 13, 10],
    [53, 58, 11, 9],
    [66, 56, 13, 11],
    [79.5, 58, 11, 9],
  ].flatMap(([cx, top, w, h]) => boulder(cx, top, w, h)),
]);

// The log: a round trunk from bank to bank, as thick as two path widths,
// with bark lines and its cut end showing rings. Its outline keeps corners
// at the way points.
const LOG = [
  [DECK.left, DECK.top],
  [DECK.left, DECK.bottom],
  [16, 67],
  [21, 68.5],
  [99, 68.5],
  [104, 67],
  [DECK.right, DECK.bottom],
  [DECK.right, DECK.top],
  [104, 54],
  [99, 52.5],
  [21, 52.5],
  [16, 54],
];
build('crossing-2', 'A log across a river', [
  waterStrip(),
  ...abutments(),
  ...polyO(LOG, T),
  rect('fg', 24, 57, 22, 1.8, 0.9),
  rect('fg', 52, 62.5, 26, 1.8, 0.9),
  rect('fg', 32, 64, 12, 1.6, 0.8),
  rect('fg', 70, 56.5, 16, 1.6, 0.8),
  ...ellipseO(101, 60.5, 5.5, 8, 1.8),
  ...ellipseO(101, 60.5, 2.6, 4.2, 1.4),
  rect('fg', 46, 51, 3, 3, 1),
  rect('fg', 47, 48.5, 1.6, 3.5),
]);

build('crossing-3', 'A plank bridge across a river', [
  waterStrip(),
  ...abutments(),
  rect('fg', 42, 62, 3.4, 16), // trestles in the water
  rect('fg', 75, 62, 3.4, 16),
  rect('fg', 42, 69, 36.4, 2.4),
  ...surface(),
  ...[16, 38, 59, 80, 101.4].map((x) => rect('fg', x, 44, 2.6, 13)),
  rect('fg', DECK.left, 43, DECK.right - DECK.left, 3, 1.5),
  rect('accent', 57.5, 40.5, 5.6, 5.6, 1.5),
]);

// The stone bridge: one arch from bank to bank, the crossing's heaviest step;
// its masonry reaches down into both banks.
const archBridge = () => [
  path('fg', 'M12 80V62H108V80H90C90 74 77 70 60 70C43 70 30 74 30 80Z'),
  path('bg', 'M14 78V64H106V78H92C91 72 78 68 60 68C42 68 29 72 28 78Z'),
  path(
    'fg',
    'M27 80C27 71 42 65.5 60 65.5C78 65.5 93 71 93 80H89C89 73 76 69.5 60 69.5C44 69.5 31 73 31 80Z',
  ),
  rect('fg', 14, 71, 12, 1.6),
  rect('fg', 94, 71, 12, 1.6),
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
// fire, the tent's opening, each door. Size and form both grow: a fire, a
// tent, a low hut under a round thatch, a cottage with a pitched roof and
// chimney, a house of two storeys.
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
// The fireplace: a ring of single round stones seen from the front, the
// back row smaller and higher, the flame rising between the rows.
const fire = () => {
  const stone = (cx, cy, rx, ry) => ellipseO(cx, cy, rx, ry, 1.6);
  return [
    ...[44, 52, 60, 68, 76].flatMap((cx) => stone(cx, 62.5, 4.2, 3.2)),
    // a flame of three tongues, the middle one highest
    poly('accent', [
      [60, 40],
      [64, 50],
      [67.5, 45],
      [70, 55],
      [67, 64],
      [53, 64],
      [50, 55],
      [52.5, 46],
      [56, 51],
    ]),
    // its light core, so the flame does not read as a shrub in a green hue
    poly('bg', [
      [60, 49],
      [63.5, 57],
      [62.5, 64],
      [57.5, 64],
      [56.5, 57],
    ]),
    ...[37, 48.5, 60, 71.5, 83].flatMap((cx) => stone(cx, 69.5, 6, 4.4)),
  ];
};
build('home-1', 'A fireplace in a clearing', [yard(), ...fire(), ...seat(6)]);

build('home-2', 'A tent by its fire', [
  yard(),
  ...polyO(
    [
      [60, 32],
      [86, 74],
      [34, 74],
    ],
    T,
  ),
  poly('accent', [
    [60, 48],
    [68, 74],
    [52, 74],
  ]),
  rect('fg', 59, 26, 2, 8),
  rect('fg', 59, 48, 2, 24),
  ...seat(8),
]);

const door = (x, y, w, h) => [
  rect('fg', x, y, w, h, 1),
  rect('accent', x + 2, y + 2, w - 4, h - 2),
];
// The hut: low log walls under a round thatched roof (a half ellipse, a
// second layer of thatch inside it), wider than the tent and lower than
// the cottage.
const dome = (cx, base, rx, ry, steps = 16) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = (2 * i) / steps - 1; // -1 … 1 across the roof
    return [cx + rx * t, base - ry * (1 - Math.abs(t) ** 1.7)];
  });
const HUT_ROOF = dome(60, 59, 36, 36);
build('home-3', 'A hut with a thatched roof', [
  yard(),
  ...boxO(36, 54, 48, 20, T),
  rect('fg', 36, 61, 17, 1.6),
  rect('fg', 67, 61, 17, 1.6),
  rect('fg', 36, 67.5, 17, 1.6),
  rect('fg', 67, 67.5, 17, 1.6),
  ...polyO(HUT_ROOF, T),
  ...[44, 51].map((y) => rect('fg', 60 - (59 - y) * 0.95, y, (59 - y) * 1.9, 1.6)),
  ...boxO(57, 20, 6, 5, 1.6, 1),
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
  ...boxO(74, 6, 9, 18, T),
  ...boxO(24, 44, 72, 30, T),
  ...polyO(
    [
      [38, 14],
      [82, 14],
      [102, 46],
      [18, 46],
    ],
    T,
  ),
  ...door(53, 54, 14, 20),
  ...window4(30, 52, 15, 13),
  ...window4(75, 52, 15, 13),
]);

build('home-5', 'A house of two storeys', [
  yard(),
  ...boxO(80, 4, 8, 16, T),
  ...boxO(14, 30, 92, 44, T),
  ...polyO(
    [
      [30, 8],
      [90, 8],
      [112, 32],
      [8, 32],
    ],
    T,
  ),
  rect('fg', 14, 51, 92, 2),
  ...door(53, 56, 14, 18),
  ...window4(22, 56, 14, 12),
  ...window4(84, 56, 14, 12),
  ...window4(22, 36, 14, 11),
  ...window4(53, 36, 14, 11, 'accent'),
  ...window4(84, 36, 14, 11),
]);

// ---- markers: drawn once for every ladder (32 × 32) ---------------------
// While a stage runs, a small festive marker grows in the foreground, one
// element at a time (owner, 2026-11-12, #42): first the posts, one after
// the other, then the hanging elements along the line, from the first post
// on. A marker has E elements in this fixed order; the hosts show the first
// ceil(p × E), p (0…1) the best progress reached in the stage's condition,
// so it never loses one. The line between two neighbouring posts shows
// once both stand. Ready (while the condition holds) every element takes
// its "on" form, different in shape: lanterns filled with rays, pennants
// solid with a second tail, flowers open. Posts carry nothing on top:
// they are plain, everything decorative hangs from the line.
// Each kind has three pictures: `marker-<kind>-post` stands on y = 30 with
// the line tied on at MARKER_TIE, `marker-<kind>-bead` hangs from the line
// at its top centre (16, 2) and `marker-<kind>-bead-lit` is its form for
// ready. The lines belong to the setting (`setting-<name>-cord-<n>.svg`).
const MARKER_TIE = [16, 15];
const MARKERS = {
  lanterns: { title: 'Lanterns', landOnly: false },
  pennants: { title: 'Pennants', landOnly: false },
  flowers: { title: 'Flowers', landOnly: true },
};
const marker = (name, title, shapes) =>
  write(`marker-${name}.svg`, svg('0 0 32 32', title, shapes));
const ray = (cx, cy, degrees, r0, r1, w) => {
  const a = (degrees * Math.PI) / 180;
  const [dx, dy] = [Math.cos(a), Math.sin(a)];
  const [nx, ny] = [(-dy * w) / 2, (dx * w) / 2];
  return poly('accent', [
    [cx + dx * r0 + nx, cy + dy * r0 + ny],
    [cx + dx * r1 + nx, cy + dy * r1 + ny],
    [cx + dx * r1 - nx, cy + dy * r1 - ny],
    [cx + dx * r0 - nx, cy + dy * r0 - ny],
  ]);
};
/** A plain post from the tie point down to y = 30, its top rounded. */
const post = () => [
  rect('fg', 15, MARKER_TIE[1] - 1.8, 2, 32 - MARKER_TIE[1], 1),
  rect('fg', 13.6, 28.9, 4.8, 1.1, 0.55),
];
const markerSet = (kind, words, bead) => {
  marker(`${kind}-post`, 'A post', post());
  marker(`${kind}-bead`, words.bead, bead(false));
  marker(`${kind}-bead-lit`, words.beadLit, bead(true));
};

// Lanterns: small lanterns on the line; ready they are filled, with a
// flame, a halo and rays.
// The halo is opaque `tint-strong`, drawn first and clearly larger than the
// lantern, so a lit lantern glows in light style too (#100's review).
const lantern = (cx, top, w, h, lit, rays = []) => [
  ...(lit ? [ellipse('tint-strong', cx, top + h / 2, w * 1.05, w * 1.05)] : []),
  poly('fg', [
    [cx - w / 2 - 1, top + 1],
    [cx + w / 2 + 1, top + 1],
    [cx, top - h * 0.28],
  ]),
  rect('fg', cx - w / 2, top, w, h, w * 0.22),
  rect(lit ? 'accent' : 'bg', cx - w / 2 + 1.6, top + 1.6, w - 3.2, h - 3.2, 1),
  ...(lit ? [ellipse('bg', cx, top + h * 0.55, w * 0.12, h * 0.17)] : []),
  rect('fg', cx - w * 0.3, top + h - 0.4, w * 0.6, 2, 0.8),
  ...(lit ? rays.map((d) => ray(cx, top + h / 2, d, w * 0.8, w * 1.2, 1.6)) : []),
];
markerSet(
  'lanterns',
  { bead: 'A small lantern on a line', beadLit: 'A small lit lantern' },
  (lit) => [rect('fg', 15.2, 1, 1.6, 4), ...lantern(16, 7, 12, 14, lit, [0, 180, 35, 145])],
);

// Pennants: pale outlined pennants on the line; ready they are solid in
// the accent with a second tail beside them.
markerSet(
  'pennants',
  { bead: 'A pale pennant on a line', beadLit: 'A bright pennant with a second tail' },
  (lit) =>
    lit
      ? [
          ...polyO(
            [
              [6, 2],
              [24, 2],
              [15, 27],
            ],
            1.8,
            'accent',
          ),
          poly('accent', [
            [24, 2],
            [27.5, 2],
            [30, 16],
            [27, 14],
          ]),
        ]
      : polyO(
          [
            [8, 2],
            [24, 2],
            [16, 24],
          ],
          1.8,
        ),
);

// Flowers: vines with closed buds on the line; ready the buds open.
const leaf = (x, y, dir) =>
  poly('tint-strong', [
    [x, y],
    [x + dir * 3, y - 2.6],
    [x + dir * 6.5, y - 1.6],
    [x + dir * 3.4, y + 1],
  ]);
const bud = (cx, cy, s = 1) => [
  ellipse('fg', cx, cy, 2.4 * s, 3.2 * s),
  ellipse('bg', cx, cy, 1.4 * s, 2.2 * s),
  ellipse('accent', cx, cy + 1.4 * s, 0.9 * s, 0.7 * s),
];
// An open blossom: petals outlined in `fg` with a `bg` fill and an accent
// centre, so it never sits green on green in the meadow hue (#100's review).
const blossom = (cx, cy, r = 2.2) => {
  const petals = [0, 72, 144, 216, 288].map((d) => {
    const a = ((d - 90) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  return [
    ...petals.map(([x, y]) => ellipse('fg', x, y, r * 0.95 + 1.4, r * 0.95 + 1.4)),
    ...petals.map(([x, y]) => ellipse('bg', x, y, r * 0.95, r * 0.95)),
    ellipse('fg', cx, cy, r * 0.62 + 1.2, r * 0.62 + 1.2),
    ellipse('accent', cx, cy, r * 0.62, r * 0.62),
  ];
};
markerSet('flowers', { bead: 'A vine in bud on a line', beadLit: 'A vine in bloom' }, (lit) => [
  rect('tint-strong', 14.8, 2, 2.4, 10),
  leaf(15, 6, -1.5),
  leaf(17, 9, 1.5),
  ...(lit ? blossom(16, 18, 4.4) : bud(16, 16.5, 2.1)),
]);

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
    `M128 180L130.5 176C139 163 146 155 ${HOME_WAYS[0]
      .map((p) => toScene(p).map(n).join(' '))
      .join('H')
      .replace(/ [\d.]+$/, '')}C174 155 181 163 189.5 176L192 180Z`,
  ),
]);

// ---- the marker's posts: per setting (320 × 180) ------------------------
// A setting declares its marker layout and an ordered list of post points
// in the near band (`marker` in the ladder file), like it declares where
// the path meets the build. `span`: one continuous line over all posts,
// where it can run in front of the build without crossing the way or the
// view (Crossing: along the near edge, in front of the bridge). `sides`:
// two short lines, left and right, with a gap in the middle where the way
// or the view to the build passes (Home: the path to the door; a boat on
// water: the waterway). The lines hang below the build's base line, so
// they never cross the build. The hanging elements are spread evenly over
// the lines, in order from the first post.
// A light line, and short posts (the tie at y = 15): the first steps must not read as a rope
// fence (#100's review).
const MARKER_POST = 34; // near band (fixed size)
const BEAD = 24;
// A line sags gently, more the longer it is; it is a little thicker than
// an outline so a long one still reads.
const sagOf = (a, b) => Math.max(3.5, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.045);
const CORD = 1.6;
const tieAt = ([x, feet]) => [x, feet - (MARKER_POST * (30 - MARKER_TIE[1])) / 32];

/** A point on the line from a to b, sagging by `sag` in the middle. */
const cordAt = (a, b, sag, t) => {
  const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 2 * sag];
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
  ];
};
/** The pairs of neighbouring posts a line joins in a layout. */
const segmentsOf = (layout, count) =>
  Array.from({ length: count - 1 }, (_, i) => [i, i + 1]).filter(
    ([i]) => layout === 'span' || i !== count / 2 - 1,
  );
const markerPlaces = (settingName, { layout, posts, beads }) => {
  const places = posts.map(([x, feet], i) => ({
    slot: 'marker',
    part: 'post',
    order: i + 1,
    band: 'near',
    x: x - MARKER_POST / 2,
    y: feet - (MARKER_POST * 30) / 32,
    width: MARKER_POST,
    height: MARKER_POST,
    feet,
  }));
  const segments = segmentsOf(layout, posts.length);
  const perSegment = beads / segments.length;
  let order = posts.length;
  segments.forEach(([i, j], k) => {
    const [a, b] = [tieAt(posts[i]), tieAt(posts[j])];
    const name = `setting-${settingName}-cord-${k + 1}`;
    const SAG = sagOf(a, b);
    const top = Array.from({ length: 25 }, (_, s) => cordAt(a, b, SAG, s / 24));
    const bottom = top.map(([x, y]) => [x, y + CORD]).reverse();
    write(
      `${name}.svg`,
      svg('0 0 320 180', 'A line between two posts', [poly('dim', [...top, ...bottom])]),
    );
    const feet = Math.max(posts[i][1], posts[j][1]) + 0.1;
    places.push({
      slot: 'marker',
      part: 'cord',
      order: j + 1,
      art: name,
      x: 0,
      y: 0,
      width: 320,
      height: 180,
      feet,
    });
    for (let s = 0; s < perSegment; s += 1) {
      const [px, py] = cordAt(a, b, SAG, (s + 1) / (perSegment + 1));
      order += 1;
      places.push({
        slot: 'marker',
        part: 'bead',
        order,
        band: 'near',
        x: px - BEAD / 2,
        y: py + CORD / 2 - (BEAD * 2) / 32,
        width: BEAD,
        height: BEAD,
        feet: feet + 0.01 * order,
      });
    }
  });
  return places;
};
const MARKER_LAYOUTS = {
  river: {
    layout: 'span',
    posts: [
      [52, 172],
      [262, 172],
    ],
    beads: 6,
  },
  clearing: {
    layout: 'sides',
    posts: [
      [34, 170],
      [116, 173],
      [204, 173],
      [286, 170],
    ],
    beads: 6,
  },
};
const markerOf = ({ layout, posts }) => ({ layout, posts });

// Where a setting has water: polygons in setting units, so the checker can
// refuse a post point on water (no post stands in water). They follow the
// river's outline in setting-river.svg closely enough for post points.
const RIVER_WATER = [
  [
    [0, 72],
    [120, 74],
    [riverRight(112) - 8, 94],
    [riverRight(112), 112],
    [riverRight(150.5), 150.5],
    [218, 170],
    [214, 180],
    [84, 180],
    [92, 170],
    [riverLeft(150.5), 150.5],
    [riverLeft(112), 112],
    [80, 96],
    [0, 96],
  ].map(([x, y]) => [Math.round(x * 10) / 10, y]),
];
/** The graduation lantern stands where the marker's first post stood. */
const lanternAtPost = ({ posts: [[x, feet]] }) => ({
  ...at('', 'near', x - 17, feet, 34),
  art: undefined,
  slot: 'lantern',
});

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
const BUILD_FEET = SLOT.y + SLOT.height * (74 / 80);
const byFeet = (list) =>
  [...list]
    .map((p) => ({
      p,
      f: p.feet ?? (p.slot === 'build' ? BUILD_FEET : feetOf(p.y, p.height)),
    }))
    .sort((a, b) => a.f - b.f)
    // `feet` only sorts; it is not part of the ladder file
    .map(({ p }) => Object.fromEntries(Object.entries(p).filter(([key]) => key !== 'feet')));
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
    water: true,
    marker: 'lanterns',
    // the row of versions shows the middle of the crossing, zoomed, so the
    // stones and the log read at 60 × 40 px
    row: [30, 38, 60, 40],
    ways: CROSSING_WAYS,
    ...markerOf(MARKER_LAYOUTS.river),
    waterAreas: RIVER_WATER,
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
    at('tuft', 'middle', 290, 92, 14),
    slot('build', { band: 'middle', ...SLOT }),
    { ...at('', 'middle', 18, 144, MIDDLE), art: undefined, slot: 'keeper' },
    at('reeds', 'near', 84, 166, 34),
    at('tuft', 'near', 296, 174, 20),
    lanternAtPost(MARKER_LAYOUTS.river),
    at('bush', 'near', -24, 179, 48),
    ...markerPlaces('river', MARKER_LAYOUTS.river),
  ],
);

ladder(
  'home',
  {
    title: 'Home',
    hue: 'meadow',
    water: false,
    marker: 'pennants',
    ways: HOME_WAYS,
    ...markerOf(MARKER_LAYOUTS.clearing),
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
    { ...at('', 'middle', 26, 144, MIDDLE), art: undefined, slot: 'keeper' },
    slot('build', { band: 'middle', ...SLOT }),
    at('flowers', 'middle', 36, 132, 24),
    lanternAtPost(MARKER_LAYOUTS.clearing),
    at('bush', 'near', -22, 179, 48),
    at('tuft', 'near', 236, 178, 20),
    ...markerPlaces('clearing', MARKER_LAYOUTS.clearing),
  ],
);

write(
  'markers.json',
  `${JSON.stringify(
    Object.fromEntries(Object.entries(MARKERS).map(([k, v]) => [k, { ...v, tie: MARKER_TIE }])),
    null,
    2,
  )}\n`,
);

// JSON as prettier writes it, so `npm run check` passes without a second step.
const { format } = await import('prettier');
for (const [name, text] of files)
  writeFileSync(
    join(out, name),
    name.endsWith('.json') ? await format(text, { parser: 'json' }) : text,
  );
// Generated pictures this run no longer writes are removed.
const generated = /^(build-|marker-|setting-[a-z]+-cord-)/;
for (const name of readdirSync(out))
  if (generated.test(name) && !files.has(name)) rmSync(join(out, name));
console.log(`Wrote ${files.size} files to content/art/`);
