import { describe, it, expect } from 'vitest';
import { parseXpTag, parseTaskType, compileTaskData } from './parsers';

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
            const result = parseTaskType('3x @daily Meditation');
            expect(result.type).toBe('HABIT');
            expect(result.meta.target).toBe(3);
            expect(result.meta.frequency).toBe('@daily');
            expect(result.cleanTitle).toBe('Meditation');
        });

        it('should detect Habit (Weekly)', () => {
            const result = parseTaskType('1x @weekly Review');
            expect(result.type).toBe('HABIT');
            expect(result.meta.frequency).toBe('@weekly');
        });

        it('should detect Grind', () => {
            const result = parseTaskType('50x Pushups');
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
        it('should compile a complete Boss step', () => {
            const raw = '⚔️ Final Boss [HP:1000] [XP:5000]';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Final Boss');
            expect(data.meta.type).toBe('BOSS');
            expect(data.boss?.hp).toBe(1000);
            expect(data.progress?.target).toBe(1000);
            // XP parsing happens first, so internal parser sees "⚔️ Final Boss [HP:1000]"
            expect(data.reward?.xp).toBe(5000);
        });

        it('should compile a Habit correctly', () => {
            const raw = '5x @daily Drink Water';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Drink Water (0/5)');
            expect(data.meta.type).toBe('HABIT');
            expect(data.routine?.frequency).toBe('@daily');
            expect(data.progress?.target).toBe(5);
            expect(data.progress?.target).toBe(5);
            expect(data.progress?.current).toBe(0);
        });

        it('should append initial progress count to title for Grinds', () => {
            const raw = '50x Pushups';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Pushups (0/50)');
            expect(data.progress?.target).toBe(50);
        });

        it('should append initial progress count to title for Habits', () => {
            const raw = '3x @daily Drink Water';
            const { title, data } = compileTaskData(raw);

            expect(title).toBe('Drink Water (0/3)');
            expect(data.progress?.target).toBe(3);
        });
    });
});
