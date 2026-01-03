import { Component, createSignal } from 'solid-js';
import { AppView } from '../hooks/useNavigation';

interface SettingsViewProps {
    onNavigate: (view: AppView) => void;
    onReset: () => void;
}

const SettingsView: Component<SettingsViewProps> = (props) => {
    const [isResetConfirming, setIsResetConfirming] = createSignal(false);

    const handleReset = () => {
        if (!isResetConfirming()) {
            setIsResetConfirming(true);
            setTimeout(() => setIsResetConfirming(false), 3000);
            return;
        }
        props.onReset();
        setIsResetConfirming(false);
    };

    return (
        <div class="settings-view">
            <div class="settings-header">
                <h2>Settings</h2>
            </div>

            <div class="settings-card">
                <div class="setting-item">
                    <div class="setting-info">
                        <h3>Reset Game Progress</h3>
                        <p>Clear all XP, levels, and history. This action cannot be undone.</p>
                    </div>
                    <button
                        class={`reset-btn ${isResetConfirming() ? 'confirming' : ''}`}
                        onClick={handleReset}
                        style={isResetConfirming() ? { 'border-color': 'var(--hp-color)', color: 'var(--hp-color)' } : {}}
                    >
                        {isResetConfirming() ? '⚠️ Confirm Reset' : 'Reset Everything'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
