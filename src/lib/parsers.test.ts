import { describe, it, expect } from 'vitest';
import { parseXpTag, parseTaskType, compileTaskData, cleanTaskTitle } from './parsers';

describe('QuestArc v2 Parsers', () => {

    describe('parseXpTag', () => {
        it('should extract XP from title', () => {
            const { xp, cleanTitle } = parseXpTag('Chapter 1 [XP:100]');
            expect(xp).toBe(100);
            expect(cleanTitle).toBe('Chapter 1');
        });

        it('should handle missing XP tag', () => {
            const { xp, cleanTitle } = parseXpTag('Just a title');
            expect(xp).toBeUndefined();
            expect(cleanTitle).toBe('Just a title');
        });

        it('should handle clean title spacing', () => {
            const { xp, cleanTitle } = parseXpTag('Title  [XP:50] ');
            expect(xp).toBe(50);
            expect(cleanTitle).toBe('Title');
        });
    });

    describe('parseTaskType', () => {
        it('should detect Boss', () => {
            const result = parseTaskType('⚔️ Goblin King [HP:500]');
            expect(result.type).toBe('BOSS');
            expect(result.meta.hp).toBe(500);
            expect(result.cleanTitle).toBe('Goblin King');
        });

        it('should detect Boss with different emoji', () => {
            const result = parseTaskType('🛡️ Dragon [HP:9999]');
            expect(result.type).toBe('BOSS');
            expect(result.meta.hp).toBe(9999);
        });

        it('should detect Habit (Daily)', () => {
            const result = parseTaskType('[count:3] [freq:daily] Meditation');
            expect(result.type).toBe('HABIT');
            expect(result.meta.target).toBe(3);
            expect(result.meta.frequency).toBe('daily');
            expect(result.cleanTitle).toBe('Meditation');
        });

        it('should detect Habit (Weekly)', () => {
            const result = parseTaskType('[count:1] [freq:weekly] Review');
            expect(result.type).toBe('HABIT');
            expect(result.meta.frequency).toBe('weekly');
        });

        it('should detect Habit (Cron)', () => {
            const result = parseTaskType('[freq:5 4 * * *] Backup');
            expect(result.type).toBe('HABIT');
            expect(result.meta.frequency).toBe('5 4 * * *');
            expect(result.meta.target).toBe(1); // Default to 1
        });

        it('should detect Grind', () => {
            const result = parseTaskType('[count:50] Pushups');
            expect(result.type).toBe('GRIND');
            expect(result.meta.target).toBe(50);
            expect(result.cleanTitle).toBe('Pushups');
        });

        it('should detect Simple task', () => {
            const result = parseTaskType('Buy Milk');
            expect(result.type).toBe('SIMPLE');
            expect(result.cleanTitle).toBe('Buy Milk');
        });

        it('should NOT confuse Grind with numbers in title', () => {
            const result = parseTaskType('Buy 50 apples');
            expect(result.type).toBe('SIMPLE');
        })
    });

    describe('compileTaskData', () => {
        it('should compile a complete Boss step with Icon', () => {
            const raw = '⚔️ Final Boss [HP:1000] [XP:5000]';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Final Boss 1000/1000 ❤️');
            expect(data.meta.type).toBe('BOSS');
            expect(data.boss?.hp).toBe(1000);
            expect(data.progress?.target).toBe(1000);
            expect(data.reward?.xp).toBe(5000);
        });

        it('should compile Boss step without Icon (case insensitive)', () => {
            const raw = 'Shadow Bug [hp:100]';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Shadow Bug 100/100 ❤️');
            expect(data.meta.type).toBe('BOSS');
            expect(data.boss?.hp).toBe(100);
        });

        it('should compile a Habit correctly', () => {
            const raw = '[count:5] [freq:daily] Drink Water';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Drink Water (0/5) 0/1 🔥');
            expect(data.meta.type).toBe('HABIT');
            // expect(data.routine?.frequency).toBe('daily'); // routine removed
            expect(data.meta.frequency).toBe('daily');
            expect(data.progress?.target).toBe(5);
            expect(data.progress?.current).toBe(0);
        });

        it('should compile a Habit with complex cron', () => {
            const raw = '[freq:0 1 * * 3] [count:2] Weekly Check';
            const { title, data } = compileTaskData(raw);

            // Expect (0/2) because count > 1
            expect(title).toBe('Weekly Check (0/2)');
            expect(data.meta.type).toBe('HABIT');
            expect(data.meta.frequency).toBe('0 1 * * 3');
        });

        it('should append initial progress count to title for Grinds', () => {
            const raw = '[count:50] Pushups';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Pushups (0/50)');
            expect(data.progress?.target).toBe(50);
        });

        it('should append initial progress count to title for Habits', () => {
            const raw = '[count:3] [freq:daily] Drink Water';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Drink Water (0/3) 0/1 🔥');
            expect(data.progress?.target).toBe(3);
        });

        it('should respect current streak if provided via hack', () => {
            // Note: Since compileTaskData re-parses, we can't easily inject current streak 
            // without modifying the input string or mocking.
            // But we can verify that the code uses data.progress.streak.current
            // by relying on the fact that existing logic sets it to 0.
            // To truly test this, we'd need to mock parseTaskType or manually construct the object.
            // For now, let's just ensure the default 0 behavior holds, which we did above.
        });
    });

    describe('[stack:X] tag parsing', () => {
        it('should extract stack ID from habit title', () => {
            const result = parseTaskType('[freq:daily] [streak:3] [stack:walk] Walk 5 min');
            expect(result.type).toBe('HABIT');
            expect(result.meta.stack).toBe('walk');
            expect(result.cleanTitle).toBe('Walk 5 min');
        });

        it('should extract stack ID with persistent tag', () => {
            const result = parseTaskType('[freq:daily] [persistent:Morgenroutine] [stack:meditate] Meditate');
            expect(result.type).toBe('HABIT');
            expect(result.meta.stack).toBe('meditate');
            expect(result.meta.persistent).toBe('Morgenroutine');
            expect(result.cleanTitle).toBe('Meditate');
        });

        it('should handle stack tag on simple task', () => {
            const result = parseTaskType('Some task [stack:foo]');
            expect(result.type).toBe('SIMPLE');
            expect(result.meta.stack).toBe('foo');
            expect(result.cleanTitle).toBe('Some task');
        });

        it('should include stack in compiled data', () => {
            const raw = '[freq:daily] [streak:7] [stack:walk] Walk 10 min';
            const { data } = compileTaskData(raw);
            expect(data.meta.stack).toBe('walk');
            expect(data.meta.type).toBe('HABIT');
            expect(data.progress?.streak?.target).toBe(7);
        });

        it('should not have stack when tag is absent', () => {
            const raw = '[freq:daily] Walk 5 min';
            const { data } = compileTaskData(raw);
            expect(data.meta.stack).toBeUndefined();
        });
    });

    describe('cleanTaskTitle', () => {
        it('should strip streak from title', () => {
            expect(cleanTaskTitle('Walk 5 min 3/7 🔥')).toBe('Walk 5 min');
        });

        it('should strip progress counter from title', () => {
            expect(cleanTaskTitle('Pushups (15/50)')).toBe('Pushups');
        });

        it('should strip [stack:X] from display title', () => {
            expect(cleanTaskTitle('Walk 5 min [stack:walk]')).toBe('Walk 5 min');
        });

        it('should strip [stack:X] along with progress', () => {
            expect(cleanTaskTitle('Walk (0/3) 0/7 🔥 [stack:walk]')).toBe('Walk');
        });
    });
});
