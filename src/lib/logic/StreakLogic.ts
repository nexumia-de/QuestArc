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
    defaultGraceCron: '', // No default cron
};

// Tier thresholds (highest streak needed to reach tier)
const TIER_THRESHOLDS = {
    bronze: 0,
    silver: 7,
    gold: 30,
    diamond: 90,
};

/** Result shape returned by processHabitProgress */
export interface HabitProgressResult {
    updates: Record<string, unknown>;
    stepIncrement: number;
    xpGained: number;
    shouldDealDamage: boolean;
    shouldBlock: boolean;
    isBonusCompletion?: boolean;
    blockReason?: string;
    blockMetadata?: { nextResetTime: number | null };
}

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
        streakBehavior?: StreakBehaviorConfig,
        globalSettings?: {
            habitCompletionMode?: 'soft' | 'strict';
            completionMinGranularity?: 'daily' | 'cycle';
        },
    ): HabitProgressResult {
        const now = Date.now();
        const settings = { ...DEFAULT_STREAK_BEHAVIOR, ...streakBehavior };

        // Sync scheduling tags from title -> meta
        FrequencyHelper.parseShouldBlock(questData, cleanTitle);
        FrequencyHelper.parseMinResetGranularity(questData, cleanTitle);

        // Priority: progress.lastDoneDate (ISO) -> 0
        let lastCompletionTime = 0;

        if (questData.progress?.lastDoneDate) {
            const date = new Date(questData.progress.lastDoneDate);
            if (!isNaN(date.getTime())) {
                lastCompletionTime = date.getTime();
            }
        }

        // Frequency Parsing (using shared helper for consistency)
        const freqExpression = FrequencyHelper.syncAndGetFrequency(questData, cleanTitle);
        const target = questData.progress?.target || 1;

        // --- 0. Grace Initialization & Accumulation ---
        if (questData.progress?.streak) {
            const streak = questData.progress.streak;
            // Ensure availableGrace is initialized
            if (streak.availableGrace === undefined) {
                streak.availableGrace = settings.gracePeriodsPerCycle ?? 1;
            }

            // Accumulate Bonus Grace from Cron
            // Accumulate Bonus Grace from Cron
            const effectiveCron = streak.graceCron || settings.defaultGraceCron;

            if (effectiveCron) {
                const lastGrant = streak.lastGraceGrantDate ? new Date(streak.lastGraceGrantDate).getTime() : Date.now();
                // Only count if lastGrant is in the past (to avoid double counting on init)
                if (streak.lastGraceGrantDate) {
                    const bonus = CronHelper.getOccurrencesBetween(effectiveCron, lastGrant, now);
                    if (bonus > 0) {
                        streak.availableGrace = (streak.availableGrace || 0) + bonus;
                        streak.lastGraceGrantDate = new Date(now).toISOString();
                    }
                } else {
                    // First time seeing cron, initialize baseline
                    streak.lastGraceGrantDate = new Date(now).toISOString();
                }
            }
        }

        // --- 1. Missed Streak Logic (with grace/decay/tiers) ---
        if (questData.progress?.streak && lastCompletionTime > 0) {
            const missedCount = CronHelper.getOccurrencesBetween(freqExpression, lastCompletionTime, now);

            if (missedCount > 1) {
                const streak = questData.progress.streak;
                const defaultGrace = settings.gracePeriodsPerCycle ?? 1;

                // Calculate actual missed cycles (subtracting the current one)
                const actualMisses = missedCount - 1;
                const currentGrace = streak.availableGrace ?? defaultGrace;

                if (actualMisses <= currentGrace) {
                    // Consume grace for each actual miss, streak survives
                    streak.availableGrace = currentGrace - actualMisses;
                    // Don't reset current progress - user gets a pass
                } else {
                    // Grace exhausted - apply decay or reset
                    const decay = settings.decayPercent;

                    if (decay > 0 && streak.current > 0) {
                        // Decay: reduce streak by percentage iteratively for each missed cycle
                        for (let i = 0; i < actualMisses; i++) {
                            const loss = Math.max(1, Math.floor(streak.current * (decay / 100)));
                            streak.current = Math.max(0, streak.current - loss);
                            if (streak.current === 0) break;
                        }
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

                    // Record miss date (human readable)
                    streak.lastMissDate = new Date(now).toISOString();

                    // Reset grace for new cycle (Standard reset to default)
                    streak.availableGrace = settings.gracePeriodsPerCycle ?? 1;

                    // Reset daily progress counter
                    questData.progress.current = 0;
                }
            }
        } else if (lastCompletionTime === 0) {
            questData.progress = { ...questData.progress, current: 0 };
        }

        // --- 2. Double-Dip Guard (Anti-Cheat) ---
        const cyclesPassed = (lastCompletionTime > 0)
            ? CronHelper.getOccurrencesBetween(freqExpression, lastCompletionTime, now)
            : 1;

        const freshCurrent = questData.progress?.current || 0;

        if (cyclesPassed === 0 && lastCompletionTime > 0) {
            if (freshCurrent >= target) {
                // --- Three-step blocking decision ---

                // Step A: Hard block (per-task [shouldBlock:true] OR global strict mode)
                const forceBlock =
                    questData.meta.shouldBlock === true ||
                    globalSettings?.habitCompletionMode === 'strict';

                if (forceBlock) {
                    return {
                        updates: {},
                        stepIncrement: 0,
                        xpGained: 0,
                        shouldDealDamage: false,
                        shouldBlock: true,
                        blockReason: 'ALREADY_DONE_TODAY',
                        blockMetadata: {
                            nextResetTime: CronHelper.getNextOccurrence(freqExpression, now)
                        }
                    };
                }

                // The user checked it again in the same cycle. We differentiate:
                // 1) Same Calendar Day -> Silent pass-through (isDone: true, no counter increase)
                // 2) Different Calendar Day -> Visual bonus (+1🔥 counter)

                const lastDoneDay = new Date(lastCompletionTime).toDateString();
                const today = new Date(now).toDateString();

                if (lastDoneDay === today) {
                    // Silent pass-through: user double-tapped it today. Result is to revert the optimistic checkbox.
                    if (questData.progress) {
                        questData.progress.lastDoneDate = new Date(now).toISOString();
                    }

                    // Re-append the Next Run tag so it doesn't disappear
                    let nextRunTag = '';
                    if (questData.meta.type === 'HABIT' && freqExpression !== 'none') {
                        nextRunTag = StreakLogic.formatNextRunTag(freqExpression, new Date(now).getTime());
                    }

                    // Keep the current title, just ensure the tag is there
                    const newTitle = formatTaskTitle(StreakLogic.stripDynamicTags(cleanTitle), questData.progress) + nextRunTag;

                    return {
                        updates: {
                            title: newTitle,
                            isDone: false,
                            notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``,
                        },
                        stepIncrement: 0,
                        xpGained: 0,
                        shouldDealDamage: false,
                        shouldBlock: false,
                        isBonusCompletion: true,
                    };
                }

                // Different day within the same cycle -> Visual Bonus (+1🔥)
                return StreakLogic.applyBonusCompletion(questData, cleanTitle, new Date(now).toISOString(), freqExpression);
            }
        } else if (cyclesPassed > 0) {
            if (questData.progress) {
                questData.progress.current = 0;
                questData.progress.bonusCount = 0; // Reset bonus counter on new cycle
            }
        }

        // Re-read current
        const actualCurrent = questData.progress?.current || 0;
        const damageEvery = questData.meta.damageEvery !== undefined ? questData.meta.damageEvery : 1;
        let stepIncrement = 0;

        const newCurrent = actualCurrent + 1;
        if (!questData.progress) questData.progress = { current: 0, target };

        questData.progress.current = newCurrent;
        if (!questData.progress) questData.progress = { current: 0, target };

        questData.progress.current = newCurrent;
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

                // Refill available grace (preserve surplus from cron)
                const defaultGrace = settings.gracePeriodsPerCycle ?? 1;
                streak.availableGrace = Math.max(streak.availableGrace || 0, defaultGrace);
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

    /**
     * Handles a bonus completion (target already met this cycle).
     * Increments bonusCount, updates the title to show '+N🔥', persists JSON.
     * Does NOT increment streak.current or grant XP/damage.
     */
    static applyBonusCompletion(questData: QuestTaskData, cleanTitle: string, now: string, freqExpression: string = 'none') {
        if (!questData.progress) questData.progress = { current: 0 };
        questData.progress.bonusCount = (questData.progress.bonusCount || 0) + 1;
        questData.progress.lastDoneDate = now;

        // Re-append the Next Run tag so it doesn't disappear
        let nextRunTag = '';
        if (questData.meta.type === 'HABIT' && freqExpression !== 'none') {
            nextRunTag = StreakLogic.formatNextRunTag(freqExpression, new Date(now).getTime());
        }

        const newTitle =
            formatTaskTitle(
                StreakLogic.stripDynamicTags(cleanTitle),
                questData.progress,
            ) + nextRunTag;

        const updates = {
            isDone: false,
            title: newTitle,
            notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``,
        };

        return {
            updates,
            stepIncrement: 0,
            xpGained: 0,
            shouldDealDamage: false,
            shouldBlock: false,
            isBonusCompletion: true,
        };
    }

    /**
     * Helper to format the [Next: Date Time] string consistently across paths.
     */
    static formatNextRunTag(freqExpression: string, nowMs: number): string {
        const nextReset = CronHelper.getNextOccurrence(freqExpression, nowMs);
        if (!nextReset) return '';

        const nextDate = new Date(nextReset);
        const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const today = new Date(nowMs);
        const tomorrow = new Date(nowMs);
        tomorrow.setDate(today.getDate() + 1);

        const isToday = today.toDateString() === nextDate.toDateString();
        const isTomorrow = tomorrow.toDateString() === nextDate.toDateString();

        let dateStr: string;
        if (isToday) {
            dateStr = 'Today';
        } else if (isTomorrow) {
            dateStr = 'Tomorrow';
        } else {
            const daysAway = (nextReset - nowMs) / (1000 * 60 * 60 * 24);
            if (daysAway > 7) {
                // More than 7 days away -> DD.MM.
                const day = nextDate.getDate().toString().padStart(2, '0');
                const month = (nextDate.getMonth() + 1).toString().padStart(2, '0');
                dateStr = `${day}.${month}.`;
            } else {
                // Within next 7 days (1-7 days away) -> 'Mon', 'Tue'
                dateStr = nextDate.toLocaleDateString([], { weekday: 'short' });
            }
        }

        return ` [Next: ${dateStr} ${timeStr}]`;
    }
}
