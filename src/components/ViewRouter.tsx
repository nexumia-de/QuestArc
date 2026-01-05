import { Component, Show } from 'solid-js';
import { QuestArcState, HeroStory } from '../types/state';
import DashboardView from './DashboardView';
import StoryListView from './StoryListView';
import EditorView from './EditorView';
import SettingsView from './SettingsView';
import CharacterView from './CharacterView';
import InventoryView from './InventoryView';

interface ViewRouterProps {
    view: string;
    state: QuestArcState;
    errorMessage: string | null;
    editingStory: HeroStory | undefined;
    actions: {
        setView: (view: any) => void;
        goToEditor: (story?: HeroStory) => void;
        goToDashboard: () => void;
        addStepTasks: () => void;
        handleAcknowledgeCompletion: () => void;
        startQuest: (storyId: string) => void;
        handleSaveStory: (title: string, steps: any[]) => Promise<void>;
        handleDeleteStory: (storyId: string) => Promise<void>;
        handleImportStory: (data: any) => Promise<void>;
        resetGame: () => void;
        clearErrorMessage: () => void;
        cancelQuest: () => Promise<void>;
    };
}

const ViewRouter: Component<ViewRouterProps> = (props) => {
    return (
        <div class="view-content padded-bottom">
            <Show when={props.view === 'dashboard'}>
                <DashboardView
                    state={props.state}
                    onNavigate={props.actions.setView}
                    onCreate={() => props.actions.goToEditor()}
                    onAddTasks={props.actions.addStepTasks}
                    onAcknowledge={props.actions.handleAcknowledgeCompletion}
                />
            </Show>

            <Show when={props.view === 'story-list'}>
                <StoryListView
                    stories={props.state.stories}
                    completedStories={props.state.completedStories || []}
                    activeStoryId={props.state.activeStory.id || ''}
                    onEdit={(story) => props.actions.goToEditor(story)}
                    onNavigate={props.actions.setView}
                    onCreate={() => props.actions.goToEditor()}
                    onStart={props.actions.startQuest}
                    onImport={props.actions.handleImportStory}
                    onCancelQuest={props.actions.cancelQuest}
                />
            </Show>

            <Show when={props.view === 'editor'}>
                <EditorView
                    initialStory={props.editingStory}
                    onSave={props.actions.handleSaveStory}
                    onCancel={() => {
                        props.actions.goToDashboard();
                        props.actions.clearErrorMessage();
                    }}
                    onDelete={props.actions.handleDeleteStory}
                    errorMessage={props.errorMessage}
                />
            </Show>

            <Show when={props.view === 'settings'}>
                <SettingsView
                    onNavigate={props.actions.setView}
                    onReset={props.actions.resetGame}
                />
            </Show>

            <Show when={props.view === 'character'}>
                <CharacterView profile={props.state.profile} />
            </Show>

            <Show when={props.view === 'inventory'}>
                <InventoryView onNavigate={props.actions.setView} />
            </Show>
        </div>
    );
};

export default ViewRouter;
