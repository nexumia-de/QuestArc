// Tries the built plugin inside Super Productivity's web app, in a fresh
// browser profile with throwaway data (docs/development.md, real app):
// install and enable the ZIP, start "A gentle morning", create the task,
// make it recurring in Super Productivity's own dialog, tick it off, and
// check the message and the journey (calm mode). Screenshots go to
// dist/real-app/.
//
//   node e2e/real-app.mjs [width height]
//
// QUESTARC_SP_URL picks the app: by default the live web app; CI runs
// Super Productivity's Docker image at a pinned digest on localhost
// (.github/workflows/ci.yml). The live app goes through HTTPS_PROXY when
// it is set; a local app never does (e2e/sp.mjs).
import { BASE, expect, install, makeRecurring, open, start, tick } from './sp.mjs';

const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
const { browser, page, view, shot } = await open(width, height);

try {
  const version = await start(page);
  const shown = await install(page);
  console.log('Super Productivity', version ?? shown);
  await shot('', '1-installed');

  // Start the journey and create the task.
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await page.keyboard.press('Escape');
  await view().getByRole('button', { name: 'Choose a journey' }).click();
  await view()
    .getByRole('button', { name: /A gentle morning/ })
    .click();
  await view().getByRole('button', { name: 'Start this journey' }).click();
  await view().locator('#qa-why').fill('Calmer mornings');
  await view().getByRole('button', { name: 'Start', exact: true }).click();
  await view().getByRole('button', { name: 'Create the task' }).click();
  await page.waitForTimeout(2500);
  await shot('', '2-created');
  expect(
    (await view().locator('main').innerText()).includes('Schedule Task'),
    'the view explains how to set the repeat',
  );

  await makeRecurring(page);
  expect(
    (await view().locator('.qa-title').innerText()) === 'A gentle morning',
    'the journey picks up the repeat',
  );

  const messages = await tick(page, 'Getting up: drink a glass of water');
  expect(
    messages.includes('Drink a glass of water: done. 1 of 5 days.'),
    `message after the completion (${messages.join(' | ')})`,
  );

  await page.goto(`${BASE}#/plugins/questarc/index`);
  await page.waitForTimeout(3000);
  const card = await view().locator('.qa-station-card').innerText();
  expect(
    card.includes('1 of 5 days') && card.includes('Calmer mornings'),
    'the card counts the completion',
  );
  expect((await view().locator('.qa-build').count()) === 0, 'calm mode shows no build');
  await shot('', '3-journey');
} catch (error) {
  await shot('failed-', 'page').catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
