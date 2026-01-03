import { createSignal, Show } from 'solid-js';
import { QuestArcState, HeroStory, StoryStep } from '../types/state';
import { MESSAGE_TYPES } from '../types/messages';
import { logger } from '../lib/logger';
import './App.css';

// Components
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import StoryListView from '../components/StoryListView';
import EditorView from '../components/EditorView';
import SettingsView from '../components/SettingsView';
import CharacterView from '../components/CharacterView';
import InventoryView from '../components/InventoryView';
import NavBar from '../components/NavBar';

// Hooks & Services
import { useStateSync } from '../hooks/useStateSync';
import { useNavigation } from '../hooks/useNavigation';
import { MessageService } from '../services/MessageService';

function App() {
  const { state, setState } = useStateSync();
  const { view, setView, editingStory, goToDashboard, goToEditor, goToSettings } = useNavigation();

  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

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
    const newState = await MessageService.send(MESSAGE_TYPES.DEV_RESET) as QuestArcState;
    setState(newState);
    goToDashboard();
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
  };

  const handleAcknowledgeCompletion = async () => {
    const response: any = await MessageService.send(MESSAGE_TYPES.ACKNOWLEDGE_COMPLETION);
    if (response && response.success) {
      // Optimistic update
      const currentState = state();
      if (currentState) {
        setState({
          ...currentState,
          activeStory: {
            ...currentState.activeStory,
            id: null,
            isCompleted: false
          }
        });
      }
    }
  };

  return (
    <div class="app">
      <Show when={state()} fallback={<div class="loading">Loading QuestArc...</div>}>
        {(s) => (
          <main class="app-main">
            {/* Header is always visible on relevant tabs, or we can conditionally hide it */}
            <Show when={view() !== 'settings' && view() !== 'editor'}>
              <Header
                profile={s().profile}
                activeBoss={s().activeBoss}
              // removed onSettings prop as it is now in nav bar
              />
            </Show>

            <div class="view-content" style={{ "padding-bottom": "80px" }}>
              <Show when={view() === 'dashboard'}>
                <DashboardView
                  state={s()}
                  onNavigate={setView}
                  onCreate={() => goToEditor()}
                  onAddTasks={addStepTasks}
                  onAcknowledge={handleAcknowledgeCompletion}
                />
              </Show>

              <Show when={view() === 'story-list'}>
                <StoryListView
                  stories={s().stories}
                  completedStories={s().completedStories || []}
                  activeStoryId={s().activeStory.id || ''}
                  onEdit={(story) => goToEditor(story)}
                  onNavigate={setView}
                  onCreate={() => goToEditor()}
                  onStart={startQuest}
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

              <Show when={view() === 'settings'}>
                <SettingsView
                  onNavigate={setView}
                  onReset={resetGame}
                />
              </Show>

              <Show when={view() === 'character'}>
                <CharacterView profile={s().profile} />
              </Show>

              <Show when={view() === 'inventory'}>
                <InventoryView onNavigate={setView} />
              </Show>
            </div>

            {/* Persistent Navigation Bar */}
            <Show when={view() !== 'editor'}>
              <NavBar currentView={view()} onNavigate={setView} />
            </Show>
          </main>
        )}
      </Show>
    </div>
  );
}

export default App;