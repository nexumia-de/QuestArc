import { Component, Index, Show } from 'solid-js';
import { HeroStory } from '../types/state';
import { useStoryEditor, EditorStep } from '../hooks/useStoryEditor';
import StepBuilder from './editor/StepBuilder';

interface EditorViewProps {
    initialStory: HeroStory | undefined;
    onSave: (title: string, steps: EditorStep[]) => Promise<void>;
    onCancel: () => void;
    errorMessage: string | null;
}

const EditorView: Component<EditorViewProps> = (props) => {
    const {
        storyTitle,
        setStoryTitle,
        steps,
        addStep,
        removeStep,
        updateStep,
        addTaskToStep,
        updateTask,
        removeTask,
        updateCompletionType,
        updateCompletionConfig
    } = useStoryEditor(props.initialStory);

    const handleSave = () => {
        props.onSave(storyTitle(), steps());
    };

    return (
        <section class="editor-view">
            <h2>{props.initialStory ? 'Edit Heroic Story' : 'Forge New Story'}</h2>

            <div class="form-group">
                <label>Story Name</label>
                <input
                    type="text"
                    placeholder="e.g. The Productivity Quest"
                    value={storyTitle()}
                    onInput={(e) => setStoryTitle(e.currentTarget.value)}
                />
            </div>

            <div class="steps-list">
                <Index each={steps()}>
                    {(step, index) => (
                        <StepBuilder
                            step={step()}
                            index={index}
                            isRemovable={steps().length > 1}
                            onRemove={() => removeStep(index)}
                            onUpdate={(field, value) => updateStep(index, field, value)}
                            onAddTask={() => addTaskToStep(index)}
                            onUpdateTask={(taskIndex, updates) => updateTask(index, taskIndex, updates)}
                            onRemoveTask={(taskIndex) => removeTask(index, taskIndex)}
                            onUpdateCompletionType={(type) => updateCompletionType(index, type)}
                            onUpdateCompletionConfig={(field, value) => updateCompletionConfig(index, field, value)}
                        />
                    )}
                </Index>
            </div>

            <button class="secondary-btn add-step-btn" onClick={addStep}>
                + Add Next Step
            </button>

            <Show when={props.errorMessage}>
                <div class="error-message">
                    {props.errorMessage}
                </div>
            </Show>

            <div class="button-row">
                <button
                    class="primary-btn"
                    onClick={handleSave}
                    disabled={!storyTitle()}
                >
                    {props.initialStory ? 'Update Story' : 'Forge Story'}
                </button>
                <button class="secondary-btn cancel-btn" onClick={props.onCancel}>
                    Cancel
                </button>
            </div>
        </section>
    );
};

export default EditorView;
