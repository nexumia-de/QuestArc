import { Component, createSignal, For, Show } from 'solid-js';
import { AppView } from '../hooks/useNavigation';
import { QuestArcState, CustomTagConfig } from '../types/state';

interface SettingsViewProps {
    settings?: QuestArcState['settings']; // Optional because state loads async
    onNavigate: (view: AppView) => void;
    onReset: () => void;
    onUpdateSettings: (settings: QuestArcState['settings']) => void;
}

const SettingsView: Component<SettingsViewProps> = (props) => {
    const [isResetConfirming, setIsResetConfirming] = createSignal(false);

    // Custom Tag State
    const [newTag, setNewTag] = createSignal('');
    const [newTagDamage, setNewTagDamage] = createSignal(10);

    const handleReset = () => {
        if (!isResetConfirming()) {
            setIsResetConfirming(true);
            setTimeout(() => setIsResetConfirming(false), 3000);
            return;
        }
        props.onReset();
        setIsResetConfirming(false);
    };

    const handleAddTag = () => {
        let tagInput = newTag().trim();
        if (!tagInput) return;

        // Auto-prepend # if missing
        const tag = tagInput.startsWith('#') ? tagInput : `#${tagInput}`;

        const currentTags = props.settings?.customTags || [];
        if (currentTags.some(t => t.tag.toLowerCase() === tag.toLowerCase())) return;

        const newConfig: CustomTagConfig = {
            id: `tag_${Date.now()}`,
            tag,
            damage: newTagDamage()
        };

        props.onUpdateSettings({
            ...props.settings!, // Assume settings exist if we are here (persistence ensures it)
            customTags: [...currentTags, newConfig]
        });
        setNewTag('');
        setNewTagDamage(10);
    };

    const handleDeleteTag = (id: string) => {
        const currentTags = props.settings?.customTags || [];
        props.onUpdateSettings({
            ...props.settings!,
            customTags: currentTags.filter(t => t.id !== id)
        });
    };

    const handleUpdateTagDamage = (id: string, damage: number) => {
        const currentTags = props.settings?.customTags || [];
        props.onUpdateSettings({
            ...props.settings!,
            customTags: currentTags.map(t => t.id === id ? { ...t, damage } : t)
        });
    };

    return (
        <section class="settings-view">
            <div class="settings-header">
                <h2>Settings</h2>
            </div>

            {/* Custom Damage Tags */}
            <div class="settings-card">
                <div class="setting-item">
                    <div class="setting-info">
                        <h3>Custom Damage Tags</h3>
                        <p>Tasks with these tags deal specific damage to bosses.</p>
                    </div>
                </div>

                <div class="tags-list">
                    <For each={props.settings?.customTags || []}>
                        {(tagConfig) => (
                            <div class="tag-row">
                                <div class="tag-name">
                                    <span class="hash-prefix">#</span>
                                    <span class={tagConfig.isSystem ? 'system-tag' : ''}>{tagConfig.tag.replace(/^#/, '')}</span>
                                </div>
                                <div class="tag-damage-input">
                                    <label>Dmg:</label>
                                    <input
                                        type="number"
                                        value={tagConfig.damage}
                                        min="1"
                                        onInput={(e) => handleUpdateTagDamage(tagConfig.id, parseInt(e.currentTarget.value) || 0)}
                                    />
                                </div>
                                <Show when={!tagConfig.isSystem}>
                                    <button class="delete-btn" onClick={() => handleDeleteTag(tagConfig.id)}>
                                        🗑️
                                    </button>
                                </Show>
                                <Show when={tagConfig.isSystem}>
                                    <div class="lock-icon" title="System Tag (Cannot Delete)">🔒</div>
                                </Show>
                            </div>
                        )}
                    </For>
                </div>

                <div class="add-tag-form">
                    <span class="input-prefix">#</span>
                    <input
                        type="text"
                        placeholder="tag"
                        value={newTag()}
                        onInput={(e) => setNewTag(e.currentTarget.value)}
                    />
                    <input
                        type="number"
                        placeholder="Dmg"
                        value={newTagDamage()}
                        min="1"
                        onInput={(e) => setNewTagDamage(parseInt(e.currentTarget.value) || 0)}
                    />
                    <button onClick={handleAddTag} disabled={!newTag().trim()}>Add</button>
                </div>
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

            <style>{`
              .tags-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 1rem;
              }
              .tag-row {
                display: flex;
                align-items: center;
                gap: 1rem;
                background: rgba(255, 255, 255, 0.05);
                padding: 0.5rem;
                border-radius: 6px;
              }
              .tag-name {
                flex: 1;
                font-family: monospace;
                font-weight: bold;
                display: flex;
                align-items: center;
              }
              .hash-prefix {
                opacity: 0.3;
                margin-right: 2px;
              }
              .input-prefix {
                font-family: monospace;
                font-weight: bold;
                opacity: 0.5;
                padding: 8px 0 8px 8px;
                display: flex;
                align-items: center;
              }
              .system-tag {
                color: var(--accent-color);
              }
              .tag-damage-input {
                display: flex;
                align-items: center;
                gap: 0.5rem;
              }
              .tag-damage-input input {
                width: 60px;
                padding: 4px;
                border-radius: 4px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.2);
                color: white;
              }
              .delete-btn {
                background: none;
                border: none;
                cursor: pointer;
                opacity: 0.7;
              }
              .delete-btn:hover {
                opacity: 1;
              }
              .lock-icon {
                font-size: 0.9em;
                opacity: 0.5;
                padding: 0 5px;
              }
              .add-tag-form {
                display: flex;
                gap: 0.5rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255,255,255,0.1);
              }
              .add-tag-form input {
                 padding: 8px;
                 border-radius: 6px;
                 border: 1px solid rgba(255,255,255,0.2);
                 background: rgba(0,0,0,0.2);
                 color: white;
              }
              .add-tag-form button {
                 padding: 8px 16px;
                 border-radius: 6px;
                 background: var(--primary-color);
                 color: white;
                 border: none;
                 cursor: pointer;
              }
              .add-tag-form button:disabled {
                 opacity: 0.5;
                 cursor: not-allowed;
              }
            `}</style>
        </section>
    );
};

export default SettingsView;
