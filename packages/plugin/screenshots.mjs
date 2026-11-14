// Screenshots of the preview at phone (360 × 720) and desktop (1000 × 700)
// size, light and dark, into dist/screenshots/. Uses the Playwright that
// the cloud environment provides (docs/development.md, preview).
// node screenshots.mjs [demos] [scale] [language]: the language is the
// one Super Productivity would report (`de`: files end in `-de`). Each
// file is followed by what a person would otherwise look for: a page
// wider than its window, text cut off in its box, and buttons, links
// and fields smaller than 44 px.
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
const lang = process.argv[4] ?? 'en';

/* global document, getComputedStyle -- layoutProblems runs in the page */
/** Runs in the page: text cut off in its box, and targets smaller than 44 px. */
const layoutProblems = () => {
  const shown = (el) => {
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const words = (el) => (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const cut = [...document.querySelectorAll('body *')]
    .filter((el) => shown(el) && el.childElementCount === 0 && words(el) !== '')
    .filter((el) => {
      const style = getComputedStyle(el);
      const clipped = style.overflowX !== 'visible' || style.textOverflow === 'ellipsis';
      return clipped && el.scrollWidth > el.clientWidth + 1;
    })
    .map((el) => `cut off: "${words(el)}"`);
  const small = [...document.querySelectorAll('button, a[href], select, input:not([type=hidden])')]
    .filter(shown)
    .map((el) => (/^(radio|checkbox)$/.test(el.type) ? (el.closest('label') ?? el) : el))
    .filter((el) => {
      const box = el.getBoundingClientRect();
      return box.height < 43.5 || box.width < 43.5;
    })
    .map((el) => {
      const box = el.getBoundingClientRect();
      return `smaller than 44 px (${Math.round(box.width)} × ${Math.round(box.height)}): "${words(el) || el.getAttribute('aria-label') || el.tagName}"`;
    });
  return [...new Set([...cut, ...small])];
};
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
          : `${page}?demo=${demo.split(':')[0]}&theme=${theme}&lang=${lang}`,
      );
      const frame = art ? tab.locator(':root') : tab.frameLocator('#view');
      await frame
        .locator(art ? 'svg.qa-art' : '.qa-header')
        .first()
        .waitFor();
      // `demo:Menu>Shelf` clicks the button or menu item of each name in turn.
      for (const click of route && !art ? route.split('>') : []) {
        await frame
          .getByRole('button', { name: click })
          .or(frame.getByRole('menuitem', { name: click }))
          .first()
          .click();
        await tab.waitForTimeout(100);
      }
      await tab.waitForTimeout(200);
      const file = join(
        out,
        `${demo.replace(/[:@>]/g, '-').replaceAll(' ', '_')}-${theme}-${name}${lang === 'en' ? '' : `-${lang}`}.png`,
      );
      await tab.screenshot({ path: file, fullPage: ladderPage });
      const overflow = await frame.locator('body').evaluate((b) => b.scrollWidth > b.clientWidth);
      console.log(`${file}${overflow ? '  HORIZONTAL OVERFLOW' : ''}`);
      if (!art)
        for (const problem of await frame.locator('body').evaluate(layoutProblems))
          console.log(`  ${problem}`);
      await tab.close();
    }
  }
}
await browser.close();
