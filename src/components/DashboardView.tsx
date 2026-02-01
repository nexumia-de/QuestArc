import { Component, createMemo, Show } from 'solid-js';
import { QuestArcState } from '../types/state';

import { QuestDashboard } from './QuestDashboard';

interface DashboardViewProps {
    state: QuestArcState;
    onNavigate: (view: 'story-list' | 'editor') => void;
    onCreate: () => void;
    onAddTasks: () => void;
    onAcknowledge: () => void;
}

const DashboardView: Component<DashboardViewProps> = (props) => {
    const storyTitle = createMemo(() => {
        if (!props.state.activeStory.id) return '';
        const story = props.state.stories?.find(s => s.id === props.state.activeStory.id);
        return story ? story.title : props.state.activeStory.id.replace(/_/g, ' ');
    });

    return (
        <section class="active-quest">
            <Show when={props.state.activeStory.isCompleted}>
                <div class="quest-complete-overlay">
                    <div class="quest-complete-content">
                        <h2>🏆 QUEST COMPLETE! 🏆</h2>
                        <p>You have finished the story: {storyTitle()}</p>
                        <button class="primary-btn" style={{ 'margin-top': '1rem' }} onClick={props.onAcknowledge}>
                            Continue Adventure
                        </button>
                    </div>
                </div>
            </Show>

            <div style={{ 'margin-top': '2rem' }}>
                <QuestDashboard />
            </div>
        </section >
    );
};

export default DashboardView;
