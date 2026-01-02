import { createSignal, onMount, Show } from 'solid-js';
import { QuestArcState, HeroStory, StoryStep } from '../types/state';
import { MESSAGE_TYPES } from '../types/messages';
import { STATE_POLL_INTERVAL_MS, MESSAGE_TIMEOUT_MS, RESET_CONFIRMATION_TIMEOUT_MS } from '../lib/constants';
import { logger } from '../lib/logger';
import './App.css';

// Components
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import StoryListView from '../components/StoryListView';
import EditorView from '../components/EditorView';

const sendMessage = async (type: string, payload?: any) => {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(2, 11);
    logger.debug('UI: Sending message:', { type, payload, messageId });

    const handler = (event: MessageEvent) => {
      logger.debug('UI: Received response:', event.data);
      if (event.data.type === 'PLUGIN_MESSAGE_RESPONSE' && event.data.messageId === messageId) {
        window.removeEventListener('message', handler);
        clearTimeout(timeout);
        resolve(event.data.result);
      }
    };

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      logger.error('UI: Message timeout for:', type);
      reject(new Error('Message timeout'));
    }, MESSAGE_TIMEOUT_MS);

    window.addEventListener('message', handler);
    window.parent.postMessage({
      type: 'PLUGIN_MESSAGE',
      message: { type, payload },
      messageId
    }, '*');
  });
};

function hasStateChanged(oldState: QuestArcState, newState: QuestArcState): boolean {
  if (oldState.profile.level !== newState.profile.level) return true;
  if (oldState.profile.xp !== newState.profile.xp) return true;
  if (oldState.profile.hp !== newState.profile.hp) return true;
  if (oldState.profile.pet.stage !== newState.profile.pet.stage) return true;

  if (oldState.activeStory.id !== newState.activeStory.id) return true;
  if (oldState.activeStory.currentStepId !== newState.activeStory.currentStepId) return true;
  if (oldState.activeStory.streakProgress !== newState.activeStory.streakProgress) return true;

  const oldBoss = oldState.activeBoss;
  const newBoss = newState.activeBoss;
  if ((oldBoss === null) !== (newBoss === null)) return true;
  if (oldBoss && newBoss) {
    if (oldBoss.hp !== newBoss.hp) return true;
    if (oldBoss.isDead !== newBoss.isDead) return true;
  }

  if (oldState.stories.length !== newState.stories.length) return true;

  return false;
}

function App() {
  const [state, setState] = createSignal<QuestArcState | null>(null);
  const [view, setView] = createSignal<'dashboard' | 'editor' | 'story-list'>('dashboard');

  // Editor State managed here for navigation purposes (Edit vs New)
  const [editingStory, setEditingStory] = createSignal<HeroStory | null>(null);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [isResetConfirming, setIsResetConfirming] = createSignal(false);

  onMount(async () => {
    const initialState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
    setState(initialState);

    setInterval(async () => {
      try {
        const newState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
        const currentState = state();
        if (currentState && hasStateChanged(currentState, newState)) {
          setState(newState);
        }
      } catch (error) {
        logger.error('Failed to sync state:', error);
      }
    }, STATE_POLL_INTERVAL_MS);
  });

  const loadStoryForEditing = (story: HeroStory) => {
    setEditingStory(story);
    setView('editor');
  };

  const createNewStory = () => {
    setEditingStory(null);
    setView('editor');
  };

  const handleSaveStory = async (title: string, steps: Omit<StoryStep, 'id' | 'nextStepId'>[]) => {
    setErrorMessage(null);

    try {
      const finalSteps = steps.map((step, index) => ({
        ...step,
        id: index + 1,
        nextStepId: index < steps.length - 1 ? index + 2 : null
      }));

      const storyToSave: HeroStory = {
        id: editingStory()?.id || `story_${Date.now()}`,
        title: title,
        steps: finalSteps
      };

      const response: any = await sendMessage(MESSAGE_TYPES.SAVE_STORY, storyToSave);

      if (response && response.success) {
        setView('dashboard');
        setEditingStory(null);

        // Force sync
        const newState = await sendMessage(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
        setState(newState);
      } else {
        const errorMsg = response?.error || 'Failed to save story';
        setErrorMessage(errorMsg);
        logger.error('Save story failed:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error occurred';
      setErrorMessage(`Failed to save: ${errorMsg}`);
      logger.error('Save story error:', error);
    }
  };

  const resetGame = async () => {
    if (!isResetConfirming()) {
      setIsResetConfirming(true);
      setTimeout(() => setIsResetConfirming(false), RESET_CONFIRMATION_TIMEOUT_MS);
      return;
    }

    const newState = await sendMessage(MESSAGE_TYPES.DEV_RESET) as QuestArcState;
    setState(newState);
    setIsResetConfirming(false);
  };

  return (
    <div class="app">
      <Show when={state()} fallback={<div class="loading">Loading QuestArc...</div>}>
        {(s) => (
          <main class="app-main">
            <Header profile={s().profile} activeBoss={s().activeBoss} />

            <div class="view-content">
              <Show when={view() === 'dashboard'}>
                <DashboardView
                  state={s()}
                  onNavigate={setView}
                  onCreate={createNewStory}
                />
              </Show>

              <Show when={view() === 'story-list'}>
                <StoryListView
                  stories={s().stories}
                  activeStoryId={s().activeStory.id}
                  onEdit={loadStoryForEditing}
                  onNavigate={setView}
                  onCreate={createNewStory}
                />
              </Show>

              <Show when={view() === 'editor'}>
                <EditorView
                  initialStory={editingStory()}
                  onSave={handleSaveStory}
                  onCancel={() => {
                    setView('dashboard');
                    setErrorMessage(null);
                  }}
                  errorMessage={errorMessage()}
                />
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
    </div>
  );
}

export default App;