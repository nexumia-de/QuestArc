import { Component, createSignal, Index, Show, onMount } from 'solid-js';
import { HeroStory } from '../types/state';

interface EditorViewProps {
    initialStory: HeroStory | null;
    onSave: (title: string, steps: { title: string; target: number; xp: number }[]) => Promise<void>;
    onCancel: () => void;
    errorMessage: string | null;
}

const EditorView: Component<EditorViewProps> = (props) => {
    const [storyTitle, setStoryTitle] = createSignal('');
    const [steps, setSteps] = createSignal<{ title: string; target: number; xp: number }[]>([
        { title: '', target: 3, xp: 50 }
    ]);

    // Initialize form if editing
    onMount(() => {
        if (props.initialStory) {
            setStoryTitle(props.initialStory.title);
            setSteps(props.initialStory.steps.map(s => ({
                title: s.title,
                target: s.condition?.target ?? 1,
                xp: s.xpReward
            })));
        }
    });

    const addStep = () => {
        setSteps([...steps(), { title: '', target: 3, xp: 50 }]);
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...steps()];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const removeStep = (index: number) => {
        const newSteps = [...steps()];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const handleSave = () => {
        props.onSave(storyTitle(), steps());
    };

    return (
        <section class="editor-view">
            <h2>{props.initialStory ? 'Edit Habit Quest' : 'Create New Habit Quest'}</h2>

            <div class="form-group">
                <label>Story Name</label>
                <input
                    type="text"
                    placeholder="e.g. Marathon Prep"
                    value={storyTitle()}
                    onInput={(e) => setStoryTitle(e.currentTarget.value)}
                />
            </div>

            <div class="steps-list">
                <Index each={steps()}>
                    {(step, index) => (
                        <div class="step-builder-card">
                            <h4>Step {index + 1}</h4>
                            <div class="form-group">
                                <label>Habit</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Put on shoes"
                                    value={step().title}
                                    onInput={(e) => updateStep(index, 'title', e.currentTarget.value)}
                                />
                            </div>
                            <div class="form-row">
                                <div class="form-group half">
                                    <label>Days Streak</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={step().target}
                                        onInput={(e) => updateStep(index, 'target', parseInt(e.currentTarget.value, 10))}
                                    />
                                </div>
                                <div class="form-group half">
                                    <label>XP Reward</label>
                                    <input
                                        type="number"
                                        value={step().xp}
                                        onInput={(e) => updateStep(index, 'xp', parseInt(e.currentTarget.value, 10))}
                                    />
                                </div>
                            </div>
                            {steps().length > 1 && (
                                <button class="remove-btn" onClick={() => removeStep(index)}>
                                    🗑️
                                </button>
                            )}
                        </div>
                    )}
                </Index>
            </div>

            <button class="secondary-btn add-step-btn" onClick={addStep}>
                + Add Next Habit Step
            </button>

            <Show when={props.errorMessage}>
                <div class="error-message" style={{ color: 'var(--hp-color)', 'margin-top': '1rem', padding: '0.75rem', border: '1px solid var(--hp-color)', 'border-radius': '4px', 'background-color': 'rgba(239, 68, 68, 0.1)' }}>
                    {props.errorMessage}
                </div>
            </Show>

            <div class="button-row">
                <button class="primary-btn" onClick={handleSave} disabled={!storyTitle() || steps().some(s => !s.title)}>
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
