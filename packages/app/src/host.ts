import type { HostApi } from '@questarc/ui/adapter/host';
import type { ViewHost } from '@questarc/ui/ui/view-host';
import type { Hooks, SnackCfg } from '@super-productivity/plugin-api';

import { dayContext } from './day';
import { decodeData } from './store/codec';
import { PLUGIN_ID, archivedTasks } from './store/dataset';
import { createHabit as newHabit } from './store/habits';
import type { Store } from './store/store';

/**
 * The standalone host (#93): the part of Super Productivity's plugin API
 * that QuestArc's adapter and screens use, answered from the app's own
 * dataset. The screens' side of it (`view`) differs on purpose: the app
 * owns the habits, so it offers `createHabit` and the set-up screen makes
 * the recurring task with the schedule of the stage, where the plugin has
 * to leave the repeat to the user.
 */

export interface HostOptions {
  readonly store: Store;
  readonly now?: () => Date;
  readonly showSnack: (snack: SnackCfg) => void;
  /** Shows a task to the user. */
  readonly selectTask: (taskId: string) => void;
  /** An id for a new repeat config. */
  readonly newId?: () => string;
}

export interface AppHost {
  /** What the brain reads: Super Productivity's plugin API, answered from the dataset. */
  readonly api: HostApi;
  /** What the screens use to list, show and create tasks. */
  readonly view: ViewHost;
  /** Tells the adapter and the screens that the data changed. */
  emit(...hooks: string[]): void;
  /** Called after each change, when the adapter has heard of it. */
  onChange(listener: () => void): void;
}

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

/** 21 random characters, the form of Super Productivity's ids (nanoid). */
export const randomId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(21)), (n) => ID_CHARS[n % 64]).join('');

const dataId = (key = ''): string => (key ? `${PLUGIN_ID}:${key}` : PLUGIN_ID);

export const createHost = ({
  store,
  now = () => new Date(),
  showSnack,
  selectTask,
  newId = randomId,
}: HostOptions): AppHost => {
  const handlers = new Map<string, (() => void)[]>();
  const listeners: (() => void)[] = [];
  const emit = (...hooks: string[]) => {
    for (const hook of hooks) for (const handler of handlers.get(hook) ?? []) handler();
    for (const listener of listeners) listener();
  };

  const api: HostApi = {
    getAppState: async () =>
      ({
        tasks: store.data.task.entities,
        taskRepeatCfgs: store.data.taskRepeatCfg.entities,
      }) as never,
    getArchivedTasks: async () => archivedTasks(store.data) as never,
    getDayContext: async () => dayContext(store.data, now()),
    listSyncedDataKeys: async (prefix = '') =>
      store.data.pluginUserData
        .filter((entry) => entry.id.startsWith(`${PLUGIN_ID}:${prefix}`) && entry.data !== '')
        .map((entry) => entry.id.slice(PLUGIN_ID.length + 1))
        .sort(),
    loadSyncedData: async (key?: string) => {
      const entry = store.data.pluginUserData.find((e) => e.id === dataId(key));
      return entry ? decodeData(entry.data) : null;
    },
    persistDataSynced: async (value: string, key?: string) => {
      const id = dataId(key);
      await store.update((data) => ({
        ...data,
        pluginUserData: [
          ...data.pluginUserData.filter((entry) => entry.id !== id),
          { id, data: value },
        ],
      }));
      emit('persistedDataChanged');
    },
    showSnack,
    registerHook: (hook: Hooks, handler: (payload: never) => void) => {
      handlers.set(hook, [...(handlers.get(hook) ?? []), () => handler(undefined as never)]);
    },
  };

  const createHabit: NonNullable<ViewHost['createHabit']> = async ({ title, schedule }) => {
    const { todayStr } = dayContext(store.data, now());
    const repeatCfgId = newId();
    let taskId = '';
    await store.update((data) => {
      const habit = newHabit(data, { cfgId: repeatCfgId, title, schedule, today: todayStr });
      taskId = habit.taskId;
      return habit.data;
    });
    emit('dataChanged');
    return { taskId, repeatCfgId };
  };

  const view: ViewHost = {
    getAppState: () => api.getAppState(),
    selectTask: (taskId) => selectTask(taskId),
    // Not used while `createHabit` is there: a task without a repeat is
    // not something the app's habits have, so it is a daily one.
    addTask: async ({ title }) =>
      (await createHabit({ title, schedule: { type: 'daily' } })).taskId,
    createHabit,
  };

  return { api, view, emit, onChange: (listener) => listeners.push(listener) };
};
