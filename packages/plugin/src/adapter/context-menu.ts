import { bindStage } from '@questarc/engine';
import { capitalise } from '@questarc/ui/shared/plan';
import { t } from '@questarc/ui/shared/texts';
import type { Brain } from '@questarc/ui/adapter/brain';
import type { HostApi } from '@questarc/ui/adapter/host';

/**
 * The task context menu entry "Use for current QuestArc station"
 * (docs/decisions/recurring-task-setup.md, way 2): binds the chosen task
 * to the active journey's current stage. A task that does not repeat yet
 * is bound too; the stage waits until the user sets the repeat.
 */
export const useForCurrentStation = async (
  api: HostApi,
  brain: Brain,
  taskId: string,
): Promise<string> => {
  const { view, journeys } = await brain.state();
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  const stage = run && journey?.stages[run.position.stage];
  if (!run || !stage || run.stations.every((s) => s.state === 'done'))
    return t('ui.menu.no-journey');
  const task = (await api.getAppState()).tasks[taskId];
  await brain.write(
    bindStage({
      runId: run.runId,
      stageId: stage.id,
      taskId,
      repeatCfgId: task?.repeatCfgId ?? null,
      day: view.todayStr,
    }),
  );
  return task?.repeatCfgId
    ? t('ui.menu.bound', { action: capitalise(t(stage.plan.action)) })
    : t('ui.menu.bound-waiting');
};
