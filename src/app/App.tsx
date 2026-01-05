import { Component, Show } from 'solid-js';
import { useQuestArc } from '../hooks/useQuestArc';
import { useNavigation } from '../hooks/useNavigation';
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import ViewRouter from '../components/ViewRouter';
import './App.css';

const App: Component = () => {
  const {
    state,
    actionError,
    saveStory,
    startQuest,
    handleAcknowledgeCompletion,
    addStepTasks,
    resetGame,
    setActionError
  } = useQuestArc();

  const { view, setView, editingStory, goToDashboard, goToEditor } = useNavigation();

  const handleSaveStoryWrapper = async (title: string, steps: any[]) => {
    await saveStory(editingStory()?.id, title, steps, () => {
      goToDashboard();
    });
  };

  const startQuestWrapper = async (storyId: string) => {
    await startQuest(storyId, () => {
      goToDashboard();
    });
  };

  const resetGameWrapper = async () => {
    await resetGame(() => {
      goToDashboard();
    });
  };



  const handleImportStory = async (json: any) => {
    try {
      // Basic validation
      if (!json.title || !Array.isArray(json.steps)) {
        alert('Invalid story file format.');
        return;
      }

      // Generate a clean ID and save
      // Passing undefined as ID forces creation of a new story
      await saveStory(undefined, json.title, json.steps, () => {
        // Optional: Navigate to list or show success toast
        // trigger a refresh by just waiting? saveStory already refreshes.
      });
    } catch (err) {
      console.error('Error importing story:', err);
      alert('Failed to parse story file.');
    }
  };

  return (
    <div class="app">
      <Show when={state()} fallback={<div class="loading">Loading QuestArc...</div>}>
        {(s) => (
          <main class="app-main">
            <Show when={view() !== 'settings' && view() !== 'editor'}>
              <Header
                profile={s().profile}
                activeBoss={s().activeBoss}
              />
            </Show>

            <ViewRouter
              view={view()}
              state={s()}
              errorMessage={actionError()}
              editingStory={editingStory() || undefined}
              actions={{
                setView,
                goToEditor,
                goToDashboard,
                addStepTasks,
                handleAcknowledgeCompletion,
                startQuest: startQuestWrapper,
                handleSaveStory: handleSaveStoryWrapper,
                handleImportStory,
                resetGame: resetGameWrapper,
                clearErrorMessage: () => setActionError(null)
              }}
            />

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