import { QuestTaskData } from '../types/quest-v2';

/**
 * Shared utility for extracting and syncing frequency from task titles/data.
 * Used by both StreakLogic and HabitService to ensure consistency.
 */
export class FrequencyHelper {
    private static readonly FREQ_REGEX = /\[freq(?::(.*?))?\]/i;

    /**
     * Extracts frequency from title [freq:...] tag and syncs it to questData.
     * Returns the resolved frequency expression.
     * 
     * Priority:
     * 1. [freq:...] tag in title (syncs to JSON)
     * 2. questData.meta.frequency
     * 3. questData.routine.frequency (legacy fallback)
     * 4. 'daily' (default)
     */
    static syncAndGetFrequency(questData: QuestTaskData, title: string): string {
        const freqMatch = title.match(this.FREQ_REGEX);

        if (freqMatch && freqMatch[1]) {
            const titleFreq = freqMatch[1].trim();
            if (titleFreq) {
                // Sync to meta.frequency
                if (!questData.meta) {
                    questData.meta = {} as any;
                }
                questData.meta.frequency = titleFreq;
                return titleFreq;
            }
        }

        // Fallback chain: meta.frequency -> routine.frequency (legacy) -> 'daily'
        return questData.meta?.frequency || questData.routine?.frequency || 'daily';
    }

    /**
     * Extracts frequency from a raw title or notes string without modifying data.
     * Returns the frequency string if found, or null.
     */
    static extractFrequencyFromText(text: string): string | null {
        const match = text.match(this.FREQ_REGEX);
        if (match && match[1]) {
            return match[1].trim() || null;
        }
        return null;
    }
}
