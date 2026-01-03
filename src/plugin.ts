import { QuestArcState } from './types/state';
import { createInitialState, migrateState, validateState, ensureState, getCurrentStep } from './lib/state-manager';
import { initializeBossIfNeeded } from './lib/game-logic';
import { PluginService } from './services/PluginService';
import { HeaderService } from './services/HeaderService';
import { TaskService } from './services/TaskService';
import { TaskCompletionHandler } from './handlers/TaskCompletionHandler';
import { TaskUndoHandler } from './handlers/TaskUndoHandler';
import { MessageHandler } from './handlers/MessageHandler';

let state: QuestArcState;

const api = PluginService.api;
const updateChannel = new BroadcastChannel('quest-arc-updates');

async function saveState(newState?: QuestArcState) {
  if (newState) state = newState;
  await PluginService.saveState(JSON.stringify(state));
  updateChannel.postMessage('UPDATE');
}

async function init() {
  try {
    PluginService.log.info('Plugin loading...');
    const saved = await PluginService.loadState();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (!validateState(parsed)) {
          PluginService.log.warn('Invalid state structure, resetting to initial state');
          state = createInitialState();
        } else {
          state = ensureState(migrateState(parsed));

          // Self-heal: Ensure boss is initialized if needed
          const currentStep = getCurrentStep(state);
          if (currentStep) {
            state = initializeBossIfNeeded(state, currentStep);
          }

          PluginService.log.info('State loaded and migrated successfully');
        }
      } catch (parseError) {
        PluginService.log.error('Failed to parse saved state:', parseError);
        state = createInitialState();
      }
    } else {
      state = createInitialState();
      PluginService.log.info('No saved state found, using initial state');
      const currentStep = getCurrentStep(state);
      if (currentStep) {
        await TaskService.createTasksForStep(currentStep);
        state = initializeBossIfNeeded(state, currentStep);
      }
    }

    HeaderService.updateHeader(state);
    PluginService.log.info('QuestArc initialized successfully');
  } catch (error) {
    PluginService.log.error('Critical error during initialization:', error);
    state = createInitialState();
    HeaderService.updateHeader(state);
  }
}

// Hooks
api.registerHook('taskComplete' as any, async (payload: unknown) => {
  await TaskCompletionHandler.handle(state, payload, saveState);
});

api.registerHook('taskUpdate' as any, async (payload: unknown) => {
  // payload: { task: Task, oldTask: Task } or just task?
  // Docs say taskUpdate returns "taskUpdate(task, updates, isRecursive)"? No, let's check docs again if needed.
  // Actually usually it passes the task. 
  // We need to check if isDone changed from true to false.
  // BUT `taskUpdate` usually triggers on ANY update.
  const updatePayload = payload as { task: unknown };
  const task = updatePayload.task as any; // Type casting for safety

  if (task && task.isDone === false) {
    // It *might* be an undo.
    // We check if we have progress recorded for it.
    await TaskUndoHandler.handle(state, task, saveState);
  }
});

// UI Communication
if (api.onMessage) {
  api.onMessage(async (message: any) => {
    return MessageHandler.handle(
      message,
      state,
      (newState) => { state = newState; },
      () => saveState()
    );
  });
} else {
  PluginService.log.warn('onMessage not available!');
}

// Entry point
init();
