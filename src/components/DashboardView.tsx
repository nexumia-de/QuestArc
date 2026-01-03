import { Component, Show, For, Switch, Match } from 'solid-js';
import { QuestArcState } from '../types/state';
import { getCurrentStepTitle, getCurrentStep } from '../lib/state-manager';

interface DashboardViewProps {
    state: QuestArcState;
    onNavigate: (view: 'story-list' | 'editor') => void;
    onCreate: () => void;
    onAddTasks: () => void;
    onAcknowledge: () => void;
}

const DashboardView: Component<DashboardViewProps> = (props) => {
    const currentStep = () => getCurrentStep(props.state);

    const getStoryTitle = () => {
        if (!props.state.activeStory.id) return '';
        const story = props.state.stories?.find(s => s.id === props.state.activeStory.id);
        return story ? story.title : props.state.activeStory.id.replace(/_/g, ' ');
    };

    // Calculate progress
    const getProgressText = () => {
        if (!props.state.activeStory.id) return '';
        const story = props.state.stories?.find(s => s.id === props.state.activeStory.id);
        if (!story) return '';
        const currentId = props.state.activeStory.currentStepId;
        const totalSteps = story.steps.length;
        // Find index of current step
        const currentIndex = story.steps.findIndex(s => s.id === currentId);
        return currentIndex >= 0 ? `Step ${currentIndex + 1}/${totalSteps}` : '';
    };

    return (
        <section class="active-quest">
            <Show when={props.state.activeStory.isCompleted}>
                <div class="quest-complete-overlay">
                    <div class="quest-complete-content">
                        <h2>🏆 QUEST COMPLETE! 🏆</h2>
                        <p>You have finished the story: {getStoryTitle()}</p>
                        <button class="primary-btn" style={{ 'margin-top': '1rem' }} onClick={props.onAcknowledge}>
                            Continue Adventure
                        </button>
                    </div>
                </div>
            </Show>
            <Show
                when={props.state.activeStory.id}
                fallback={
                    <div class="empty-quest-state">
                        <h2>Ready for Adventure?</h2>
                        <p>Go to the Quest Board to select or create a quest!</p>
                        <div class="dashboard-actions">
                            <button class="primary-btn" onClick={() => props.onNavigate('story-list')}>
                                📜 Quest Board
                            </button>
                        </div>
                    </div>
                }
            >
                <div class="story-header-row">
                    <h2>Current Story Step</h2>
                    <span class="story-progress-indicator">{getProgressText()}</span>
                </div>

                <div
                    class={`step-card ${currentStep()?.environment_theme ? 'themed-step' : ''}`}
                    style={currentStep()?.environment_theme ? { '--theme-color': currentStep()!.environment_theme } : {}}
                >
                    <Show when={getCurrentStepTitle(props.state)}>
                        <div class="step-card-header">
                            <h3>{getCurrentStepTitle(props.state)}</h3>
                        </div>
                    </Show>

                    <Show when={currentStep()?.flavor_text}>
                        <div class={`story-block-container mode-${currentStep()?.display_mode || 'visible'}`}>
                            <Switch>
                                <Match when={currentStep()?.display_mode === 'collapsed'}>
                                    <details class="story-details">
                                        <summary class="story-summary">{currentStep()?.summary_text || '📜 The Story so far...'}</summary>
                                        <div class="story-flavor-text">
                                            {currentStep()?.flavor_text}
                                        </div>
                                    </details>
                                </Match>
                                <Match when={currentStep()?.display_mode === 'tooltip'}>
                                    <div class="story-tooltip-container">
                                        <span class="story-info-icon" aria-label="Story Lore">{currentStep()?.story_icon || '📖'}</span>
                                        <div class="story-tooltip-content">{currentStep()?.flavor_text}</div>
                                    </div>
                                </Match>
                                <Match when={true}>
                                    {/* Default Visible */}
                                    <div class="story-flavor-text visible">
                                        {currentStep()?.flavor_text}
                                    </div>
                                </Match>
                            </Switch>
                        </div>
                    </Show>

                    <hr class="story-divider" />

                    <Show when={currentStep()?.tasksToCreate && currentStep()!.tasksToCreate!.length > 0}>
                        <div class="step-tasks">
                            <h4>Complete Tasks:</h4>
                            <ul>
                                <For each={currentStep()!.tasksToCreate}>
                                    {(task) => {
                                        const progress = props.state.activeStory.taskProgress?.[task.title] || 0;
                                        const required = task.requiredCount || 1;
                                        const isCompleted = progress >= required;

                                        return (
                                            <li class={`task-item ${isCompleted ? 'completed' : ''}`}>
                                                <div class="task-checkbox-indicator"></div>
                                                <span class="task-title">{task.title}</span>
                                                <span class="task-spacer"></span>
                                                <span class="task-progress">
                                                    {progress}/{required}
                                                </span>
                                                {task.isRepeating && <span class="tag" style={{ 'margin-left': '0.5rem' }}>🔁</span>}
                                            </li>
                                        );
                                    }}
                                </For>
                            </ul>
                            <Show when={props.state.activeStory.tasksCreatedForStepId !== props.state.activeStory.currentStepId}>
                                <button class="action-btn" onClick={props.onAddTasks}>
                                    📥 Add tasks to your list
                                </button>
                            </Show>
                        </div>
                    </Show>

                    <Show when={props.state.activeBoss}>
                        <div
                            class={`boss-battle ${props.state.activeBoss!.hp < props.state.activeBoss!.maxHp ? 'boss-shake' : ''}`}
                            style={props.state.activeBoss!.themeColor ? { 'border-color': props.state.activeBoss!.themeColor, '--boss-theme': props.state.activeBoss!.themeColor } : {}}
                        >
                            <Show when={props.state.activeBoss!.image}>
                                <div class="boss-image-container">
                                    <Show
                                        when={props.state.activeBoss!.image!.startsWith('http')}
                                        fallback={<span class="boss-emoji">{props.state.activeBoss!.image}</span>}
                                    >
                                        <img src={props.state.activeBoss!.image!} class="boss-image" alt="Boss" />
                                    </Show>
                                </div>
                            </Show>

                            <h4 style={props.state.activeBoss!.themeColor ? { color: props.state.activeBoss!.themeColor } : {}}>
                                {props.state.activeBoss!.name || '👹 BOSS BATTLE'}
                            </h4>

                            <div class="hp-bar-container boss-hp-container">
                                <div
                                    class="hp-bar-fill"
                                    style={{
                                        width: `${(props.state.activeBoss!.hp / props.state.activeBoss!.maxHp) * 100}%`,
                                        background: props.state.activeBoss!.themeColor ? props.state.activeBoss!.themeColor : undefined
                                    }}
                                ></div>
                            </div>
                            <p class="hp-text">{props.state.activeBoss!.hp} / {props.state.activeBoss!.maxHp} HP</p>
                        </div>
                    </Show>

                </div>
            </Show>
        </section>
    );
};

export default DashboardView;
