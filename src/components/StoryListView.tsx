import { Component, Show, createSignal, For } from 'solid-js';
import { HeroStory, CompletedStory } from '../types/state';
import StoryCard from './StoryCard';
import ConfirmDialog from './common/ConfirmDialog';
import './StoryListView.css';

interface StoryListViewProps {
    stories: HeroStory[];
    completedStories: CompletedStory[];
    activeStoryId: string;
    onEdit: (story: HeroStory) => void;
    onNavigate: (view: 'dashboard') => void;
    onCreate: () => void;
    onStart: (storyId: string) => void;
}

type ConfirmType = 'start' | 'restart' | 'history';

interface ConfirmState {
    isOpen: boolean;
    type: ConfirmType;
    storyId: string | null;
}

const StoryListView: Component<StoryListViewProps> = (props) => {
    const [confirmState, setConfirmState] = createSignal<ConfirmState>({
        isOpen: false,
        type: 'start',
        storyId: null
    });

    const [isHistoryExpanded, setIsHistoryExpanded] = createSignal(false);
    const [isCompletedExpanded, setIsCompletedExpanded] = createSignal(false);

    const handleCardClick = (storyId: string) => {
        if (storyId === props.activeStoryId) {
            setConfirmState({ isOpen: true, type: 'restart', storyId });
        } else if (props.completedStories.some(s => s.id === storyId)) {
            setConfirmState({ isOpen: true, type: 'history', storyId });
        } else {
            setConfirmState({ isOpen: true, type: 'start', storyId });
        }
    };

    const handleConfirm = () => {
        const { type, storyId } = confirmState();

        if (type === 'restart') {
            // Special case for restart: Just navigating to dashboard
            props.onNavigate('dashboard');
        } else if (storyId) {
            props.onStart(storyId);
        }

        closeDialog();
    };

    const closeDialog = () => {
        setConfirmState({ isOpen: false, type: 'start', storyId: null });
    };

    const getDialogContent = () => {
        const { type } = confirmState();
        switch (type) {
            case 'start':
                return {
                    title: 'Start this Quest?',
                    message: 'Do you want to start this quest?',
                    confirmText: 'Start Quest',
                    showCancel: true
                };
            case 'restart':
                return {
                    title: 'Quest Running',
                    message: 'This quest is already running.',
                    confirmText: 'Go to Dashboard',
                    showCancel: false
                };
            case 'history':
                return {
                    title: 'Restart Quest?',
                    message: 'Do you want to restart this completed quest? It will be moved back to your active quests.',
                    confirmText: 'Restart',
                    showCancel: true
                };
            default:
                return { title: '', message: '', confirmText: 'OK' };
        }
    };

    // Sub-components can be extracted to separate files if they grow larger,
    // but for now, keeping them here cleans up the main render function significantly.
    return (
        <section class="story-list-view">
            <h2>Quest Board</h2>
            <div class="story-grid">
                <Show when={props.stories && props.stories.length > 0} fallback={<div class="empty-state">No quests found. Create one to get started!</div>}>
                    <ActiveQuestsList
                        stories={props.stories}
                        completedStories={props.completedStories}
                        activeStoryId={props.activeStoryId}
                        onEdit={props.onEdit}
                        onCardClick={handleCardClick}
                    />
                    <CompletedQuestsList
                        stories={props.stories}
                        completedStories={props.completedStories}
                        activeStoryId={props.activeStoryId}
                        onEdit={props.onEdit}
                        onCardClick={handleCardClick}
                        isExpanded={isCompletedExpanded()}
                        toggleExpanded={() => setIsCompletedExpanded(!isCompletedExpanded())}
                    />
                </Show>
            </div>

            <div class="button-row">
                <button class="primary-btn" onClick={props.onCreate}>
                    ➕ Create New Quest
                </button>
            </div>

            <HistorySection
                completedStories={props.completedStories}
                onCardClick={handleCardClick}
                isExpanded={isHistoryExpanded()}
                toggleExpanded={() => setIsHistoryExpanded(!isHistoryExpanded())}
            />

            <ConfirmDialog
                isOpen={confirmState().isOpen}
                {...getDialogContent()}
                onConfirm={handleConfirm}
                onCancel={closeDialog}
            />
        </section>
    );
};

// ----------------------------------------------------------------------
// Sub-Components (Extracted to prevent re-render thrashing)
// ----------------------------------------------------------------------

interface ActiveQuestsListProps {
    stories: HeroStory[];
    completedStories: CompletedStory[];
    activeStoryId: string;
    onEdit: (story: HeroStory) => void;
    onCardClick: (id: string) => void;
}

const ActiveQuestsList: Component<ActiveQuestsListProps> = (props) => {
    const incompleteStories = () => (props.stories || []).filter(s => !props.completedStories.some(cs => cs.id === s.id));
    return (
        <>
            <For each={incompleteStories()}>
                {(story) => (
                    <div
                        onClick={() => props.onCardClick(story.id)}
                        class="story-card-wrapper"
                    >
                        <StoryCard
                            title={story.title}
                            stepsCount={story.steps.length}
                            totalXp={story.steps.reduce((acc, step) => acc + step.xpReward, 0)}
                            isActive={props.activeStoryId === story.id}
                            onEdit={(e) => {
                                e.stopPropagation();
                                props.onEdit(story);
                            }}
                        />
                    </div>
                )}
            </For>
        </>
    );
};

interface CompletedQuestsListProps {
    stories: HeroStory[];
    completedStories: CompletedStory[];
    activeStoryId: string;
    onEdit: (story: HeroStory) => void;
    onCardClick: (id: string) => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
}

const CompletedQuestsList: Component<CompletedQuestsListProps> = (props) => {
    const finishedStories = () => (props.stories || []).filter(s => props.completedStories.some(cs => cs.id === s.id));

    return (
        <Show when={finishedStories().length > 0}>
            <>
                <div
                    class="completed-separator-header"
                    onClick={props.toggleExpanded}
                >
                    <h4>Completed Quests ({finishedStories().length})</h4>
                    <span class={`accordion-arrow ${!props.isExpanded ? 'collapsed' : ''}`}>
                        ▼
                    </span>
                    <div class="separator-line"></div>
                </div>

                <Show when={props.isExpanded}>
                    <For each={finishedStories()}>
                        {(story) => (
                            <div
                                onClick={() => props.onCardClick(story.id)}
                                class="story-card-wrapper completed-item"
                            >
                                <StoryCard
                                    title={story.title}
                                    stepsCount={story.steps.length}
                                    totalXp={story.steps.reduce((acc, step) => acc + step.xpReward, 0)}
                                    isActive={props.activeStoryId === story.id}
                                    onEdit={(e) => {
                                        e.stopPropagation();
                                        props.onEdit(story);
                                    }}
                                />
                            </div>
                        )}
                    </For>
                </Show>
            </>
        </Show>
    );
};

interface HistorySectionProps {
    completedStories: CompletedStory[];
    onCardClick: (id: string) => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
}

const HistorySection: Component<HistorySectionProps> = (props) => {
    return (
        <Show when={props.completedStories && props.completedStories.length > 0}>
            <div class="completed-stories-section">
                <div class="history-header" onClick={props.toggleExpanded}>
                    <h3>📜 History</h3>
                    <span class={`accordion-arrow ${!props.isExpanded ? 'collapsed' : ''}`}>
                        ▼
                    </span>
                </div>

                <Show when={props.isExpanded}>
                    <div class="story-grid">
                        <For each={props.completedStories}>
                            {(story) => (
                                <div
                                    class="story-card-wrapper completed"
                                    onClick={() => props.onCardClick(story.id)}
                                >
                                    <StoryCard
                                        title={story.title}
                                        stepsCount={story.steps.length}
                                        totalXp={story.steps.reduce((acc, step) => acc + step.xpReward, 0)}
                                        isActive={false}
                                    />
                                    <div class="completion-footer">
                                        <div class="completion-date">
                                            Completed: {new Date(story.completedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

export default StoryListView;
