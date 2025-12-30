import {
  PluginAPI,
  TaskCompletePayload,
} from '@super-productivity/plugin-api';
import { PluginHooks } from '@super-productivity/plugin-api';
import { QuestArcState, HeroStory, StoryStep } from './types/state';
import { MESSAGE_TYPES, PluginMessage } from './types/messages';
import { createInitialState, updateXp } from './lib/state-manager';
import { processTaskCompletion } from './lib/game-logic';

declare const plugin: PluginAPI;

let state: QuestArcState;

// Mock Story Data (In real app, this might be loaded from assets)
const STORY_DATA: HeroStory = {
  id: 'story_productivity_mastery',
  title: 'Productivity Mastery',
  steps: [
    {
      id: 1,
      title: 'The First Step',
      condition: { type: 'streak', target: 3 },
      xpReward: 50,
      nextStepId: 2,
    },
    {
      id: 2,
      title: 'Boss Fight: Procrastination Monster',
      type: 'boss',
      boss: {
        hp: 100,
        maxHp: 100,
        damageModifiers: [
          { trigger: { type: 'tag', value: 'deep-work' }, multiplier: 2.0 },
        ],
      },
      xpReward: 200,
    },
  ],
};

async function init() {
  const saved = await plugin.loadSyncedData();
  state = saved ? JSON.parse(saved) : createInitialState();
  
  updateHeader();
  plugin.log.info('QuestArc initialized');
}

function updateHeader() {
  if (state.activeBoss && !state.activeBoss.isDead) {
    plugin.registerHeaderListItem({
      id: 'quest-arc-boss-hp',
      label: `👹 Boss HP: ${state.activeBoss.hp}/${state.activeBoss.maxHp}`,
      icon: 'heart',
    });
  } else {
    // Show XP/Level in header if no boss
    plugin.registerHeaderListItem({
      id: 'quest-arc-status',
      label: `Lvl ${state.profile.level} (${state.profile.xp} XP)`,
      icon: 'trending_up',
    });
  }
}

async function saveState() {
  await plugin.persistDataSynced(JSON.stringify(state));
}

function getCurrentStep(): StoryStep | undefined {
  return STORY_DATA.steps.find(s => s.id === state.activeStory.currentStepId);
}

// Hooks
plugin.registerHook(PluginHooks.TASK_COMPLETE, async (payload: TaskCompletePayload) => {
  const currentStep = getCurrentStep();
  if (!currentStep) return;

  // Initialize boss if needed
  if (currentStep.type === 'boss' && !state.activeBoss) {
    state.activeBoss = { ...currentStep.boss! };
  }

  const { damageDealt, stepCompleted } = processTaskCompletion(state, payload.task, currentStep);

  if (damageDealt > 0) {
    broadcast({ type: MESSAGE_TYPES.BOSS_HIT, payload: { damage: damageDealt } });
  }

  if (stepCompleted) {
    const { leveledUp } = updateXp(state, currentStep.xpReward);
    
    if (leveledUp) {
      broadcast({ type: MESSAGE_TYPES.LEVEL_UP, payload: { newLevel: state.profile.level } });
    }

    // Move to next step
    if (currentStep.nextStepId) {
      state.activeStory.currentStepId = currentStep.nextStepId;
      state.activeStory.streakProgress = 0;
      state.activeBoss = null;
    }

    plugin.showSnack({
      msg: `Quest Step Completed: ${currentStep.title}! Received ${currentStep.xpReward} XP.`,
      type: 'SUCCESS',
    });
  }

  updateHeader();
  await saveState();
  broadcast({ type: MESSAGE_TYPES.STATE_SYNC, payload: state });
});

// UI Communication
function broadcast(msg: PluginMessage) {
  // Use postMessage to communicate with the IFrame
  if (window.parent) {
    window.parent.postMessage(msg, '*');
  }
}

if (plugin.onMessage) {
  plugin.onMessage(async (message: PluginMessage) => {
    switch (message.type) {
      case MESSAGE_TYPES.REQUEST_SYNC:
        return state;
      case MESSAGE_TYPES.DEV_RESET:
        state = createInitialState();
        updateHeader();
        await saveState();
        return state;
      default:
        return { error: 'Unknown message type' };
    }
  });
}

// Entry point
init();

plugin.registerHeaderButton({
  icon: 'videogame_asset',
  label: 'QuestArc',
  onClick: () => plugin.showIndexHtmlAsView(),
});