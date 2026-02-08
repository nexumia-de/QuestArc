
import { CronHelper } from './src/lib/cron';

const inputs = [
    { name: 'Daily', expr: 'daily', now: new Date('2026-02-03T12:00:00Z') }, // Tue
    { name: 'Weekly', expr: 'weekly', now: new Date('2026-02-03T12:00:00Z') }, // Tue -> Expect Mon
    { name: 'Custom Mon', expr: '0 0 * * 1', now: new Date('2026-02-03T12:00:00Z') }, // Tue -> Expect Mon
    { name: 'Custom Fri', expr: '0 0 * * 5', now: new Date('2026-02-03T12:00:00Z') }, // Tue -> Expect Fri
    { name: 'Every 2 Mins', expr: '*/2 * * * *', now: new Date('2026-02-03T12:00:00Z') }, // 12:00 -> 12:02
    { name: 'Every 2 Days (*/2)', expr: '0 0 */2 * *', now: new Date('2026-02-03T12:00:00Z') }, // 3rd (odd). 3%2!=0. Next even is 4th?
    { name: 'Range 1-5', expr: '0 0 * * 1-5', now: new Date('2026-02-03T12:00:00Z') }, // Tue -> Wed
    { name: 'Later Today (14:00)', expr: '0 14 * * *', now: new Date('2026-02-03T10:00:00Z') }, // Tue 10:00 -> Tue 14:00
    { name: 'Sunday as 7', expr: '0 0 * * 7', now: new Date('2026-02-03T12:00:00Z') }, // Tue -> Sun
    { name: 'Range 1-5 (Mon-Fri)', expr: '0 0 * * 1-5', now: new Date('2026-02-07T12:00:00Z') }, // Sat -> Expect Mon
    { name: 'Range 1-5 (Mon-Fri) from Sun', expr: '0 0 * * 1-5', now: new Date('2026-02-08T12:00:00Z') }, // Sun -> Expect Mon
    { name: 'Check Sunday Match', expr: '0 0 * * 1-5', now: new Date('2026-02-08T00:00:00Z') }, // Sun 00:00. Should NOT match.
];

inputs.forEach(i => {
    const next = CronHelper.getNextOccurrence(i.expr, i.now.getTime());
    console.log(`\n--- ${i.name} ---`);
    console.log(`Expr: ${i.expr}`);
    console.log(`Now:  ${i.now.toISOString()} (${i.now.toDateString()})`);
    if (next) {
        const d = new Date(next);
        console.log(`Next: ${d.toISOString()} (${d.toDateString()})`);
    } else {
        console.log('Next: NULL');
    }
});
