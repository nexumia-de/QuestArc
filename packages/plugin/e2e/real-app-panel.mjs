// The side panel setting in the real app (#100): off by default (no
// side-panel button), on in QuestArc's settings (game mode), then the
// button next to the play button opens QuestArc beside the task list.
//
//   node e2e/real-app-panel.mjs [width height]
import { BASE, expect, install, open, start } from './sp.mjs';

const [width = 1200, height = 800] = process.argv.slice(2).map(Number);
const { browser, page, view, shot } = await open(width, height);
const panelButtons = () => page.locator('plugin-side-panel-btns button, .plugin-side-panel-btn');

try {
  const version = await start(page);
  console.log('Super Productivity', version ?? (await install(page)));
  if (version) await install(page);
  expect((await panelButtons().count()) === 0, 'no side-panel button by default');

  await page.goto(`${BASE}#/plugins/questarc/index`);
  await page.keyboard.press('Escape');
  await view()
    .getByRole('radio', { name: /With game/ })
    .check();
  await view().getByRole('button', { name: 'Choose a journey' }).click();
  await view().locator('.qa-header button').first().click();
  await view().locator('.qa-menu-wrap button').first().click();
  await view()
    .getByRole('menuitem', { name: 'Settings' })
    .or(view().getByRole('button', { name: 'Settings' }))
    .first()
    .click();
  await view().getByRole('switch').check();
  await page.waitForTimeout(1500);
  expect((await panelButtons().count()) === 1, 'the setting adds the side-panel button');

  await page.goto(`${BASE}#/tag/TODAY/tasks`);
  await page.waitForTimeout(1500);
  await panelButtons().first().click();
  await page.waitForTimeout(3000);
  const frames = page.locator('plugin-panel-container iframe');
  expect((await frames.count()) === 1, 'the button opens QuestArc in the right panel');
  const box = await frames.first().boundingBox();
  console.log(`panel iframe: ${Math.round(box?.width ?? 0)} × ${Math.round(box?.height ?? 0)} px`);
  await shot('panel-', 'open');
} catch (error) {
  await shot('failed-panel-', 'page').catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
