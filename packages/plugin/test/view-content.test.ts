import startTexts from 'virtual:questarc-start-texts';
import { describe, expect, it } from 'vitest';

import english from '../../../content/i18n/en.json';
import { artPack } from '../src/adapter/art-pack';
import { contentPack } from '../src/adapter/content-pack';
import { createBrain } from '../src/adapter/brain';
import { handleMessage } from '../src/adapter/messages';
import { builtInJourneys } from '../src/shared/content';
import { hasText, t } from '../src/shared/texts';
import { applyContent } from '../src/ui/content';
import { art } from '../src/ui/art-store';
import { createFakeHost } from './fake-host';

// What the view does not carry itself comes from plugin.js once
// (docs/decisions/one-build-for-older-versions.md, docs/plugin-adapter.md).
describe('the content for the view (#102)', () => {
  it('is sent on request: every UI text, the style and only the ladders’ pictures', async () => {
    const brain = createBrain({
      api: createFakeHost().api,
      journeys: builtInJourneys,
      onEvents: () => undefined,
    });
    const pack = await handleMessage(brain, { type: 'questarc:content' });
    brain.stop();
    expect(pack).toBe(contentPack);
    expect(contentPack.texts).toEqual(english);
    expect(contentPack.style).toContain('.qa-header{');
    expect(contentPack.style).not.toMatch(/\n\s/);
    expect(contentPack.art).toBe(artPack);
    expect(Object.keys(artPack.ladders).sort()).toEqual(['crossing', 'home']);
    expect(artPack.pictures['build-home-3']).toContain('<svg');
    expect(artPack.pictures['keepsake-first-step']).toBeUndefined();
  });

  it('keeps the texts of the start state in the view, taken from en.json', () => {
    const all: Record<string, string> = english;
    expect(Object.keys(startTexts).sort()).toEqual([
      'ui.error.details',
      'ui.error.failed',
      'ui.error.not-running',
      'ui.error.starting',
    ]);
    for (const [key, text] of Object.entries(startTexts)) expect(text).toBe(all[key]);
  });

  it('is taken in by the view: texts, pictures and one style element', () => {
    const added: { textContent: string }[] = [];
    const doc = {
      createElement: () => ({ textContent: '' }),
      head: { append: (el: { textContent: string }) => added.push(el) },
    } as unknown as Document;
    applyContent(
      { texts: { 'ui.test.only-here': 'Sent by plugin.js' }, style: 'p{}', art: artPack },
      doc,
    );
    expect(hasText('ui.test.only-here')).toBe(true);
    expect(t('ui.test.only-here')).toBe('Sent by plugin.js');
    expect(art()).toBe(artPack);
    expect(added.map((el) => el.textContent)).toEqual(['p{}']);
  });
});
