// Screenshots of the preview at phone (360 × 720) and desktop (1000 × 700)
// size, light and dark, into dist/screenshots/. Uses the Playwright that
// the cloud environment provides (docs/development.md, preview).
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = join('dist', 'screenshots');
mkdirSync(out, { recursive: true });
const page = pathToFileURL(resolve('dist', 'preview', 'index.html')).href;
const artPage = pathToFileURL(resolve('dist', 'preview', 'art.html')).href;
const scale = Number(process.argv[3] ?? 1);
const shots = (process.argv[2] ?? 'welcome,empty,journey,met,unbound,build,build-ready').split(',');
const sizes = [
  ['phone', 360, 720],
  ['desktop', 1000, 700],
];

const browser = await chromium.launch();
for (const demo of shots) {
  // The ladders' pages (#42): sequences and the palette on one wide full
  // page, the journey mock at phone size; `@<hue>` picks a palette hue.
  const [, part = ''] = demo.split(':');
  const ladderPage = /^(sequence-|palette)/.test(part);
  const sizesHere = ladderPage
    ? [['wide', 1400, 900]]
    : part.startsWith('journey-')
      ? sizes.slice(0, 1)
      : sizes;
  for (const theme of ['light', 'dark']) {
    for (const [name, width, height] of sizesHere) {
      const tab = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
      const [, full] = demo.split(':');
      const [route, hue] = (full ?? '').split('@');
      // `art` and `art:more` are the pictures' page (preview/art.ts), without the view.
      const art = demo.startsWith('art');
      await tab.goto(
        art
          ? `${artPage}?theme=${theme}&part=${route || 'sizes'}${hue ? `&hue=${hue}` : ''}`
          : `${page}?demo=${demo.split(':')[0]}&theme=${theme}`,
      );
      const frame = art ? tab.locator(':root') : tab.frameLocator('#view');
      await frame
        .locator(art ? 'svg.qa-art' : '.qa-header')
        .first()
        .waitFor();
      if (route && !art) await frame.getByRole('button', { name: route }).first().click();
      await tab.waitForTimeout(200);
      const file = join(out, `${demo.replace(/[:@]/g, '-')}-${theme}-${name}.png`);
      await tab.screenshot({ path: file, fullPage: ladderPage });
      const overflow = await frame.locator('body').evaluate((b) => b.scrollWidth > b.clientWidth);
      console.log(`${file}${overflow ? '  HORIZONTAL OVERFLOW' : ''}`);
      await tab.close();
    }
  }
}
await browser.close();
