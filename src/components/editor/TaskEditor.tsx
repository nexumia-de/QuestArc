import { Component, Index, Show } from 'solid-js';
import { TaskDefinition } from '../../types/state';

interface TaskEditorProps {
    tasks: TaskDefinition[];
    onAdd: () => void;
    onUpdate: (index: number, updates: Partial<TaskDefinition>) => void;
    onRemove: (index: number) => void;
}

const TaskEditor: Component<TaskEditorProps> = (props) => {
    return (
        <div class="tasks-section">
            <h5>Tasks to Create</h5>
            <div class="tasks-list">
                <Index each={props.tasks}>
                    {(task, index) => (
                        <div class="task-card">
                            <div class="task-info-line">
                                <input
                                    type="text"
                                    class="task-name-input"
                                    placeholder="Task Name"
                                    value={task().title || ''}
                                    onInput={(e) => props.onUpdate(index, { title: e.currentTarget.value })}
                                />
                                <button
                                    class="remove-task-mini-btn"
                                    onClick={() => props.onRemove(index)}
                                    title="Remove Task"
                                >
                                    ×
                                </button>
                            </div>

                            <div class="task-options-row">
                                <label class="checkbox-pill">
                                    <input
                                        type="checkbox"
                                        checked={task().isAutoCreate || false}
                                        onChange={(e) => props.onUpdate(index, { isAutoCreate: e.currentTarget.checked })}
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

                                            props.onUpdate(index, updates);
                                        }}
                                    />
                                    Repeat
                                </label>

                                <label class="checkbox-pill required-pill">
                                    <input
                                        type="checkbox"
                                        checked={task().isRequired !== false} // Default true
                                        onChange={(e) => props.onUpdate(index, { isRequired: e.currentTarget.checked })}
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
                                            onChange={(e) => props.onUpdate(index, {
                                                repeatCfg: {
                                                    repeatEvery: task().repeatCfg?.repeatEvery || 1,
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
                                                onInput={(e) => props.onUpdate(index, { requiredCount: parseInt(e.currentTarget.value) })}
                                            />
                                        </div>
                                    </Show>
                                </div>
                            </Show>
                        </div>
                    )}
                </Index>
                <button class="small-btn" onClick={props.onAdd}>+ Add Task</button>
            </div>
        </div>
    );
};

export default TaskEditor;
