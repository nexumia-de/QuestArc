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

// The view is minified: Super Productivity 19.3.1 refuses an index.html
// over 100 KiB (it checks it against MAX_PLUGIN_MANIFEST_SIZE; the 1 MiB
// limit is unreleased, docs/super-productivity-facts.md §1).
const MAX_INDEX_HTML = 100 * 1024;
const view = await build({
  ...common,
  plugins: [esbuildJourneys],
  entryPoints: ['src/ui/main.ts'],
  write: false,
  minify: true,
});
const script = view.outputFiles[0].text.replaceAll('</script', '<\\/script');
const style = (
  await transform(readFileSync('src/ui/style.css', 'utf8'), { loader: 'css', minify: true })
).code;
const html = readFileSync('src/ui/index.html', 'utf8')
  .replace('<!-- QUESTARC_STYLE -->', () => `<style>\n${style}</style>`)
  .replace('<!-- QUESTARC_SCRIPT -->', () => `<script>\n${script}</script>`);
writeFileSync(join(files, 'index.html'), html);
const htmlBytes = Buffer.byteLength(html);
if (htmlBytes > MAX_INDEX_HTML) {
  throw new Error(
    `index.html is ${htmlBytes} bytes; Super Productivity 19.3.1 takes at most ${MAX_INDEX_HTML}`,
  );
}

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
