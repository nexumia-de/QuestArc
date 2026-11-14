import style from 'virtual:questarc-style';

import { uiTextsIn } from '../shared/languages';
import type { ContentPack } from '../shared/protocol';
import { language } from '../shared/texts';
import { artPackIn } from './art-pack';

/**
 * What plugin.js carries for the view, because the view's index.html is
 * limited to 100 KB in Super Productivity 19.3
 * (docs/decisions/one-build-for-older-versions.md): the UI texts in the
 * current language, the style and the ladders' pictures. Sent on
 * `questarc:content`: once, and again after the language changed.
 */
export const contentPack = (): ContentPack => ({
  language: language(),
  texts: uiTextsIn(language()),
  style,
  art: artPackIn(),
});
