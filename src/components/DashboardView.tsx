import { Component, Show } from 'solid-js';
import { QuestArcState } from '../types/state';
import { getCurrentStepTitle } from '../lib/state-manager';

interface DashboardViewProps {
    state: QuestArcState;
    onNavigate: (view: 'story-list' | 'editor') => void;
    onCreate: () => void;
}

const DashboardView: Component<DashboardViewProps> = (props) => {
    return (
        <section class="active-quest">
            <h2>Current Story Step</h2>
            <div class="step-card">
                <h3>{getCurrentStepTitle(props.state)}</h3>
                <p>Step ID: {props.state.activeStory.currentStepId}</p>

                <Show when={props.state.activeBoss}>
                    <div class="boss-battle">
                        <h4>👹 BOSS BATTLE</h4>
                        <div class="hp-bar-container">
                            <div
                                class="hp-bar-fill"
                                style={{ width: `${(props.state.activeBoss!.hp / props.state.activeBoss!.maxHp) * 100}%` }}
                            ></div>
                        </div>
                        <p class="hp-text">{props.state.activeBoss!.hp} / {props.state.activeBoss!.maxHp} HP</p>
                    </div>
                </Show>

                <Show when={!props.state.activeBoss && props.state.activeStory.streakProgress >= 0}>
                    <div class="streak-progress">
                        <p>Streak Progress: {props.state.activeStory.streakProgress}</p>
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
