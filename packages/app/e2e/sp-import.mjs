// Imports a backup the standalone app exported (#93) into a real Super
// Productivity through its own "Import from File", in a fresh browser
// profile, and checks two things: Super Productivity takes the file as
// it is (no validation failure, no repair, no dialog), and the QuestArc
// plugin there shows the journey as the app did.
//
//   node e2e/sp-import.mjs [backup.json]
//
// Run `npm run build` and `npm run e2e -w @questarc/app` first: the
// backup and what to expect come from the walk (dist/walk/), the plugin
// ZIP from packages/plugin/dist. QUESTARC_SP_URL picks the app as for the
// plugin's real-app tests (docs/development.md); the steps in Super
// Productivity are theirs (packages/plugin/e2e/sp.mjs). The clock is set
// to the walk's last day, so both show the same day.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './serve.mjs';

const walk = resolve('dist', 'walk');
const file = resolve(process.argv[2] ?? resolve(walk, 'backup-360.json'));
const expected = JSON.parse(readFileSync(resolve(walk, 'expect-360.json'), 'utf8'));
const log = resolve(walk, 'sp-import.log');
// sp.mjs finds the plugin ZIP from the plugin's folder.
process.chdir(fileURLToPath(new URL('../../plugin/', import.meta.url)));
const { BASE, expect, install } = await import('../../plugin/e2e/sp.mjs');
const local = /^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(BASE);

// What Super Productivity logs when it finds imported data invalid or
// changes it (BackupService, data-repair, typia auto-fix).
const REPAIR = /validation failed|attempting repair|auto-?fix|repair|orphan|invalid|restored/i;

const browser = await launch({ proxy: !local });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.clock.install({ time: new Date('2026-03-12T08:30:00') });
const lines = [];
const dialogs = [];
page.on('console', (message) => lines.push(message.text().replace(/\s+/g, ' ').slice(0, 300)));
page.on('dialog', async (dialog) => {
  dialogs.push(dialog.type());
  await dialog.dismiss();
});
const view = () => page.frameLocator('iframe').first();

try {
  // The live app's CDN sometimes fails a script; loading again helps.
  for (let attempt = 1; ; attempt += 1) {
    try {
      if (attempt === 1) await page.goto(`${BASE}#/config`, { waitUntil: 'networkidle' });
      else await page.reload({ waitUntil: 'networkidle' });
      await page.locator('[role=tab]').filter({ hasText: 'cloud_sync' }).click({ timeout: 30_000 });
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      console.log(`Super Productivity did not load, attempt ${attempt}`);
    }
  }
  const version = (await page.locator('body').innerText()).match(/\d+\.\d+\.\d+/)?.[0];
  console.log('Super Productivity', version);
  await page.getByText('Import/Export', { exact: true }).click();
  await page.locator('button').filter({ hasText: 'Import from File' }).waitFor();
  const before = lines.length;
  await page.locator('input[type=file]').setInputFiles(file);
  await page.waitForURL(/#\/tag\/TODAY/, { timeout: 30_000 });
  await page.waitForTimeout(3000);
  const imported = lines.slice(before);
  writeFileSync(log, `${imported.join('\n')}\n`);
  const repairs = imported.filter((line) => REPAIR.test(line) && !/count: 0\b/.test(line));
  expect(repairs.length === 0, `no validation failure or repair (${repairs.join(' | ')})`);
  const open = await page.locator('mat-dialog-container').count();
  expect(dialogs.length === 0 && open === 0, 'no dialog');
  expect(
    (await page.locator('task').filter({ hasText: 'drink a glass of water' }).count()) > 0,
    'Today shows the habit’s task',
  );
  await page.screenshot({ path: resolve(walk, 'sp-1-imported.png') });

  // The plugin on the imported data.
  await install(page);
  await page.goto(`${BASE}#/plugins/questarc/index`);
  await view().locator('.qa-station-card').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  const title = await view().locator('.qa-title').innerText();
  const card = await view().locator('.qa-station-card').innerText();
  expect(title === expected.journey, `the plugin shows the journey (${title})`);
  expect(
    card.includes(expected.card) && card.includes(expected.why),
    `the plugin shows the same state (${expected.card})`,
  );
  await page.screenshot({ path: resolve(walk, 'sp-2-plugin.png') });
} catch (error) {
  await page.screenshot({ path: resolve(walk, 'sp-failed.png') }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
