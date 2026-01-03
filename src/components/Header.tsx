import { Component } from 'solid-js';
import { QuestArcState } from '../types/state';
import Avatar from './Avatar';

interface HeaderProps {
    profile: QuestArcState['profile'];
    activeBoss: QuestArcState['activeBoss'];
}

const Header: Component<HeaderProps> = (props) => {
    // Determine pet stage for the avatar overlay
    const getPetStage = () => {
        const pet = props.profile.pet;
        if (!pet) return 0;
        return pet.stage;
    };

    return (
        <header class="quest-header">
            <div class="header-content">
                {/* Visual Avatar System */}
                <div class="avatar-container avatar-wrapper">
                    <Avatar
                        level={props.profile.level}
                        stage={getPetStage()}
                        config={props.profile.avatar}
                    />

                    {/* Floating Pet Tooltip/Name if needed, though Avatar now integrates egg */}
                </div>

                {/* HUD Stats */}
                <div class="stats-container">
                    <div class="stats-top-row">
                        <h1 class="hud-level-text">Lvl {props.profile.level}</h1>
                        <span class="hud-values">{props.profile.xp}/{props.profile.xpToNextLevel} XP</span>
                    </div>

                    {/* HP Bar */}
                    <div class="bar-row compact-bar">
                        <div class="hp-bar-container user-hp hud-bar-hp-active">
                            <div
                                class="hp-bar-fill user-hp-fill hud-bar-hp"
                                style={{ width: `${(props.profile.hp / props.profile.maxHp) * 100}%` }}
                            ></div>
                        </div>
                        <span class="bar-text-overlay hud-values">{props.profile.hp} HP</span>
                    </div>

                    {/* XP Bar */}
                    <div class="bar-row compact-bar">
                        <div class="xp-bar-container">
                            <div
                                class="xp-bar-fill hud-bar-xp"
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
