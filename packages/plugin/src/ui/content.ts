import type { ContentPack } from '../shared/protocol';
import { language, setLanguage } from '../shared/texts';
import { setArt } from './art-store';

/**
 * Takes in what plugin.js sends once (`questarc:content`): the UI texts,
 * the style and the ladders' pictures. The view's index.html holds only
 * its start state (start.css and the texts of load-error.ts); the screens
 * are drawn after this. It comes again when the language changed (#39):
 * the texts are replaced, and so is the style element.
 */
let sheet: HTMLElement | undefined;

export const applyContent = (pack: ContentPack, doc: Document = document): void => {
  setLanguage(pack.language ?? 'en', pack.texts);
  if (doc.documentElement) doc.documentElement.lang = language();
  setArt(pack.art);
  sheet?.remove();
  sheet = doc.createElement('style');
  sheet.textContent = pack.style;
  doc.head.append(sheet);
};
