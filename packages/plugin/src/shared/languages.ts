import { pickLanguage, textsIn, type Journey, type TextTables } from '@questarc/engine';

import german from '../../../../content/i18n/de.json';
import english from '../../../../content/i18n/en.json';

import { addJourneyTexts, language, setLanguage } from './texts';

/**
 * The UI and event texts of content/i18n in every language, for
 * plugin.js: it uses them itself and sends the ones of the current
 * language to the view (`questarc:content`). Never imported by the
 * view's own modules (src/ui/), or every text would be in index.html
 * again; build.mjs fails then.
 */
export const UI_TEXTS: TextTables = { en: english, de: german };

/** The app's texts in `name`, English behind every missing key. */
export const uiTextsIn = (name: string): Readonly<Record<string, string>> =>
  textsIn(UI_TEXTS, name);

/**
 * Shows the texts in the language of the host's `locale` ("de",
 * "de-AT"; anything else is English) and returns it. `journeys` are the
 * ones whose texts are held, added again in that language.
 */
export const useLanguage = (locale: unknown, journeys: readonly Journey[] = []): string => {
  const next = pickLanguage(locale, Object.keys(UI_TEXTS));
  setLanguage(next, uiTextsIn(next));
  addJourneyTexts(journeys);
  return language();
};

useLanguage(undefined);
