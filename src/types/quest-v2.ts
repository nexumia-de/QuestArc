export type QuestTaskType = 'SIMPLE' | 'GRIND' | 'HABIT' | 'BOSS';

export interface QuestTaskData {
    meta: {
        type: QuestTaskType;
        version: number;
        originalTitle: string; // Keep track of the source title
    };

    // For Story Steps (Parents)
    reward?: {
        xp: number;
    };

    // For Conditions (Subtasks)
    progress?: {
        current: number;
        target: number; // HP or Repetitions
        unit?: string;  // e.g., "HP"
    };

    // Only for Habits
    routine?: {
        frequency: '@daily' | '@weekly';
        lastDone: number | null; // Timestamp
    };

    // Only for Bosses (Optional)
    boss?: {
        image?: string;
        dmgPerHit?: number;
        hp: number;
    };
}
