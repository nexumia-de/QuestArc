import english from '../../../../content/i18n/en.json';

import { addTexts } from './texts';

/**
 * The UI and event texts of content/i18n/en.json, for plugin.js: it uses
 * them itself and sends them to the view (`questarc:content`). Never
 * imported by the view's own modules (src/ui/), or every text would be
 * in index.html again; build.mjs fails then.
 */
export const uiTexts: Readonly<Record<string, string>> = english;
addTexts(uiTexts);
