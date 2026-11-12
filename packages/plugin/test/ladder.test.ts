import { describe, expect, it } from 'vitest';
import file from '../../../content/art/crossing.ladder.json';
import homeFile from '../../../content/art/home.ladder.json';
import {
  buildWords,
  elementsShown,
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
    expect(marks(3, { progress: 0.1 }, home)).toEqual(['marker-bunting-post']);
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
