import { describe, expect, it } from 'vitest';

import startTexts from 'virtual:questarc-start-texts';

import { addTexts } from '../src/shared/texts';
import { loadErrorText, loadProblem, NOT_RUNNING_AFTER_MS } from '../src/ui/load-error';

// Only the texts the view carries itself: these messages are shown before
// plugin.js has sent the others (docs/plugin-adapter.md).
addTexts(startTexts);

// Super Productivity's answers while plugin.js is not running
// (plugin-runner.ts, plugin-api.ts at c5eb3f6) and the view's own timeout.
const notLoaded = new Error('Plugin questarc not found or not loaded');
const noHandler = new Error('Plugin questarc has no message handler registered');
const timedOut = new Error('QuestArc request timed out');

describe('load errors', () => {
  it('calls a plugin.js that is not loaded yet "starting"', () => {
    expect(loadProblem(notLoaded, 0)).toBe('starting');
    expect(loadProblem(noHandler, 5_000)).toBe('starting');
  });

  it('says "not running" when plugin.js stays away', () => {
    expect(loadProblem(notLoaded, NOT_RUNNING_AFTER_MS)).toBe('not-running');
    expect(loadProblem(timedOut, 30_000)).toBe('not-running');
  });

  it('calls any other error "failed" and shows its reason', () => {
    const shown = loadErrorText(new Error('archive unreadable'), 0);
    expect(shown.problem).toBe('failed');
    expect(shown.text).toContain('could not read your data');
    expect(shown.detail).toBe('Details: archive unreadable');
  });

  it('shows no details while starting and has a text for every problem', () => {
    const starting = loadErrorText(notLoaded, 0);
    expect(starting.detail).toBeUndefined();
    for (const [error, ms] of [
      [notLoaded, 0],
      [notLoaded, NOT_RUNNING_AFTER_MS],
      ['x', 0],
    ] as const) {
      expect(loadErrorText(error, ms).text).not.toMatch(/^ui\./);
    }
  });
});
