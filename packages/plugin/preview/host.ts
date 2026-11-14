// Preview of the view outside Super Productivity (docs/development.md,
// preview): a fake plugin API with demo data, the real adapter (brain) and
// the built view in an iframe that talks to it the way Super Productivity's
// bridge does. Query: ?demo=<scenario in preview/demo.ts>&theme=light|dark
// &lang=de|en (the language Super Productivity would report, issue #39).
import type { Hooks } from '@super-productivity/plugin-api';

import { createBrain } from '@questarc/ui/adapter/brain';
import { localDay } from '@questarc/ui/adapter/day';
import { registerHooks } from '@questarc/ui/adapter/hooks';
import { followLanguage } from '../src/adapter/language';
import type { HostApi } from '@questarc/ui/adapter/host';
import { handleMessage } from '../src/adapter/messages';
import { createSidePanel } from '../src/adapter/side-panel';
import { messageFor } from '@questarc/ui/adapter/snacks';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { demoData, type Scenario } from './demo';
import { own, previewLanguage } from './demo-words';
import { themeCss } from '@questarc/ui/ui/theme';

declare const VIEW_HTML: string;

const params = new URLSearchParams(location.search);
const scenario = (params.get('demo') ?? 'journey') as Scenario;
const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
const today = localDay(new Date());
const demo = demoData(scenario, today);
const hooks = new Map<string, (() => void)[]>();
const snacks = document.getElementById('snacks') as HTMLElement;

const api: HostApi & Record<string, unknown> = {
  getAppState: async () => ({ tasks: demo.tasks, taskRepeatCfgs: demo.repeatCfgs }) as never,
  getArchivedTasks: async () => [],
  getDayContext: async () => ({ todayStr: today, startOfNextDayDiffMs: 0 }),
  getCurrentLanguage: () => previewLanguage(),
  listSyncedDataKeys: async () =>
    Object.keys(demo.data)
      .filter((k) => demo.data[k])
      .sort(),
  loadSyncedData: async (key?: string) => demo.data[key ?? ''] ?? null,
  persistDataSynced: async (value: string, key?: string) => {
    demo.data[key ?? ''] = value;
    fire('persistedDataChanged');
  },
  showSnack: ({ msg }) => {
    snacks.textContent = msg;
  },
  registerHook: (hook: Hooks, handler: (payload: never) => void) => {
    hooks.set(hook, [...(hooks.get(hook) ?? []), () => handler(undefined as never)]);
  },
  addTask: async ({ title }: { title: string }) => {
    const id = `task-${Object.keys(demo.tasks).length + 1}`;
    demo.tasks[id] = { id, title, isDone: false, timeSpentOnDay: {} } as never;
    fire('dataChanged');
    return id;
  },
  selectTask: async (id: string) => {
    snacks.textContent = `Opened task ${id}`;
  },
};

const fire = (hook: string) => {
  for (const handler of hooks.get(hook) ?? []) handler();
};

let failWith: string | null = null;

/** Helpers for trying flows by hand in the browser console. */
Object.assign(window, {
  preview: {
    data: demo,
    /**
     * Answers the view's requests with this error until called with null,
     * as Super Productivity does while plugin.js is not loaded
     * ("Plugin questarc not found or not loaded").
     */
    failMessages: (error: string | null) => {
      failWith = error;
    },
    /** Ticks off today's instance of the demo's recurring task (#100: the moment of the tick). */
    tick: () => {
      const id = `rpt_demo_${today}`;
      demo.tasks[id] = {
        id,
        title: own('Morning routine'),
        isDone: true,
        doneOn: Date.now(),
        repeatCfgId: 'demo',
        dueDay: today,
        created: Date.parse(`${today}T12:00:00Z`),
        timeSpentOnDay: {},
      } as never;
      fire('dataChanged');
    },
    /** Gives a task a daily repeat, as the user would in Super Productivity. */
    setRepeat: (taskId: string, cfg: Record<string, unknown> = {}) => {
      const id = `cfg-${taskId}`;
      demo.repeatCfgs[id] = {
        id,
        title: demo.tasks[taskId]?.title,
        isPaused: false,
        repeatCycle: 'DAILY',
        repeatEvery: 1,
        startDate: today,
        ...cfg,
      };
      const task = demo.tasks[taskId];
      if (task) task.repeatCfgId = id;
      fire('dataChanged');
    },
  },
});

followLanguage(api as never, builtInJourneys);
const brain = createBrain({
  api,
  journeys: builtInJourneys,
  onEvents: (events, view, journeys) => {
    const msg = messageFor(events, view, journeys);
    if (msg) api.showSnack({ msg });
  },
});

registerHooks(api, brain.refresh);
const panel = createSidePanel({ registerSidePanelButton: () => undefined }, undefined);
document.documentElement.style.cssText = '';
const style = document.createElement('style');
style.textContent = `${themeCss(theme)} body{background:var(--bg)}`;
document.head.append(style);

// The iframe's PluginAPI: every call goes to this page, like Super
// Productivity's injected shim (docs/super-productivity-facts.md §1).
const shim = `<script>
(() => {
  let id = 0; const pending = new Map(); const hookHandlers = new Map();
  addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === 'PLUGIN_API_RESPONSE' && pending.has(d.callId)) { pending.get(d.callId).resolve(d.result); pending.delete(d.callId); }
    if (d.type === 'PLUGIN_API_ERROR' && pending.has(d.callId)) { pending.get(d.callId).reject(new Error(d.error)); pending.delete(d.callId); }
    if (d.type === 'PLUGIN_HOOK_EVENT') (hookHandlers.get(d.hook) || []).forEach((h) => h(d.payload));
  });
  const call = (method, args) => new Promise((resolve, reject) => {
    id += 1; pending.set(id, { resolve, reject });
    parent.postMessage({ type: 'PLUGIN_API_CALL', method, args, callId: id }, '*');
  });
  window.PluginAPI = new Proxy({}, { get: (_, method) => method === 'registerHook'
    ? (hook, handler) => { hookHandlers.set(hook, [...(hookHandlers.get(hook) || []), handler]); return call('registerHook', [hook]); }
    : (...args) => call(method, args) });
})();
</script><style>${themeCss(theme)}</style>`;

const frame = document.getElementById('view') as HTMLIFrameElement;
frame.srcdoc = VIEW_HTML.replace(/<head>/i, `<head>${shim}`);

addEventListener('message', async (event: MessageEvent) => {
  const data = event.data as Record<string, unknown>;
  const reply = (message: Record<string, unknown>) =>
    (event.source as Window | null)?.postMessage(message, '*');
  if (data.type === 'PLUGIN_MESSAGE') {
    if (failWith !== null) {
      reply({ type: 'PLUGIN_MESSAGE_ERROR', messageId: data.messageId, error: failWith });
      return;
    }
    try {
      const result = await handleMessage(brain, data.message, panel);
      reply({ type: 'PLUGIN_MESSAGE_RESPONSE', messageId: data.messageId, result });
    } catch (error) {
      reply({ type: 'PLUGIN_MESSAGE_ERROR', messageId: data.messageId, error: String(error) });
    }
  } else if (data.type === 'PLUGIN_API_CALL') {
    const method = data.method as string;
    const args = data.args as unknown[];
    if (method === 'registerHook') {
      const hook = args[0] as string;
      api.registerHook(hook as Hooks, () => reply({ type: 'PLUGIN_HOOK_EVENT', hook }));
      reply({ type: 'PLUGIN_API_RESPONSE', callId: data.callId, result: undefined });
      return;
    }
    const fn = api[method];
    if (typeof fn !== 'function') {
      reply({ type: 'PLUGIN_API_ERROR', callId: data.callId, error: `${method} not in preview` });
      return;
    }
    reply({ type: 'PLUGIN_API_RESPONSE', callId: data.callId, result: await fn(...args) });
  }
});
