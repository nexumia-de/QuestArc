import { createSignal, onMount, Show, For } from 'solid-js';
import { QuestArcState, HeroStory } from '../types/state';
import { MESSAGE_TYPES, PluginMessage } from '../types/messages';
import { getCurrentStepTitle } from '../lib/state-manager';
import './App.css';
import avatarImg from '../assets/avatar.svg';

const sendMessage = async (type: string, payload?: any) => {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(2, 11);
    console.log('QuestArc UI: Sending message:', { type, payload, messageId });

    const handler = (event: MessageEvent) => {
      console.log('QuestArc UI: Received response:', event.data);
      // Check for both MESSAGE_RESPONSE and PLUGIN_MESSAGE_RESPONSE
      if (event.data.type === 'PLUGIN_MESSAGE_RESPONSE' && event.data.messageId === messageId) {
        window.removeEventListener('message', handler);
        clearTimeout(timeout);
        resolve(event.data.result);
      }
    };

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      console.error('QuestArc UI: Message timeout for:', type);
      reject(new Error('Message timeout'));
    }, 5000);

    window.addEventListener('message', handler);
    // Super Productivity expects type: 'PLUGIN_MESSAGE' with message inside
    window.parent.postMessage({
      type: 'PLUGIN_MESSAGE',
      message: { type, payload },
      messageId
    }, '*');
  });
};

function App() {
  const [state, setState] = createSignal<QuestArcState | null>(null);
  const [lastUpdate, setLastUpdate] = createSignal<number>(Date.now());

  onMount(async () => {
    // Initial sync
    const initialState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
    setState(initialState);

    // Poll for state updates every 2 seconds
    // This is necessary because plugin.ts can't push updates to the iframe
    setInterval(async () => {
      try {
        const newState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;

        // Check if state actually changed to avoid unnecessary re-renders
        const currentState = state();
        if (currentState && JSON.stringify(newState) !== JSON.stringify(currentState)) {
          setState(newState);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error('Failed to sync state:', error);
      }
    }, 2000);
  });

  const [view, setView] = createSignal<'dashboard' | 'editor' | 'story-list'>('dashboard');

  // Editor State
  const [storyTitle, setStoryTitle] = createSignal('');
  const [steps, setSteps] = createSignal<{ title: string; target: number; xp: number }[]>([
    { title: '', target: 3, xp: 50 }
  ]);

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

    // Auto-link steps
    const finalSteps = steps().map((step, index) => ({
      id: index + 1,
      title: step.title,
      condition: { type: 'streak' as const, target: step.target },
      xpReward: step.xp,
      nextStepId: index < steps().length - 1 ? index + 2 : undefined
    }));

    const storyToSave: HeroStory = {
      id: `story_${Date.now()}`,
      title: storyTitle(),
      steps: finalSteps
    };

    const response: any = await sendMessage(MESSAGE_TYPES.SAVE_STORY, storyToSave);
    if (response && response.success) {
      setView('dashboard');
      // Reset form
      setStoryTitle('');
      setSteps([{ title: '', target: 3, xp: 50 }]);
      // Force sync
      const newState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
      setState(newState);
    }
  };

  const [isResetConfirming, setIsResetConfirming] = createSignal(false);

  const resetGame = async () => {
    if (!isResetConfirming()) {
      setIsResetConfirming(true);
      // Reset confirmation state after 3 seconds if not clicked
      setTimeout(() => setIsResetConfirming(false), 3000);
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
                    <button class="primary-btn" onClick={() => setView('editor')}>
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
                        </div>
                      ))}
                    </Show>
                  </div>

                  <div class="button-row">
                    <button class="primary-btn" onClick={() => setView('editor')}>
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
                  <h2>Create New Habit Quest</h2>

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
                    <For each={steps()}>
                      {(step, index) => (
                        <div class="step-builder-card">
                          <h4>Step {index() + 1}</h4>
                          <div class="form-group">
                            <label>Habit</label>
                            <input
                              type="text"
                              placeholder="e.g. Put on shoes"
                              value={step.title}
                              onInput={(e) => updateStep(index(), 'title', e.currentTarget.value)}
                            />
                          </div>
                          <div class="form-row">
                            <div class="form-group half">
                              <label>Days Streak</label>
                              <input
                                type="number"
                                min="1"
                                value={step.target}
                                onInput={(e) => updateStep(index(), 'target', parseInt(e.currentTarget.value))}
                              />
                            </div>
                            <div class="form-group half">
                              <label>XP Reward</label>
                              <input
                                type="number"
                                value={step.xp}
                                onInput={(e) => updateStep(index(), 'xp', parseInt(e.currentTarget.value))}
                              />
                            </div>
                          </div>
                          {steps().length > 1 && (
                            <button class="remove-btn" onClick={() => removeStep(index())}>
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </For>
                  </div>

                  <button class="secondary-btn add-step-btn" onClick={addStep}>
                    + Add Next Habit Step
                  </button>

                  <div class="button-row">
                    <button class="primary-btn" onClick={saveStory} disabled={!storyTitle() || steps().some(s => !s.title)}>
                      Forge Story
                    </button>
                    <button class="secondary-btn cancel-btn" onClick={() => setView('dashboard')}>
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