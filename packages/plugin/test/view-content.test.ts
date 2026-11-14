import startTexts from 'virtual:questarc-start-texts';
import { describe, expect, it } from 'vitest';

import german from '../../../content/i18n/de.json';
import english from '../../../content/i18n/en.json';
import { artPack } from '@questarc/ui/adapter/art-pack';
import { contentPack } from '../src/adapter/content-pack';
import { createBrain } from '@questarc/ui/adapter/brain';
import { handleMessage } from '../src/adapter/messages';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { hasText, language, t } from '@questarc/ui/shared/texts';
import { applyContent } from '../src/ui/content';
import { art } from '@questarc/ui/ui/art-store';
import { createFakeHost } from '@questarc/ui/testing/fake-host';

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
    expect(pack).toEqual(contentPack());
    expect(contentPack().language).toBe('en');
    expect(contentPack().texts).toEqual(english);
    expect(contentPack().style).toContain('.qa-header{');
    expect(contentPack().style).not.toMatch(/\n\s/);
    // the titles of content/art are the English texts
    expect(contentPack().art).toEqual(artPack);
    expect(Object.keys(artPack.ladders).sort()).toEqual(['crossing', 'home']);
    expect(artPack.pictures['build-home-3']).toContain('<svg');
    expect(artPack.pictures['keepsake-first-step']).toBeUndefined();
  });

  it('keeps the texts of the start state in the view, taken from content/i18n', () => {
    const all: Record<string, Record<string, string>> = { en: english, de: german };
    expect(Object.keys(startTexts).sort()).toEqual(['de', 'en']);
    for (const [language, texts] of Object.entries(startTexts)) {
      expect(Object.keys(texts).sort()).toEqual([
        'ui.error.details',
        'ui.error.failed',
        'ui.error.not-running',
        'ui.error.starting',
      ]);
      for (const [key, text] of Object.entries(texts)) expect(text).toBe(all[language]?.[key]);
    }
  });

  it('is taken in by the view: texts, pictures and one style element', () => {
    const added: { textContent: string }[] = [];
    const doc = {
      documentElement: { lang: 'en' },
      createElement: () => {
        const el = { textContent: '', remove: () => added.splice(added.indexOf(el), 1) };
        return el;
      },
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
    expect(language()).toBe('en');

    // Again in another language (#39): the texts and the style are replaced.
    applyContent(
      { language: 'de', texts: { 'ui.test.de': 'Von plugin.js' }, style: 'q{}', art: artPack },
      doc,
    );
    expect(language()).toBe('de');
    expect(doc.documentElement.lang).toBe('de');
    expect(hasText('ui.test.only-here')).toBe(false);
    expect(t('ui.test.de')).toBe('Von plugin.js');
    expect(added.map((el) => el.textContent)).toEqual(['q{}']);
  });
});
