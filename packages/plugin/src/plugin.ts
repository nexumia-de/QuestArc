// Host-side entry, run by Super Productivity when the plugin is enabled:
// keeps the game view current (adapter/), shows messages after
// completions, and answers the view's requests.
import { createBrain } from './adapter/brain';
import { registerHooks } from './adapter/hooks';
import { handleMessage } from './adapter/messages';
import { messageFor } from './adapter/snacks';
import { builtInJourneys } from './shared/content';

const brain = createBrain({
  api: PluginAPI,
  journeys: builtInJourneys,
  onEvents: (events, view, journeys) => {
    const msg = messageFor(events, view, journeys);
    if (msg) PluginAPI.showSnack({ msg, type: 'SUCCESS', ico: 'route' });
  },
});

registerHooks(PluginAPI, brain.refresh);
PluginAPI.onMessage?.((message) => handleMessage(brain, message));

PluginAPI.registerHeaderButton({
  label: 'QuestArc',
  icon: 'route',
  onClick: () => PluginAPI.showIndexHtmlAsView(),
});

// The first evaluation is the baseline that later events are compared with.
void brain.state().catch(() => undefined);
