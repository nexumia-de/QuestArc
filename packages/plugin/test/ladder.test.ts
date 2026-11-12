import { describe, expect, it } from 'vitest';
import file from '../../../content/art/crossing.ladder.json';
import homeFile from '../../../content/art/home.ladder.json';
import {
  appearing,
  buildLabel,
  buildWords,
  elementsShown,
  markerCount,
  ladderScene,
  markerElements,
  rowViewBox,
  type BuildState,
  type Ladder,
} from '../src/ui/ladder';

// The scene of a ladder (docs/journey-design.md, "Builds and ladders"):
// the slots filled by state, never a count. Day Planner's `ladder_scene`
// composes the same (nexumia-de/pensum tests/test_art.py).
const crossing = file as unknown as Ladder;
const home = homeFile as unknown as Ladder;
const arts = (version: number, state: BuildState = {}, ladder = crossing) =>
  ladderScene(ladder, version, state).pictures.map((p) => p.art);
const marks = (version: number, state: BuildState, ladder = crossing) =>
  arts(version, state, ladder).filter((a) => a.startsWith('marker-'));

describe('ladderScene', () => {
  it('puts the standing version in the build slot, the setting first', () => {
    const scene = ladderScene(crossing, 3);
    expect(scene.pictures[0]?.art).toBe('setting-river');
    expect(arts(3).filter((a) => a.startsWith('build-'))).toEqual(['build-crossing-3']);
    expect(marks(3, {})).toEqual([]);
    expect(scene.title).toBe('A plank bridge stands');
  });

  it('counts the elements: posts, then hanging ones (span 2 + 6, sides 4 + 6)', () => {
    expect(markerElements(crossing)).toBe(8);
    expect(markerElements(home)).toBe(10);
    expect(elementsShown(crossing, 0)).toBe(0);
    expect(elementsShown(crossing, 0.01)).toBe(1);
    expect(elementsShown(crossing, 3 / 8)).toBe(3);
    expect(elementsShown(crossing, 1)).toBe(8);
    // a days stage of 5 and a count stage of 20 fill the same marker
    expect(elementsShown(home, 3 / 5)).toBe(elementsShown(home, 12 / 20));
  });

  it('grows element by element: posts first, a line once both its posts stand', () => {
    expect(marks(3, { progress: 1 / 8 })).toEqual(['marker-lanterns-post']);
    const two = arts(3, { progress: 2 / 8 });
    expect(two.filter((a) => a.includes('-post'))).toHaveLength(2);
    expect(two.filter((a) => a.includes('-cord-'))).toHaveLength(1);
    expect(marks(3, { progress: 3 / 8 })).toHaveLength(3);
    expect(marks(3, { progress: 4 / 8 }).filter((a) => a.includes('-bead'))).toHaveLength(2);
    expect(ladderScene(crossing, 3, { progress: 0.5 }).title).toBe(
      'A plank bridge stands, a stone bridge is on its way',
    );
  });

  it('leaves the middle open in the sides layout: two lines, never three', () => {
    const lines = arts(3, { progress: 4 / 10 }, home).filter((a) => a.includes('-cord-'));
    expect(lines).toEqual(['setting-clearing-cord-1', 'setting-clearing-cord-2']);
  });

  it('shows every hanging element in its on form when ready, the posts plain', () => {
    const on = marks(3, { ready: true, progress: 0.5 });
    expect(on).toHaveLength(8);
    expect(on.filter((a) => a.endsWith('-bead-lit'))).toHaveLength(6);
    expect(on.filter((a) => a === 'marker-lanterns-post')).toHaveLength(2);
    expect(ladderScene(crossing, 3, { ready: true }).title).toBe(
      'A plank bridge stands, a stone bridge is ready',
    );
  });

  it('takes the ladder default marker or another one', () => {
    expect(marks(3, { progress: 0.1 }, home)).toEqual(['marker-pennants-post']);
    expect(marks(3, { progress: 0.1, marker: 'flowers' }, home)).toEqual(['marker-flowers-post']);
  });

  it('shows no marker after the last version and lights the lantern', () => {
    const list = arts(5, { ready: true, graduated: true });
    expect(list.filter((a) => a.startsWith('marker-'))).toEqual([]);
    expect(list.filter((a) => a === 'lantern')).toHaveLength(1);
  });

  it('says the state in words, never a building site', () => {
    expect(buildWords(crossing, 1, { progress: 0.1 })).toBe(
      'Stepping stones stand · a log is on its way',
    );
    expect(buildWords(home, 3, { ready: true })).toBe('A hut stands · a cottage is ready');
    expect(buildWords(home, 5, { progress: 1 })).toBe('A house stands');
  });

  it('zooms the row of versions where the ladder says so', () => {
    expect(rowViewBox(crossing)).toBe('30 38 60 40');
    expect(rowViewBox(home)).toBe('0 0 120 80');
  });
});

// The journey screen with the build (#100): names, the label for screen
// readers, the journey's own version count and what appears at the tick.
describe('the build on the journey screen', () => {
  it('says the state in words, with the journey own names where given', () => {
    expect(buildWords(crossing, 3, { progress: 0.5 })).toBe(
      'A plank bridge stands · a stone bridge is on its way',
    );
    expect(buildWords(crossing, 1, { progress: 0.5 })).toBe(
      'Stepping stones stand · a log is on its way',
    );
    expect(buildWords(crossing, 3, { progress: 0 })).toBe('A plank bridge stands');
    expect(
      buildWords(crossing, 3, {
        ready: true,
        names: [undefined, undefined, 'The Morning Bridge', 'The Stone Way'],
      }),
    ).toBe('The Morning Bridge stands · The Stone Way is ready');
  });

  it('names the marker in numbers for screen readers', () => {
    expect(buildLabel(crossing, 3, { progress: 5 / 8 }, 'Lanterns')).toBe(
      'A plank bridge, version 3 of 5; marker: 2 of 2 posts and 3 of 6 lanterns; not ready yet',
    );
    expect(buildLabel(home, 2, { progress: 0.2 }, 'Pennants')).toBe(
      'A tent, version 2 of 5; marker: 2 of 4 posts and 0 of 6 pennants; not ready yet',
    );
    expect(buildLabel(home, 2, { ready: true }, 'Pennants')).toBe(
      'A tent, version 2 of 5; marker: 4 of 4 posts and 6 of 6 pennants; ready',
    );
    expect(buildLabel(home, 2, {}, 'Pennants')).toBe(
      'A tent, version 2 of 5; nothing on its way yet',
    );
    expect(buildLabel(home, 5, { progress: 1 }, 'Pennants')).toBe(
      'A house, version 5 of 5; all versions stand',
    );
  });

  it('follows the journey version count: more versions than pictures reuse the last', () => {
    const six = { versions: 6, progress: 0.5 };
    expect(arts(6, six).filter((a) => a.startsWith('build-'))).toEqual(['build-crossing-5']);
    expect(marks(5, six).length).toBeGreaterThan(0);
    expect(marks(6, six)).toEqual([]);
    expect(markerCount(crossing, 5, six).hangingShown).toBe(2);
    // a journey with fewer stages ends earlier: no marker on its last version
    expect(marks(3, { versions: 3, progress: 0.5 })).toEqual([]);
  });

  it('lets only what is new appear, and nothing on the first draw', () => {
    const at = (version: number, shown: number, key = 'r/crossing/lanterns') => ({
      key,
      version,
      shown,
    });
    expect(appearing(undefined, at(3, 4))).toEqual({ version: false, fromOrder: Infinity });
    expect(appearing(at(3, 4), at(3, 4))).toEqual({ version: false, fromOrder: Infinity });
    expect(appearing(at(3, 4), at(3, 6))).toEqual({ version: false, fromOrder: 5 });
    expect(appearing(at(3, 8), at(4, 0))).toEqual({ version: true, fromOrder: 1 });
    expect(appearing(at(3, 4), at(3, 6, 'r/home/pennants'))).toEqual({
      version: false,
      fromOrder: Infinity,
    });
  });
});
