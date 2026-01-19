import { Component } from 'solid-js';
import { QuestArcState } from '../types/state';

interface HeaderProps {
    profile: QuestArcState['profile'];
    activeBoss: QuestArcState['activeBoss'];
}

const Header: Component<HeaderProps> = (props) => {
    return (
        <header class="quest-header">
            <div class="header-content">
                {/* Left Side: Empty/Logo */}
                <div class="header-left">
                    <div class="logo-wrapper" style={{ 'font-size': '2rem' }}>
                        ⚔️
                    </div>
                </div>

                {/* Right Side: Stats Bars */}
                <div class="header-stats">
                    <div class="stats-header-row">
                        <h1 class="hud-level-text">Lvl {props.profile.level}</h1>
                    </div>

                    <div class="stat-bars-container">
                        {/* HP Bar */}
                        <div class="stat-bar-row">
                            <div class="bar-label">HP</div>
                            <div class="hp-bar-track">
                                <div
                                    class="hp-bar-fill"
                                    style={{ width: `${(props.profile.hp / props.profile.maxHp) * 100}%` }}
                                ></div>
                            </div>
                            <span class="bar-value">{props.profile.hp}</span>
                        </div>

                        {/* XP Bar */}
                        <div class="stat-bar-row">
                            <div class="bar-label">XP</div>
                            <div class="xp-bar-track">
                                <div
                                    class="xp-bar-fill"
                                    style={{ width: `${(props.profile.xp / props.profile.xpToNextLevel) * 100}%` }}
                                ></div>
                            </div>
                            <span class="bar-value">{props.profile.xp}/{props.profile.xpToNextLevel}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
