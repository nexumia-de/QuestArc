import style from 'virtual:questarc-style';

import { uiTexts } from '../shared/english';
import type { ContentPack } from '../shared/protocol';
import { artPack } from './art-pack';

/**
 * What plugin.js carries for the view, because the view's index.html is
 * limited to 100 KB in Super Productivity 19.3
 * (docs/decisions/one-build-for-older-versions.md): the UI texts, the
 * style and the ladders' pictures. Sent once, on `questarc:content`.
 */
export const contentPack: ContentPack = { texts: uiTexts, style, art: artPack };
