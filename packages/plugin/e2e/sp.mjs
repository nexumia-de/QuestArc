// Steps in Super Productivity's web app shared by the real-app tests
// (real-app.mjs, real-app-build.mjs, real-app-return.mjs, real-app-graduation.mjs, real-app-moments.mjs; docs/development.md, real app): open
// the app, install and enable the built ZIP, make the open task recurring,
// tick a task off and collect the messages. Uses the Playwright of the
// environment.
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const BASE = process.env.QUESTARC_SP_URL ?? 'https://app.super-productivity.com/';
const local = /^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(BASE);
const { version } = JSON.parse(readFileSync(resolve('src', 'manifest.json'), 'utf8'));
const ZIP = resolve('dist', `questarc-${version}.zip`);
export const OUT = resolve('dist', 'real-app');
mkdirSync(OUT, { recursive: true });

export const expect = (ok, what) => {
  if (!ok) throw new Error(`Failed: ${what}`);
  console.log(`ok: ${what}`);
};

/** A fresh browser profile at `width` × `height`; `clock` fakes the date from that time. */
export const open = async (width, height, { clock } = {}) => {
  const proxy =
    process.env.HTTPS_PROXY && !local ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
  const browser = await chromium.launch(proxy);
  const page = await browser.newPage({ viewport: { width, height } });
  if (clock) await page.clock.install({ time: clock });
  page.on('pageerror', (error) => console.log('page error:', error.message));
  const view = () => page.frameLocator('iframe').first();
  const shot = (prefix, name) =>
    page.screenshot({ path: join(OUT, `${prefix}${width}-${name}.png`) });
  return { browser, page, view, shot };
};

/** Opens the app and skips its first-start choice; returns the app's version. */
export const start = async (page) => {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90_000 });
  await page
    .getByText('Simple Todo List')
    .click()
    .catch(() => undefined);
  return (await page.locator('body').innerText()).match(/Super Productivity (\d+\.\d+\.\d+)/)?.[1];
};

/** Installs the ZIP in Settings → Plugins and switches it on. */
export const install = async (page) => {
  await page.goto(`${BASE}#/config`, { waitUntil: 'networkidle' });
  const tab = page.locator('[role=tab]').filter({ hasText: 'extension' });
  await tab.waitFor({ timeout: 90_000 });
  const settingsText = await page.locator('body').innerText();
  await tab.click();
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
  return settingsText.match(/\d+\.\d+\.\d+/)?.[0];
};

/**
 * Opens the journey from the home: the view's home is the user's moments
 * (#96), and the growing step there opens its journey.
 */
export const journey = async (view) => {
  await view().locator('.qa-growing, .qa-station-card').first().waitFor();
  if ((await view().locator('.qa-growing').count()) > 0)
    await view().locator('.qa-growing').click();
  await view().locator('.qa-station-card').waitFor();
};

/** Makes the open task recurring, as the user would: Schedule Task → Repeat → Save. */
export const makeRecurring = async (page) => {
  await page.getByText('Schedule Task', { exact: true }).click({ force: true });
  await page
    .locator('mat-dialog-container')
    .getByText('Repeat', { exact: true })
    .click({ force: true });
  await page.locator('mat-dialog-container').getByRole('button', { name: /Save/ }).click();
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(3000);
};

/**
 * Ticks off the task titled `title` in Today and collects the messages
 * for a few seconds: their texts and, when one has an action, its button.
 */
export const tick = async (page, title) => {
  await page.goto(`${BASE}#/tag/TODAY/tasks`);
  await page.waitForTimeout(1500);
  await page
    .getByText('No thanks')
    .click()
    .catch(() => undefined);
  const row = page.locator('task').filter({ hasText: title }).first();
  await row.hover();
  await row.locator('done-toggle').first().click({ force: true });
  const messages = new Set();
  for (let i = 0; i < 10; i += 1) {
    await page.waitForTimeout(500);
    for (const text of await page
      .locator('snack-custom, .mat-mdc-snack-bar-container')
      .allInnerTexts()) {
      messages.add(text.replace(/^route\s*/, '').trim());
    }
  }
  return [...messages];
};
