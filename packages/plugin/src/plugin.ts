// Host-side entry, run by Super Productivity when the plugin is enabled:
// keeps the game view current (adapter/), shows messages after
// completions, and answers the view's requests.
import { createBrain } from '@questarc/ui/adapter/brain';
import { useForCurrentStation } from './adapter/context-menu';
import { registerHooks } from '@questarc/ui/adapter/hooks';
import { followLanguage } from './adapter/language';
import { handleMessage } from './adapter/messages';
import { registerSettingsEntry } from './adapter/settings-entry';
import { createShowJourney } from './adapter/show-journey';
import { createSidePanel } from './adapter/side-panel';
import { snackFor } from '@questarc/ui/adapter/snacks';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { t } from '@questarc/ui/shared/texts';

// Super Productivity's language, before anything is said (#39).
followLanguage(PluginAPI, builtInJourneys);

const journey = createShowJourney(() => PluginAPI.showIndexHtmlAsView());
const brain = createBrain({
  api: PluginAPI,
  journeys: builtInJourneys,
  onEvents: (events, view, journeys) => {
    const snack = snackFor(events, view, journeys, journey.show);
    if (snack) PluginAPI.showSnack(snack);
  },
});

registerHooks(PluginAPI, brain.refresh);
const panel = createSidePanel(PluginAPI);
const settings = registerSettingsEntry(PluginAPI);
PluginAPI.onMessage?.((message) => handleMessage(brain, message, panel, settings, journey));

// Super Productivity does not clear a plugin's timers when it switches
// the plugin off or replaces it (docs/super-productivity-facts.md).
PluginAPI.onUnload?.(() => brain.stop());

PluginAPI.registerHeaderButton({
  label: 'QuestArc',
  icon: 'route',
  onClick: () => PluginAPI.showIndexHtmlAsView(),
});

// Task context menu (Super Productivity 19.2.0 and newer).
PluginAPI.registerTaskContextMenuEntry?.({
  id: 'use-for-station',
  label: t('ui.menu.use-for-station'),
  icon: 'route',
  showFor: ['TASK'],
  onClick: async ({ taskId }) => {
    const msg = await useForCurrentStation(PluginAPI, brain, taskId);
    PluginAPI.showSnack({ msg, type: 'INFO', ico: 'route' });
  },
});

// The first evaluation is the baseline that later events are compared with.
void brain.state().catch(() => undefined);
