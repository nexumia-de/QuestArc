import { CronHelper } from '../cron';
import { QuestTaskData } from '../../types/quest-v2';
import { formatTaskTitle } from '../parsers';
import { PluginService } from '../../services/PluginService';

export class StreakLogic {

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

    static processHabitProgress(questData: QuestTaskData, cleanTitle: string) {
        const now = Date.now();

        // 0. Human Readable Date Override
        let resolvedLastUpdated = questData.progress?.lastUpdated || 0;
        if (questData.progress?.lastDoneDate) {
            const manualDate = new Date(questData.progress.lastDoneDate);
            if (!isNaN(manualDate.getTime())) {
                resolvedLastUpdated = manualDate.getTime();
            }
        }
        const lastUpdated = resolvedLastUpdated;

        // Frequency Parsing
        const freqExpression = questData.meta.frequency || 'daily';
        const target = questData.progress?.target || 1;

        // --- 1. Missed Streak Logic ---
        if (questData.progress?.streak && lastUpdated > 0) {
            const missedCount = CronHelper.getOccurrencesBetween(freqExpression, lastUpdated, now);
            if (missedCount > 1) {
                questData.progress.streak.current = 0;
                questData.progress.current = 0;
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
                questData.progress.streak.current = (questData.progress.streak.current || 0) + 1;
                const currentStreak = questData.progress.streak.current;
                const highest = questData.progress.streak.highest || 0;
                if (currentStreak > highest) {
                    questData.progress.streak.highest = currentStreak;
                }
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
                const dayStr = nextDate.toLocaleDateString([], { weekday: 'short' });
                nextRunTag = ` [Next: ${dayStr} ${timeStr}]`;
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
