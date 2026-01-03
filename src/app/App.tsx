import { createSignal, Show, Switch, Match } from 'solid-js';
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

  const startQuest = async (storyId: string) => {
    const response: any = await MessageService.send(MESSAGE_TYPES.START_QUEST, { storyId });
    if (response && response.success) {
      // Refresh state
      const newState = await MessageService.send(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
      setState(newState);
      goToDashboard();
    } else {
      logger.error('Failed to start quest:', response?.error);
    }
  };

  const addStepTasks = async () => {
    await MessageService.send(MESSAGE_TYPES.ADD_STEP_TASKS);
    // Ideally user sees feedback. Since creating tasks is async/background, maybe just log?
    // Or we could show a toast. For now, let's keep it simple.
  };

  const handleAcknowledgeCompletion = async () => {
    const response: any = await MessageService.send(MESSAGE_TYPES.ACKNOWLEDGE_COMPLETION);
    if (response && response.success) {
      // Optimistic update
      const currentState = state();
      if (currentState && currentState.activeStory) {
        setState({
          ...currentState,
          activeStory: {
            ...currentState.activeStory,
            isCompleted: false
          }
        });
      }
    }
  };

  const handleStopQuest = async () => {
    const response: any = await MessageService.send(MESSAGE_TYPES.STOP_QUEST);
    if (response && response.success) {
      // Optimistic update
      const currentState = state();
      if (currentState) {
        setState({
          ...currentState,
          activeStory: null,
          activeBoss: null
        });
      }
    }
  };

  return (
    <div class="app">
      <Show when={state()} fallback={<div class="loading">Loading QuestArc...</div>}>
        {(s) => (
          <div class="app-container">
            <Header
              profile={s().profile}
              activeBoss={s().activeBoss}
            />

            <main class="content-area">
              <Switch>
                <Match when={view() === 'dashboard'}>
                  <DashboardView
                    state={s()}
                    onNavigate={setView}
                    onCreate={() => goToEditor()}
                    onAddTasks={addStepTasks}
                    onAcknowledge={handleAcknowledgeCompletion}
                    onStopQuest={handleStopQuest}
                  />
                </Match>

                <Match when={view() === 'story-list'}>
                  <StoryListView
                    stories={s().stories}
                    activeStoryId={s().activeStory?.id || null}
                    onEdit={(story) => goToEditor(story)}
                    onNavigate={setView}
                    onCreate={() => goToEditor()}
                    onStart={startQuest}
                  />
                </Match>

                <Match when={view() === 'editor'}>
                  <EditorView
                    initialStory={editingStory()}
                    onSave={handleSaveStory}
                    onCancel={() => {
                      goToDashboard();
                      setErrorMessage(null);
                    }}
                    errorMessage={errorMessage()}
                  />
                </Match>
              </Switch>

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
          </div>
        )}
      </Show>
    </div>
  );
}

export default App;