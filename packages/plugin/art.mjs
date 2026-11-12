// The module `virtual:questarc-art`: every picture (`<name>.svg`), scene
// (`<name>.scene.json`), ladder (`<name>.ladder.json`) and the palette in
// content/art/ as text and data
// (docs/decisions/shared-pictures.md). Used by esbuild in preview.mjs;
// typed in src/virtual-art.d.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', '..', 'content', 'art');

const source = () => {
  const files = readdirSync(dir).sort();
  const pictures = Object.fromEntries(
    files
      .filter((file) => file.endsWith('.svg'))
      .map((file) => [file.slice(0, -4), readFileSync(join(dir, file), 'utf8')]),
  );
  const scenes = Object.fromEntries(
    files
      .filter((file) => file.endsWith('.scene.json'))
      .map((file) => [
        file.slice(0, -'.scene.json'.length),
        JSON.parse(readFileSync(join(dir, file), 'utf8')),
      ]),
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
  return [
    `export const pictures = ${JSON.stringify(pictures)};`,
    `export const scenes = ${JSON.stringify(scenes)};`,
    `export const ladders = ${JSON.stringify(ladders)};`,
    `export const palette = ${JSON.stringify(palette)};`,
  ].join('\n');
};

export const esbuildArt = {
  name: 'questarc-art',
  setup(build) {
    build.onResolve({ filter: /^virtual:questarc-art$/ }, () => ({
      path: 'virtual:questarc-art',
      namespace: 'questarc-art',
    }));
    build.onLoad({ filter: /.*/, namespace: 'questarc-art' }, () => ({
      contents: source(),
      loader: 'js',
      watchDirs: [dir],
    }));
  },
};
