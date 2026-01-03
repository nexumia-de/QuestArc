import { Component, Show, createSignal } from 'solid-js';
import { HeroStory, CompletedStory } from '../types/state';
import StoryCard from './StoryCard';

interface StoryListViewProps {
    stories: HeroStory[];
    completedStories: CompletedStory[];
    activeStoryId: string;
    onEdit: (story: HeroStory) => void;
    onNavigate: (view: 'dashboard') => void;
    onCreate: () => void;
    onStart: (storyId: string) => void;
}

const StoryListView: Component<StoryListViewProps> = (props) => {
    const [showStartConfirm, setShowStartConfirm] = createSignal<string | null>(null);

    const [showRestartConfirm, setShowRestartConfirm] = createSignal<string | null>(null);

    const handleCardClick = (storyId: string) => {
        if (storyId === props.activeStoryId) {
            setShowRestartConfirm(storyId);
        } else {
            setShowStartConfirm(storyId);
        }
    };

    const confirmStart = () => {
        const id = showStartConfirm();
        if (id) {
            props.onStart(id);
            setShowStartConfirm(null);
        }
    };

    const confirmRestart = () => {
        const id = showRestartConfirm();
        if (id) {
            props.onStart(id);
            setShowRestartConfirm(null);
        }
    };

    return (
        <section class="story-list-view">
            <h2>My Quests</h2>
            <div class="story-grid">
                <Show when={props.stories && props.stories.length > 0} fallback={<div class="empty-state">No quests found. Create one to get started!</div>}>
                    {(props.stories || []).map((story) => (
                        <div onClick={() => handleCardClick(story.id)} class="story-card-wrapper" style={{ cursor: 'pointer' }}>
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
                    ))}
                </Show>
            </div>

            <div class="button-row">
                <button class="primary-btn" onClick={props.onCreate}>
                    ➕ Create New Quest
                </button>
                <button class="secondary-btn" onClick={() => props.onNavigate('dashboard')}>
                    Back to Dashboard
                </button>
            </div>

            <Show when={props.completedStories && props.completedStories.length > 0}>
                <div class="completed-stories-section">
                    <h3>📜 History</h3>
                    <div class="story-grid">
                        {props.completedStories.map((story) => (
                            <div class="story-card-wrapper completed">
                                <StoryCard
                                    title={story.title}
                                    stepsCount={story.steps.length}
                                    totalXp={story.steps.reduce((acc, step) => acc + step.xpReward, 0)}
                                    isActive={false}
                                    onEdit={() => { }}
                                />
                                <div class="completion-footer">
                                    <div class="completion-date">
                                        Completed: {new Date(story.completedAt).toLocaleDateString()}
                                    </div>
                                    <button
                                        class="restart-btn secondary-btn small"
                                        onClick={() => props.onStart(story.id)}
                                        title="Restart this quest"
                                    >
                                        Restart ↻
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Show>

            <Show when={showStartConfirm()}>
                <div class="modal-overlay">
                    <div class="modal">
                        <h3>Start this Quest?</h3>
                        <p>Do you want to start active quest?</p>
                        <div class="modal-actions">
                            <button class="secondary-btn" onClick={() => setShowStartConfirm(null)}>Cancel</button>
                            <button class="primary-btn" onClick={confirmStart}>Start Quest</button>
                        </div>
                    </div>
                </div>
            </Show>

            <Show when={showRestartConfirm()}>
                <div class="modal-overlay">
                    <div class="modal">
                        <h3>Restrt Quest?</h3>
                        <p>This quest is already running, do you want to restart?</p>
                        <div class="modal-actions">
                            <button class="secondary-btn" onClick={() => {
                                setShowRestartConfirm(null);
                                props.onNavigate('dashboard');
                            }}>No</button>
                            <button class="primary-btn" onClick={confirmRestart}>Yes</button>
                        </div>
                    </div>
                </div>
            </Show>
        </section>
    );
};

export default StoryListView;
