import { describe, it, expect } from 'vitest';
import { calculateDamage } from './game-logic';
import { Modifier } from '../types/state';

describe('calculateDamage', () => {
  it('should return base damage (10) when no modifiers are present', () => {
    const task = { tagIds: [] };
    const damage = calculateDamage(task, []);
    expect(damage).toBe(10);
  });

  it('should apply tag modifiers correctly', () => {
    const task = { tagIds: ['deep-work'] };
    const modifiers: Modifier[] = [
      { trigger: { type: 'tag', value: 'deep-work' }, multiplier: 2.0 }
    ];
    
    const damage = calculateDamage(task, modifiers);
    expect(damage).toBe(20);
  });

  it('should stack multiple modifiers multiplicatively', () => {
    const task = { tagIds: ['deep-work', 'urgent'] };
    const modifiers: Modifier[] = [
      { trigger: { type: 'tag', value: 'deep-work' }, multiplier: 2.0 },
      { trigger: { type: 'tag', value: 'urgent' }, multiplier: 1.5 }
    ];
    
    const damage = calculateDamage(task, modifiers);
    expect(damage).toBe(10 * 2.0 * 1.5); // 30
  });

  it('should ignore modifiers that do not match tags', () => {
    const task = { tagIds: ['routine'] };
    const modifiers: Modifier[] = [
      { trigger: { type: 'tag', value: 'deep-work' }, multiplier: 2.0 }
    ];
    
    const damage = calculateDamage(task, modifiers);
    expect(damage).toBe(10);
  });
});
