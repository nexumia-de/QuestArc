import { Component, Show } from 'solid-js';
import { EditorStep } from '../../hooks/useStoryEditor';
import { CompletionType, TaskDefinition } from '../../types/state';
import TaskEditor from './TaskEditor';
import CompletionRequirementEditor from './CompletionRequirementEditor';

interface StepBuilderProps {
    step: EditorStep;
    index: number;
    isRemovable: boolean;
    onRemove: () => void;
    onUpdate: (field: keyof EditorStep, value: any) => void;

    // Task Actions
    onAddTask: () => void;
    onUpdateTask: (taskIndex: number, updates: Partial<TaskDefinition>) => void;
    onRemoveTask: (taskIndex: number) => void;

    // Completion Actions
    onUpdateCompletionType: (type: CompletionType) => void;
    onUpdateCompletionConfig: (field: string, value: any) => void;
}

const StepBuilder: Component<StepBuilderProps> = (props) => {
    return (
        <div class="step-builder-card">
            <div class="step-header">
                <h4>Step {props.index + 1}</h4>
                <div class="step-meta">
                    <label>XP Reward:</label>
                    <input
                        type="number"
                        class="small-input"
                        value={props.step.xpReward || 0}
                        onInput={(e) => props.onUpdate('xpReward', parseInt(e.currentTarget.value, 10))}
                    />
                    <Show when={props.isRemovable}>
                        <button class="remove-btn" onClick={props.onRemove}>🗑️</button>
                    </Show>
                </div>
            </div>

            <div class="form-group">
                <label>Step Title</label>
                <input
                    type="text"
                    placeholder="e.g. Enter the Dungeon"
                    value={props.step.title || ''}
                    onInput={(e) => props.onUpdate('title', e.currentTarget.value)}
                />
            </div>

            <div class="form-group">
                <label>Flavor Text (Narrative)</label>
                <textarea
                    class="story-textarea"
                    placeholder="Describe the scene or story event..."
                    value={props.step.flavor_text || ''}
                    onInput={(e) => props.onUpdate('flavor_text', e.currentTarget.value)}
                    rows={3}
                />
            </div>

            <div class="form-row">
                <div class="form-group half-width">
                    <label>Display Mode</label>
                    <select
                        value={props.step.display_mode || 'visible'}
                        onChange={(e) => props.onUpdate('display_mode', e.currentTarget.value)}
                    >
                        <option value="visible">Visible (Always Open)</option>
                        <option value="collapsed">Collapsed (Story Scroll)</option>
                        <option value="tooltip">Tooltip (Subtle Icon)</option>
                    </select>
                </div>
                <Show when={props.step.display_mode === 'tooltip'}>
                    <div class="form-group icon-input-group">
                        <label>Icon</label>
                        <input
                            type="text"
                            placeholder="📖"
                            value={props.step.story_icon || ''}
                            onInput={(e) => props.onUpdate('story_icon', e.currentTarget.value)}
                            style={{ 'text-align': 'center' }}
                        />
                    </div>
                </Show>
            </div>
            <div class="form-row">
                <Show when={props.step.display_mode === 'collapsed'}>
                    <div class="form-group half-width">
                        <label>Summary Text</label>
                        <input
                            type="text"
                            placeholder="e.g. The Story so far..."
                            value={props.step.summary_text || ''}
                            onInput={(e) => props.onUpdate('summary_text', e.currentTarget.value)}
                        />
                    </div>
                </Show>
            </div>

            <div class="form-row">
                <div class="form-group half-width">
                    <label>Environment Theme</label>
                    <input
                        type="text"
                        placeholder="e.g. #2e7d32 or forest"
                        value={props.step.environment_theme || ''}
                        onInput={(e) => props.onUpdate('environment_theme', e.currentTarget.value)}
                    />
                </div>
            </div>

            <TaskEditor
                tasks={props.step.tasksToCreate || []}
                onAdd={props.onAddTask}
                onUpdate={props.onUpdateTask}
                onRemove={props.onRemoveTask}
            />

            <CompletionRequirementEditor
                completion={props.step.completion}
                onUpdateType={props.onUpdateCompletionType}
                onUpdateConfig={props.onUpdateCompletionConfig}
            />
        </div>
    );
};

export default StepBuilder;
