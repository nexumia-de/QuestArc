import { QuestArcState } from './types/state';
import { createInitialState, migrateState, ensureState } from './lib/state/persistence';
import { validateState } from './lib/state/validation';
import { getCurrentStep } from './lib/plugin-utils';
import { initializeBossIfNeeded } from './lib/game-logic';
import { PluginService } from './services/PluginService';
import { HeaderService } from './services/HeaderService';
import { TaskService } from './services/TaskService';
import { TaskCompletionHandler } from './handlers/TaskCompletionHandler';
import { TaskUndoHandler } from './handlers/TaskUndoHandler';
import { MessageHandler } from './handlers/MessageHandler';
import { ContextHandler } from './handlers/ContextHandler';


let state: QuestArcState;

const api = PluginService.api;
const updateChannel = new BroadcastChannel('quest-arc-updates');

// Basic debounce implementation
let saveTimeout: any = null;
const SAVE_DELAY = 1500; // 1.5s delay to satisfy rate limit

async function saveState(newState?: QuestArcState) {
  if (newState) state = newState;

  // Always update header immediately for UI responsiveness
  HeaderService.updateHeader(state);
  updateChannel.postMessage('UPDATE');

  // Cancel pending save
  if (saveTimeout) clearTimeout(saveTimeout);

  // Schedule new save
  saveTimeout = setTimeout(async () => {
    try {
      await PluginService.saveState(JSON.stringify(state));
    } catch (e) {
      PluginService.log.error('Failed to save state:', e);
    }
    saveTimeout = null;
  }, SAVE_DELAY);
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

          // Register hook to call TaskHandler
          // Note: Assuming PluginAPI.Hooks.TASK_COMPLETE maps to 'taskComplete' or similar string literal
          // and that TaskHandler.handleTaskComplete expects a taskId.
          // This is a new hook registration, distinct from the existing TaskCompletionHandler.


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
        await TaskService.createTasksForStep(currentStep, false, state.activeStory.id);
        state = initializeBossIfNeeded(state, currentStep);
      }
    }

    HeaderService.updateHeader(state);
    HeaderService.updateHeader(state);

    // Check for daily habit resets
    await TaskService.checkDailyResets();

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
  const updatePayload = payload as { task: unknown };
  const task = updatePayload.task as any;

  if (!task) return;

  // 1. Undo Handling
  if (task.isDone === false) {
    await TaskUndoHandler.handle(state, task, saveState);
  }

  // 2. Boss Detection (Context Update)
  // If I rename a task or move it, re-check context.
  await ContextHandler.handle(task.id, state, saveState);
});

api.registerHook('currentTaskChange' as any, async (taskId: unknown) => {
  // Proactive Boss Detection on Context Switch
  await ContextHandler.handle(taskId as string | null, state, saveState);
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
