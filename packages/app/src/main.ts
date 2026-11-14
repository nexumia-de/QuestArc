// The standalone app (#93, a spike): the shared adapter and screens on
// the app's own host. Where the plugin has plugin.js and a view in an
// iframe with messages in between, the app is one page: the screens ask
// the brain directly. Today and Data are the app's own screens.
import { createBrain } from '@questarc/ui/adapter/brain';
import { registerHooks } from '@questarc/ui/adapter/hooks';
import { artPackIn } from '@questarc/ui/adapter/art-pack';
import { messageFor } from '@questarc/ui/adapter/snacks';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { useLanguage } from '@questarc/ui/shared/languages';
import { language, t } from '@questarc/ui/shared/texts';
import { createApp } from '@questarc/ui/ui/app';
import { setArt } from '@questarc/ui/ui/art-store';
import type { Client } from '@questarc/ui/ui/client';
import { h } from '@questarc/ui/ui/dom';

import { dayContext, dayStartTime, withDayStart } from './day';
import { createHost } from './host';
import { applyHostTexts } from './host-texts';
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

/**
 * The app speaks the language of the device (issue #39): German for a
 * German locale, English for any other; `?lang=de` says it by hand, as
 * a host that embeds the app does with its own locale.
 */
useLanguage(
  new URLSearchParams(location.search).get('lang') ?? navigator.language,
  builtInJourneys,
);
applyHostTexts();
document.documentElement.lang = language();

const start = async (root: HTMLElement): Promise<void> => {
  const store = await openStore(indexedDbPersistence(), freshDataset);
  const shell = createShell(root);
  const today = () => dayContext(store.data, new Date()).todayStr;

  const host = createHost({
    store,
    showSnack: ({ msg }) => shell.message(msg),
    selectTask: () => shell.show('today'),
  });

  let showJourney = (): void => shell.show('journey');
  const game = createBrain({
    api: host.api,
    journeys: builtInJourneys,
    onEvents: (events, view, journeys) => {
      const msg = messageFor(events, view, journeys);
      if (msg) {
        shell.message(msg, { label: t('ui.snack.show'), run: () => showJourney() });
      }
    },
  });
  registerHooks(host.api, game.refresh);

  const art = artPackIn();
  setArt(art);
  const client: Client = {
    get: () => game.state(),
    write: (records) => game.write(records),
    // texts and style are part of the app itself (app.js, app.css)
    content: async () => ({ language: language(), texts: {}, style: '', art }),
  };
  const journey = createApp(shell.views.journey, client, host.view);
  // The view's home is the moments (#96); a message's Show leads to the journey.
  showJourney = () => {
    shell.show('journey');
    journey.openJourney();
  };

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
};

const root = document.getElementById('app') ?? document.body;
start(root).catch(() => {
  root.replaceChildren(h('div', { class: 'qa-callout', role: 'alert' }, at('error.start')));
});

// After the first load the service worker answers every request from
// its cache, so the app works offline and asks the network for nothing.
if ('serviceWorker' in navigator) void navigator.serviceWorker.register('sw.js');
