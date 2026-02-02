export const TaskType = {
    BOSS: 'BOSS',
    HABIT: 'HABIT',
    GRIND: 'GRIND',
    SIMPLE: 'SIMPLE'
} as const;

export const HookName = {
    TASK_COMPLETE: 'taskComplete',
    TASK_UPDATE: 'taskUpdate',
    CURRENT_TASK_CHANGE: 'currentTaskChange'
} as const;

export const Legacy = {
    QUEST_ARC_TAG: '#QuestArc'
} as const;

export const Symbol = {
    QUEST_ACTIVE: '🧭',
    QUEST_DONE: '✅',
    TEMPLATE: '📜'
} as const;
