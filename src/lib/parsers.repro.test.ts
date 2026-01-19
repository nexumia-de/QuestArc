import { describe, it, expect } from 'vitest';
import { compileTaskData } from './parsers';

describe('Parser Reproduction', () => {
    it('should parse "Multi 3x"', () => {
        const { title, data } = compileTaskData('Multi 3x');
        expect(data.meta.type).toBe('GRIND');
        expect(data.progress?.target).toBe(3);
        expect(title).toBe('Multi');
    });

    it('should parse "daily 2x@daily"', () => {
        const { title, data } = compileTaskData('daily 2x@daily');
        expect(data.meta.type).toBe('HABIT');
        expect(data.routine?.frequency).toBe('@daily');
        expect(data.progress?.target).toBe(2);
        expect(title).toBe('daily');
    });
});
