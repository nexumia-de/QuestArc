import { Component, Show } from 'solid-js';
import { QuestArcState } from '../types/state';
import avatarImg from '../assets/avatar.svg';

interface HeaderProps {
    profile: QuestArcState['profile'];
    activeBoss: QuestArcState['activeBoss'];
}

const Header: Component<HeaderProps> = (props) => {
    return (
        <header class="quest-header">
            <div class="header-content">
                <div class="avatar-container">
                    <img src={avatarImg} alt={`Level ${props.profile.level} Hero`} class="avatar" />
                    <Show when={props.profile.pet}>
                        {(pet) => {
                            const stage = pet().stage;
                            const petClass = stage === 1 ? 'pet-egg' : stage === 2 ? 'pet-baby' : 'pet-adult';
                            const petEmoji = stage === 1 ? '🥚' : stage === 2 ? '💧' : '🐉';

                            return (
                                <div class="pet-container">
                                    <div class="pet-name-tooltip">{pet().name} (Stage {stage})</div>
                                    <div class={`pet ${petClass}`}>
                                        {petEmoji}
                                    </div>
                                </div>
                            );
                        }}
                    </Show>
                </div>
                <div class="stats-container">
                    <div class="stats-top-row">
                        <h1 class="level-headline">Lvl {props.profile.level}</h1>
                        <span class="xp-total">{props.profile.xp}/{props.profile.xpToNextLevel} XP</span>
                    </div>

                    {/* HP Bar */}
                    <div class="bar-row compact-bar">
                        <div class="hp-bar-container user-hp">
                            <div
                                class="hp-bar-fill user-hp-fill"
                                style={{ width: `${(props.profile.hp / props.profile.maxHp) * 100}%` }}
                            ></div>
                        </div>
                        <span class="bar-text-overlay">{props.profile.hp} HP</span>
                    </div>

                    {/* XP Bar */}
                    <div class="bar-row compact-bar">
                        <div class="xp-bar-container">
                            <div
                                class="xp-bar-fill"
                                style={{ width: `${(props.profile.xp / props.profile.xpToNextLevel) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
