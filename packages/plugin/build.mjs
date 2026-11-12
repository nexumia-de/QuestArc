// Builds the plugin into dist/ and packs dist/questarc-<version>.zip:
// plugin.js (classic script, run by Super Productivity via new Function),
// index.html with the view's script and style inlined (iframe plugins get no other
// files) and manifest.json. The icon is Material's "route", named in the
// manifest: Super Productivity uses a name without a file as a Material icon.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build, transform } from 'esbuild';
import { zipSync } from 'fflate';
import { esbuildLadderArt } from './art.mjs';
import { esbuildJourneys } from './journeys.mjs';

const out = 'dist';
const files = join(out, 'plugin');
rmSync(out, { recursive: true, force: true });
mkdirSync(files, { recursive: true });

const common = {
  bundle: true,
  format: 'iife',
  target: 'es2022',
  legalComments: 'none',
  plugins: [esbuildJourneys, esbuildLadderArt],
};

await build({ ...common, entryPoints: ['src/plugin.ts'], outfile: join(files, 'plugin.js') });

// The view's script and style without whitespace, names kept readable:
// Super Productivity 19.3 installs an index.html of at most 100 KB (below).
const view = await build({
  ...common,
  // the pictures come from plugin.js (questarc:art), not inlined
  plugins: [esbuildJourneys],
  entryPoints: ['src/ui/main.ts'],
  write: false,
  minifyWhitespace: true,
});
const script = view.outputFiles[0].text.replaceAll('</script', '<\\/script');
const { code: style } = await transform(readFileSync('src/ui/style.css', 'utf8'), {
  loader: 'css',
  minifyWhitespace: true,
});
const html = readFileSync('src/ui/index.html', 'utf8')
  .replace('<!-- QUESTARC_STYLE -->', () => `<style>\n${style}</style>`)
  .replace('<!-- QUESTARC_SCRIPT -->', () => `<script>\n${script}</script>`);
writeFileSync(join(files, 'index.html'), html);

// Super Productivity 19.3.x (minSupVersion) refuses an index.html above
// 100 KB (102,400 bytes) at install; later versions allow 1 MB
// (docs/super-productivity-facts.md §1). One build serves all supported
// versions, so the oldest limit holds; what does not fit travels in
// plugin.js by message (docs/decisions/one-build-for-older-versions.md).
// Fail here instead of in the real app.
const INDEX_HTML_LIMIT = 102_400;
const indexBytes = Buffer.byteLength(html);
if (indexBytes > INDEX_HTML_LIMIT) {
  throw new Error(
    `index.html is ${indexBytes} bytes; Super Productivity 19.3 installs at most ${INDEX_HTML_LIMIT}`,
  );
}
console.log(`index.html: ${indexBytes} of ${INDEX_HTML_LIMIT} bytes`);

copyFileSync(join('src', 'manifest.json'), join(files, 'manifest.json'));

const { version } = JSON.parse(readFileSync('src/manifest.json', 'utf8'));
const entries = Object.fromEntries(
  ['manifest.json', 'plugin.js', 'index.html'].map((name) => [
    name,
    readFileSync(join(files, name)),
  ]),
);
const zipPath = join(out, `questarc-${version}.zip`);
writeFileSync(zipPath, zipSync(entries, { level: 9, mtime: new Date('2026-01-01T00:00:00Z') }));
console.log(`Packed ${zipPath}`);
