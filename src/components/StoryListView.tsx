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
    const [showHistoryRestartConfirm, setShowHistoryRestartConfirm] = createSignal<string | null>(null);
    const [isHistoryExpanded, setIsHistoryExpanded] = createSignal(false);
    const [isCompletedExpanded, setIsCompletedExpanded] = createSignal(false);

    const handleCardClick = (storyId: string) => {
        if (storyId === props.activeStoryId) {
            setShowRestartConfirm(storyId); // Active story click logic (already runnning)
        } else if (props.completedStories.some(s => s.id === storyId)) {
            setShowHistoryRestartConfirm(storyId); // Completed story click logic
        } else {
            setShowStartConfirm(storyId); // New story click logic
        }
    };

    const confirmStart = () => {
        const id = showStartConfirm();
        if (id) {
            props.onStart(id);
            setShowStartConfirm(null);
        }
    };

    const confirmHistoryRestart = () => {
        const id = showHistoryRestartConfirm();
        if (id) {
            props.onStart(id);
            setShowHistoryRestartConfirm(null);
        }
    };

    return (
        <section class="story-list-view">
            <h2>My Quests</h2>
            <div class="story-grid">
                <Show when={props.stories && props.stories.length > 0} fallback={<div class="empty-state">No quests found. Create one to get started!</div>}>
                    {(() => {
                        const allStories = props.stories || [];
                        const incompleteStories = allStories.filter(s => !props.completedStories.some(cs => cs.id === s.id));
                        const finishedStories = allStories.filter(s => props.completedStories.some(cs => cs.id === s.id));

                        return (
                            <>
                                {incompleteStories.map((story) => (
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

                                <Show when={finishedStories.length > 0}>
                                    <div
                                        class="completed-separator-header"
                                        onClick={() => setIsCompletedExpanded(!isCompletedExpanded())}
                                        style={{
                                            'grid-column': '1 / -1',
                                            'display': 'flex',
                                            'align-items': 'center',
                                            'gap': '0.5rem',
                                            'margin': '1rem 0',
                                            'cursor': 'pointer',
                                            'opacity': 0.8
                                        }}
                                    >
                                        <h4 style={{ margin: 0 }}>Completed Quests ({finishedStories.length})</h4>
                                        <span style={{
                                            transform: isCompletedExpanded() ? 'rotate(0deg)' : 'rotate(-90deg)',
                                            transition: 'transform 0.2s',
                                            'font-size': '1em',
                                            'display': 'inline-block'
                                        }}>
                                            ▼
                                        </span>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)', 'margin-left': '1rem' }}></div>
                                    </div>

                                    <Show when={isCompletedExpanded()}>
                                        {finishedStories.map((story) => (
                                            <div
                                                onClick={() => handleCardClick(story.id)}
                                                class="story-card-wrapper"
                                                style={{
                                                    cursor: 'pointer',
                                                    opacity: 0.6,
                                                    filter: 'grayscale(0.5)'
                                                }}
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
                                        ))}
                                    </Show>
                                </Show>
                            </>
                        );
                    })()}
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
                    <div class="section-header" onClick={() => setIsHistoryExpanded(!isHistoryExpanded())} style={{ cursor: 'pointer', display: 'flex', 'align-items': 'center', gap: '0.5rem', 'margin-bottom': '1rem' }}>
                        <h3 style={{ margin: 0 }}>📜 History</h3>
                        <span style={{ transform: isHistoryExpanded() ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', 'font-size': '1.2em', 'display': 'inline-block' }}>
                            ▼
                        </span>
                    </div>

                    <Show when={isHistoryExpanded()}>
                        <div class="story-grid">
                            {props.completedStories.map((story) => (
                                <div
                                    class="story-card-wrapper completed"
                                    onClick={() => handleCardClick(story.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <StoryCard
                                        title={story.title}
                                        stepsCount={story.steps.length}
                                        totalXp={story.steps.reduce((acc, step) => acc + step.xpReward, 0)}
                                        isActive={false}
                                    // onEdit is omitted, so button won't render
                                    />
                                    <div class="completion-footer">
                                        <div class="completion-date">
                                            Completed: {new Date(story.completedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Show>
                </div>
            </Show>

            <Show when={showStartConfirm()}>
                <div class="modal-overlay">
                    <div class="modal">
                        <h3>Start this Quest?</h3>
                        <p>Do you want to start this quest?</p>
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
                        <h3>Quest Running</h3>
                        <p>This quest is already running.</p>
                        <div class="modal-actions">
                            <button class="primary-btn" onClick={() => {
                                setShowRestartConfirm(null);
                                props.onNavigate('dashboard');
                            }}>Go to Dashboard</button>
                        </div>
                    </div>
                </div>
            </Show>

            <Show when={showHistoryRestartConfirm()}>
                <div class="modal-overlay">
                    <div class="modal">
                        <h3>Restart Quest?</h3>
                        <p>Do you want to restart this completed quest? It will be moved back to your active quests.</p>
                        <div class="modal-actions">
                            <button class="secondary-btn" onClick={() => setShowHistoryRestartConfirm(null)}>Cancel</button>
                            <button class="primary-btn" onClick={confirmHistoryRestart}>Restart</button>
                        </div>
                    </div>
                </div>
            </Show>
        </section>
    );
};

export default StoryListView;
