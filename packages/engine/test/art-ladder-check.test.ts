import { describe, expect, it } from 'vitest';
import { ladderProblems, markerProblems } from '../src/art-ladder-check';

// The ladder checker on a ladder that passes, and on broken copies
// (docs/journey-design.md, "Builds and ladders").
const names = [
  'setting-river',
  'build-x-1',
  'build-x-2',
  'build-x-3',
  'setting-river-cord-1',
  'tree',
  'tuft',
  ...['lanterns', 'flowers'].flatMap((k) =>
    ['post', 'bead', 'bead-lit'].map((p) => `marker-${k}-${p}`),
  ),
];
const markers = {
  lanterns: { title: 'Lanterns', landOnly: false },
  flowers: { title: 'Flowers', landOnly: true },
};
const hues = ['water', 'meadow'];
const whole = { x: 0, y: 0, width: 320, height: 180 };
const ladder = {
  title: 'Crossing',
  hue: 'water',
  width: 320,
  height: 180,
  water: true,
  // the river, where no post may stand
  waterAreas: [
    [
      [100, 60],
      [200, 60],
      [200, 180],
      [100, 180],
    ],
  ],
  marker: 'lanterns',
  // the walking surface meets the path at x = 14 and x = 106, y 57–64
  ways: [
    [
      [14, 57],
      [14, 64],
    ],
    [
      [106, 57],
      [106, 64],
    ],
  ],
  // the marker: one line over two posts in the near band
  layout: 'span',
  posts: [
    [30, 170],
    [90, 170],
  ],
  versions: [
    { art: 'build-x-1', title: 'Stones' },
    { art: 'build-x-2', title: 'A log' },
    { art: 'build-x-3', title: 'A bridge' },
  ],
  pictures: [
    { art: 'setting-river', ...whole },
    // feet at y + 15/16 of the size: 21.25 + 18.75 = 40
    { art: 'tree', band: 'far', x: 30, y: 21.25, width: 20, height: 20 },
    { slot: 'lantern', band: 'middle', x: 8, y: 107.125, width: 34, height: 34 },
    // a build stands on y = 74 of 80: 10.5 + 140 × 74/80 = 140
    { slot: 'build', band: 'middle', x: 55, y: 10.5, width: 210, height: 140 },
    { slot: 'keeper', band: 'middle', x: 40, y: 117.5, width: 24, height: 24 },
    // the marker: posts of 34 on the post points (feet 138.125 + 31.875 = 170),
    // the line, two hanging elements, in the order they appear
    {
      slot: 'marker',
      part: 'post',
      order: 1,
      band: 'near',
      x: 13,
      y: 138.125,
      width: 34,
      height: 34,
    },
    {
      slot: 'marker',
      part: 'post',
      order: 2,
      band: 'near',
      x: 73,
      y: 138.125,
      width: 34,
      height: 34,
    },
    { slot: 'marker', part: 'cord', order: 2, art: 'setting-river-cord-1', ...whole },
    { slot: 'marker', part: 'bead', order: 3, band: 'near', x: 40, y: 150, width: 20, height: 20 },
    { slot: 'marker', part: 'bead', order: 4, band: 'near', x: 60, y: 150, width: 20, height: 20 },
    { art: 'tuft', band: 'near', x: 290, y: 152, width: 20, height: 20 },
  ],
};
const svg = (shapes: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><title>x</title>${shapes}</svg>`;
// Way points in the setting: 55 + 14 × 1.75 = 79.5, 10.5 + 57 × 1.75 = 110.25 …
const sources = {
  'build-x-1': svg(
    '<rect class="fg" x="14" y="57" width="12" height="7"/><rect class="fg" x="94" y="57" width="12" height="7"/>',
  ),
  'build-x-2': svg('<rect class="fg" x="14" y="57" width="92" height="7" rx="3"/>'),
  'build-x-3': svg('<path class="fg" d="M14 57H106V64H14Z"/>'),
  'setting-river': svg(
    '<path class="bg" d="M0 106C30 106 56 110.3 79.5 110.3V122.5C56 122.5 30 124 0 125Z"/><polygon class="bg" points="240.5,110.3 320,104 320,117 240.5,122.5"/>',
  ),
};
const at = (value: unknown, withSources = false) =>
  ladderProblems(value, names, hues, markers, withSources ? sources : undefined).map((p) => p.at);
const withPicture = (index: number, change: Record<string, unknown>) => ({
  ...ladder,
  pictures: ladder.pictures.map((p, i) => (i === index ? { ...p, ...change } : p)),
});

describe('markerProblems', () => {
  it('wants a title, landOnly and the three pictures of every kind', () => {
    expect(markerProblems(markers, names)).toEqual([]);
    expect(markerProblems({}, names).map((p) => p.at)).toEqual(['markers']);
    const broken = { bunting: { title: '', landOnly: 'no' } };
    expect(markerProblems(broken, names).map((p) => p.at)).toEqual([
      'bunting',
      'bunting',
      'bunting',
      'bunting',
      'bunting',
    ]);
  });
});

describe('ladderProblems', () => {
  it('passes a ladder whose versions stand in one slot of one setting', () => {
    expect(ladderProblems(ladder, names, hues, markers, sources)).toEqual([]);
  });

  it('fails a missing title, an unknown hue and another size', () => {
    expect(at({ ...ladder, title: '', hue: 'gold', height: 120 })).toEqual([
      'title',
      'hue',
      'size',
    ]);
  });

  it('wants at least three versions of build pictures', () => {
    expect(at({ ...ladder, versions: ladder.versions.slice(0, 2) })).toContain('versions');
    const versions = [
      { art: 'tree', title: 'A tree' },
      { art: 'build-x-2', title: '' },
      { art: 'build-x-3', title: 'A bridge' },
    ];
    expect(at({ ...ladder, versions })).toEqual(['versions[0]', 'versions[1]']);
  });

  it('wants the setting first', () => {
    expect(at(withPicture(0, { art: 'tree' }))).toEqual(['pictures[0]']);
    expect(at(withPicture(0, { width: 300 }))).toEqual(['pictures[0]']);
  });

  it('wants exactly one of each slot and the build in the fixed slot', () => {
    const noKeeper = { ...ladder, pictures: ladder.pictures.filter((p) => p.slot !== 'keeper') };
    expect(at(noKeeper)).toEqual(['pictures']);
    expect(at(withPicture(3, { width: 180 }))).toContain('pictures[3]');
    expect(at(withPicture(2, { slot: 'scaffold' }))).toContain('pictures[2]');
    expect(at(withPicture(2, { slot: 'flag' }))).toContain('pictures[2]');
  });

  it('wants the row crop 3 : 2 inside the build if there is one', () => {
    expect(at({ ...ladder, row: [30, 38, 60, 40] })).toEqual([]);
    expect(at({ ...ladder, row: [21, 28, 78, 60] })).toEqual(['row']);
    expect(at({ ...ladder, row: [60, 28, 78, 52] })).toEqual(['row']);
    expect(at({ ...ladder, row: 'middle' })).toEqual(['row']);
  });

  it('wants a known marker, and flowers only on land', () => {
    expect(at({ ...ladder, marker: 'scaffold' })).toEqual(['marker']);
    expect(at({ ...ladder, marker: 'flowers' })).toEqual(['marker']);
    expect(at({ ...ladder, marker: 'flowers', water: false })).toEqual([]);
    expect(at({ ...ladder, water: undefined })).toEqual(['water']);
  });

  it('wants the marker element by element: posts, lines, hanging elements', () => {
    expect(at(withPicture(5, { order: 2 }))).toEqual(['pictures[5]']);
    expect(at(withPicture(7, { order: 1 }))).toEqual(['pictures[7]']);
    expect(at(withPicture(9, { order: 6 }))).toEqual(['pictures[9]']);
    const without = (part: string) => ({
      ...ladder,
      pictures: ladder.pictures.filter((p) => p.part !== part),
    });
    expect(at(without('bead'))).toEqual(['marker']);
    expect(at(without('post'))).toEqual(['marker']);
    expect(at(without('cord'))).toEqual(['marker']);
    expect(at(withPicture(7, { art: 'tree' }))).toEqual(['pictures[7]']);
    expect(at(withPicture(8, { width: 30, height: 30 }))).toEqual(['pictures[8]']);
    expect(at(withPicture(5, { art: 'lantern' }))).toEqual(['pictures[5]']);
  });

  it('wants a layout and post points in the near band, left to right', () => {
    expect(at({ ...ladder, layout: 'ring' })).toContain('layout');
    expect(at({ ...ladder, layout: 'sides' })).toContain('posts');
    expect(at({ ...ladder, posts: [ladder.posts[1], ladder.posts[0]] })).toContain('posts');
    expect(
      at({
        ...ladder,
        posts: [
          [30, 120],
          [90, 120],
        ],
      }),
    ).toContain('posts');
    expect(at(withPicture(6, { x: 80 }))).toEqual(['pictures[6]']);
  });

  it('wants no post in water: a setting with water marks it', () => {
    const river = [
      [
        [100, 60],
        [200, 60],
        [200, 180],
        [100, 180],
      ],
    ];
    expect(at({ ...ladder, waterAreas: river })).toEqual([]);
    expect(at({ ...ladder, waterAreas: undefined })).toEqual(['waterAreas']);
    expect(at({ ...ladder, water: false, waterAreas: undefined })).toEqual([]);
    expect(at({ ...ladder, waterAreas: [[[1, 2]]] })).toEqual(['waterAreas']);
    const wet = [
      [
        [20, 160],
        [40, 160],
        [40, 180],
        [20, 180],
      ],
    ];
    expect(at({ ...ladder, waterAreas: wet })).toEqual(['posts']);
  });

  it('wants every hanging element under a line, below the build', () => {
    expect(at(withPicture(8, { x: 100 }))).toEqual(['pictures[8]']);
    expect(at(withPicture(8, { y: 120 }))).toEqual(['pictures[8]']);
    expect(at(withPicture(8, { band: 'middle' }))).toEqual(['pictures[8]']);
  });

  it('leaves the middle of a sides layout open', () => {
    const post = (order: number, x: number) => ({
      slot: 'marker',
      part: 'post',
      order,
      band: 'near',
      x: x - 17,
      y: 138.125,
      width: 34,
      height: 34,
    });
    const bead = (order: number, x: number) => ({
      slot: 'marker',
      part: 'bead',
      order,
      band: 'near',
      x: x - 10,
      y: 150,
      width: 20,
      height: 20,
    });
    const cord = (order: number) => ({
      slot: 'marker',
      part: 'cord',
      order,
      art: 'setting-river-cord-1',
      ...whole,
    });
    const sides = {
      ...ladder,
      layout: 'sides',
      posts: [
        [20, 170],
        [60, 170],
        [200, 170],
        [240, 170],
      ],
      pictures: [
        ...ladder.pictures.slice(0, 5),
        post(1, 20),
        post(2, 60),
        post(3, 200),
        post(4, 240),
        cord(2),
        cord(4),
        bead(5, 40),
        bead(6, 220),
        ladder.pictures[10],
      ],
    };
    expect(at(sides)).toEqual([]);
    const inGap = {
      ...sides,
      pictures: sides.pictures.map((p, i) => (i === 12 ? bead(6, 130) : p)),
    };
    expect(at(inGap)).toEqual(['pictures[12]']);
    expect(at({ ...sides, pictures: [...sides.pictures, cord(3)] })).toContain('marker');
  });

  it('wants nothing of the marker on the way where it meets the build', () => {
    // the left way point is at 79.5, 110.25–122.5 in the setting
    expect(at(withPicture(8, { x: 70, y: 105 }))).toEqual(['pictures[8]', 'ways[0]', 'ways[0]']);
  });

  it('wants band sizes, feet inside the band and back-to-front order', () => {
    expect(at(withPicture(1, { width: 24, height: 24 }))).toEqual(['pictures[1]']);
    expect(at(withPicture(10, { y: 100 }))).toEqual(['pictures[10]', 'pictures[10]']);
  });

  it('wants every version and the setting to meet the path at the way points', () => {
    expect(at(ladder, true)).toEqual([]);
    expect(at({ ...ladder, ways: [] })).toEqual(['ways']);
    expect(at({ ...ladder, ways: [[[14, 57]]] })).toEqual(['ways[0]']);
    const moved = {
      ...ladder,
      ways: [
        ladder.ways[0],
        [
          [100, 50],
          [100, 64],
        ],
      ],
    };
    expect(at(moved, true)).toEqual(['versions[0]', 'versions[1]', 'versions[2]', 'ways[1]']);
  });
});
