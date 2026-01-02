import { createSignal, onMount, Show, For, Index } from 'solid-js';
import { QuestArcState, HeroStory } from '../types/state';
import { MESSAGE_TYPES, PluginMessage } from '../types/messages';
import { getCurrentStepTitle } from '../lib/state-manager';
import { STATE_POLL_INTERVAL_MS, MESSAGE_TIMEOUT_MS, RESET_CONFIRMATION_TIMEOUT_MS } from '../lib/constants';
import { logger } from '../lib/logger';
import './App.css';
import avatarImg from '../assets/avatar.svg';

const sendMessage = async (type: string, payload?: any) => {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(2, 11);
    logger.debug('UI: Sending message:', { type, payload, messageId });

    const handler = (event: MessageEvent) => {
      logger.debug('UI: Received response:', event.data);
      // Check for both MESSAGE_RESPONSE and PLUGIN_MESSAGE_RESPONSE
      if (event.data.type === 'PLUGIN_MESSAGE_RESPONSE' && event.data.messageId === messageId) {
        window.removeEventListener('message', handler);
        clearTimeout(timeout);
        resolve(event.data.result);
      }
    };

    // Timeout after configured timeout
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      logger.error('UI: Message timeout for:', type);
      reject(new Error('Message timeout'));
    }, MESSAGE_TIMEOUT_MS);

    window.addEventListener('message', handler);
    // Super Productivity expects type: 'PLUGIN_MESSAGE' with message inside
    window.parent.postMessage({
      type: 'PLUGIN_MESSAGE',
      message: { type, payload },
      messageId
    }, '*');
  });
};

/**
 * Efficient state comparison that checks only fields likely to change
 * instead of serializing the entire state tree
 */
function hasStateChanged(oldState: QuestArcState, newState: QuestArcState): boolean {
  // Check profile changes
  if (oldState.profile.level !== newState.profile.level) return true;
  if (oldState.profile.xp !== newState.profile.xp) return true;
  if (oldState.profile.hp !== newState.profile.hp) return true;
  if (oldState.profile.pet.stage !== newState.profile.pet.stage) return true;

  // Check active story changes
  if (oldState.activeStory.id !== newState.activeStory.id) return true;
  if (oldState.activeStory.currentStepId !== newState.activeStory.currentStepId) return true;
  if (oldState.activeStory.streakProgress !== newState.activeStory.streakProgress) return true;

  // Check boss changes
  const oldBoss = oldState.activeBoss;
  const newBoss = newState.activeBoss;
  if ((oldBoss === null) !== (newBoss === null)) return true;
  if (oldBoss && newBoss) {
    if (oldBoss.hp !== newBoss.hp) return true;
    if (oldBoss.isDead !== newBoss.isDead) return true;
  }

  // Check stories array length (for new stories)
  if (oldState.stories.length !== newState.stories.length) return true;

  return false;
}

function App() {
  const [state, setState] = createSignal<QuestArcState | null>(null);
  const [lastUpdate, setLastUpdate] = createSignal<number>(Date.now());

  onMount(async () => {
    // Initial sync
    const initialState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
    setState(initialState);

    // Poll for state updates at configured interval
    // This is necessary because plugin.ts can't push updates to the iframe
    setInterval(async () => {
      try {
        const newState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;

        // Check if state actually changed by comparing key fields
        const currentState = state();
        if (currentState && hasStateChanged(currentState, newState)) {
          setState(newState);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        logger.error('Failed to sync state:', error);
      }
    }, STATE_POLL_INTERVAL_MS);
  });

  const [view, setView] = createSignal<'dashboard' | 'editor' | 'story-list'>('dashboard');

  // Editor State
  const [storyTitle, setStoryTitle] = createSignal('');
  const [editingStoryId, setEditingStoryId] = createSignal<string | null>(null);
  const [steps, setSteps] = createSignal<{ title: string; target: number; xp: number }[]>([
    { title: '', target: 3, xp: 50 }
  ]);

  // Error State
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const loadStoryForEditing = (story: HeroStory) => {
    setStoryTitle(story.title);
    setEditingStoryId(story.id);
    setSteps(story.steps.map(s => ({
      title: s.title,
      target: s.condition?.target || 1,
      xp: s.xpReward
    })));
    setView('editor');
  };

  const createNewStory = () => {
    setStoryTitle('');
    setEditingStoryId(null);
    setSteps([{ title: '', target: 3, xp: 50 }]);
    setView('editor');
  };

  const addStep = () => {
    setSteps([...steps(), { title: '', target: 3, xp: 50 }]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps()];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps()];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const saveStory = async () => {
    if (!storyTitle() || steps().length === 0) return;

    // Clear any previous errors
    setErrorMessage(null);

    try {
      // Auto-link steps
      const finalSteps = steps().map((step, index) => ({
        id: index + 1,
        title: step.title,
        condition: { type: 'streak' as const, target: step.target },
        xpReward: step.xp,
        nextStepId: index < steps().length - 1 ? index + 2 : null
      }));

      const storyToSave: HeroStory = {
        id: editingStoryId() || `story_${Date.now()}`,
        title: storyTitle(),
        steps: finalSteps
      };

      const response: any = await sendMessage(MESSAGE_TYPES.SAVE_STORY, storyToSave);

      if (response && response.success) {
        setView('dashboard');
        // Reset form
        setStoryTitle('');
        setEditingStoryId(null);
        setSteps([{ title: '', target: 3, xp: 50 }]);
        // Force sync
        const newState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
        setState(newState);
      } else {
        // Handle validation or server errors
        const errorMsg = response?.error || 'Failed to save story';
        setErrorMessage(errorMsg);
        logger.error('Save story failed:', errorMsg);
      }
    } catch (error) {
      // Handle network or timeout errors
      const errorMsg = error instanceof Error ? error.message : 'Network error occurred';
      setErrorMessage(`Failed to save: ${errorMsg}`);
      logger.error('Save story error:', error);
    }
  };

  const [isResetConfirming, setIsResetConfirming] = createSignal(false);

  const resetGame = async () => {
    if (!isResetConfirming()) {
      setIsResetConfirming(true);
      // Reset confirmation state after configured timeout if not clicked
      setTimeout(() => setIsResetConfirming(false), RESET_CONFIRMATION_TIMEOUT_MS);
      return;
    }

    // Actually reset
    const newState = await sendMessage(MESSAGE_TYPES.DEV_RESET) as QuestArcState;
    setState(newState);
    setIsResetConfirming(false);
  };

  return (
    <div class="app">
      <Show when={state()} fallback={<div class="loading">Loading QuestArc...</div>}>
        {(s) => (
          <main class="app-main">
            <header class="quest-header">
              <div class="header-content">
                <div class="avatar-container">
                  <img src={avatarImg} alt={`Level ${s().profile.level} Hero`} class="avatar" />
                  <Show when={s().profile.pet}>
                    {(pet) => {
                      const stage = pet().stage;
                      const petClass = stage === 1 ? 'pet-egg' : stage === 2 ? 'pet-baby' : 'pet-adult';
                      const petEmoji = stage === 1 ? '🥚' : stage === 2 ? '💧' : '🐉';

                      return (
                        <div class="pet-container">
                          <div class="pet-name-tooltip">{pet().name} (Stage {stage})</div>
                          <div class={`pet ${petClass}`}>
                            {petEmoji}
                          </div>
                        </div>
                      );
                    }}
                  </Show>
                </div>
                <div class="stats-container">
                  <div class="stats-top-row">
                    <h1 class="level-headline">Lvl {s().profile.level}</h1>
                    <span class="xp-total">{s().profile.xp}/{s().profile.xpToNextLevel} XP</span>
                  </div>

                  {/* HP Bar */}
                  <div class="bar-row compact-bar">
                    <div class="hp-bar-container user-hp">
                      <div
                        class="hp-bar-fill user-hp-fill"
                        style={{ width: `${(s().profile.hp / s().profile.maxHp) * 100}%` }}
                      ></div>
                    </div>
                    <span class="bar-text-overlay">{s().profile.hp} HP</span>
                  </div>

                  {/* XP Bar */}
                  <div class="bar-row compact-bar">
                    <div class="xp-bar-container">
                      <div
                        class="xp-bar-fill"
                        style={{ width: `${(s().profile.xp / s().profile.xpToNextLevel) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div class="view-content">
              <Show when={view() === 'dashboard'}>
                <section class="active-quest">
                  <h2>Current Story Step</h2>
                  <div class="step-card">
                    <h3>{getCurrentStepTitle(s())}</h3>
                    <p>Step ID: {s().activeStory.currentStepId}</p>

                    <Show when={s().activeBoss}>
                      <div class="boss-battle">
                        <h4>👹 BOSS BATTLE</h4>
                        <div class="hp-bar-container">
                          <div
                            class="hp-bar-fill"
                            style={{ width: `${(s().activeBoss!.hp / s().activeBoss!.maxHp) * 100}%` }}
                          ></div>
                        </div>
                        <p class="hp-text">{s().activeBoss!.hp} / {s().activeBoss!.maxHp} HP</p>
                      </div>
                    </Show>

                    <Show when={!s().activeBoss && s().activeStory.streakProgress >= 0}>
                      <div class="streak-progress">
                        <p>Streak Progress: {s().activeStory.streakProgress}</p>
                      </div>
                    </Show>
                  </div>
                  <div class="dashboard-actions">
                    <button class="secondary-btn" onClick={() => setView('story-list')}>
                      📜 My Quests
                    </button>
                    <button class="primary-btn" onClick={createNewStory}>
                      ➕ New Quest
                    </button>
                  </div>
                </section>
              </Show>

              <Show when={view() === 'story-list'}>
                <section class="story-list-view">
                  <h2>My Quests</h2>
                  <div class="story-grid">
                    <Show when={s().stories && s().stories.length > 0} fallback={<div class="empty-state">No quests found. Create one to get started!</div>}>
                      {(s().stories || []).map((story) => (
                        <div class="story-card">
                          <div class="story-info">
                            <h3>{story.title}</h3>
                            <div class="story-meta">
                              <span>👣 {story.steps.length} Steps</span>
                              <span>✨ {story.steps.reduce((acc, step) => acc + step.xpReward, 0)} XP</span>
                            </div>
                          </div>
                          {s().activeStory.id === story.id && <div class="active-badge">Active</div>}
                          <button class="edit-btn" onClick={(e) => { e.stopPropagation(); loadStoryForEditing(story); }} title="Edit Story">✏️</button>
                        </div>
                      ))}
                    </Show>
                  </div>

                  <div class="button-row">
                    <button class="primary-btn" onClick={createNewStory}>
                      ➕ Create New Quest
                    </button>
                    <button class="secondary-btn" onClick={() => setView('dashboard')}>
                      Back to Dashboard
                    </button>
                  </div>
                </section>
              </Show>

              <Show when={view() === 'editor'}>
                <section class="editor-view">
                  <h2>{editingStoryId() ? 'Edit Habit Quest' : 'Create New Habit Quest'}</h2>

                  <div class="form-group">
                    <label>Story Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Marathon Prep"
                      value={storyTitle()}
                      onInput={(e) => setStoryTitle(e.currentTarget.value)}
                    />
                  </div>

                  <div class="steps-list">
                    <Index each={steps()}>
                      {(step, index) => (
                        <div class="step-builder-card">
                          <h4>Step {index + 1}</h4>
                          <div class="form-group">
                            <label>Habit</label>
                            <input
                              type="text"
                              placeholder="e.g. Put on shoes"
                              value={step().title}
                              onInput={(e) => updateStep(index, 'title', e.currentTarget.value)}
                            />
                          </div>
                          <div class="form-row">
                            <div class="form-group half">
                              <label>Days Streak</label>
                              <input
                                type="number"
                                min="1"
                                value={step().target}
                                onInput={(e) => updateStep(index, 'target', parseInt(e.currentTarget.value, 10))}
                              />
                            </div>
                            <div class="form-group half">
                              <label>XP Reward</label>
                              <input
                                type="number"
                                value={step().xp}
                                onInput={(e) => updateStep(index, 'xp', parseInt(e.currentTarget.value, 10))}
                              />
                            </div>
                          </div>
                          {steps().length > 1 && (
                            <button class="remove-btn" onClick={() => removeStep(index)}>
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </Index>
                  </div>

                  <button class="secondary-btn add-step-btn" onClick={addStep}>
                    + Add Next Habit Step
                  </button>

                  <Show when={errorMessage()}>
                    <div class="error-message" style={{ color: 'var(--hp-color)', 'margin-top': '1rem', padding: '0.75rem', border: '1px solid var(--hp-color)', 'border-radius': '4px', 'background-color': 'rgba(239, 68, 68, 0.1)' }}>
                      {errorMessage()}
                    </div>
                  </Show>

                  <div class="button-row">
                    <button class="primary-btn" onClick={saveStory} disabled={!storyTitle() || steps().some(s => !s.title)}>
                      {editingStoryId() ? 'Update Story' : 'Forge Story'}
                    </button>
                    <button class="secondary-btn cancel-btn" onClick={() => { setView('dashboard'); setErrorMessage(null); }}>
                      Cancel
                    </button>
                  </div>
                </section>
              </Show>
            </div>

            <footer class="app-footer">
              <button
                class={`reset-btn ${isResetConfirming() ? 'confirming' : ''}`}
                onClick={resetGame}
                style={isResetConfirming() ? { 'border-color': 'var(--hp-color)', color: 'var(--hp-color)' } : {}}
              >
                {isResetConfirming() ? '⚠️ Tap again to confirm reset' : 'Reset Progress'}
              </button>
            </footer>
          </main>
        )}
      </Show>
    </div >
  );
}

export default App;