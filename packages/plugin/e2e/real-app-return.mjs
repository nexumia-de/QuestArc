// Coming back after a long break in the real app (#82): walk "A gentle
// morning" to its second station, tick its task once, then let 13 and 14
// days pass with Playwright's clock (the app is reloaded on each new day).
// After 13 days nothing is offered; after 14 the card is there. Start
// Smaller, with the gap called a pause, makes the first station current
// again: the version stands, and the first tick is a welcome back.
// Screenshots go to dist/real-app/return-*.
//
//   node e2e/real-app-return.mjs [width height]
import { BASE, expect, install, journey, makeRecurring, open, start, tick } from './sp.mjs';

const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
const DAY_MS = 86_400_000;
// A Monday morning, local time of the browser (UTC in CI).
const first = new Date('2026-11-16T08:00:00');
const { browser, page, view, shot } = await open(width, height, { clock: first });
const name = (n) => shot('return-', n);
// The second station's task title begins like the first one's.
const SMALL = /drink a glass of water(?! and)/;
const LARGER = /stretch for one minute/;
const label = () => view().locator('.qa-build svg.qa-art').first().getAttribute('aria-label');
const questArc = async () => {
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await view().locator('.qa-header').first().waitFor();
  await page.waitForTimeout(2000);
  // The home is the moments (#96); the growing step opens the journey.
  await journey(view);
};
const onDay = async (day) => {
  await page.clock.setSystemTime(new Date(first.getTime() + day * DAY_MS));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
};

try {
  const version = await start(page);
  console.log('Super Productivity', version ?? (await install(page)));
  if (version) await install(page);

  // The first station: five days, then continue.
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await page.keyboard.press('Escape');
  await view().getByRole('button', { name: 'Choose a journey' }).click();
  await view()
    .getByRole('button', { name: /A gentle morning/ })
    .click();
  await view().getByRole('button', { name: 'Start this journey' }).click();
  await view().getByRole('button', { name: 'Start', exact: true }).click();
  await view().getByRole('button', { name: 'Create the task' }).click();
  await page.waitForTimeout(2500);
  await makeRecurring(page);
  await tick(page, SMALL);
  for (let day = 1; day <= 4; day += 1) {
    await onDay(day);
    await tick(page, SMALL);
  }
  await questArc();
  await view().getByRole('button', { name: 'Continue' }).click();
  await view()
    .getByRole('button', { name: /Continue|Go on/ })
    .last()
    .click();

  // The second station: its own task, ticked off once.
  await view().getByRole('button', { name: 'Create the task' }).click();
  await page.waitForTimeout(2500);
  await makeRecurring(page);
  await tick(page, LARGER);
  await questArc();
  expect(
    /station 2 of 4/i.test(await view().locator('.qa-station-card').innerText()),
    'the second station is the current one',
  );

  // 13 days without a completion: the hard-week hint, no card.
  await onDay(17);
  await questArc();
  expect((await view().locator('.qa-comeback').count()) === 0, 'no card after 13 days');
  await name('0-thirteen-days');

  // 14 days: one calm card with three choices instead of the banners.
  await onDay(18);
  await questArc();
  const card = await view().locator('.qa-comeback').innerText();
  expect(card.includes('Good to see you.'), `the card greets after 14 days (${card})`);
  for (const choice of ['Carry On', 'Call It a Pause', 'Start Smaller'])
    expect(card.includes(choice), `the card offers ${choice}`);
  expect((await view().locator('.qa-banner').count()) === 0, 'the card stands alone');
  await name('1-card');

  // Start Smaller, with the gap called a pause.
  await view().getByRole('button', { name: 'Start Smaller' }).click();
  await view().getByRole('checkbox').check();
  await name('2-start-smaller');
  await view().getByRole('button', { name: 'Start Smaller' }).last().click();
  await view().locator('.qa-build').waitFor();
  await page.waitForTimeout(1500);
  const station = await view().locator('.qa-station-card').innerText();
  expect(
    /station 1 of 4/i.test(station) && station.includes('You started smaller'),
    `the first station is the current one again (${station})`,
  );
  expect((await view().locator('.qa-comeback').count()) === 0, 'the card is gone');
  const build = await label();
  expect(build?.includes('version 2 of 5'), `the version stands: ${build}`);
  await name('3-smaller');

  // The first completion afterwards is a normal welcome back.
  const messages = await tick(page, SMALL);
  expect(
    messages.some((m) => m.includes('Welcome back')),
    `the first tick is a welcome back (${messages.join(' | ')})`,
  );
  await questArc();
  expect(
    (await view().locator('.qa-station-card').innerText()).includes('1 of 5 days'),
    'the smaller station counts again',
  );
  await name('4-welcome-back');
} catch (error) {
  await shot('failed-', 'page').catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
