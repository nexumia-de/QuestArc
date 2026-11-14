import { LADDERS } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import crossing from '../../../content/art/crossing.ladder.json';
import home from '../../../content/art/home.ladder.json';
import markers from '../../../content/art/markers.json';
import palette from '../../../content/art/palette.json';
// @ts-expect-error: a plain build script without types
import { ladderArt } from '../art.mjs';

// The journey screen with the build (#100): what the plugin bundles, and that
// the engine's list and the pictures name the same things. Every named picture exists: the ladder checker
// (npm run journeys) requires it.
const ladders: Record<string, { versions: { art: string }[]; water: boolean }> = {
  crossing,
  home,
};
const kinds: Record<string, { landOnly: boolean }> = markers;

describe('the plugin bundles only the pictures of the build', () => {
  const kept: Set<string> = ladderArt({ ladders, markers });

  it('keeps every picture a ladder scene, the row or the chooser draws', () => {
    for (const ladder of Object.values(ladders))
      for (const v of ladder.versions) expect(kept).toContain(v.art);
    for (const kind of Object.keys(markers))
      for (const part of ['post', 'bead', 'bead-lit'])
        expect(kept).toContain(`marker-${kind}-${part}`);
    expect(kept).toContain('lantern');
  });

  it('leaves out pictures the journey screen does not draw', () => {
    expect(kept).not.toContain('keepsake-first-step');
  });
});

describe('the engine offers only ladders the plugin draws', () => {
  it('every ladder, marker and hue of the engine is in the bundled pictures', () => {
    for (const name of Object.keys(LADDERS.ladders)) expect(Object.keys(ladders)).toContain(name);
    expect(Object.keys(kinds).sort()).toEqual(Object.keys(LADDERS.markers).sort());
    expect(Object.keys(palette).sort()).toEqual([...LADDERS.hues].sort());
  });
});
