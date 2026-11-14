import type { ContentPack } from '../shared/protocol';
import { addTexts } from '../shared/texts';
import { setArt } from './art-store';

/**
 * Takes in what plugin.js sends once (`questarc:content`): the UI texts,
 * the style and the ladders' pictures. The view's index.html holds only
 * its start state (start.css and the texts of load-error.ts); the screens
 * are drawn after this.
 */
export const applyContent = (pack: ContentPack, doc: Document = document): void => {
  addTexts(pack.texts);
  setArt(pack.art);
  const style = doc.createElement('style');
  style.textContent = pack.style;
  doc.head.append(style);
};
