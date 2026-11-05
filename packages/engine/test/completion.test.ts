import { describe, expect, it } from 'vitest';

import { isCompleted, timeSpentMs } from '../src';

describe('isCompleted', () => {
  it('counts done tasks', () => {
    expect(isCompleted({ id: 'a', isDone: true, doneOn: 1 })).toBe(true);
  });

  it('ignores open tasks', () => {
    expect(isCompleted({ id: 'a', isDone: false })).toBe(false);
  });

  it("ignores tasks finished as won't do", () => {
    expect(isCompleted({ id: 'a', isDone: true, doneOn: 5, wontDoOn: 5 })).toBe(false);
  });
});

describe('timeSpentMs', () => {
  it('sums all days', () => {
    expect(timeSpentMs({ id: 'a', isDone: true, timeSpentOnDay: { d1: 1, d2: 2 } })).toBe(3);
  });

  it('is 0 without tracked time', () => {
    expect(timeSpentMs({ id: 'a', isDone: true })).toBe(0);
  });
});
