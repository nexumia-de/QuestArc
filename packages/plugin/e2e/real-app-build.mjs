// The journey screen with the build in the real app (#100):
// start "A gentle morning" with another ladder (Crossing instead of its
// Home), tick the task off and see the first marker element from the
// message's Show action, tick it off on four more days until the stage is
// ready, continue and see the next version. The days pass with
// Playwright's clock (the app is reloaded on each new day, so Super
// Productivity makes that day's instance of the recurring task).
// Screenshots go to dist/real-app/build-*.
//
//   node e2e/real-app-build.mjs [width height]
import { BASE, expect, install, journey, makeRecurring, open, start, tick } from './sp.mjs';

const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
const DAY_MS = 86_400_000;
// A Monday morning, local time of the browser (UTC in CI).
const first = new Date('2026-11-16T08:00:00');
const { browser, page, view, shot } = await open(width, height, { clock: first });
const name = (n) => shot('build-', n);
const TASK = 'Getting up: drink a glass of water';
const label = () => view().locator('.qa-build svg.qa-art').first().getAttribute('aria-label');
const questArc = async () => {
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await view().locator('.qa-header').first().waitFor();
  await page.waitForTimeout(2000);
  // The home is the moments (#96); the growing step opens the journey.
  await journey(view);
};

try {
  const version = await start(page);
  console.log('Super Productivity', version ?? (await install(page)));
  if (version) await install(page);

  // Start with another ladder.
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await page.keyboard.press('Escape');
  await name('0-welcome');
  await view().getByRole('button', { name: 'Choose a journey' }).click();
  await view()
    .getByRole('button', { name: /A gentle morning/ })
    .click();
  await view().getByRole('button', { name: 'Start this journey' }).click();
  await view().locator('.qa-build-pick').waitFor({ timeout: 15_000 });
  const startText = await view().locator('.qa-build-pick').innerText();
  expect(
    startText.includes('You build: Home'),
    `the start page suggests the journey’s Home (${startText})`,
  );
  await view().getByRole('button', { name: 'Change' }).click();
  await view()
    .getByRole('radio', { name: /Crossing/ })
    .check();
  await name('1-start');
  await view().getByRole('button', { name: 'Start', exact: true }).click();
  await view().getByRole('button', { name: 'Create the task' }).click();
  await page.waitForTimeout(2500);
  await makeRecurring(page);
  await questArc();
  expect(
    (await label())?.startsWith('Stepping stones, version 1 of 5; nothing on its way yet'),
    `the Crossing stands, nothing on its way (${await label()})`,
  );

  // Day 1: the first tick, its message opens the build.
  const messages = await tick(page, TASK);
  expect(
    messages.some((m) => m.includes('done. 1 of 5 days.') && m.includes('Show')),
    `the message has the action Show (${messages.join(' | ')})`,
  );
  await page.locator('.mat-mdc-snack-bar-container button, snack-custom button').first().click();
  await view().locator('.qa-build').waitFor();
  await page.waitForTimeout(1500);
  const one = await label();
  expect(/marker: [12] of 2 posts and 0 of 6/.test(one ?? ''), `Show opens the build: ${one}`);
  await name('2-first-post');

  // Days 2 to 5: the marker grows; on day 5 the stage is ready.
  for (let day = 1; day <= 4; day += 1) {
    await page.clock.setSystemTime(new Date(first.getTime() + day * DAY_MS));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await tick(page, TASK);
  }
  await questArc();
  const ready = await label();
  expect(/; ready$/.test(ready ?? ''), `ready after five days: ${ready}`);
  expect(
    (await view().locator('.qa-build-state').innerText()).includes('a log is ready'),
    'the line says the log is ready',
  );
  await name('3-ready');

  // Stay Here a While (#81): nothing changes, the offer turns quiet.
  await view().getByRole('button', { name: 'Continue' }).click();
  await view().getByRole('button', { name: 'Stay Here a While' }).click();
  await view().locator('.qa-build').waitFor();
  await page.waitForTimeout(1000);
  expect(
    (await view().locator('.qa-station-card').innerText()).includes('You are staying here a while'),
    'the card says the user stays',
  );
  expect(/; ready$/.test((await label()) ?? ''), 'staying keeps the build ready');
  await name('3a-staying');

  // Continue: the next version stands, the marker is gone. Flow C ends
  // on "Set up the task" for the next stage; back leads to the journey.
  await view().getByRole('button', { name: 'Continue' }).click();
  await view()
    .getByRole('button', { name: /Continue|Go on/ })
    .last()
    .click();
  await view().getByRole('button', { name: 'Create the task' }).waitFor();
  await view().locator('.qa-header button').first().click();
  await view().locator('.qa-build').waitFor();
  await page.waitForTimeout(1000);
  const next = await label();
  expect(
    next?.startsWith('A log, version 2 of 5; nothing on its way yet'),
    `the next version stands: ${next}`,
  );
  expect(
    (await view().locator('.qa-versions li').count()) === 3,
    'the row shows 1, 2 and the next step',
  );
  await name('4-next-version');

  // I Already Do This (#81): the offered stage is passed without a task,
  // the next version stands and says "already yours".
  await view().getByRole('button', { name: 'Set up the task' }).click();
  await view().getByRole('button', { name: 'I Already Do This' }).click();
  await page.waitForTimeout(1000);
  await view().locator('.qa-header button').first().click();
  await view().locator('.qa-build').waitFor();
  await page.waitForTimeout(1000);
  const skipped = await label();
  expect(skipped?.includes('version 3 of 5'), `a skipped stage raises the version: ${skipped}`);
  expect(
    (await view().locator('.qa-versions li').nth(2).innerText()).includes('already yours'),
    'the row says which version is already yours',
  );
  await name('5-already-yours');
} catch (error) {
  await shot('failed-', 'page').catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
