import { createSignal, onMount, Show } from 'solid-js';
import { QuestArcState } from '../types/state';
import { MESSAGE_TYPES, PluginMessage } from '../types/messages';
import './App.css';

const sendMessage = async (type: string, payload?: any) => {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(2, 11);
    console.log('QuestArc UI: Sending message:', { type, payload, messageId });

    const handler = (event: MessageEvent) => {
      console.log('QuestArc UI: Received response:', event.data);
      if (event.data.messageId === messageId) {
        window.removeEventListener('message', handler);
        resolve(event.data.response);
      }
    };

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      console.error('QuestArc UI: Message timeout for:', type);
      reject(new Error('Message timeout'));
    }, 5000);

    window.addEventListener('message', handler);
    window.parent.postMessage({ type, payload, messageId }, '*');
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

  const resetGame = async () => {
    if (confirm('Are you sure you want to reset all progress?')) {
      const newState = await sendMessage(MESSAGE_TYPES.DEV_RESET) as QuestArcState;
      setState(newState);
    }
  };

  return (
    <div class="app">
      <Show when={state()} fallback={<div class="loading">Loading QuestArc...</div>}>
        {(s) => (
          <main class="app-main">
            <header class="quest-header">
              <h1>⚔️ QuestArc</h1>
              <div class="profile-summary">
                <span class="level-badge">Lvl {s().profile.level}</span>
                <div class="xp-bar-container">
                  <div 
                    class="xp-bar-fill" 
                    style={{ width: `${(s().profile.xp / s().profile.xpToNextLevel) * 100}%` }}
                  ></div>
                </div>
                <span class="xp-text">{s().profile.xp} / {s().profile.xpToNextLevel} XP</span>
              </div>
            </header>

            <section class="active-quest">
              <h2>Current Story Step</h2>
              <div class="step-card">
                <h3>{s().activeStory.id.replace(/_/g, ' ').toUpperCase()}</h3>
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
              <button class="reset-btn" onClick={resetGame}>Reset Progress</button>
            </footer>
          </main>
        )}
      </Show>
    </div>
  );
}

export default App;