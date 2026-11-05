import type { SnapshotRepeatCfg, SnapshotTask } from './types/snapshot';

/**
 * Resolves a stage's binding (docs/decisions/recurring-task-setup.md) to its
 * repeat config and the tasks that are instances of it.
 */

export type ResolvedBinding =
  | { readonly kind: 'unbound' }
  | {
      readonly kind: 'bound';
      readonly cfg: SnapshotRepeatCfg;
      readonly tasks: readonly SnapshotTask[];
    };

export const resolveBinding = (
  binding: { taskId: string; repeatCfgId?: string } | undefined,
  tasks: readonly SnapshotTask[],
  repeatCfgs: readonly SnapshotRepeatCfg[],
): ResolvedBinding => {
  if (!binding) return { kind: 'unbound' };
  const cfgById = new Map(repeatCfgs.map((cfg) => [cfg.id, cfg]));
  // The binding may be written before the user set the repeat (create and
  // hand over), so the task's current repeatCfgId is the fallback. Deleting
  // a repeat config clears repeatCfgId everywhere: the stage is unbound.
  const boundTask = tasks.find((task) => task.id === binding.taskId);
  const cfg =
    (binding.repeatCfgId ? cfgById.get(binding.repeatCfgId) : undefined) ??
    (boundTask?.repeatCfgId ? cfgById.get(boundTask.repeatCfgId) : undefined);
  if (!cfg) return { kind: 'unbound' };
  return { kind: 'bound', cfg, tasks: tasks.filter((task) => task.repeatCfgId === cfg.id) };
};
