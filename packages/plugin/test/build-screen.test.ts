import { LADDERS } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import crossing from '../../../content/art/crossing.ladder.json';
import home from '../../../content/art/home.ladder.json';
import markers from '../../../content/art/markers.json';
import palette from '../../../content/art/palette.json';
// @ts-expect-error: a plain build script without types
import { ladderArt } from '../art.mjs';
import { createSidePanel } from '../src/adapter/side-panel';
import { isRequest } from '../src/shared/protocol';

// The journey screen with the build (#100): what the plugin bundles, that
// the engine's list and the pictures name the same things, and the side
// panel setting. Every named picture exists: the ladder checker
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

describe('the side panel setting (this device only)', () => {
  const fakeStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => void values.set(k, v),
    };
  };

  it('is off by default and registers no button', () => {
    const calls: unknown[] = [];
    const panel = createSidePanel(
      { registerSidePanelButton: (c) => void calls.push(c) },
      fakeStorage(),
    );
    expect(panel.on).toBe(false);
    expect(calls).toEqual([]);
  });

  it('on: registers the button once, and again at the next start', () => {
    const storage = fakeStorage();
    const calls: unknown[] = [];
    const api = { registerSidePanelButton: (c: unknown) => void calls.push(c) };
    const panel = createSidePanel(api, storage);
    panel.set(true);
    panel.set(false);
    panel.set(true);
    expect(calls).toHaveLength(1);
    expect(createSidePanel(api, storage).on).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('off is kept for the next start, when no button is registered', () => {
    const storage = fakeStorage();
    const calls: unknown[] = [];
    const api = { registerSidePanelButton: (c: unknown) => void calls.push(c) };
    createSidePanel(api, storage).set(false);
    expect(createSidePanel(api, storage).on).toBe(false);
    expect(calls).toEqual([]);
  });

  it('works without storage (blocked): off', () => {
    expect(createSidePanel({ registerSidePanelButton: () => undefined }, undefined).on).toBe(false);
  });

  it('is a request only with a yes or no', () => {
    expect(isRequest({ type: 'questarc:side-panel', on: true })).toBe(true);
    expect(isRequest({ type: 'questarc:side-panel', on: 'yes' })).toBe(false);
    expect(isRequest({ type: 'questarc:side-panel' })).toBe(false);
  });
});
