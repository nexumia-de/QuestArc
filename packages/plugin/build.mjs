// Builds the plugin into dist/ and packs dist/questarc-<version>.zip:
// plugin.js (classic script, run by Super Productivity via new Function),
// index.html with the view's script inlined (iframe plugins get no other
// files), manifest.json and icon.svg.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { zipSync } from 'fflate';

const out = 'dist';
const files = join(out, 'plugin');
rmSync(out, { recursive: true, force: true });
mkdirSync(files, { recursive: true });

const common = { bundle: true, format: 'iife', target: 'es2022', legalComments: 'none' };

await build({ ...common, entryPoints: ['src/plugin.ts'], outfile: join(files, 'plugin.js') });

const view = await build({ ...common, entryPoints: ['src/ui/main.ts'], write: false });
const script = view.outputFiles[0].text.replaceAll('</script', '<\\/script');
const html = readFileSync('src/ui/index.html', 'utf8').replace(
  '<!-- QUESTARC_SCRIPT -->',
  () => `<script>\n${script}</script>`,
);
writeFileSync(join(files, 'index.html'), html);

for (const name of ['manifest.json', 'icon.svg'])
  copyFileSync(join('src', name), join(files, name));

const { version } = JSON.parse(readFileSync('src/manifest.json', 'utf8'));
const entries = Object.fromEntries(
  ['manifest.json', 'plugin.js', 'index.html', 'icon.svg'].map((name) => [
    name,
    readFileSync(join(files, name)),
  ]),
);
const zipPath = join(out, `questarc-${version}.zip`);
writeFileSync(zipPath, zipSync(entries, { level: 9, mtime: new Date('2026-01-01T00:00:00Z') }));
console.log(`Packed ${zipPath}`);
