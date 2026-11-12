// The module `virtual:questarc-art`: every picture (`<name>.svg`) and scene
// (`<name>.scene.json`) in content/art/ as text and data
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
  return `export const pictures = ${JSON.stringify(pictures)};\nexport const scenes = ${JSON.stringify(scenes)};`;
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
