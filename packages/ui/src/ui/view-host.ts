import type { PluginAppState } from '@super-productivity/plugin-api';
import type { Schedule } from '@questarc/engine';

/**
 * What the screens need from the host that shows them: the tasks and
 * repeat configs to list, a way to show a task, and a way to make one.
 * The plugin answers from Super Productivity's plugin API, the standalone
 * app from its own dataset; the screens never reach for a global.
 */
export interface ViewHost {
  getAppState(): Promise<PluginAppState>;
  /** Shows the task to the user. */
  selectTask(taskId: string): void | Promise<void>;
  /** Adds a task with this title and returns its id. */
  addTask(task: { title: string }): Promise<string>;
  /**
   * Creates a recurring task on the given schedule. Only hosts that can
   * create a repeat offer it; the others make a task the user sets the
   * repeat of (docs/decisions/recurring-task-setup.md).
   */
  createHabit?(habit: {
    title: string;
    schedule: Schedule;
  }): Promise<{ taskId: string; repeatCfgId: string }>;
}
