// The module `virtual:questarc-art`: every picture (`<name>.svg`) and ladder
// (`<name>.ladder.json`), the markers and the palette in content/art/ as
// text and data
// (docs/decisions/shared-pictures.md). Used by esbuild in preview.mjs;
// typed in src/virtual-art.d.ts. The plugin itself bundles only what the
// journey screen draws (`ladderArt`, docs/journey-design.md, "The journey
// screen with the build"): the same module shape with fewer pictures.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', '..', 'content', 'art');

const read = () => {
  const files = readdirSync(dir).sort();
  const pictures = Object.fromEntries(
    files
      .filter((file) => file.endsWith('.svg'))
      .map((file) => [file.slice(0, -4), readFileSync(join(dir, file), 'utf8')]),
  );
  const ladders = Object.fromEntries(
    files
      .filter((file) => file.endsWith('.ladder.json'))
      .map((file) => [
        file.slice(0, -'.ladder.json'.length),
        JSON.parse(readFileSync(join(dir, file), 'utf8')),
      ]),
  );
  const palette = JSON.parse(readFileSync(join(dir, 'palette.json'), 'utf8'));
  const markers = JSON.parse(readFileSync(join(dir, 'markers.json'), 'utf8'));
  return { pictures, ladders, palette, markers };
};

/** The names of the pictures the journey screen and the build page draw. */
export const ladderArt = ({ ladders, markers }) => {
  const names = new Set(['lantern']);
  for (const ladder of Object.values(ladders)) {
    for (const version of ladder.versions) names.add(version.art);
    for (const place of ladder.pictures) if (place.art) names.add(place.art);
  }
  for (const kind of Object.keys(markers))
    for (const part of ['post', 'bead', 'bead-lit']) names.add(`marker-${kind}-${part}`);
  return names;
};

const source = (only) => {
  const { pictures, ladders, palette, markers } = read();
  const kept = only ? ladderArt(read()) : undefined;
  return [
    `export const pictures = ${JSON.stringify(
      kept
        ? Object.fromEntries(Object.entries(pictures).filter(([name]) => kept.has(name)))
        : pictures,
    )};`,
    `export const ladders = ${JSON.stringify(ladders)};`,
    `export const palette = ${JSON.stringify(palette)};`,
    `export const markers = ${JSON.stringify(markers)};`,
  ].join('\n');
};

const plugin = (only) => ({
  name: only ? 'questarc-ladder-art' : 'questarc-art',
  setup(build) {
    build.onResolve({ filter: /^virtual:questarc-art$/ }, () => ({
      path: 'virtual:questarc-art',
      namespace: 'questarc-art',
    }));
    build.onLoad({ filter: /.*/, namespace: 'questarc-art' }, () => ({
      contents: source(only),
      loader: 'js',
      watchDirs: [dir],
    }));
  },
});

/** Every picture: the preview pages. */
export const esbuildArt = plugin(false);
/** Only what the journey screen draws: the plugin. */
export const esbuildLadderArt = plugin(true);

/** The same module for Vitest (vitest.config.ts): only what the plugin bundles. */
export const viteLadderArt = {
  name: 'questarc-ladder-art',
  resolveId: (id) => (id === 'virtual:questarc-art' ? '\0virtual:questarc-art' : undefined),
  load: (id) => (id === '\0virtual:questarc-art' ? source(true) : undefined),
};
