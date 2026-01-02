import { createSignal } from 'solid-js';
import { HeroStory, StoryStep, TaskDefinition, CompletionType, CompletionRequirement } from '../types/state';

// We manage the step without the ID/NextID until save time
export type EditorStep = Omit<StoryStep, 'id' | 'nextStepId'>;

export function useStoryEditor(initialStory: HeroStory | null) {
    const [storyTitle, setStoryTitle] = createSignal(initialStory?.title || '');

    // transform initial steps or default to one empty step
    const initialStepsState: EditorStep[] = initialStory
        ? initialStory.steps.map(s => ({
            title: s.title || '',
            tasksToCreate: s.tasksToCreate || [],
            completion: s.completion || { type: 'tasks_completed' },
            xpReward: s.xpReward || 0
        }))
        : [{
            title: '',
            xpReward: 50,
            tasksToCreate: [{ title: '', isAutoCreate: true }],
            completion: { type: 'tasks_completed' }
        }];

    const [steps, setSteps] = createSignal<EditorStep[]>(initialStepsState);

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
        const step = newSteps[index];
        if (!step) return;
        newSteps[index] = { ...step, [field]: value };
        setSteps(newSteps);
    };

    // Task Management
    const addTaskToStep = (stepIndex: number) => {
        const newSteps = [...steps()];
        const step = newSteps[stepIndex];
        if (!step) return;

        const currentTasks = step.tasksToCreate || [];
        newSteps[stepIndex] = {
            ...step,
            tasksToCreate: [...currentTasks, { title: '', isAutoCreate: true }]
        };
        setSteps(newSteps);
    };

    const updateTask = (stepIndex: number, taskIndex: number, updates: Partial<TaskDefinition>) => {
        const newSteps = [...steps()];
        const step = newSteps[stepIndex];
        if (!step) return;

        const tasks = [...(step.tasksToCreate || [])];
        const existingTask = tasks[taskIndex];
        if (!existingTask) return;

        tasks[taskIndex] = { ...existingTask, ...updates };

        newSteps[stepIndex] = {
            ...step,
            tasksToCreate: tasks
        };

        setSteps(newSteps);
    };

    const removeTask = (stepIndex: number, taskIndex: number) => {
        const newSteps = [...steps()];
        const step = newSteps[stepIndex];
        if (!step) return;

        const tasks = [...(step.tasksToCreate || [])];
        tasks.splice(taskIndex, 1);

        newSteps[stepIndex] = {
            ...step,
            tasksToCreate: tasks
        };

        setSteps(newSteps);
    };

    // Completion Management
    const updateCompletionType = (stepIndex: number, type: CompletionType) => {
        const newSteps = [...steps()];
        const step = newSteps[stepIndex];
        if (!step) return;

        const newCompletion: CompletionRequirement = { type };

        if (type === 'boss_defeat') {
            newCompletion.config = { boss: { hp: 100, maxHp: 100, damageModifiers: [] } };
        } else {
            newCompletion.config = {};
        }

        newSteps[stepIndex] = {
            ...step,
            completion: newCompletion
        };
        setSteps(newSteps);
    };

    const updateCompletionConfig = (stepIndex: number, field: string, value: any) => {
        const newSteps = [...steps()];
        const step = newSteps[stepIndex];
        if (!step) return;

        const currentCompletion = step.completion;
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

        newSteps[stepIndex] = {
            ...step,
            completion: {
                ...currentCompletion,
                config: newConfig
            }
        };
        setSteps(newSteps);
    };

    return {
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
    };
}
