
import { CronHelper } from './src/lib/cron';
import { StreakLogic } from './src/lib/logic/StreakLogic';
import { formatTaskTitle } from './src/lib/parsers';

// Mock PluginService (needed for StreakLogic logs)
const PluginService = {
    log: {
        info: (msg) => console.log(`[INFO] ${msg}`),
        warn: (msg) => console.log(`[WARN] ${msg}`),
        error: (msg) => console.log(`[ERROR] ${msg}`),
    }
};
(global as any).PluginService = PluginService;
// Also mock it in the import proxy if possible (but we use direct checking here)

// Force mock needed for class usage if it imports PluginService
jest.mock('./src/services/PluginService', () => ({ PluginService }));
// Wait, we can't use jest mocks in tsx directly without jest. 

// We will just try to run CronHelper directly first as that's the core.
// Then simulate StreakLogic logic manually if needed.

const USER_FREQ = "0 0 * 1-5"; // 4 parts (Missing Month/Day separator?)
const CORRECT_FREQ = "0 0 * * 1-5"; // 5 parts
const NOW = new Date('2026-02-07T12:00:00Z').getTime(); // Saturday

console.log('--- Debug User Failure ---');

// 1. CronHelper Check
console.log(`\n1. Testing CronHelper with "${USER_FREQ}" (User JSON)`);
const nextUser = CronHelper.getNextOccurrence(USER_FREQ, NOW);
console.log(`Next (User 4 parts "0 0 * 1-5"): ${nextUser ? new Date(nextUser).toISOString() : 'NULL (Invalid)'}`);

console.log(`\n2. Testing CronHelper with "${CORRECT_FREQ}" (Correct 5 parts)`);
const nextCorrect = CronHelper.getNextOccurrence(CORRECT_FREQ, NOW);
console.log(`Next (Correct 5 parts "0 0 * * 1-5"): ${nextCorrect ? new Date(nextCorrect).toISOString() : 'NULL'}`);

// 2. Simulate StreakLogic Logic
console.log('\n2. Simulating StreakLogic Logic');
const questData = {
    meta: {
        type: 'HABIT',
        frequency: FREQ_4_PARTS // From User JSON
    },
    progress: {
        current: 2,
        target: 2,
        lastUpdated: 1770464970188
    }
};

const cleanTitle = "test [freq:* * * 1-5]";

// Logic from StreakLogic.processHabitProgress (simplified)
const freqExpression = questData.meta.frequency || 'daily';
console.log(`Resolved Freq Expression: "${freqExpression}"`);

const nextMs = CronHelper.getNextOccurrence(freqExpression, NOW);
if (nextMs) {
    const nextDate = new Date(nextMs);
    console.log(`[Logic] Calculated Next: ${nextDate.toISOString()}`);
    console.log(`[Logic] Day: ${nextDate.getDay()} (0=Sun)`);
} else {
    console.log(`[Logic] Next was NULL (No Tag)`);
}

// Check Daily Fallback
console.log(`\n3. Checking Daily Fallback`);
const dailyNext = CronHelper.getNextOccurrence('daily', NOW);
console.log(`Daily Next: ${dailyNext ? new Date(dailyNext).toISOString() : 'NULL'}`);
