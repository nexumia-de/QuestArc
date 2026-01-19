import { Component, Show } from 'solid-js';
import { QuestArcState, HeroStory } from '../types/state';
import DashboardView from './DashboardView';
import SettingsView from './SettingsView';

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

            {/* Editor, Character, Inventory Views Removed for Size Optimization */}

            <Show when={props.view === 'settings'}>
                <SettingsView
                    onNavigate={props.actions.setView}
                    onReset={props.actions.resetGame}
                />
            </Show>
        </div>
    );
};

export default ViewRouter;
