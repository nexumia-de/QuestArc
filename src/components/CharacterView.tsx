import { Component, Show } from 'solid-js';
import { QuestArcState } from '../types/state';
import avatarImg from '../assets/avatar.svg';
import './CharacterView.css';

interface CharacterViewProps {
    profile: QuestArcState['profile'];
}

const CharacterView: Component<CharacterViewProps> = (props) => {
    return (
        <div class="character-view">
            <div class="hero-card">
                <div class="hero-avatar-section">
                    <div class="hero-avatar-container">
                        <img src={avatarImg} alt="Hero" class="hero-avatar-large" />
                        <div class="hero-level-badge">{props.profile.level}</div>
                    </div>

                    <div class="hero-identity">
                        <h2>{props.profile.name || 'Hero'}</h2>
                        <span class="hero-class">Adventurer</span>
                    </div>
                </div>

                <div class="hero-stats-grid">
                    <div class="stat-box">
                        <span class="stat-label">HP</span>
                        <span class="stat-value hp-val">{props.profile.hp} <span class="stat-max">/ {props.profile.maxHp}</span></span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">XP</span>
                        <span class="stat-value xp-val">{props.profile.xp} <span class="stat-max">/ {props.profile.xpToNextLevel}</span></span>
                    </div>
                </div>
            </div>

            <Show when={props.profile.pet}>
                {pet => (
                    <div class="pet-details-card">
                        <div class="pet-header">
                            <h3>Companion</h3>
                            <span class="pet-stage-badge">Stage {pet().stage}</span>
                        </div>

                        <div class="pet-showcase">
                            <div class="pet-emoji-large">
                                {pet().stage === 1 ? '🥚' : pet().stage === 2 ? '💧' : '🐉'}
                            </div>
                            <div class="pet-info">
                                <h4>{pet().name}</h4>
                                <p class="pet-lore">
                                    {pet().stage === 1
                                        ? "A mysterious egg. Keep it warm with your achievements."
                                        : pet().stage === 2
                                            ? "A curious hatchling looking for adventure."
                                            : "A mighty dragon, loyal to the end."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
};

export default CharacterView;
