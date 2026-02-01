export type QuestTaskType = 'SIMPLE' | 'GRIND' | 'HABIT' | 'BOSS';

export interface QuestTaskData {
    meta: {
        type: QuestTaskType;
        version: number;
        originalTitle: string; // Keep track of the source title
        sourceIndex?: number; // Original index in template (for sequential loading)
        damage?: number; // Custom damage amount (e.g. [dmg:10])
        damageEvery?: number; // Custom damage frequency (e.g. [dmgevery:1])
    };

    // For Story Steps (Parents)
    reward?: {
        xp: number;
    };

    // For Conditions (Subtasks)
    progress?: {
        current: number;
        target?: number; // HP or Repetitions
        unit?: string;  // e.g., "HP"
        lastUpdated?: number;
        streak?: {
            current: number;
            target?: number; // Optional target to complete something
            highest?: number;
        };
    };

    // Only for Habits
    routine?: {
        frequency: string; // '@daily', 'cron:...' or custom
        lastDone: number | null; // Timestamp
    };

    // Only for Bosses (Optional)
    boss?: {
        image?: string;
        dmgPerHit?: number;
        hp: number;
    };
}
