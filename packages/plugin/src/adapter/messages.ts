import { isRequest, type State } from '../shared/protocol';
import type { Brain } from './brain';

/** Answers the view's requests (shared/protocol.ts) from the brain. */
export const handleMessage = (brain: Brain, message: unknown): Promise<State> => {
  if (!isRequest(message)) return Promise.reject(new Error('QuestArc: unknown request'));
  return message.type === 'questarc:write' ? brain.write(message.records) : brain.state();
};
