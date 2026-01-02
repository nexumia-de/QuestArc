import type {
  PluginAPI as PluginAPIBase,
  Task,
} from '@super-productivity/plugin-api';
import { QuestArcState, HeroStory } from './types/state';
import { MESSAGE_TYPES } from './types/messages';
import { createInitialState, updateXp, migrateState, validateState, ensureState, getCurrentStep } from './lib/state-manager';
import { processTaskCompletion, initializeBossIfNeeded } from './lib/game-logic';
import { createPluginLogger } from './lib/logger';

// Define missing types locally
export interface TaskCompletePayload {
  task: Task;
}

// Augment PluginAPI to include missing methods that exist at runtime
interface PluginAPI extends PluginAPIBase {
  log: {
    info(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
  };
  onMessage?: (handler: (message: any) => Promise<any> | any) => void;
}

// Super Productivity provides 'PluginAPI' as a global variable
declare const PluginAPI: PluginAPI;

// Create plugin logger that uses PluginAPI.log when available
const log = createPluginLogger(PluginAPI);

log.info('Plugin loading...', typeof PluginAPI);

let state: QuestArcState;

async function init() {
  try {
    const saved = await PluginAPI.loadSyncedData();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Validate structure
        if (!validateState(parsed)) {
          log.warn('Invalid state structure, resetting to initial state');
          state = createInitialState();
        } else {
          // Migrate if needed
          state = migrateState(parsed);
          state = ensureState(state); // Ensure new fields like HP exist
          log.info('State loaded and migrated successfully');
        }
      } catch (parseError) {
        log.error('Failed to parse saved state:', parseError);
        state = createInitialState();
      }
    } else {
      state = createInitialState();
      log.info('No saved state found, using initial state');
    }

    updateHeader();
    log.info('QuestArc initialized successfully');
  } catch (error) {
    log.error('Critical error during initialization:', error);
    state = createInitialState();
    updateHeader();
  }
}

function updateHeader() {
  // Note: Header buttons can't be dynamically updated after registration
  // This is called once during init. For dynamic updates, users should open the plugin UI
  if (state.activeBoss && !state.activeBoss.isDead) {
    PluginAPI.registerHeaderButton({
      label: `👹 ${state.activeBoss.hp}/${state.activeBoss.maxHp} HP`,
      icon: 'skull',
      onClick: () => PluginAPI.showIndexHtmlAsView(),
    });
  } else {
    PluginAPI.registerHeaderButton({
      label: `Lvl ${state.profile.level}`,
      icon: 'trending_up',
      onClick: () => PluginAPI.showIndexHtmlAsView(),
    });
  }
}

async function saveState() {
  await PluginAPI.persistDataSynced(JSON.stringify(state));
}

// Hooks
PluginAPI.registerHook('taskComplete' as any, async (payload: unknown) => {
  // Cast payload to TaskCompletePayload
  const taskPayload = payload as TaskCompletePayload;

  log.info('Task completed!', taskPayload);
  const currentStep = getCurrentStep(state);
  if (!currentStep) {
    log.info('No current step found');
    return;
  }
  log.info('Current step:', currentStep);

  // Initialize boss if needed
  state = initializeBossIfNeeded(state, currentStep);

  const result = processTaskCompletion(state, taskPayload.task, currentStep);
  state = result.newState;
  const { damageDealt, stepCompleted } = result;

  if (stepCompleted) {
    const xpResult = updateXp(state, currentStep.xpReward);
    state = xpResult.state;
    const leveledUp = xpResult.leveledUp;

    let snackMessage = `Quest Step Completed: ${currentStep.title}! +${currentStep.xpReward} XP`;
    if (leveledUp) {
      snackMessage += ` 🎉 Level Up! Now Level ${state.profile.level}!`;
    }

    // Move to next step
    if (currentStep.nextStepId) {
      state = {
        ...state,
        activeStory: {
          ...state.activeStory,
          currentStepId: currentStep.nextStepId,
          streakProgress: 0,
          taskProgress: {}
        },
        activeBoss: null
      };

      // Rename the host task to the new step title
      const nextStep = state.activeStory && state.stories
        ? state.stories.find(s => s.id === state.activeStory.id)?.steps.find(step => step.id === currentStep.nextStepId)
        : null;

      if (nextStep) {
        try {
          if (PluginAPI.updateTask) {
            PluginAPI.updateTask(taskPayload.task.id, { title: nextStep.title });
            log.info(`Updated task title to: ${nextStep.title}`);
          }

          // Auto-create tasks for the new step
          if (nextStep.tasksToCreate) {
            nextStep.tasksToCreate.forEach(async (taskDef) => {
              if (taskDef.isAutoCreate && PluginAPI.addTask) {
                try {
                  const additionalFields: any = {
                    notes: taskDef.notes || `Quest Sub-task for: ${nextStep.title}`
                  };

                  if (taskDef.isRepeating && taskDef.repeatCfg) {
                    additionalFields.taskRepeatCfg = {
                      repeatEvery: 1, // Default to 1
                      repeatCycle: taskDef.repeatCfg.repeatType || 'DAILY',
                      startDate: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
                    };
                  }

                  await PluginAPI.addTask({
                    title: taskDef.title,
                    ...additionalFields
                  });
                  log.info(`Auto-created task: ${taskDef.title} (Repeat: ${taskDef.isRepeating})`);
                } catch (e) {
                  log.error(`Failed to auto-create task: ${taskDef.title}`, e);
                }
              }
            });
          }

        } catch (err) {
          log.error('Failed to update task title/create subtasks', err);
        }
      }
    }

    PluginAPI.showSnack({
      msg: snackMessage,
      type: 'SUCCESS',
    });
  } else if (damageDealt > 0) {
    // Show damage notification for boss hits
    PluginAPI.showSnack({
      msg: `💥 Dealt ${damageDealt} damage to boss! HP: ${state.activeBoss?.hp}/${state.activeBoss?.maxHp}`,
      type: 'SUCCESS',
    });
  }

  await saveState();
  // Note: UI will poll for updates via REQUEST_SYNC message
});

// UI Communication - Handle messages from the iframe
if (PluginAPI.onMessage) {
  PluginAPI.onMessage(async (message: any) => {
    log.debug('Received message from UI:', message);
    switch (message.type) {
      case MESSAGE_TYPES.REQUEST_SYNC:
        log.debug('Sending state to UI');
        // Return current state to UI
        return state;
      case MESSAGE_TYPES.DEV_RESET:
        log.info('Resetting progress');
        // Reset all progress
        state = createInitialState();
        await saveState();
        log.info('Progress reset');
        return state;
      case MESSAGE_TYPES.SAVE_STORY:
        const newStory = message.payload as HeroStory;
        log.info('Saving story:', newStory.title);

        // Validation
        if (!newStory.id || !newStory.steps || newStory.steps.length === 0) {
          log.error('Invalid story format', newStory);
          return { error: 'Invalid Story Format' };
        }

        // Initialize stories if needed
        const currentStories = state.stories ? [...state.stories] : [];

        // Update or Add
        const existingIdx = currentStories.findIndex(s => s.id === newStory.id);
        if (existingIdx > -1) {
          currentStories[existingIdx] = newStory;
        } else {
          currentStories.push(newStory);
        }

        state = { ...state, stories: currentStories };

        await saveState();
        log.info(`Story saved: ${newStory.title}`);
        return { success: true, stories: state.stories };
      default:
        log.warn('Unknown message type:', message.type);
        return { error: 'Unknown message type' };
    }
  });
} else {
  log.warn('onMessage not available!');
}

// Entry point
init();
