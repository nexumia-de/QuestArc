import { describe, expect, it } from 'vitest';

import { createBrain } from '../src/adapter/brain';
import { handleMessage } from '../src/adapter/messages';
import { registerSettingsEntry } from '../src/adapter/settings-entry';
import type { State } from '../src/shared/protocol';
import { builtInJourneys } from '../src/shared/content';
import { createFakeHost } from './fake-host';

// The settings button in Super Productivity's plugin list (#67).
const setUp = (withHandler = true) => {
  const { api } = createFakeHost();
  const calls = { opened: 0, handler: undefined as (() => void) | undefined };
  const host = {
    showIndexHtmlAsView: () => void (calls.opened += 1),
    ...(withHandler ? { registerConfigHandler: (h: () => void) => void (calls.handler = h) } : {}),
  };
  const settings = registerSettingsEntry(host);
  const brain = createBrain({
    api,
    journeys: builtInJourneys,
    debounceMs: 10,
    onEvents: () => undefined,
  });
  return { calls, settings, brain };
};

describe('the settings button of the plugin list', () => {
  it('opens the page and marks the next state for the view, once', async () => {
    const { calls, settings, brain } = setUp();
    const get = async () =>
      (await handleMessage(brain, { type: 'questarc:get' }, undefined, settings)) as State;
    expect((await get()).openSettings).toBeUndefined();
    calls.handler?.();
    expect(calls.opened).toBe(1);
    expect((await get()).openSettings).toBe(true);
    expect((await get()).openSettings).toBeUndefined();
  });

  it('is left out on a Super Productivity without registerConfigHandler', () => {
    const { calls, settings } = setUp(false);
    expect(calls.handler).toBeUndefined();
    expect(settings.take()).toBe(false);
  });

  it('survives a host that rejects the registration', () => {
    const settings = registerSettingsEntry({
      registerConfigHandler: () => {
        throw new Error('unknown');
      },
    });
    expect(settings.take()).toBe(false);
  });
});
