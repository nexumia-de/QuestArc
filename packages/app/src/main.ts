// The standalone app (#93, a spike): the plugin's adapter and screens on
// the app's own host. Where the plugin has plugin.js and a view in an
// iframe with messages in between, the app is one page: the screens ask
// the brain directly. Today and Data are the app's own screens.
import type { Schedule } from '@questarc/engine';
import { createBrain, type Brain } from '@questarc/plugin/src/adapter/brain';
import { registerHooks } from '@questarc/plugin/src/adapter/hooks';
import { artPack } from '@questarc/plugin/src/adapter/messages';
import { messageFor } from '@questarc/plugin/src/adapter/snacks';
import { builtInJourneys } from '@questarc/plugin/src/shared/content';
import { t } from '@questarc/plugin/src/shared/texts';
import { createApp } from '@questarc/plugin/src/ui/app';
import { setArt } from '@questarc/plugin/src/ui/art-store';
import type { Client } from '@questarc/plugin/src/ui/client';
import { h } from '@questarc/plugin/src/ui/dom';

import { dayContext, dayStartTime, withDayStart } from './day';
import { createHost } from './host';
import { renderData } from './screens/data';
import { renderToday } from './screens/today';
import { createShell } from './shell';
import { BackupError, parseBackup, toBackup } from './store/backup';
import { freshDataset, type Dataset } from './store/dataset';
import { setDone, todaysTasks } from './store/habits';
import { indexedDbPersistence } from './store/idb';
import { createInstances } from './store/instances';
import { openStore } from './store/store';
import { at } from './texts';

const DAY_CHECK_MS = 60_000;

const start = async (root: HTMLElement): Promise<void> => {
  const store = await openStore(indexedDbPersistence(), freshDataset);
  const shell = createShell(root);
  const today = () => dayContext(store.data, new Date()).todayStr;

  // The brain is made after the host it reads from; the host asks it
  // only when a task is created.
  const brain: { current?: Brain } = {};
  const stageSchedule = async (): Promise<Schedule | undefined> => {
    const state = await brain.current?.state();
    const run = state?.view.active;
    const journey = run && state.journeys.find((j) => j.id === run.journeyId);
    return run && journey?.stages[run.position.stage]?.schedule;
  };
  const host = createHost({
    store,
    schedule: stageSchedule,
    showSnack: ({ msg }) => shell.message(msg),
    selectTask: () => shell.show('today'),
  });
  // The screens call the plugin API by its global name.
  (globalThis as { PluginAPI?: unknown }).PluginAPI = host.api;

  const game = createBrain({
    api: host.api,
    journeys: builtInJourneys,
    onEvents: (events, view, journeys) => {
      const msg = messageFor(events, view, journeys);
      if (msg) {
        shell.message(msg, { label: t('ui.snack.show'), run: () => shell.show('journey') });
      }
    },
  });
  brain.current = game;
  registerHooks(host.api, game.refresh);

  setArt(artPack);
  const client: Client = {
    get: () => game.state(),
    write: (records) => game.write(records),
    sidePanel: () => game.state(),
    art: async () => artPack,
  };
  const journey = createApp(shell.views.journey, client);

  // Today's instances, made once per logical day.
  let day = '';
  const newDay = async (): Promise<void> => {
    const now = today();
    if (now === day) return;
    day = now;
    await store.update((data) => createInstances(data, now));
    host.emit('dayChange', 'dataChanged');
  };

  const replace = async (next: Dataset): Promise<void> => {
    await store.update(() => next);
    day = '';
    host.emit('persistedDataChanged');
    await newDay();
  };

  const exportBackup = (): void => {
    const file = new Blob([JSON.stringify(toBackup(store.data, Date.now()))], {
      type: 'application/json',
    });
    const link = h('a', {
      href: URL.createObjectURL(file),
      download: `questarc-backup-${today()}.json`,
    }) as HTMLAnchorElement;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
  };

  const importBackup = async (file: File): Promise<void> => {
    const before = store.data;
    try {
      await replace(parseBackup(await file.text()));
    } catch (error) {
      shell.message(
        at(`data.problem.${error instanceof BackupError ? error.problem : 'not-a-backup'}`),
      );
      return;
    }
    shell.message(at('data.imported'), {
      label: at('data.undo'),
      run: () => void replace(before).then(() => shell.message(at('data.restored'))),
    });
  };

  const draw = async (): Promise<void> => {
    renderToday(shell.views.today, {
      today: today(),
      tasks: todaysTasks(store.data, today()),
      hasHabits: store.data.taskRepeatCfg.ids.length > 0,
      toggle: (task) =>
        void store
          .update((data) => setDone(data, task.id, !task.isDone, Date.now()))
          .then(() => host.emit('dataChanged')),
      openJourney: () => shell.show('journey'),
    });
    renderData(shell.views.data, {
      dayStart: dayStartTime(store.data),
      setDayStart: (time) => void replace(withDayStart(store.data, time)),
      exportBackup,
      importBackup: (file) => void importBackup(file),
    });
    try {
      journey.update(await game.state());
    } catch {
      journey.showError(t('ui.error.load'));
    }
  };

  host.onChange(() => void draw());
  await newDay();
  await draw();
  performance.mark('questarc-ready');

  setInterval(() => void newDay(), DAY_CHECK_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void newDay();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') journey.back();
  });
  document.addEventListener('click', (event) => {
    if (!(event.target as Element | null)?.closest('.qa-menu-wrap')) journey.closeMenu();
  });
};

const root = document.getElementById('app') ?? document.body;
start(root).catch(() => {
  root.replaceChildren(h('div', { class: 'qa-callout', role: 'alert' }, at('error.start')));
});

// After the first load the service worker answers every request from
// its cache, so the app works offline and asks the network for nothing.
if ('serviceWorker' in navigator) void navigator.serviceWorker.register('sw.js');
