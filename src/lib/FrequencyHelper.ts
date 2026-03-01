import { QuestTaskData } from '../types/quest-v2';

/**
 * Shared utility for extracting and syncing frequency from task titles/data.
 * Used by both StreakLogic and HabitService to ensure consistency.
 */
export class FrequencyHelper {
    private static readonly FREQ_REGEX = /\[freq(?::(.*?))?\]/i;
    private static readonly SHOULD_BLOCK_REGEX = /\[shouldBlock:true\]/i;
    private static readonly MIN_RESET_REGEX = /\[minReset:(daily|cycle)\]/i;

    /**
     * Extracts frequency from title [freq:...] tag and syncs it to questData.
     * Returns the resolved frequency expression.
     *
     * Priority:
     * 1. [freq:...] tag in title (syncs to JSON)
     * 2. questData.meta.frequency
     * 3. 'daily' (default)
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

        // Fallback chain: meta.frequency -> 'daily'
        return questData.meta?.frequency || 'daily';
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

    /**
     * Returns true if [shouldBlock:true] is present in the title.
     * Syncs the result into questData.meta.shouldBlock.
     */
    static parseShouldBlock(questData: QuestTaskData, title: string): boolean {
        const result = this.SHOULD_BLOCK_REGEX.test(title);
        if (result) {
            questData.meta.shouldBlock = true;
        }
        return result;
    }

    /**
     * Parses [minReset:daily] or [minReset:cycle] from the title.
     * Syncs the result into questData.meta.minResetGranularity.
     * Returns null if no tag is found.
     */
    static parseMinResetGranularity(
        questData: QuestTaskData,
        title: string,
    ): 'daily' | 'cycle' | null {
        const match = title.match(this.MIN_RESET_REGEX);
        if (match && match[1]) {
            const granularity = match[1].toLowerCase() as 'daily' | 'cycle';
            questData.meta.minResetGranularity = granularity;
            return granularity;
        }
        return null;
    }

    /**
     * Heuristic: returns true if the given CRON expression can fire more than
     * once per calendar day (i.e. it's a sub-daily frequency).
     * Named aliases (daily, weekly, monthly) are never considered sub-daily.
     *
     * Examples that return true:  every minute, every hour
     * Examples that return false: daily, weekly, 0 9 * * * (once per day)
     */
    static isShorterThanOneDay(freq: string): boolean {
        const normalized = freq.trim().toLowerCase();

        // Well-known named aliases - never sub-daily
        const namedAliases = ['daily', 'weekly', 'monthly', 'yearly', 'workdays', 'weekends'];
        if (namedAliases.some((alias) => normalized === alias)) return false;

        // Try to parse as CRON (5-field standard: min hour dom month dow)
        const parts = normalized.split(/\s+/);
        if (parts.length !== 5) return false;

        const minutePart = parts[0] ?? '';
        const hourPart = parts[1] ?? '';

        // If the minute field fires on every minute -> sub-daily
        if (minutePart === '*') return true;

        // If minute field is a wildcard-step like */N, check if N < 60 and hour is wildcard
        const minuteStepMatch = minutePart.match(/^\*\/(\d+)$/);
        if (minuteStepMatch) {
            const step = parseInt(minuteStepMatch[1] ?? '0', 10);
            if (step < 60 && hourPart === '*') return true;
        }

        // If hour field fires multiple times per day (wildcard or */N with N < 24)
        if (hourPart === '*') return true;
        const hourStepMatch = hourPart.match(/^\*\/(\d+)$/);
        if (hourStepMatch) {
            const step = parseInt(hourStepMatch[1] ?? '0', 10);
            if (step < 24) return true;
        }

        // Otherwise it's once-a-day or less
        return false;
    }
}
