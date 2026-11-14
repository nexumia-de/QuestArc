import { ladders, markers, palette, pictures } from 'virtual:questarc-art';

import type { ArtPack } from '../shared/protocol';
import { hasText, t } from '../shared/texts';
import type { LadderVersion } from '../ui/ladder';

/** The ladders' pictures plugin.js carries for the view (#100), titles as content/art has them. */
export const artPack: ArtPack = { pictures, ladders, palette, markers };

const titled = <T extends { readonly title: string }>(
  all: Readonly<Record<string, T>>,
  key: (name: string) => string,
  more: (name: string, each: T) => Partial<T> = () => ({}),
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(all).map(([name, each]) => [
      name,
      { ...each, title: hasText(key(name)) ? t(key(name)) : each.title, ...more(name, each) },
    ]),
  );

/**
 * The same with the titles of ladders, versions, markers and hues in
 * the current language (`ui.art.*` in content/i18n, issue #39); a title
 * without a text stays as content/art has it.
 */
export const artPackIn = (): ArtPack => ({
  pictures,
  ladders: titled(
    ladders,
    (name) => `ui.art.ladder.${name}`,
    (name, ladder) => ({
      versions: ladder.versions.map((version: LadderVersion, i: number) => {
        const key = `ui.art.ladder.${name}.${i + 1}`;
        return { ...version, title: hasText(key) ? t(key) : version.title };
      }),
    }),
  ),
  palette: titled(palette, (name) => `ui.art.hue.${name}`),
  markers: titled(markers, (name) => `ui.art.marker.${name}`),
});
