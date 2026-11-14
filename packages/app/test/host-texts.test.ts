import { describe, expect, it } from 'vitest';

import german from '../../../content/i18n/de.json';
import english from '../../../content/i18n/en.json';
import { hostTexts } from '../src/host-texts';

const originals: Record<string, Record<string, string>> = { en: english, de: german };
const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{[^}]+\}/g)].map((m) => m[0]).sort();

describe('the host-naming texts of the app', () => {
  it('override keys that exist in content/i18n, in both languages alike', () => {
    expect(Object.keys(hostTexts).sort()).toEqual(['de', 'en']);
    expect(Object.keys(hostTexts.de ?? {}).sort()).toEqual(Object.keys(hostTexts.en ?? {}).sort());
    for (const [lang, texts] of Object.entries(hostTexts)) {
      for (const key of Object.keys(texts)) {
        expect(originals[lang], `${lang} has ${key}`).toHaveProperty(key);
      }
    }
  });

  it('keep the placeholders of the originals', () => {
    for (const [lang, texts] of Object.entries(hostTexts)) {
      for (const [key, text] of Object.entries(texts)) {
        expect(placeholders(text), `${lang} ${key}`).toEqual(
          placeholders(originals[lang]?.[key] ?? ''),
        );
      }
    }
  });

  it('no longer send the user to a task list or to Super Productivity', () => {
    for (const texts of Object.values(hostTexts)) {
      for (const text of Object.values(texts))
        expect(text).not.toMatch(/task list|Aufgabenliste|Super Productivity/);
    }
  });
});
