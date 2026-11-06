// Tries the built plugin inside Super Productivity's web app, in a fresh
// browser profile with throwaway data (docs/development.md, real app):
// install and enable the ZIP, start "A gentle morning", create the task,
// make it recurring in Super Productivity's own dialog, tick it off, and
// check the message and the journey. Screenshots go to dist/real-app/.
//
//   node e2e/real-app.mjs [width height]
//
// Uses the Playwright of the environment; behind a proxy it uses
// HTTPS_PROXY. Not part of npm run check: it needs the live app (#50).
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = 'https://app.super-productivity.com/';
const ZIP = resolve('dist', 'questarc-3.0.0.zip');
const OUT = resolve('dist', 'real-app');
const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
mkdirSync(OUT, { recursive: true });

const expect = (ok, what) => {
  if (!ok) throw new Error(`Failed: ${what}`);
  console.log(`ok: ${what}`);
};

const proxy = process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
const browser = await chromium.launch(proxy);
const page = await browser.newPage({ viewport: { width, height } });
const shot = (name) => page.screenshot({ path: join(OUT, `${width}-${name}.png`) });
page.on('pageerror', (error) => console.log('page error:', error.message));
const view = () => page.frameLocator('iframe').first();

try {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90_000 });
  await page
    .getByText('Simple Todo List')
    .click()
    .catch(() => undefined);
  const version = (await page.locator('body').innerText()).match(
    /Super Productivity (\d+\.\d+\.\d+)/,
  );

  // Install and enable.
  await page.goto(`${BASE}#/config`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const settingsText = await page.locator('body').innerText();
  console.log('Super Productivity', version?.[1] ?? settingsText.match(/\d+\.\d+\.\d+/)?.[0]);
  await page.locator('[role=tab]').filter({ hasText: 'extension' }).click();
  await page.waitForTimeout(1500);
  await page.locator('input[type=file]').first().setInputFiles(ZIP);
  await page.locator('mat-dialog-container button').filter({ hasText: 'Install Plugin' }).click();
  await page.waitForTimeout(2000);
  await page
    .locator('mat-card')
    .filter({ hasText: 'QuestArc' })
    .locator('[role=switch]')
    .first()
    .click();
  await page.waitForTimeout(2000);
  await shot('1-installed');

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
  await shot('2-created');
  expect(
    (await view().locator('main').innerText()).includes('Schedule Task'),
    'the view explains how to set the repeat',
  );

  // Make it recurring, as the user would: Schedule Task → Repeat → Save.
  await page.getByText('Schedule Task', { exact: true }).click({ force: true });
  await page
    .locator('mat-dialog-container')
    .getByText('Repeat', { exact: true })
    .click({ force: true });
  await page.locator('mat-dialog-container').getByRole('button', { name: /Save/ }).click();
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(3000);
  expect(
    (await view().locator('.qa-title').innerText()) === 'A gentle morning',
    'the journey picks up the repeat',
  );

  // Tick it off in the task list and collect the messages.
  await page.goto(`${BASE}#/tag/TODAY/tasks`);
  await page.waitForTimeout(1500);
  await page
    .getByText('No thanks')
    .click()
    .catch(() => undefined);
  const row = page
    .locator('task')
    .filter({ hasText: 'Getting up: drink a glass of water' })
    .first();
  await row.hover();
  await row.locator('done-toggle').first().click({ force: true });
  const messages = new Set();
  for (let i = 0; i < 10; i += 1) {
    await page.waitForTimeout(500);
    for (const text of await page
      .locator('snack-custom, .mat-mdc-snack-bar-container')
      .allInnerTexts()) {
      messages.add(text.replace(/^route\s*/, ''));
    }
  }
  expect(
    [...messages].includes('Drink a glass of water: done. 1 of 5 days.'),
    `message after the completion (${[...messages].join(' | ')})`,
  );

  await page.goto(`${BASE}#/plugins/questarc/index`);
  await page.waitForTimeout(3000);
  const card = await view().locator('.qa-station-card').innerText();
  expect(
    card.includes('1 of 5 days') && card.includes('Calmer mornings'),
    'the card counts the completion',
  );
  await shot('3-journey');
} finally {
  await browser.close();
}
