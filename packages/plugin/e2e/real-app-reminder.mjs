// Reminders in the real app (#60): QuestArc sends none; it suggests the
// task's own reminder at set-up, reads it from the repeat, and says when
// it may not be needed any more. Start "A gentle morning", see the
// suggestion, create the task and make it recurring with a start time
// and a reminder in Super Productivity's own dialogs, see QuestArc read
// it (the view's state and the `reminder-seen` record); then, with two
// weekly answers of 5 or more written through the view's own message to
// plugin.js, the banner with **Open the task**.
// Screenshots go to dist/real-app/reminder-*.
//
//   node e2e/real-app-reminder.mjs [width height]
import { BASE, expect, install, journey, makeRecurring, open, start } from './sp.mjs';

const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
const DAY_MS = 86_400_000;
// A Monday morning, local time of the browser (UTC in CI).
const first = new Date('2026-11-16T08:00:00');
const { browser, page, view, shot } = await open(width, height, { clock: first });
const name = (n) => shot('reminder-', n);

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

try {
  const version = await start(page);
  console.log('Super Productivity', version ?? (await install(page)));
  if (version) await install(page);

  // Set-up suggests the task's own reminder; QuestArc sends none.
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await page.keyboard.press('Escape');
  await view().getByRole('button', { name: 'Choose a journey' }).click();
  await view()
    .getByRole('button', { name: /A gentle morning/ })
    .click();
  await view().getByRole('button', { name: 'Start this journey' }).click();
  await view().getByRole('button', { name: 'Start', exact: true }).click();
  const setUp = await view().locator('.qa-main').innerText();
  expect(
    setUp.includes('Would a reminder at the time of your moment help for the first weeks?') &&
      setUp.includes('QuestArc sends none itself'),
    `set-up suggests a reminder on the task (${setUp})`,
  );
  await name('0-set-up');
  await view().getByRole('button', { name: 'Create the task' }).click();
  await page.waitForTimeout(2500);

  // The user sets a start time and a reminder on the repeat; QuestArc reads it.
  await makeRecurring(page, { time: '07:00' });
  await questArc();
  const state = await request({ type: 'questarc:get' });
  const run = state.view.active;
  expect(
    run?.reminder?.set === true,
    `QuestArc reads the reminder of the task's repeat (${JSON.stringify(run?.reminder)})`,
  );
  const seen = state.records[`reminder-seen:${run.runId}:water`];
  expect(seen?.on === true, `the day it was first seen is recorded (${JSON.stringify(seen)})`);
  await journey(view);
  expect(
    !(await view().locator('.qa-main').innerText()).includes('Would a reminder'),
    'with a reminder set nothing is suggested',
  );

  // Two weekly answers of 5 or more in a row: it may not be needed any more.
  const answers = {};
  for (const [weeksAgo, score] of [
    [1, 5],
    [0, 6],
  ]) {
    const week = isoWeek(new Date(first.getTime() - weeksAgo * 7 * DAY_MS));
    answers[`checkin:${run.runId}:water:${week}`] = { score };
  }
  const written = await request({ type: 'questarc:write', records: answers });
  expect(
    written.view.active?.reminder?.fade === true,
    `the answers have risen (${JSON.stringify(written.view.active?.reminder)})`,
  );
  await questArc();
  await journey(view);
  // One thing at a time: the station's nugget is put away first.
  const gotIt = view().getByRole('button', { name: 'Got it' });
  if ((await gotIt.count()) > 0) await gotIt.click();
  const banner = await view().locator('.qa-banner').first().innerText();
  expect(
    banner.includes('You may not need the reminder any more'),
    `the banner says the reminder may not be needed (${banner})`,
  );
  expect(
    (await view().locator('.qa-banner').getByRole('button', { name: 'Open the task' }).count()) ===
      1,
    'the banner leads to the task',
  );
  const overflow = await view()
    .locator('body')
    .evaluate((body) => body.scrollWidth > body.clientWidth);
  expect(!overflow, 'no horizontal scrolling');
  await name('1-may-not-need');
  // QuestArc never removes a reminder: the repeat still has it.
  const after = await request({ type: 'questarc:get' });
  expect(after.view.active?.reminder?.set === true, 'the reminder is still set');
} catch (error) {
  await shot('failed-', 'page').catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
