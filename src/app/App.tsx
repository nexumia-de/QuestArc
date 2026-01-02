import { createSignal, onMount, Show } from 'solid-js';
import { QuestArcState } from '../types/state';
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
                  <h1 class="level-headline">Lvl {s().profile.level}</h1>

                  {/* User HP Bar */}
                  <div class="bar-row">
                    <div class="hp-bar-container user-hp">
                      <div
                        class="hp-bar-fill user-hp-fill"
                        style={{ width: `${(s().profile.hp / s().profile.maxHp) * 100}%` }}
                      ></div>
                    </div>
                    <span class="bar-text">{s().profile.hp}/{s().profile.maxHp} HP</span>
                  </div>

                  {/* XP Bar */}
                  <div class="bar-row">
                    <div class="xp-bar-container">
                      <div
                        class="xp-bar-fill"
                        style={{ width: `${(s().profile.xp / s().profile.xpToNextLevel) * 100}%` }}
                      ></div>
                    </div>
                    <span class="bar-text">{s().profile.xp}/{s().profile.xpToNextLevel} XP</span>
                  </div>
                </div>
              </div>
            </header>

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
            </section>

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
    </div>
  );
}

export default App;