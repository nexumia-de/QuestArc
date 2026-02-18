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
        persistent?: string | boolean;
        stack?: string;
    };
    progress?: {
        current?: number;
        target?: number;
        streak?: {
            current: number;
            highest?: number;
            target?: number;
            tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
            totalCompletions?: number;
            availableGrace?: number;
            graceCron?: string;
            lastGraceGrantDate?: string;
            lastMissDate?: string;
        };
        lastUpdated?: number;
        lastDoneDate?: string; // Human readable
    };
    reward?: {
        xp: number;
    };
    boss?: {
        hp: number;
        image?: string;
        dmgPerHit?: number;
    };
}
