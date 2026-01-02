import { Component, Show } from 'solid-js';
import { HeroStory } from '../types/state';
import StoryCard from './StoryCard';

interface StoryListViewProps {
    stories: HeroStory[];
    activeStoryId: string;
    onEdit: (story: HeroStory) => void;
    onNavigate: (view: 'dashboard') => void;
    onCreate: () => void;
}

const StoryListView: Component<StoryListViewProps> = (props) => {
    return (
        <section class="story-list-view">
            <h2>My Quests</h2>
            <div class="story-grid">
                <Show when={props.stories && props.stories.length > 0} fallback={<div class="empty-state">No quests found. Create one to get started!</div>}>
                    {(props.stories || []).map((story) => (
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
        </section>
    );
};

export default StoryListView;
