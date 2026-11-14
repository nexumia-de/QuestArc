import { describe, expect, it } from 'vitest';

import { isRequest } from '@questarc/ui/shared/protocol';
import { createSidePanel } from '../src/adapter/side-panel';

describe('the side panel setting (this device only)', () => {
  const fakeStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => void values.set(k, v),
    };
  };

  it('is off by default and registers no button', () => {
    const calls: unknown[] = [];
    const panel = createSidePanel(
      { registerSidePanelButton: (c) => void calls.push(c) },
      fakeStorage(),
    );
    expect(panel.on).toBe(false);
    expect(calls).toEqual([]);
  });

  it('on: registers the button once, and again at the next start', () => {
    const storage = fakeStorage();
    const calls: unknown[] = [];
    const api = { registerSidePanelButton: (c: unknown) => void calls.push(c) };
    const panel = createSidePanel(api, storage);
    panel.set(true);
    panel.set(false);
    panel.set(true);
    expect(calls).toHaveLength(1);
    expect(createSidePanel(api, storage).on).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('off is kept for the next start, when no button is registered', () => {
    const storage = fakeStorage();
    const calls: unknown[] = [];
    const api = { registerSidePanelButton: (c: unknown) => void calls.push(c) };
    createSidePanel(api, storage).set(false);
    expect(createSidePanel(api, storage).on).toBe(false);
    expect(calls).toEqual([]);
  });

  it('works without storage (blocked): off', () => {
    expect(createSidePanel({ registerSidePanelButton: () => undefined }, undefined).on).toBe(false);
  });

  it('is a request only with a yes or no', () => {
    expect(isRequest({ type: 'questarc:side-panel', on: true })).toBe(true);
    expect(isRequest({ type: 'questarc:side-panel', on: 'yes' })).toBe(false);
    expect(isRequest({ type: 'questarc:side-panel' })).toBe(false);
  });
});
