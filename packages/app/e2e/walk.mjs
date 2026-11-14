// Walks the built standalone app (#93) in a fresh browser profile: start
// a journey, create its task, tick it off on three logical days
// (Playwright's clock sets the date), see the build, the welcome back
// and the weekly look back; reload and go offline in between; export the
// dataset and import it again. Writes screenshots and the exported
// backup to dist/walk/ (sp-import.mjs takes the backup from there) and
// the start time under a slowed CPU.
//
//   node e2e/walk.mjs [width height]
/* global document, innerWidth, indexedDB -- in functions the page runs */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, launch, serve } from './serve.mjs';

const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
const OUT = resolve('dist', 'walk');
mkdirSync(OUT, { recursive: true });
const DAY_MS = 86_400_000;
const first = new Date('2026-03-02T08:00:00');
const TASK = 'Getting up: drink a glass of water';

const site = await serve();
const browser = await launch();
const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
const page = await context.newPage();
await page.clock.install({ time: first });
page.on('pageerror', (error) => console.log('page error:', error.message));

// Every request after the first load must be answered by the service worker.
let loaded = false;
const fromNetwork = [];
page.on('response', (response) => {
  if (loaded && !response.fromServiceWorker()) fromNetwork.push(response.url());
});

const shot = (name) => page.screenshot({ path: join(OUT, `${width}-${name}.png`) });
const tab = (name) => page.locator('.app-tabs').getByRole('button', { name, exact: true }).click();
const journey = page.locator('.app-view').nth(1);
const habit = () => page.getByRole('checkbox', { name: TASK });
const isTicked = (ticked) => page.locator(`.app-habit[aria-checked=${ticked}]`).waitFor();
const message = () => page.locator('.app-message').innerText();
const open = async () => {
  await page.goto(site.url, { waitUntil: 'load' });
  await page.locator('.app-tabs').waitFor();
};
const noOverflow = async (where) => {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(!wide, `no horizontal scrolling ${where}`);
};
/** Ticks today's habit off and returns the message that follows. */
const tick = async () => {
  await tab('Today');
  await habit().click();
  await isTicked(true);
  await page.locator('.app-message:not([hidden])').waitFor();
  return message();
};
/** The dataset as the app keeps it in IndexedDB. */
const stored = () =>
  page.evaluate(
    () =>
      new Promise((done, failed) => {
        const request = indexedDB.open('questarc');
        request.onerror = () => failed(request.error);
        request.onsuccess = () => {
          const get = request.result.transaction('dataset').objectStore('dataset').get('current');
          get.onsuccess = () => done(get.result);
          get.onerror = () => failed(get.error);
        };
      }),
  );

try {
  await open();
  await page.evaluate(() => navigator.serviceWorker.ready);
  expect(
    (await page.locator('main').first().innerText()).includes('Nothing is due'),
    'empty Today',
  );
  await noOverflow('on Today');
  await shot('0-today-empty');
  loaded = true;

  // Start a journey; "Create the task" makes the recurring task itself.
  await page.getByRole('button', { name: 'Open the Journey' }).click();
  await journey.getByRole('button', { name: 'Choose a journey' }).click();
  await journey.getByRole('button', { name: /A gentle morning/ }).click();
  await journey.getByRole('button', { name: 'Start this journey' }).click();
  await journey.locator('#qa-why').fill('Calmer mornings');
  await shot('1-start');
  await journey.getByRole('button', { name: 'Start', exact: true }).click();
  await journey.getByRole('button', { name: 'Create the task' }).click();
  await habit().waitFor();
  await isTicked(false);
  const made = await stored();
  const [cfgId] = made.taskRepeatCfg.ids;
  expect(
    made.task.ids[0] === `rpt_${cfgId}_2026-03-02` &&
      made.taskRepeatCfg.entities[cfgId].repeatCycle === 'DAILY',
    'the app created the repeat config and its instance rpt_<cfgId>_<day>',
  );
  await shot('2-today');

  // Day 1: tick, undo, tick again.
  const one = await tick();
  expect(one.startsWith('Drink a glass of water: done. 1 of 5 days.'), `day 1: ${one}`);
  await habit().click();
  await isTicked(false);
  await tab('Journey');
  await journey.locator('.qa-station-card').waitFor();
  expect(
    (await journey.locator('.qa-station-card').innerText()).includes('0 of 5 days'),
    'a second tap undoes the tick, and the journey forgets it',
  );
  await tick();
  await page.locator('.app-message').getByRole('button', { name: 'Show' }).click();
  const card = await journey.locator('.qa-station-card').innerText();
  expect(
    card.includes('1 of 5 days') && card.includes('Calmer mornings'),
    'Show opens the journey',
  );
  expect((await journey.locator('.qa-build').count()) === 1, 'the journey shows its build');
  await noOverflow('on the journey');
  await shot('3-journey-day-1');

  // Offline from here on: the reloads below get every file from the cache.
  await context.setOffline(true);

  // Day 2.
  await page.clock.setSystemTime(new Date(first.getTime() + DAY_MS));
  await open();
  await isTicked(false);
  const two = await tick();
  expect(two.includes('2 of 5 days'), `day 2, offline: ${two}`);

  // Day 3 is nine days later: a gap, and the weekly look back is due.
  await page.clock.setSystemTime(new Date(first.getTime() + 10 * DAY_MS));
  await open();
  const three = await tick();
  expect(three.includes('Welcome back'), `after a gap: ${three}`);
  await shot('4-today-welcome-back');
  await tab('Journey');
  await journey.getByRole('button', { name: 'Answer' }).click();
  expect(
    (await journey.locator('.qa-title').innerText()) === 'Weekly look back',
    'the weekly look back opens',
  );
  await shot('5-look-back');
  await journey.locator('.qa-header button').first().click();
  const after = await journey.locator('.qa-station-card').innerText();
  expect(
    after.includes('1 of 5 days in the last 7 due days'),
    `the engine counts the days in its window (${after.split('\n')[4]})`,
  );
  await shot('6-journey-day-3');
  expect(fromNetwork.length === 0, `no request left the page (${fromNetwork.join(', ')})`);

  // Export, then import the file into the same app: nothing changes.
  await tab('Data');
  await noOverflow('on Data');
  await shot('7-data');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export a Backup' }).click(),
  ]);
  const file = join(OUT, `backup-${width}.json`);
  await download.saveAs(file);
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  expect(
    backup.crossModelVersion === 4.5 && backup.data.task.ids.length === 3,
    'the export is a CompleteBackup with the three instances',
  );
  writeFileSync(
    join(OUT, `expect-${width}.json`),
    JSON.stringify({
      journey: 'A gentle morning',
      card: '1 of 5 days in the last 7 due days',
      why: 'Calmer mornings',
    }),
  );
  await page.locator('input[type=file]').setInputFiles(file);
  await page.locator('.app-message:not([hidden])').waitFor();
  expect((await message()).startsWith('Backup imported.'), 'the export imports again');
  expect(
    JSON.stringify(await stored()) === JSON.stringify(backup.data),
    'the imported dataset is the exported one',
  );
  await tab('Journey');
  expect(
    (await journey.locator('.qa-station-card').innerText()) === after,
    'the journey is as before the import',
  );

  // Start time with the CPU slowed four times, as on a mid-range phone:
  // a second profile with the real clock (the faked one also fakes the
  // timing) and the same data, loaded from the service worker's cache.
  const phone = await browser.newPage({ viewport: { width, height } });
  await phone.goto(site.url, { waitUntil: 'load' });
  await phone.evaluate(() => navigator.serviceWorker.ready);
  await phone.locator('.app-tabs').getByRole('button', { name: 'Data' }).click();
  await phone.locator('input[type=file]').setInputFiles(file);
  await phone.locator('.app-message:not([hidden])').waitFor();
  const cdp = await phone.context().newCDPSession(phone);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const ready = () => performance.getEntriesByName('questarc-ready')[0]?.startTime;
  const times = [];
  for (let run = 0; run < 5; run += 1) {
    await phone.reload({ waitUntil: 'load' });
    await phone.waitForFunction(ready);
    times.push(await phone.evaluate(ready));
  }
  times.sort((a, b) => a - b);
  console.log(`start to first screen, CPU ×4, from the cache: median ${Math.round(times[2])} ms`);
} catch (error) {
  await shot('failed').catch(() => undefined);
  throw error;
} finally {
  await browser.close();
  await site.close();
}
