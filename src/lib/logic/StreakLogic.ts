import { CronHelper } from '../cron';
import { QuestTaskData } from '../../types/quest-v2';
import { formatTaskTitle } from '../parsers';
import { FrequencyHelper } from '../FrequencyHelper';
import { StreakBehaviorConfig, StreakTier } from '../../types/state';

// Default streak behavior settings
const DEFAULT_STREAK_BEHAVIOR: Required<StreakBehaviorConfig> = {
    gracePeriodsPerCycle: 1,
    decayPercent: 25,
    useTiers: true,
    tierFloors: {
        bronze: 0,
        silver: 7,
        gold: 30,
        diamond: 60,
    },
};

// Tier thresholds (highest streak needed to reach tier)
const TIER_THRESHOLDS = {
    bronze: 0,
    silver: 7,
    gold: 30,
    diamond: 90,
};

export class StreakLogic {

    /**
     * Calculate tier based on highest streak achieved
     */
    static calculateTier(highest: number): StreakTier {
        if (highest >= TIER_THRESHOLDS.diamond) return 'diamond';
        if (highest >= TIER_THRESHOLDS.gold) return 'gold';
        if (highest >= TIER_THRESHOLDS.silver) return 'silver';
        return 'bronze';
    }

    /**
     * Get the floor value for a given tier
     */
    static getTierFloor(tier: StreakTier | undefined, floors?: StreakBehaviorConfig['tierFloors']): number {
        const tierFloors = floors ?? DEFAULT_STREAK_BEHAVIOR.tierFloors;
        if (!tier) return tierFloors.bronze;
        return tierFloors[tier] ?? 0;
    }

    static processGrindProgress(questData: QuestTaskData, cleanTitle: string) {
        const current = questData.progress?.current || 0;
        const target = questData.progress?.target || 1;
        const damageEvery = questData.meta.damageEvery !== undefined ? questData.meta.damageEvery : 1;

        if (current < target) {
            const newCurrent = current + 1;
            if (!questData.progress) questData.progress = { current: 0, target };
            questData.progress.current = newCurrent;

            const isFinished = newCurrent >= target;
            const newTitle = formatTaskTitle(cleanTitle, questData.progress);

            let shouldDealDamage = false;
            if (damageEvery === 0) {
                shouldDealDamage = isFinished;
            } else {
                shouldDealDamage = (newCurrent % damageEvery === 0);
            }

            const updates = {
                isDone: isFinished,
                title: newTitle,
                notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
            };

            return { updates, isPartial: !isFinished, shouldDealDamage };
        }
        return null;
    }

    // Helper to strip dynamic tags for clean processing
    static stripDynamicTags(title: string): string {
        return title.replace(/\s*\[\s*(Next|Due):.*?\]/gi, '').trim();
    }

    static processHabitProgress(
        questData: QuestTaskData,
        cleanTitle: string,
        streakBehavior?: StreakBehaviorConfig
    ) {
        const now = Date.now();
        const settings = { ...DEFAULT_STREAK_BEHAVIOR, ...streakBehavior };

        // 0. Human Readable Date Override
        let resolvedLastUpdated = questData.progress?.lastUpdated || 0;
        if (questData.progress?.lastDoneDate) {
            const manualDate = new Date(questData.progress.lastDoneDate);
            if (!isNaN(manualDate.getTime())) {
                resolvedLastUpdated = manualDate.getTime();
            }
        }
        const lastUpdated = resolvedLastUpdated;

        // Frequency Parsing (using shared helper for consistency)
        const freqExpression = FrequencyHelper.syncAndGetFrequency(questData, cleanTitle);
        const target = questData.progress?.target || 1;

        // --- 1. Missed Streak Logic (with grace/decay/tiers) ---
        if (questData.progress?.streak && lastUpdated > 0) {
            const missedCount = CronHelper.getOccurrencesBetween(freqExpression, lastUpdated, now);

            if (missedCount > 1) {
                const streak = questData.progress.streak;
                const graceMax = settings.gracePeriodsPerCycle;
                const graceUsed = streak.graceUsed ?? 0;

                if (graceUsed < graceMax) {
                    // Consume grace, streak survives
                    streak.graceUsed = graceUsed + 1;
                    // Don't reset current progress - user gets a pass
                } else {
                    // Grace exhausted - apply decay or reset
                    const decay = settings.decayPercent;

                    if (decay > 0 && streak.current > 0) {
                        // Decay: reduce streak by percentage
                        const loss = Math.max(1, Math.floor(streak.current * (decay / 100)));
                        streak.current = Math.max(0, streak.current - loss);
                    } else {
                        // Hard reset
                        streak.current = 0;
                    }

                    // Apply tier floor if enabled
                    if (settings.useTiers) {
                        const tier = streak.tier ?? this.calculateTier(streak.highest ?? 0);
                        const floor = this.getTierFloor(tier, settings.tierFloors);
                        streak.current = Math.max(streak.current, floor);
                        streak.tier = tier; // Persist calculated tier
                    }

                    // Record miss timestamp
                    streak.lastMissTimestamp = now;

                    // Reset grace for new cycle
                    streak.graceUsed = 0;

                    // Reset daily progress counter
                    questData.progress.current = 0;
                }
            }
        } else if (lastUpdated === 0) {
            questData.progress = { ...questData.progress, current: 0 };
        }

        // --- 2. Double-Dip Guard (Anti-Cheat) ---
        const cyclesPassed = (lastUpdated > 0)
            ? CronHelper.getOccurrencesBetween(freqExpression, lastUpdated, now)
            : 1;

        const freshCurrent = questData.progress?.current || 0;

        if (cyclesPassed === 0 && lastUpdated > 0) {
            if (freshCurrent >= target) {
                return {
                    updates: {},
                    stepIncrement: 0,
                    xpGained: 0,
                    shouldDealDamage: false,
                    shouldBlock: true,
                    blockReason: 'ALREADY_DONE_TODAY'
                };
            }
        } else if (cyclesPassed > 0) {
            if (questData.progress) questData.progress.current = 0;
        }

        // Re-read current
        const actualCurrent = questData.progress?.current || 0;
        const damageEvery = questData.meta.damageEvery !== undefined ? questData.meta.damageEvery : 1;
        let stepIncrement = 0;

        const newCurrent = actualCurrent + 1;
        if (!questData.progress) questData.progress = { current: 0, target };

        questData.progress.current = newCurrent;
        questData.progress.lastUpdated = now;
        questData.progress.lastDoneDate = new Date(now).toISOString();

        const isFinishedForCycle = newCurrent >= target;

        let shouldDealDamage = false;
        if (damageEvery === 0) {
            shouldDealDamage = isFinishedForCycle;
        } else {
            shouldDealDamage = (newCurrent % damageEvery === 0);
        }

        if (isFinishedForCycle) {
            if (newCurrent === target && questData.progress.streak) {
                const streak = questData.progress.streak;

                // Increment streak
                streak.current = (streak.current || 0) + 1;

                // Update highest
                const currentStreak = streak.current;
                const highest = streak.highest || 0;
                if (currentStreak > highest) {
                    streak.highest = currentStreak;
                    // Recalculate tier on new highest
                    streak.tier = this.calculateTier(currentStreak);
                }

                // Increment lifetime completions (never resets)
                streak.totalCompletions = (streak.totalCompletions || 0) + 1;

                // Reset grace used on successful completion
                streak.graceUsed = 0;
            }
            if (newCurrent === target) {
                stepIncrement = 1;
            }
        }

        // 3. Sticky Streak Persistence
        let isDoneGlobal = isFinishedForCycle;
        if (questData.progress?.streak?.target) {
            const streakCurrent = questData.progress.streak.current || 0;
            const streakTarget = questData.progress.streak.target;
            if (streakCurrent < streakTarget) {
                isDoneGlobal = false;
            }
        }

        // 4. Next Run Indicator
        let nextRunTag = '';
        if (isFinishedForCycle) {
            const nextMs = CronHelper.getNextOccurrence(freqExpression, now);
            if (nextMs) {
                const nextDate = new Date(nextMs);
                const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // If more than 7 days away, show date (DD.MM.) instead of weekday
                const daysAway = (nextMs - now) / (1000 * 60 * 60 * 24);
                let dateStr: string;
                if (daysAway > 7) {
                    // Format as DD.MM.
                    const day = nextDate.getDate().toString().padStart(2, '0');
                    const month = (nextDate.getMonth() + 1).toString().padStart(2, '0');
                    dateStr = `${day}.${month}.`;
                } else {
                    dateStr = nextDate.toLocaleDateString([], { weekday: 'short' });
                }
                nextRunTag = ` [Next: ${dateStr} ${timeStr}]`;
            }
        }

        // Apply stripDynamicTags to ensure we don't accumulate tags
        const newTitle = formatTaskTitle(StreakLogic.stripDynamicTags(cleanTitle), questData.progress) + nextRunTag;

        const updates = {
            isDone: isDoneGlobal,
            title: newTitle,
            notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
        };

        return { updates, stepIncrement, xpGained: 0, shouldDealDamage, shouldBlock: false };
    }
}
