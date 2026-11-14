import type { ViewHost } from '@questarc/ui/ui/view-host';

/**
 * The screens' host in Super Productivity's plugin iframe: the global
 * `PluginAPI` the shim injects. The plugin cannot create a repeat, so
 * there is no `createHabit`; a task is made without short syntax, so the
 * title stays as QuestArc wrote it.
 */
export const createViewHost = (): ViewHost => ({
  getAppState: () => PluginAPI.getAppState(),
  selectTask: (taskId) => PluginAPI.selectTask(taskId),
  addTask: ({ title }) => PluginAPI.addTask({ title, isIgnoreShortSyntax: true }),
});
