import { describe, it, expect } from 'vitest';
import { StreakLogic } from './logic/StreakLogic';

describe('Streak Motivation Logic', () => {

    describe('calculateTier', () => {
        it('should return bronze for streaks 0-6', () => {
            expect(StreakLogic.calculateTier(0)).toBe('bronze');
            expect(StreakLogic.calculateTier(6)).toBe('bronze');
        });

        it('should return silver for streaks 7-29', () => {
            expect(StreakLogic.calculateTier(7)).toBe('silver');
            expect(StreakLogic.calculateTier(29)).toBe('silver');
        });

        it('should return gold for streaks 30-89', () => {
            expect(StreakLogic.calculateTier(30)).toBe('gold');
            expect(StreakLogic.calculateTier(89)).toBe('gold');
        });

        it('should return diamond for streaks 90+', () => {
            expect(StreakLogic.calculateTier(90)).toBe('diamond');
            expect(StreakLogic.calculateTier(200)).toBe('diamond');
        });
    });

    describe('getTierFloor', () => {
        const customFloors = { bronze: 0, silver: 7, gold: 30, diamond: 60 };

        it('should return 0 for bronze tier', () => {
            expect(StreakLogic.getTierFloor('bronze', customFloors)).toBe(0);
        });

        it('should return 7 for silver tier', () => {
            expect(StreakLogic.getTierFloor('silver', customFloors)).toBe(7);
        });

        it('should return 30 for gold tier', () => {
            expect(StreakLogic.getTierFloor('gold', customFloors)).toBe(30);
        });

        it('should return 60 for diamond tier', () => {
            expect(StreakLogic.getTierFloor('diamond', customFloors)).toBe(60);
        });

        it('should use default floors if not provided', () => {
            expect(StreakLogic.getTierFloor('silver')).toBe(7);
        });

        it('should return bronze floor for undefined tier', () => {
            expect(StreakLogic.getTierFloor(undefined, customFloors)).toBe(0);
        });
    });

    describe('Decay Calculation (Unit)', () => {
        it('25% decay on streak of 20 should reduce to 15', () => {
            const current = 20;
            const decayPercent = 25;
            const loss = Math.max(1, Math.floor(current * (decayPercent / 100)));
            const result = Math.max(0, current - loss);
            expect(result).toBe(15);
        });

        it('25% decay on streak of 4 should reduce by at least 1', () => {
            const current = 4;
            const decayPercent = 25;
            const loss = Math.max(1, Math.floor(current * (decayPercent / 100)));
            const result = Math.max(0, current - loss);
            expect(result).toBe(3);
        });

        it('0% decay should result in hard reset to 0', () => {
            const current = 50;
            const decayPercent = 0;
            const result = decayPercent > 0
                ? Math.max(0, current - Math.floor(current * (decayPercent / 100)))
                : 0;
            expect(result).toBe(0);
        });
    });

    describe('Tier Floor Enforcement', () => {
        it('silver tier should never drop below 7', () => {
            const decayedStreak = 3; // Would drop to 3 from decay
            const tier = 'silver' as const;
            const floor = StreakLogic.getTierFloor(tier);
            const finalStreak = Math.max(decayedStreak, floor);
            expect(finalStreak).toBe(7);
        });

        it('gold tier should never drop below 30', () => {
            const decayedStreak = 15;
            const tier = 'gold' as const;
            const floor = StreakLogic.getTierFloor(tier);
            const finalStreak = Math.max(decayedStreak, floor);
            expect(finalStreak).toBe(30);
        });
    });

});
