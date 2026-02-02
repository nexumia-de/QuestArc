export interface TaskHookPayload {
    task: {
        id: string;
        title: string;
        isDone: boolean;
        projectId?: string;
        notes?: string;
        parentId?: string;
        subTaskIds?: string[];
        tagIds?: string[];
    };
}

export interface TaskNoteJSON {
    meta: {
        type: 'BOSS' | 'HABIT' | 'GRIND' | 'SIMPLE';
        version?: number;
        damage?: number;
        damageEvery?: number;
        frequency?: string;
        originalTitle?: string;
        sourceIndex?: number;
    };
    progress?: {
        current?: number;
        target?: number;
        streak?: {
            current: number;
            highest?: number;
            target?: number;
        };
        lastUpdated?: number;
        lastDoneDate?: string; // Human readable
    };
    reward?: {
        xp: number;
    };
}
