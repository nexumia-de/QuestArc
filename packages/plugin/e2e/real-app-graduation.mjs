// Graduation in the real app (#22), with prepared data: start "A gentle
// morning", create its task and tick it once, then write the records of
// a finished journey through the view's own message to plugin.js (the
// stages' checkpoints, the journey's end, the last stage bound to that
// task, three high weekly answers). The habit can graduate: the banner,
// "Not Now" (a choice record: quiet for four weeks, the shelf keeps the way),
// the page with its two choices, "Runs by itself", the shelf. Two weeks
// later (Playwright's clock) the question is due; "Not Really" offers to
// bring the habit back, and the shelf shows it as one that stays.
// Screenshots go to dist/real-app/graduation-*.
//
//   node e2e/real-app-graduation.mjs [width height]
import { BASE, expect, install, makeRecurring, open, start, tick } from './sp.mjs';

const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
const DAY_MS = 86_400_000;
// A Monday morning, local time of the browser (UTC in CI).
const first = new Date('2026-11-16T08:00:00');
const { browser, page, view, shot } = await open(width, height, { clock: first });
const name = (n) => shot('graduation-', n);
const TASK = /drink a glass of water/;
const STAGES = ['water', 'stretch-1', 'stretch-5', 'plan-day'];
const LAST = 'plan-day';

const dayOf = (date) => date.toISOString().slice(0, 10);
/** ISO 8601 week of a date, "2026-W47". */
const isoWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const year = d.getUTCFullYear();
  const week = Math.floor((d - Date.UTC(year, 0, 1)) / (7 * DAY_MS)) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
};

const questArc = async () => {
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await view().locator('.qa-header').first().waitFor();
  await page.waitForTimeout(2000);
};
const onDay = async (day) => {
  await page.clock.setSystemTime(new Date(first.getTime() + day * DAY_MS));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
};
/** Sends a request to plugin.js from inside the view, as the view does. */
const request = (message) =>
  view()
    .locator('body')
    .evaluate(
      (_, sent) =>
        new Promise((resolve, reject) => {
          const messageId = `e2e-${Math.random()}`;
          globalThis.addEventListener('message', function answer(event) {
            if (event.data?.messageId !== messageId) return;
            globalThis.removeEventListener('message', answer);
            if (event.data.type === 'PLUGIN_MESSAGE_RESPONSE') resolve(event.data.result);
            else reject(new Error(event.data.error));
          });
          globalThis.parent.postMessage({ type: 'PLUGIN_MESSAGE', messageId, message: sent }, '*');
        }),
      message,
    );
const shelf = async () => {
  await view().getByRole('button', { name: 'Menu' }).click();
  await view().getByRole('menuitem', { name: 'Shelf' }).click();
  await page.waitForTimeout(500);
  return view().locator('.qa-main').innerText();
};

try {
  const version = await start(page);
  console.log('Super Productivity', version ?? (await install(page)));
  if (version) await install(page);

  // A real recurring task, ticked off today.
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
  await tick(page, TASK);

  // Prepared data: the journey is finished, its last habit is that task.
  await questArc();
  const { records } = await request({ type: 'questarc:get' });
  const runId = Object.keys(records)
    .find((key) => key.startsWith('run:'))
    ?.slice(4);
  const binding = records[`binding:${runId}:water`];
  expect(Boolean(runId && binding?.taskId), 'the first station has its task');
  const today = dayOf(first);
  const prepared = { [`run-end:${runId}`]: { day: today, reason: 'finished' } };
  for (const stage of STAGES) {
    prepared[`stage:${runId}:${stage}`] = { acceptedDay: today };
    prepared[`stage-done:${runId}:${stage}`] = { day: today, dataFormat: 2 };
  }
  prepared[`binding:${runId}:${LAST}`] = { ...binding, day: today };
  for (const weeksAgo of [2, 1, 0]) {
    const week = isoWeek(new Date(first.getTime() - weeksAgo * 7 * DAY_MS));
    prepared[`checkin:${runId}:${LAST}:${week}`] = { score: 6 };
  }
  const written = await request({ type: 'questarc:write', records: prepared });
  expect(
    written.view.finished[0]?.habit?.canGraduate === true,
    `the habit can graduate (${JSON.stringify(written.view.finished[0]?.habit)})`,
  );

  // The offer: a banner, never more.
  await questArc();
  const banner = await view().locator('.qa-banner').first().innerText();
  expect(banner.includes('seems to run by itself'), `the banner offers graduation (${banner})`);
  await name('0-offer');
  // "Not Now" is a choice: the offer is quiet for four weeks on every
  // device, and the shelf keeps the quiet way to it.
  await view().getByRole('button', { name: 'Not Now' }).click();
  await page.waitForTimeout(1500);
  expect((await view().locator('.qa-banner').count()) === 0, 'Not Now puts the offer away');
  const later = await request({ type: 'questarc:get' });
  expect(
    Boolean(later.records[`graduation-later:${runId}:${LAST}`]?.day) &&
      Boolean(later.view.finished[0]?.habit?.offerQuietUntil),
    `Not Now is a choice record with the day (${JSON.stringify(later.view.finished[0]?.habit)})`,
  );
  await questArc();
  expect(
    (await view().locator('.qa-banner').count()) === 0,
    'the offer stays quiet after a reload',
  );
  expect((await shelf()).includes('Let It Graduate'), 'the shelf keeps the way to graduation');
  await view().getByRole('button', { name: 'Let It Graduate' }).click();
  const offer = await view().locator('.qa-main').innerText();
  for (const choice of ['I Will End Its Repeat', 'Keep It Repeating Quietly'])
    expect(offer.includes(choice), `the page offers "${choice}"`);
  expect(offer.includes('not a research result'), 'the page says the thresholds are a choice');
  await name('1-let-it-graduate');

  // The user's yes: they end the repeat themselves; QuestArc only leads there.
  await view().getByRole('button', { name: 'I Will End Its Repeat' }).click();
  await view().getByRole('button', { name: 'Done' }).waitFor();
  const done = await view().locator('.qa-main').innerText();
  expect(done.includes('QuestArc does not do this for you'), 'the page leads to the task');
  expect(
    (await view().getByRole('button', { name: 'Open the task' }).count()) === 1,
    'the task can be opened',
  );
  await name('2-runs-by-itself');
  await view().getByRole('button', { name: 'Done' }).click();
  expect((await view().locator('.qa-banner').count()) === 0, 'no banner after graduation');
  const graduated = await shelf();
  expect(
    graduated.includes('Running by themselves') && graduated.includes('Runs by itself since'),
    `the shelf shows the graduated habit (${graduated})`,
  );
  await name('3-shelf');

  // A graduated habit is quiet: ticking its task says nothing.
  await onDay(1);
  const messages = await tick(page, TASK);
  expect(messages.length === 0, `no message for a graduated habit (${messages.join(' | ')})`);

  // 13 days after graduation nothing is asked; after 14 the question is due.
  await onDay(13);
  await questArc();
  expect((await view().locator('.qa-banner').count()) === 0, 'no question after 13 days');
  await onDay(14);
  await questArc();
  const question = await view().locator('.qa-banner').first().innerText();
  expect(question.includes('One question'), `the question is due after 14 days (${question})`);
  await view().getByRole('button', { name: 'Answer' }).click();
  await name('4-one-question');
  await view().getByRole('button', { name: 'Not Really' }).click();
  await view().getByRole('button', { name: 'Bring It Back' }).waitFor();
  const back = await view().locator('.qa-main').innerText();
  expect(back.includes('nothing is lost'), 'bringing back is offered without a loss');
  await name('5-bring-it-back');
  await view().getByRole('button', { name: 'Bring It Back' }).click();
  await page.waitForTimeout(1500);
  const stays = await view().locator('.qa-main').innerText();
  expect(
    stays.includes('Habits that stay') && stays.includes('Back with you since'),
    `the habit stays again (${stays})`,
  );
  expect(!stays.includes('Running by themselves'), 'nothing runs by itself any more');
  // The tick before graduation still counts; the one in between does not (#66).
  expect(stays.includes('1 in total'), 'the run stands as it was before graduation');
  await name('6-back');
} catch (error) {
  await shot('failed-', 'page').catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
