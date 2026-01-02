import { Component, createSignal, Index, Show, onMount, For } from 'solid-js';
import { HeroStory, StoryStep, TaskDefinition, CompletionType, CompletionRequirement } from '../types/state';

// We manage the step without the ID/NextID until save time
type EditorStep = Omit<StoryStep, 'id' | 'nextStepId'>;

interface EditorViewProps {
    initialStory: HeroStory | null;
    onSave: (title: string, steps: EditorStep[]) => Promise<void>;
    onCancel: () => void;
    errorMessage: string | null;
}

const EditorView: Component<EditorViewProps> = (props) => {
    const [storyTitle, setStoryTitle] = createSignal('');
    const [steps, setSteps] = createSignal<EditorStep[]>([
        {
            title: '',
            xpReward: 50,
            tasksToCreate: [{ title: '', isAutoCreate: true }],
            completion: { type: 'tasks_completed' }
        }
    ]);

    // Initialize form if editing
    onMount(() => {
        if (props.initialStory) {
            setStoryTitle(props.initialStory.title);
            setSteps(props.initialStory.steps.map(s => ({
                title: s.title || '',
                tasksToCreate: s.tasksToCreate || [],
                completion: s.completion || { type: 'tasks_completed' },
                xpReward: s.xpReward || 0
            })));
        }
    });

    const addStep = () => {
        setSteps([...steps(), {
            title: '',
            xpReward: 50,
            tasksToCreate: [{ title: '', isAutoCreate: true }],
            completion: { type: 'tasks_completed' }
        }]);
    };

    const removeStep = (index: number) => {
        const newSteps = [...steps()];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const updateStep = (index: number, field: keyof EditorStep, value: any) => {
        const newSteps = [...steps()];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    // Task Management
    const addTaskToStep = (stepIndex: number) => {
        const newSteps = [...steps()];
        const currentTasks = newSteps[stepIndex].tasksToCreate || [];
        newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            tasksToCreate: [...currentTasks, { title: '', isAutoCreate: true }]
        };
        setSteps(newSteps);
    };

    const updateTask = (stepIndex: number, taskIndex: number, updates: Partial<TaskDefinition>) => {
        const newSteps = [...steps()];
        const tasks = [...(newSteps[stepIndex].tasksToCreate || [])];
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };

        // Correctly updating the step object immutably
        newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            tasksToCreate: tasks
        };

        setSteps(newSteps);
    };

    const removeTask = (stepIndex: number, taskIndex: number) => {
        const newSteps = [...steps()];
        const tasks = [...(newSteps[stepIndex].tasksToCreate || [])];
        tasks.splice(taskIndex, 1);
        newSteps[stepIndex].tasksToCreate = tasks;
        setSteps(newSteps);
    };

    // Completion Management
    const updateCompletionType = (stepIndex: number, type: CompletionType) => {
        const newSteps = [...steps()];
        const newCompletion: CompletionRequirement = { type };

        // Set defaults based on type
        if (type === 'boss_defeat') {
            newCompletion.config = { boss: { hp: 100, maxHp: 100, damageModifiers: [] } };
        } else {
            // tasks_completed
            newCompletion.config = {};
        }

        newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            completion: newCompletion
        };
        setSteps(newSteps);
    };

    const updateCompletionConfig = (stepIndex: number, field: string, value: any) => {
        const newSteps = [...steps()];
        const currentCompletion = newSteps[stepIndex].completion;
        const currentConfig = currentCompletion.config || {};

        let newConfig = { ...currentConfig };

        if (field === 'boss_hp') {
            newConfig.boss = {
                hp: value,
                maxHp: value,
                damageModifiers: newConfig.boss?.damageModifiers || []
            };
        } else {
            newConfig = { ...newConfig, [field]: value };
        }

        newSteps[stepIndex].completion = {
            ...currentCompletion,
            config: newConfig
        };
        setSteps(newSteps);
    };

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
                        <div class="step-builder-card">
                            <div class="step-header">
                                <h4>Step {index + 1}</h4>
                                <div class="step-meta">
                                    <label>XP Reward:</label>
                                    <input
                                        type="number"
                                        class="small-input"
                                        value={step().xpReward || 0}
                                        onInput={(e) => updateStep(index, 'xpReward', parseInt(e.currentTarget.value, 10))}
                                    />
                                    {steps().length > 1 && (
                                        <button class="remove-btn" onClick={() => removeStep(index)}>🗑️</button>
                                    )}
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Step Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Enter the Dungeon"
                                    value={step().title || ''}
                                    onInput={(e) => updateStep(index, 'title', e.currentTarget.value)}
                                />
                            </div>

                            <div class="tasks-section">
                                <h5>Tasks to Create</h5>
                                <div class="tasks-list">
                                    <Index each={step().tasksToCreate || []}>
                                        {(task, tIndex) => (
                                            <div class="task-card">
                                                <div class="task-info-line">
                                                    <input
                                                        type="text"
                                                        class="task-name-input"
                                                        placeholder="Task Name"
                                                        value={task().title || ''}
                                                        onInput={(e) => updateTask(index, tIndex, { title: e.currentTarget.value })}
                                                    />
                                                    <button class="remove-task-mini-btn" onClick={() => removeTask(index, tIndex)} title="Remove Task">×</button>
                                                </div>

                                                <div class="task-options-row">
                                                    <label class="checkbox-pill">
                                                        <input
                                                            type="checkbox"
                                                            checked={task().isAutoCreate || false}
                                                            onChange={(e) => updateTask(index, tIndex, { isAutoCreate: e.currentTarget.checked })}
                                                        />
                                                        Auto-add
                                                    </label>

                                                    <label class="checkbox-pill">
                                                        <input
                                                            type="checkbox"
                                                            checked={task().isRepeating || false}
                                                            onChange={(e) => {
                                                                const checked = e.currentTarget.checked;
                                                                const updates: Partial<TaskDefinition> = { isRepeating: checked };

                                                                if (checked && !task().repeatCfg) {
                                                                    updates.repeatCfg = { repeatEvery: 1, repeatType: 'DAILY' };
                                                                }

                                                                updateTask(index, tIndex, updates);
                                                            }}
                                                        />
                                                        Repeat
                                                    </label>

                                                    <label class="checkbox-pill required-pill">
                                                        <input
                                                            type="checkbox"
                                                            checked={task().isRequired !== false} // Default true
                                                            onChange={(e) => updateTask(index, tIndex, { isRequired: e.currentTarget.checked })}
                                                        />
                                                        Required
                                                    </label>
                                                </div>

                                                <Show when={task().isRepeating}>
                                                    <div class="repeat-settings-panel">
                                                        <div class="setting-group">
                                                            <span>Every</span>
                                                            <select
                                                                class="compact-select"
                                                                value={task().repeatCfg?.repeatType || 'DAILY'}
                                                                onChange={(e) => updateTask(index, tIndex, {
                                                                    repeatCfg: {
                                                                        ...task().repeatCfg,
                                                                        repeatType: e.currentTarget.value as any
                                                                    }
                                                                })}
                                                            >
                                                                <option value="DAILY">Day</option>
                                                                <option value="WEEKLY">Week</option>
                                                            </select>
                                                        </div>

                                                        <Show when={task().isRequired !== false}>
                                                            <div class="setting-group">
                                                                <span>Target:</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    class="compact-input"
                                                                    value={task().requiredCount || 1}
                                                                    onInput={(e) => updateTask(index, tIndex, { requiredCount: parseInt(e.currentTarget.value) })}
                                                                />
                                                            </div>
                                                        </Show>
                                                    </div>
                                                </Show>
                                            </div>
                                        )}
                                    </Index>
                                    <button class="small-btn" onClick={() => addTaskToStep(index)}>+ Add Task</button>
                                </div>
                            </div>

                            {/* COMPLETION REQUIREMENTS */}
                            <div class="requirements-section">
                                <h5>Step Goal</h5>
                                <div class="form-group">
                                    <select
                                        value={step().completion?.type || 'tasks_completed'}
                                        onChange={(e) => updateCompletionType(index, e.currentTarget.value as CompletionType)}
                                    >
                                        <option value="tasks_completed">Complete Required Tasks</option>
                                        <option value="boss_defeat">Defeat Boss</option>
                                    </select>
                                </div>

                                <Show when={step().completion?.type === 'tasks_completed'}>
                                    <div class="info-box">
                                        <p>This step is complete when all <strong>Required (❗)</strong> tasks meet their targets.</p>
                                    </div>
                                </Show>

                                <Show when={step().completion?.type === 'boss_defeat'}>
                                    <div class="form-group">
                                        <label>Boss HP:</label>
                                        <input
                                            type="number"
                                            min="10"
                                            value={step().completion.config?.boss?.maxHp || 100}
                                            onInput={(e) => updateCompletionConfig(index, 'boss_hp', parseInt(e.currentTarget.value, 10))}
                                        />
                                    </div>
                                </Show>
                            </div>

                        </div>
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
