import type { Schedule } from '@questarc/engine';
import type { HostApi } from '@questarc/plugin/src/adapter/host';
import type { Hooks, PluginAPI, SnackCfg } from '@super-productivity/plugin-api';

import { dayContext } from './day';
import { decodeData } from './store/codec';
import { PLUGIN_ID, archivedTasks } from './store/dataset';
import { createHabit } from './store/habits';
import type { Store } from './store/store';

/**
 * The standalone host (#93): the part of Super Productivity's plugin API
 * that QuestArc's adapter and screens use, answered from the app's own
 * dataset. `addTask` differs on purpose: the app owns the habits, so it
 * creates the recurring task with the schedule of the stage it is for,
 * where the plugin has to leave the repeat to the user.
 */

export type AppApi = HostApi & Pick<PluginAPI, 'addTask' | 'selectTask'>;

export interface HostOptions {
  readonly store: Store;
  readonly now?: () => Date;
  /** The schedule of the stage a new task is for; daily without one. */
  readonly schedule: () => Promise<Schedule | undefined>;
  readonly showSnack: (snack: SnackCfg) => void;
  /** Shows a task to the user. */
  readonly selectTask: (taskId: string) => void;
  /** An id for a new repeat config. */
  readonly newId?: () => string;
}

export interface AppHost {
  readonly api: AppApi;
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
  schedule,
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

  const api: AppApi = {
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
    addTask: async ({ title = '' }) => {
      const stage = (await schedule()) ?? { type: 'daily' };
      const { todayStr } = dayContext(store.data, now());
      let taskId = '';
      await store.update((data) => {
        const habit = createHabit(data, {
          cfgId: newId(),
          title,
          schedule: stage,
          today: todayStr,
        });
        taskId = habit.taskId;
        return habit.data;
      });
      emit('dataChanged');
      return taskId;
    },
    selectTask: async (taskId: string) => selectTask(taskId),
  };

  return { api, emit, onChange: (listener) => listeners.push(listener) };
};
