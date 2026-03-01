export type QuestTaskType = 'SIMPLE' | 'GRIND' | 'HABIT' | 'BOSS';

export interface QuestTaskData {
    meta: {
        type: QuestTaskType;
        version: number;
        originalTitle: string; // Keep track of the source title
        sourceIndex?: number; // Original index in template (for sequential loading)
        damage?: number; // Custom damage amount (e.g. [dmg:10])
        damageEvery?: number; // Custom damage frequency (e.g. [dmgevery:1])
        frequency?: string; // [freq:...] value
        persistent?: string | boolean; // [persistent] value
        stack?: string; // [stack:ID] — habit chain identifier for cross-step stacking
        shouldBlock?: boolean; // [shouldBlock:true] – opt-in hard block after target reached in cycle
        minResetGranularity?: 'daily' | 'cycle'; // floor for blocking: 'daily' = 1x/day max (default), 'cycle' = per freq cycle
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
        lastDoneDate?: string; // Human readable ISO date (manual override)
        bonusCount?: number;   // Extra completions beyond target within current cycle (resets each cycle)
        streak?: {
            current: number;
            target?: number; // Optional target to complete something
            highest?: number;
            tier?: 'bronze' | 'silver' | 'gold' | 'diamond'; // Milestone tier
            availableGrace?: number;   // Bank of grace tokens
            graceCron?: string;        // Optional cron schedule to earn bonus grace
            lastGraceGrantDate?: string; // ISO string tracking last bonus grant

            totalCompletions?: number; // Lifetime count (never resets)
            lastMissDate?: string; // Human readable date when streak was last reduced
        };
    };

    // Only for Bosses (Optional)
    boss?: {
        image?: string;
        dmgPerHit?: number;
        hp: number;
    };
}
