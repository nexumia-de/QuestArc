import type {
  PluginAPI,
  TaskCompletePayload,
  PluginHooks,
} from '@super-productivity/plugin-api';
import { QuestArcState, HeroStory, StoryStep } from './types/state';
import { createInitialState, updateXp, migrateState, validateState, ensureState } from './lib/state-manager';
import { processTaskCompletion } from './lib/game-logic';
import storyDataRaw from './assets/stories/productivity-mastery.json';

// Super Productivity provides 'PluginAPI' as a global variable
declare const PluginAPI: PluginAPI;

console.log('QuestArc: Plugin loading...', typeof PluginAPI);

// Message types - duplicated here to avoid code splitting with UI
const MESSAGE_TYPES = {
  REQUEST_SYNC: 'REQUEST_SYNC',
  DEV_RESET: 'DEV_RESET',
} as const;

// Type assertion for imported JSON
const STORY_DATA = storyDataRaw as HeroStory;

let state: QuestArcState;

async function init() {
  try {
    const saved = await PluginAPI.loadSyncedData();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Validate structure
        if (!validateState(parsed)) {
          PluginAPI.log.warn('Invalid state structure, resetting to initial state');
          state = createInitialState();
        } else {
          // Migrate if needed
          state = migrateState(parsed);
          state = ensureState(state); // Ensure new fields like HP exist
          PluginAPI.log.info('State loaded and migrated successfully');
        }
      } catch (parseError) {
        PluginAPI.log.error('Failed to parse saved state:', parseError);
        state = createInitialState();
      }
    } else {
      state = createInitialState();
      PluginAPI.log.info('No saved state found, using initial state');
    }

    updateHeader();
    PluginAPI.log.info('QuestArc initialized successfully');
  } catch (error) {
    PluginAPI.log.error('Critical error during initialization:', error);
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

function getCurrentStep(): StoryStep | undefined {
  return STORY_DATA.steps.find(s => s.id === state.activeStory.currentStepId);
}

// Hooks
PluginAPI.registerHook('taskComplete' as any, async (payload: TaskCompletePayload) => {
  console.log('QuestArc: Task completed!', payload);
  const currentStep = getCurrentStep();
  if (!currentStep) {
    console.log('QuestArc: No current step found');
    return;
  }
  console.log('QuestArc: Current step:', currentStep);

  // Initialize boss if needed
  if (currentStep.type === 'boss' && !state.activeBoss) {
    state.activeBoss = { ...currentStep.boss!, isDead: false };
  }

  const { damageDealt, stepCompleted } = processTaskCompletion(state, payload.task, currentStep);

  if (stepCompleted) {
    const { leveledUp } = updateXp(state, currentStep.xpReward);

    let snackMessage = `Quest Step Completed: ${currentStep.title}! +${currentStep.xpReward} XP`;
    if (leveledUp) {
      snackMessage += ` 🎉 Level Up! Now Level ${state.profile.level}!`;
    }

    // Move to next step
    if (currentStep.nextStepId) {
      state.activeStory.currentStepId = currentStep.nextStepId;
      state.activeStory.streakProgress = 0;
      state.activeBoss = null;
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
    console.log('QuestArc: Received message from UI:', message);
    switch (message.type) {
      case MESSAGE_TYPES.REQUEST_SYNC:
        console.log('QuestArc: Sending state to UI:', state);
        // Return current state to UI
        return state;
      case MESSAGE_TYPES.DEV_RESET:
        console.log('QuestArc: Resetting progress');
        // Reset all progress
        state = createInitialState();
        await saveState();
        PluginAPI.log.info('Progress reset');
        return state;
      default:
        console.log('QuestArc: Unknown message type:', message.type);
        return { error: 'Unknown message type' };
    }
  });
} else {
  console.log('QuestArc: onMessage not available!');
}

// Entry point
init();