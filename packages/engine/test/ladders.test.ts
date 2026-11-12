import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LADDERS, markerFits } from '../src/ladders';

// The engine's list of ladders comes from content/art/ (docs/game-rules.md
// §9); the art checker checks the files themselves.
const art = join(import.meta.dirname, '..', '..', '..', 'content', 'art');

describe('the list of ladders', () => {
  it('has every ladder file in content/art', () => {
    const files = readdirSync(art)
      .filter((file) => file.endsWith('.ladder.json'))
      .map((file) => file.slice(0, -'.ladder.json'.length));
    expect(Object.keys(LADDERS.ladders).sort()).toEqual(files.sort());
  });

  it('has a default ladder, and every default marker and hue fits', () => {
    expect(LADDERS.ladders[LADDERS.defaultLadder]).toBeDefined();
    for (const [name, ladder] of Object.entries(LADDERS.ladders)) {
      expect(markerFits(ladder.marker, name), name).toBe(true);
      expect(LADDERS.hues, name).toContain(ladder.hue);
    }
  });

  it('keeps flowers off water', () => {
    expect(LADDERS.ladders.crossing).toMatchObject({ versions: 5, water: true });
    expect(markerFits('flowers', 'crossing')).toBe(false);
    expect(markerFits('flowers', 'home')).toBe(true);
    expect(markerFits('balloons', 'home')).toBe(false);
  });
});
