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
