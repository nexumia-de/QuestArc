import { Component, Show } from 'solid-js';
import { CompletionRequirement, CompletionType } from '../../types/state';

interface CompletionRequirementEditorProps {
    completion: CompletionRequirement;
    onUpdateType: (type: CompletionType) => void;
    onUpdateConfig: (field: string, value: any) => void;
}

const CompletionRequirementEditor: Component<CompletionRequirementEditorProps> = (props) => {
    return (
        <div class="requirements-section">
            <h5>Step Goal</h5>
            <div class="form-group">
                <select
                    value={props.completion?.type || 'tasks_completed'}
                    onChange={(e) => props.onUpdateType(e.currentTarget.value as CompletionType)}
                >
                    <option value="tasks_completed">Complete Required Tasks</option>
                    <option value="boss_defeat">Defeat Boss</option>
                </select>
            </div>

            <Show when={props.completion?.type === 'tasks_completed'}>
                <div class="info-box">
                    <p>This step is complete when all <strong>Required (❗)</strong> tasks meet their targets.</p>
                </div>
            </Show>

            <Show when={props.completion?.type === 'boss_defeat'}>
                <div class="form-group">
                    <label>Boss HP:</label>
                    <input
                        type="number"
                        min="10"
                        value={props.completion.config?.boss?.maxHp || 100}
                        onInput={(e) => props.onUpdateConfig('boss_hp', parseInt(e.currentTarget.value, 10))}
                    />
                </div>
                <div class="form-group">
                    <label>Boss Name:</label>
                    <input
                        type="text"
                        placeholder="e.g. The Procrastination Monster"
                        value={props.completion.config?.boss?.name || ''}
                        onInput={(e) => props.onUpdateConfig('boss_name', e.currentTarget.value)}
                    />
                </div>
                <div class="form-group">
                    <label>Boss Image (URL or Emoji):</label>
                    <input
                        type="text"
                        placeholder="e.g. 🐉 or https://example.com/dragon.png"
                        value={props.completion.config?.boss?.image || ''}
                        onInput={(e) => props.onUpdateConfig('boss_image', e.currentTarget.value)}
                    />
                </div>
                <div class="form-group">
                    <label>Theme Color:</label>
                    <div style={{ display: 'flex', gap: '0.5rem', 'align-items': 'center' }}>
                        <input
                            type="color"
                            value={props.completion.config?.boss?.themeColor || '#ff0000'}
                            onInput={(e) => props.onUpdateConfig('boss_themeColor', e.currentTarget.value)}
                            style={{ height: '40px', width: '60px', padding: '0', border: 'none' }}
                        />
                        <span style={{ 'font-size': '0.9rem', opacity: 0.7 }}>
                            {props.completion.config?.boss?.themeColor || '#ff0000'}
                        </span>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default CompletionRequirementEditor;
