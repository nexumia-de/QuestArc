import { describe, expect, it } from 'vitest';
import file from '../../../content/art/crossing.ladder.json';
import { ladderScene, type Ladder } from '../src/ui/ladder';

// The scene of a ladder (docs/journey-design.md, "Builds and ladders"):
// the slots filled by state, never a count. Day Planner's `ladder_scene`
// composes the same (nexumia-de/pensum tests/test_art.py).
const crossing = file as unknown as Ladder;
const arts = (version: number, state?: 'standing' | 'extending' | 'ready', lit = false) =>
  ladderScene(crossing, version, state, lit).pictures.map((p) => p.art);

describe('ladderScene', () => {
  it('puts the standing version in the build slot, the setting first', () => {
    const scene = ladderScene(crossing, 3);
    expect(scene.pictures[0]?.art).toBe('setting-river');
    expect(arts(3).filter((a) => a.startsWith('build-'))).toEqual(['build-crossing-3']);
    expect(scene.title).toBe('A plank bridge');
  });

  it('shows work on the next version as the scaffold behind the build', () => {
    const list = arts(3, 'extending');
    expect(list.indexOf('build-scaffold')).toBe(list.indexOf('build-crossing-3') - 1);
    expect(list).not.toContain('pennant');
    expect(ladderScene(crossing, 3, 'extending').title).toBe(
      'A plank bridge, work on a stone bridge has begun',
    );
  });

  it('sets the flag on the scaffold when the stage is met', () => {
    expect(arts(3, 'ready')).toEqual(expect.arrayContaining(['build-scaffold', 'pennant']));
    expect(ladderScene(crossing, 3, 'ready').title).toBe('A plank bridge, a stone bridge is ready');
  });

  it('extends nothing after the last version and lights the lantern', () => {
    const list = arts(5, 'ready', true);
    expect(list).not.toContain('build-scaffold');
    expect(list.filter((a) => a === 'lantern')).toHaveLength(1);
  });
});
