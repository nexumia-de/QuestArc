import { createSignal, Show } from 'solid-js';
import { QuestArcState, HeroStory, StoryStep } from '../types/state';
import { MESSAGE_TYPES } from '../types/messages';
import { RESET_CONFIRMATION_TIMEOUT_MS } from '../lib/constants';
import { logger } from '../lib/logger';
import './App.css';

// Components
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import StoryListView from '../components/StoryListView';
import EditorView from '../components/EditorView';

// Hooks & Services
import { useStateSync } from '../hooks/useStateSync';
import { useNavigation } from '../hooks/useNavigation';
import { MessageService } from '../services/MessageService';

function App() {
  const { state, setState } = useStateSync();
  const { view, setView, editingStory, goToDashboard, goToEditor } = useNavigation();

  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [isResetConfirming, setIsResetConfirming] = createSignal(false);

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

      const response: any = await MessageService.send(MESSAGE_TYPES.SAVE_STORY, storyToSave);

      if (response && response.success) {
        goToDashboard();

        // Force sync
        const newState = await MessageService.send(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
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

    const newState = await MessageService.send(MESSAGE_TYPES.DEV_RESET) as QuestArcState;
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
                  onCreate={() => goToEditor()}
                />
              </Show>

              <Show when={view() === 'story-list'}>
                <StoryListView
                  stories={s().stories}
                  activeStoryId={s().activeStory.id}
                  onEdit={(story) => goToEditor(story)}
                  onNavigate={setView}
                  onCreate={() => goToEditor()}
                />
              </Show>

              <Show when={view() === 'editor'}>
                <EditorView
                  initialStory={editingStory()}
                  onSave={handleSaveStory}
                  onCancel={() => {
                    goToDashboard();
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