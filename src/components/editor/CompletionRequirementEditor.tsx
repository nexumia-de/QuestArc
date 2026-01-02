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
            </Show>
        </div>
    );
};

export default CompletionRequirementEditor;
