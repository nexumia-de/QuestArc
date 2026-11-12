import { describe, expect, it } from 'vitest';
import { LADDERS, ladderListProblems, type LadderList } from '../src/ladders';

// content/ladders.json is read by the engine, the journey checker and both
// hosts (docs/game-rules.md §9); it must be consistent in itself.
describe('the list of ladders', () => {
  it('is consistent', () => {
    expect(ladderListProblems(LADDERS)).toEqual([]);
  });

  it('has the ladders the built-in journeys use', () => {
    expect(Object.keys(LADDERS.ladders).sort()).toEqual(['crossing', 'home']);
    expect(LADDERS.defaultLadder).toBe('home');
  });

  it('finds a broken list', () => {
    const broken = structuredClone(LADDERS) as unknown as {
      ladders: Record<string, { versions: number; setting: string; marker: string }>;
      settings: Record<string, { water: boolean; layout: string; hue: string }>;
    };
    broken.ladders.crossing = { versions: 1, setting: 'river', marker: 'flowers' };
    broken.ladders.tower = { versions: 4, setting: 'hill', marker: 'lanterns' };
    broken.settings.clearing = { water: false, layout: 'round', hue: 'gold' };
    expect(
      ladderListProblems({ ...LADDERS, ...broken, defaultLadder: 'castle' } as LadderList),
    ).toEqual([
      'defaultLadder castle: not a ladder',
      'ladder crossing: needs at least 2 versions',
      'ladder crossing: default marker flowers unknown or not fitting',
      'ladder tower: setting hill unknown',
      'setting clearing: hue gold unknown',
      'setting clearing: layout must be span or sides',
    ]);
  });
});
