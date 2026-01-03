import { Component, Show, For } from 'solid-js';
import { QuestArcState } from '../types/state';
import { getCurrentStepTitle, getCurrentStep } from '../lib/state-manager';

interface DashboardViewProps {
    state: QuestArcState;
    onNavigate: (view: 'story-list' | 'editor') => void;
    onCreate: () => void;
    onAddTasks: () => void;
}

const DashboardView: Component<DashboardViewProps> = (props) => {
    const currentStep = () => getCurrentStep(props.state);

    return (
        <section class="active-quest">
            <h2>Current Story Step</h2>
            <div class="step-card">
                <h3>{getCurrentStepTitle(props.state)}</h3>

                <Show when={currentStep()?.tasksToCreate && currentStep()!.tasksToCreate!.length > 0}>
                    <div class="step-tasks">
                        <h4>Quest Tasks:</h4>
                        <ul>
                            <For each={currentStep()!.tasksToCreate}>
                                {(task) => (
                                    <li class="task-item">
                                        <span class="task-title">{task.title}</span>
                                        <span class="task-progress">
                                            ({props.state.activeStory.taskProgress?.[task.title] || 0}/{task.requiredCount || 1})
                                        </span>
                                        {task.isRepeating && <span class="tag">🔁 Repeating</span>}
                                    </li>
                                )}
                            </For>
                        </ul>
                        <Show when={props.state.activeStory.tasksCreatedForStepId !== props.state.activeStory.currentStepId}>
                            <button class="action-btn" onClick={props.onAddTasks}>
                                📥 Add tasks to your list
                            </button>
                        </Show>
                    </div>
                </Show>

                <p class="step-id">Step ID: {props.state.activeStory.currentStepId}</p>

                <Show when={props.state.activeBoss}>
                    <div
                        class="boss-battle"
                        style={props.state.activeBoss!.themeColor ? { 'border-color': props.state.activeBoss!.themeColor } : {}}
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

                        <div class="hp-bar-container">
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
            <div class="dashboard-actions">
                <button class="secondary-btn" onClick={() => props.onNavigate('story-list')}>
                    📜 My Quests
                </button>
                <button class="primary-btn" onClick={props.onCreate}>
                    ➕ New Quest
                </button>
            </div>
        </section>
    );
};

export default DashboardView;
