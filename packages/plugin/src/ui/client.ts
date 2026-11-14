import type { ContentPack, Request, State } from '../shared/protocol';

/**
 * Sends requests to plugin.js. Super Productivity forwards
 * `PLUGIN_MESSAGE` from the view to the plugin's onMessage handler and
 * answers with `PLUGIN_MESSAGE_RESPONSE` or `PLUGIN_MESSAGE_ERROR`
 * (docs/super-productivity-facts.md §1); the shim has no helper for it.
 */

interface Pending {
  resolve: (result: never) => void;
  reject: (error: Error) => void;
}

const TIMEOUT_MS = 30_000;

export const createClient = (target: Window = window.parent, source: Window = window) => {
  const pending = new Map<string, Pending>();
  let next = 0;

  source.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as {
      type?: string;
      messageId?: string;
      result?: unknown;
      error?: string;
    };
    const call = data?.messageId ? pending.get(data.messageId) : undefined;
    if (!call || event.source !== target) return;
    if (data.type === 'PLUGIN_MESSAGE_RESPONSE' && data.result) {
      pending.delete(data.messageId as string);
      call.resolve(data.result as never);
    } else if (data.type === 'PLUGIN_MESSAGE_ERROR') {
      pending.delete(data.messageId as string);
      call.reject(new Error(data.error ?? 'QuestArc request failed'));
    }
  });

  const request = <T = State>(message: Request): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      next += 1;
      const messageId = `questarc-${next}`;
      pending.set(messageId, { resolve: resolve as (result: never) => void, reject });
      target.postMessage({ type: 'PLUGIN_MESSAGE', messageId, message }, '*');
      setTimeout(() => {
        if (pending.delete(messageId)) reject(new Error('QuestArc request timed out'));
      }, TIMEOUT_MS);
    });

  return {
    get: () => request({ type: 'questarc:get' }),
    write: (records: Record<string, unknown>) => request({ type: 'questarc:write', records }),
    sidePanel: (on: boolean) => request({ type: 'questarc:side-panel', on }),
    content: () => request<ContentPack>({ type: 'questarc:content' }),
  };
};

export type Client = ReturnType<typeof createClient>;
